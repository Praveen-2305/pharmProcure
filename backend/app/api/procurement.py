"""
Procurement REST API Endpoints.
Routes for triggering multi-agent pipeline, queue monitoring, and Human-in-the-Loop decision recording.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

from workflow.state import ProcurementRequest, RiskAssessment
from workflow.graph import create_procurement_workflow

router = APIRouter(prefix="/procurement", tags=["Procurement"])

# Shared memory database for active workflow state
workflows_db: Dict[str, Dict[str, Any]] = {}

try:
    workflow_app = create_procurement_workflow()
except Exception as e:
    print(f"[Procurement API] Workflow note: {e}")
    workflow_app = None

class RunWorkflowRequest(BaseModel):
    vendor_name: str
    deal_size: float
    procurement_details: str
    category: Optional[str] = "Pharmaceuticals"
    quoted_unit_price: Optional[float] = None
    contract_document_id: Optional[str] = None

class HumanApprovalRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, ESCALATED
    notes: Optional[str] = ""
    reviewer_id: Optional[str] = "OFFICER_01"

@router.post("/run")
async def run_procurement(req: RunWorkflowRequest):
    procurement_id = f"PR-{uuid.uuid4().hex[:8].upper()}"
    
    initial_state = {
        "request": ProcurementRequest(
            vendor_name=req.vendor_name,
            deal_size=req.deal_size,
            procurement_details=req.procurement_details,
            category=req.category or "Pharmaceuticals",
            quoted_unit_price=req.quoted_unit_price,
            contract_document_id=req.contract_document_id
        ),
        "investigation_plan": "PENDING",
        "stage": "PLANNING",
        "evidence_bundle": {},
        "risk_assessment": RiskAssessment(),
        "revision_count": 0,
        "max_revisions": 3,
        "final_report": {},
        "human_approved": False,
        "human_decision": None,
        "failure_reason": None
    }
    
    if workflow_app:
        result_state = workflow_app.invoke(initial_state)
    else:
        result_state = initial_state
        result_state["stage"] = "COMPLETED"

    workflows_db[procurement_id] = result_state
    
    return {
        "procurement_id": procurement_id,
        "status": result_state["stage"],
        "investigation_plan": result_state["investigation_plan"],
        "risk_assessment": result_state["risk_assessment"].dict(),
        "report": result_state.get("final_report", {})
    }

@router.get("/queue")
async def get_procurement_queue():
    queue_items = []
    for p_id, state in workflows_db.items():
        req = state["request"]
        risk = state["risk_assessment"]
        queue_items.append({
            "id": p_id,
            "vendorName": req.vendor_name,
            "dealSize": req.deal_size,
            "category": req.category,
            "stage": state["stage"],
            "overallRisk": risk.overall_risk,
            "confidenceScore": risk.confidence_score,
            "humanDecision": state.get("human_decision"),
            "contradictionCount": len(risk.contradiction_flags)
        })
    return queue_items

@router.get("/{procurement_id}")
async def get_procurement(procurement_id: str):
    if procurement_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Procurement workflow ID not found")
        
    state = workflows_db[procurement_id]
    risk = state["risk_assessment"]
    
    return {
        "procurementId": procurement_id,
        "vendorName": state["request"].vendor_name,
        "dealSize": state["request"].deal_size,
        "category": state["request"].category,
        "stage": state["stage"],
        "investigationPlan": state["investigation_plan"],
        "revisionCount": state["revision_count"],
        "maxRevisions": state["max_revisions"],
        "riskAssessment": risk.dict(),
        "evidenceBundle": state.get("evidence_bundle", {}),
        "report": state.get("final_report", {}),
        "humanDecision": state.get("human_decision"),
        "humanApproved": state.get("human_approved", False)
    }

@router.post("/{procurement_id}/approve")
async def approve_procurement(procurement_id: str, req: HumanApprovalRequest):
    if procurement_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Procurement workflow ID not found")
        
    state = workflows_db[procurement_id]
    state["human_decision"] = req.decision
    state["human_approved"] = (req.decision == "APPROVED")
    state["stage"] = "COMPLETED"
    
    return {
        "procurementId": procurement_id,
        "humanDecision": req.decision,
        "status": "COMPLETED",
        "message": f"Procurement request marked as {req.decision} by reviewer {req.reviewer_id}."
    }
