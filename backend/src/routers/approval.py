"""
Approval Router for AutonoSource (pharmProcure).
Provides Human-in-the-Loop governance endpoints:
- GET  /approval/pending: Returns list of cases in AWAITING_APPROVAL state
- POST /approval/{id}/decide: Records human decision (APPROVE, REJECT, REQUEST_MORE_INFO)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from typing import List
from datetime import datetime, timezone

from src.models.schemas import (
    PendingApprovalItem,
    ApprovalDecisionRequest,
    ApprovalDecisionResponse,
    ApprovalRecord,
    ApprovalDecision,
    WorkflowStage
)
from src.db.session import case_store

router = APIRouter(prefix="/approval", tags=["Human Approval"])

@router.get("/pending", response_model=List[PendingApprovalItem])
async def get_pending_approvals():
    """Lists all procurement items awaiting officer review."""
    return case_store.get_pending_approvals()

@router.post("/{procurement_id}/decide", response_model=ApprovalDecisionResponse)
async def decide_procurement(
    procurement_id: str,
    req: ApprovalDecisionRequest,
    background_tasks: BackgroundTasks
):
    """
    Records human approval decision.
    REJECT and REQUEST_MORE_INFO require a non-empty reason.
    REQUEST_MORE_INFO loops back to agent execution with revision count incremented.
    """
    case = case_store.get(procurement_id)
    if not case:
        raise HTTPException(status_code=404, detail="Procurement case not found")

    # Enforce non-empty reason validation on rejection or more info request
    if req.decision in [ApprovalDecision.REJECT, ApprovalDecision.REQUEST_MORE_INFO]:
        if not req.reason or not req.reason.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Reason is required when decision is {req.decision.value}"
            )

    now_iso = datetime.now(timezone.utc).isoformat()
    record = ApprovalRecord(
        decision=req.decision,
        reason=req.reason,
        decided_by=req.decided_by or "Procurement Officer",
        decided_at=now_iso
    )

    if req.decision in [ApprovalDecision.APPROVE, ApprovalDecision.REJECT]:
        case.status.stage = WorkflowStage.COMPLETE
        case.approval = record
        case_store.save(case)
        from src.routers.procurement import active_workflows
        if procurement_id in active_workflows:
            active_workflows[procurement_id]["stage"] = WorkflowStage.COMPLETE
    elif req.decision == ApprovalDecision.REQUEST_MORE_INFO:
        # Loop back to executing with increased revision count
        case.status.revision_count += 1
        case.status.stage = WorkflowStage.EXECUTING
        case.approval = None
        case_store.save(case)

        # Trigger background multi-agent reinvestigation
        from src.routers.procurement import active_workflows, _run_workflow_sync
        reinvestigate_state = active_workflows.get(procurement_id)
        if not reinvestigate_state:
            reinvestigate_state = {
                "procurementId": procurement_id,
                "vendorName": case.vendor_name,
                "dealSize": case.deal_size,
                "procurementDetails": f"Re-investigation: {req.reason}",
                "category": "Pharmaceuticals",
                "investigationPlan": case.status.investigation_plan,
                "stage": WorkflowStage.EXECUTING,
                "revisionCount": case.status.revision_count,
                "maxRevisions": case.status.max_revisions,
                "evidence_bundle": {"officer_feedback": req.reason},
                "criticFeedback": req.reason
            }
        else:
            reinvestigate_state["stage"] = WorkflowStage.EXECUTING
            reinvestigate_state["revisionCount"] = case.status.revision_count
            reinvestigate_state["criticFeedback"] = req.reason
            if "evidence_bundle" not in reinvestigate_state or not isinstance(reinvestigate_state["evidence_bundle"], dict):
                reinvestigate_state["evidence_bundle"] = {}
            reinvestigate_state["evidence_bundle"]["officer_feedback"] = req.reason

        active_workflows[procurement_id] = reinvestigate_state
        background_tasks.add_task(_run_workflow_sync, procurement_id, reinvestigate_state)

    return ApprovalDecisionResponse(
        success=True,
        record=record
    )
