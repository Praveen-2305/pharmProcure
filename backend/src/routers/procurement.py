"""
Procurement Router for AutonoSource (pharmProcure).
Implements the authoritative frontend contract:
- POST /procurement/submit: Form/JSON submission to initiate multi-agent pipeline
- GET  /procurement/{id}/status: Polled every 1.5s for live progress & revisionCount
- GET  /procurement/{id}/report: Returns final ProcurementReport once ready
- GET  /procurement/all: Returns all ProcurementItemSummary items for dashboard
"""

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import asyncio

from src.models.schemas import (
    SubmitProcurementResponse,
    WorkflowStatus,
    WorkflowStage,
    InvestigationPlan,
    ProcurementReport,
    ProcurementItemSummary
)
from src.agents.state import WorkflowState
from src.agents.workflow import create_procurement_workflow
from src.agents.contract_parser import extract_contract_clauses
from src.db.session import case_store

router = APIRouter(prefix="/procurement", tags=["Procurement"])

_workflow_engine = None

def get_workflow_engine():
    global _workflow_engine
    if _workflow_engine is None:
        try:
            _workflow_engine = create_procurement_workflow()
        except Exception as e:
            print(f"[ProcurementRouter] Workflow initialization note: {e}")
            _workflow_engine = None
    return _workflow_engine

# Active background workflows
active_workflows: Dict[str, WorkflowState] = {}

def _run_workflow_sync(procurement_id: str, initial_state: WorkflowState):
    """Executes the LangGraph agent pipeline in background with streaming stage progression."""
    try:
        engine = get_workflow_engine()
        if engine:
            accumulated_state = dict(initial_state)
            for event in engine.stream(initial_state):
                for node_name, node_state in event.items():
                    if isinstance(node_state, dict):
                        accumulated_state.update(node_state)
                        if "evidence_bundle" in node_state and isinstance(node_state["evidence_bundle"], dict):
                            if "evidence_bundle" not in accumulated_state or not isinstance(accumulated_state["evidence_bundle"], dict):
                                accumulated_state["evidence_bundle"] = {}
                            accumulated_state["evidence_bundle"].update(node_state["evidence_bundle"])
                    
                    active_workflows[procurement_id] = accumulated_state
                    
                    # Update case_store with live stage progression
                    case = case_store.get(procurement_id)
                    if case and isinstance(node_state, dict):
                        if "stage" in node_state and node_state["stage"]:
                            case.status.stage = node_state["stage"]
                        rev = node_state.get("revisionCount") if node_state.get("revisionCount") is not None else node_state.get("revision_count")
                        if rev is not None:
                            case.status.revision_count = rev
                        if node_state.get("report"):
                            case.report = node_state["report"]
                        case_store.save(case)
            result = accumulated_state
        else:
            result = initial_state
            result["stage"] = WorkflowStage.COMPLETE
            active_workflows[procurement_id] = result
        
        # Final status persistence
        case = case_store.get(procurement_id)
        if case:
            case.status.stage = result.get("stage", WorkflowStage.AWAITING_APPROVAL)
            case.status.revision_count = result.get("revisionCount", result.get("revision_count", 0))
            if result.get("report"):
                case.report = result["report"]
            case_store.save(case)
    except Exception as e:
        print(f"[Workflow Runner] Execution error on {procurement_id}: {e}")
        if procurement_id in active_workflows:
            active_workflows[procurement_id]["stage"] = WorkflowStage.FAILED
            active_workflows[procurement_id]["failureReason"] = str(e)
        case = case_store.get(procurement_id)
        if case:
            case.status.stage = WorkflowStage.FAILED
            case.status.failure_reason = str(e)
            case_store.save(case)

@router.post("/submit", response_model=SubmitProcurementResponse)
async def submit_procurement(
    request: Request,
    background_tasks: BackgroundTasks,
    vendorName: Optional[str] = Form(None),
    dealSize: Optional[float] = Form(None),
    procurementDetails: Optional[str] = Form(None),
    investigationPlan: Optional[InvestigationPlan] = Form(None),
    contractDocument: Optional[UploadFile] = File(None)
):
    """Initiates an autonomous procurement risk evaluation workflow supporting both Form and JSON."""
    # Check if request was submitted as application/json
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            vendorName = body.get("vendorName") or body.get("vendor_name", vendorName)
            if body.get("dealSize") is not None:
                dealSize = float(body.get("dealSize"))
            elif body.get("deal_size") is not None:
                dealSize = float(body.get("deal_size"))
            procurementDetails = body.get("procurementDetails") or body.get("procurement_details", procurementDetails)
            plan_val = body.get("investigationPlan") or body.get("investigation_plan")
            if plan_val:
                investigationPlan = InvestigationPlan(plan_val)
        except Exception as err:
            print(f"[ProcurementSubmit] JSON parse note: {err}")

    if not vendorName:
        raise HTTPException(status_code=422, detail="Field 'vendorName' is required")
    if dealSize is None:
        raise HTTPException(status_code=422, detail="Field 'dealSize' is required")
    if not procurementDetails:
        raise HTTPException(status_code=422, detail="Field 'procurementDetails' is required")
    if not investigationPlan:
        investigationPlan = InvestigationPlan.FULL

    # Generate ID format PR-2026-XXXX-[INITIALS]
    initials = "".join([w[0] for w in vendorName.split()[:2]]).upper() or "VN"
    procurement_id = f"PR-2026-{uuid.uuid4().hex[:4].upper()}-{initials}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Ingest contract document if uploaded
    contract_doc_path = None
    contract_clauses_extracted = None
    if contractDocument and contractDocument.filename:
        try:
            uploads_dir = Path("processed_data/uploads") / procurement_id
            uploads_dir.mkdir(parents=True, exist_ok=True)
            saved_file = uploads_dir / contractDocument.filename
            
            file_bytes = await contractDocument.read()
            with open(saved_file, "wb") as f:
                f.write(file_bytes)
            
            contract_doc_path = str(saved_file)
            contract_clauses_extracted = extract_contract_clauses(contract_doc_path, contractDocument.filename)
            print(f"[ProcurementSubmit] Ingested and parsed contract: {contractDocument.filename} ({len(file_bytes)} bytes)")
        except Exception as e:
            print(f"[ProcurementSubmit] Error during contract file processing: {e}")

    initial_status = WorkflowStatus(
        procurement_id=procurement_id,
        stage=WorkflowStage.PLANNING,
        investigation_plan=investigationPlan,
        revision_count=0,
        max_revisions=3,
        failure_reason=None
    )

    initial_evidence: Dict[str, Any] = {}
    if contract_clauses_extracted:
        initial_evidence["contract_clauses"] = contract_clauses_extracted

    initial_state: WorkflowState = {
        "procurementId": procurement_id,
        "vendorName": vendorName,
        "dealSize": dealSize,
        "procurementDetails": procurementDetails,
        "category": "Pharmaceuticals",
        "investigationPlan": investigationPlan,
        "stage": WorkflowStage.PLANNING,
        "revisionCount": 0,
        "maxRevisions": 3,
        "evidence_bundle": initial_evidence,
        "contractDocumentPath": contract_doc_path or (contractDocument.filename if contractDocument else None)
    }

    active_workflows[procurement_id] = initial_state

    # Register in case store
    summary_item = ProcurementItemSummary(
        procurement_id=procurement_id,
        vendor_name=vendorName,
        deal_size=dealSize,
        status=initial_status,
        report=None,
        approval=None,
        created_at=now_iso
    )
    case_store.save(summary_item)

    # Launch agent workflow in background
    background_tasks.add_task(_run_workflow_sync, procurement_id, initial_state)

    return SubmitProcurementResponse(
        procurement_id=procurement_id,
        status=initial_status
    )

@router.get("/{procurement_id}/status", response_model=WorkflowStatus)
async def get_procurement_status(procurement_id: str):
    """Lightweight polling endpoint hit every 1.5s by the frontend."""
    case = case_store.get(procurement_id)
    if not case:
        raise HTTPException(status_code=404, detail="Procurement record not found")
        
    if case.status.stage == WorkflowStage.COMPLETE or case.approval:
        return case.status

    if procurement_id in active_workflows:
        wf = active_workflows[procurement_id]
        stage = wf.get("stage", case.status.stage)
        rev = wf.get("revisionCount", case.status.revision_count)
        return WorkflowStatus(
            procurement_id=procurement_id,
            stage=stage,
            investigation_plan=case.status.investigation_plan,
            revision_count=rev,
            max_revisions=3,
            failure_reason=wf.get("failureReason")
        )
        
    return case.status

@router.get("/{procurement_id}/report", response_model=ProcurementReport)
async def get_procurement_report(procurement_id: str):
    """Retrieves the finalized ProcurementReport once stage is AWAITING_APPROVAL or COMPLETE."""
    case = case_store.get(procurement_id)
    if not case:
        raise HTTPException(status_code=404, detail="Procurement record not found")
        
    if case.report:
        return case.report
        
    if procurement_id in active_workflows:
        wf = active_workflows[procurement_id]
        if wf.get("report"):
            return wf["report"]
            
    raise HTTPException(status_code=404, detail="Report not ready")

@router.get("/all", response_model=List[ProcurementItemSummary])
async def get_all_procurements():
    """Returns all procurement records sorted by creation date descending."""
    return case_store.get_all()

@router.delete("/vendor/{vendor_identifier}")
async def delete_vendor(vendor_identifier: str):
    """Deletes a vendor catalog entry from the database."""
    deleted = case_store.delete_vendor(vendor_identifier)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {
        "success": True,
        "vendor_identifier": vendor_identifier,
        "message": f"Vendor '{vendor_identifier}' deleted successfully"
    }

@router.delete("/{procurement_id}")
async def delete_procurement_case(procurement_id: str):
    """Deletes a procurement case from the database and active workflows."""
    if procurement_id in active_workflows:
        del active_workflows[procurement_id]
    deleted = case_store.delete(procurement_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Procurement record not found")
    return {
        "success": True,
        "procurement_id": procurement_id,
        "message": "Procurement case deleted successfully"
    }

@router.get("/logs")
async def get_governance_logs():
    """Returns forensic audit and governance logs across all procurement workflow cases."""
    return {
        "count": len(case_store.get_all()),
        "currency": "INR",
        "logs": case_store.get_all_audit_logs()
    }

@router.get("/{procurement_id}/audit")
async def get_case_audit(procurement_id: str):
    """Retrieves step-by-step forensic governance and audit timeline for a specific procurement case."""
    log = case_store.get_case_audit_log(procurement_id)
    if not log:
        raise HTTPException(status_code=404, detail="Procurement case not found")
    return log

@router.get("/vendors")
async def list_vendors():
    """Retrieves all registered pharmaceutical vendors from the SQLite database."""
    vendors = case_store.get_all_vendors()
    return {
        "total": len(vendors),
        "currency": "INR",
        "vendors": vendors
    }

@router.get("/vendors/{vendor_identifier}")
async def get_vendor_details(vendor_identifier: str):
    """Retrieves specific vendor record and catalog products from the SQLite database."""
    vendor = case_store.get_vendor(vendor_identifier)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    products = case_store.get_vendor_products(vendor.get("vendor_id") or vendor_identifier)
    profile = case_store.get_vendor_profile(vendor.get("vendor_name"))
    return {
        "vendor": vendor,
        "cached_profile": profile,
        "products": products
    }

@router.get("/pricing-catalog")
async def get_pricing_catalog():
    """Retrieves NPPA DPCO 2013 statutory price ceiling benchmarks from SQLite."""
    items = case_store.get_pricing_references()
    return {
        "total": len(items),
        "currency": "INR",
        "items": items
    }

# --- Legacy endpoint aliases for backward compatibility ---
@router.post("/run")
async def run_procurement_legacy(req: Dict[str, Any], background_tasks: BackgroundTasks):
    v_name = req.get("vendor_name", "Vendor")
    d_size = float(req.get("deal_size", 100000.0))
    p_det = req.get("procurement_details", "Supply order")
    initials = "".join([w[0] for w in v_name.split()[:2]]).upper() or "VN"
    procurement_id = f"PR-2026-{uuid.uuid4().hex[:4].upper()}-{initials}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    status = WorkflowStatus(
        procurement_id=procurement_id,
        stage=WorkflowStage.PLANNING,
        investigation_plan=InvestigationPlan.FULL,
        revision_count=0,
        max_revisions=3
    )
    initial_state = {
        "procurementId": procurement_id,
        "vendorName": v_name,
        "dealSize": d_size,
        "procurementDetails": p_det,
        "category": req.get("category", "Pharmaceuticals"),
        "investigationPlan": InvestigationPlan.FULL,
        "stage": WorkflowStage.PLANNING,
        "revisionCount": 0,
        "maxRevisions": 3,
        "evidence_bundle": {}
    }
    active_workflows[procurement_id] = initial_state
    case_store.save(
        ProcurementItemSummary(
            procurement_id=procurement_id,
            vendor_name=v_name,
            deal_size=d_size,
            status=status,
            created_at=now_iso
        )
    )
    # Execute immediately
    _run_workflow_sync(procurement_id, initial_state)
    case = case_store.get(procurement_id)
    return {
        "procurement_id": procurement_id,
        "status": case.status.stage if case else "COMPLETE",
        "report": case.report.model_dump(by_alias=True) if case and case.report else {}
    }

@router.get("/queue")
async def get_queue_legacy():
    return case_store.get_pending_approvals()

