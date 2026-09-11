"""
Workflow State definition for AutonoSource multi-agent pipeline.
Supports both the canonical flat schema (Specification Section 1) and legacy compatibility.
"""

from typing import TypedDict, Optional, List, Dict, Any
from app.models.schemas import (
    InvestigationPlan,
    WorkflowStage,
    RankedContext,
    RiskAssessment,
    ProcurementReport,
)

class ProcurementRequest(TypedDict, total=False):
    vendor_name: str
    deal_size: float
    procurement_details: str
    category: str
    quoted_unit_price: Optional[float]
    contract_document_id: Optional[str]

class WorkflowState(TypedDict, total=False):
    """
    Shared state across LangGraph agent nodes.
    Flat design with typed schemas.
    """
    # Canonical flat fields
    procurementId: str
    vendorName: str
    dealSize: float
    procurementDetails: str
    category: str
    contractDocumentPath: Optional[str]

    investigationPlan: InvestigationPlan
    stage: WorkflowStage
    revisionCount: int
    maxRevisions: int

    fusedContext: Optional[RankedContext]
    riskAssessment: Optional[RiskAssessment]
    criticFeedback: Optional[str]
    report: Optional[ProcurementReport]
    failureReason: Optional[str]

    # Legacy/compatibility fields for existing nodes
    request: Any
    investigation_plan: str
    evidence_bundle: Dict[str, Any]
    risk_assessment: Any
    revision_count: int
    max_revisions: int
    final_report: Dict[str, Any]
    human_approved: bool
    human_decision: Optional[str]
