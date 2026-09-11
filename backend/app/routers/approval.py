"""
Approval Router for AutonoSource (pharmProcure).
Provides Human-in-the-Loop governance endpoints:
- GET  /approval/pending: Returns list of cases in AWAITING_APPROVAL state
- POST /approval/{id}/decide: Records human decision (APPROVE, REJECT, REQUEST_MORE_INFO)
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime, timezone

from app.models.schemas import (
    PendingApprovalItem,
    ApprovalDecisionRequest,
    ApprovalDecisionResponse,
    ApprovalRecord,
    ApprovalDecision,
    WorkflowStage
)
from app.db.session import case_store

router = APIRouter(prefix="/approval", tags=["Human Approval"])

@router.get("/pending", response_model=List[PendingApprovalItem])
async def get_pending_approvals():
    """Lists all procurement items awaiting officer review."""
    return case_store.get_pending_approvals()

@router.post("/{procurement_id}/decide", response_model=ApprovalDecisionResponse)
async def decide_procurement(procurement_id: str, req: ApprovalDecisionRequest):
    """
    Records human approval decision.
    REJECT and REQUEST_MORE_INFO require a non-empty reason.
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
    elif req.decision == ApprovalDecision.REQUEST_MORE_INFO:
        # Loop back to executing with increased revision count
        case.status.revision_count += 1
        case.status.stage = WorkflowStage.EXECUTING
        case.approval = None

    case_store.save(case)

    return ApprovalDecisionResponse(
        success=True,
        record=record
    )
