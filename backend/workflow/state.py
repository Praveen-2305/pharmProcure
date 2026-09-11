"""
State definition for the AutonoSource Multi-Agent Pipeline (POC v2.0).
Defines Pydantic models and TypedDict WorkflowState schemas.
"""

from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ProcurementRequest(BaseModel):
    vendor_name: str
    deal_size: float
    procurement_details: str
    contract_document_id: Optional[str] = None
    category: str = "Pharmaceuticals"
    quoted_unit_price: Optional[float] = None

class ContradictionFlag(BaseModel):
    fact_a: str
    fact_b: str
    description: str
    severity: str = "MEDIUM"

class RiskAssessment(BaseModel):
    financial_risk: str = "PENDING"  # LOW, MEDIUM, HIGH
    compliance_risk: str = "PENDING"  # LOW, MEDIUM, HIGH
    contract_risk: str = "PENDING"   # LOW, MEDIUM, HIGH
    pricing_risk: str = "PENDING"    # WITHIN_CEILING, EXCEEDS_CEILING, INDETERMINATE
    overall_risk: str = "PENDING"     # LOW, MEDIUM, HIGH
    confidence_score: float = 0.0
    rationale: str = ""
    contradiction_flags: List[ContradictionFlag] = []

class WorkflowState(TypedDict):
    """
    State definition for the AutonoSource Multi-Agent Pipeline.
    Shared across LangGraph agent nodes.
    """
    request: ProcurementRequest
    investigation_plan: str           # LIGHT vs. FULL
    stage: str                        # PLANNING, EXECUTING, SCORING, CRITIQUING, WRITING_REPORT, AWAITING_APPROVAL, COMPLETED, FAILED
    evidence_bundle: Dict[str, Any]
    risk_assessment: RiskAssessment
    revision_count: int
    max_revisions: int
    final_report: Dict[str, Any]
    human_approved: bool
    human_decision: Optional[str]     # APPROVED, REJECTED, ESCALATED
    failure_reason: Optional[str]
