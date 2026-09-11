"""
Procurement Router for AutonoSource (pharmProcure).
Implements the authoritative frontend contract:
- POST /procurement/submit: Form/JSON submission to initiate multi-agent pipeline
- GET  /procurement/{id}/status: Polled every 1.5s for live progress & revisionCount
- GET  /procurement/{id}/report: Returns final ProcurementReport once ready
- GET  /procurement/all: Returns all ProcurementItemSummary items for dashboard
"""

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
from src.db.session import case_store

router = APIRouter(prefix="/procurement", tags=["Procurement"])

try:
    workflow_engine = create_procurement_workflow()
except Exception as e:
    print(f"[ProcurementRouter] Workflow initialization note: {e}")
    workflow_engine = None

# Active background workflows
active_workflows: Dict[str, WorkflowState] = {}

def _run_workflow_sync(procurement_id: str, initial_state: WorkflowState):
    """Executes the LangGraph agent pipeline in background."""
    try:
        if workflow_engine:
            result = workflow_engine.invoke(initial_state)
        else:
            result = initial_state
            result["stage"] = WorkflowStage.COMPLETE
            
        active_workflows[procurement_id] = result
        
        # Update case_store with final report
        case = case_store.get(procurement_id)
        if case:
            case.status.stage = result.get("stage", WorkflowStage.AWAITING_APPROVAL)
            case.status.revision_count = result.get("revisionCount", 0)
            if "report" in result and result["report"]:
                case.report = result["report"]
            case_store.save(case)
    except Exception as e:
        print(f"[Workflow Runner] Execution error on {procurement_id}: {e}")
        if procurement_id in active_workflows:
            active_workflows[procurement_id]["stage"] = WorkflowStage.FAILED
            active_workflows[procurement_id]["failureReason"] = str(e)

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

    initial_status = WorkflowStatus(
        procurement_id=procurement_id,
        stage=WorkflowStage.PLANNING,
        investigation_plan=investigationPlan,
        revision_count=0,
        max_revisions=3,
        failure_reason=None
    )

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
        "evidence_bundle": {},
        "contractDocumentPath": contractDocument.filename if contractDocument else None
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
