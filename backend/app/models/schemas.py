"""
Pydantic Schemas for AutonoSource (pharmProcure).
Matches frontend/src/api/types.ts contract field-for-field with camelCase serialization.
"""

from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field

class CamelBaseModel(BaseModel):
    """Base model with camelCase serialization and population by field name."""
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda s: "".join(
            word.capitalize() if i > 0 else word for i, word in enumerate(s.split("_"))
        ),
        from_attributes=True
    )

class InvestigationPlan(str, Enum):
    LIGHT = "LIGHT"
    FULL = "FULL"

class WorkflowStage(str, Enum):
    PLANNING = "PLANNING"
    EXECUTING = "EXECUTING"
    SCORING = "SCORING"
    CRITIQUING = "CRITIQUING"
    WRITING_REPORT = "WRITING_REPORT"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"

class WorkflowStatus(CamelBaseModel):
    procurement_id: str
    stage: WorkflowStage
    investigation_plan: InvestigationPlan
    revision_count: int = 0
    max_revisions: int = 3
    failure_reason: Optional[str] = None

class RankedFact(CamelBaseModel):
    fact_id: str
    text: str
    source: str  # "vector" | "graph"
    retriever_score: float
    source_weight: float
    final_score: float
    is_primary: bool = False
    contradiction_flag: bool = False
    conflicts_with: Optional[str] = None

class RankedContext(CamelBaseModel):
    facts: List[RankedFact] = Field(default_factory=list)
    overall_confidence: float = 0.0
    fallback_to_vector_only: bool = False

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class PricingRiskStatus(str, Enum):
    WITHIN_CEILING = "WITHIN_CEILING"
    EXCEEDS_CEILING = "EXCEEDS_CEILING"
    INDETERMINATE = "INDETERMINATE"

class PricingRisk(CamelBaseModel):
    status: PricingRiskStatus
    ceiling_price: Optional[float] = None
    quoted_price: float
    excess_amount: Optional[float] = None

class RiskItem(CamelBaseModel):
    level: RiskLevel
    rationale: str

class RiskAssessment(CamelBaseModel):
    financial_risk: RiskItem
    compliance_risk: RiskItem
    contract_risk: RiskItem
    pricing_risk: PricingRisk
    overall_risk: RiskLevel
    confidence_score: float

class ProcurementReport(CamelBaseModel):
    vendor_summary: str
    financial_assessment: str
    compliance_findings: str
    flagged_contract_clauses: List[str] = Field(default_factory=list)
    evidence_summary: str
    fused_context: RankedContext
    risk_assessment: RiskAssessment
    risk_explanation: str
    recommendation: str

class ApprovalDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REQUEST_MORE_INFO = "REQUEST_MORE_INFO"

class ApprovalRecord(CamelBaseModel):
    decision: ApprovalDecision
    reason: Optional[str] = None
    decided_by: str = "Procurement Officer"
    decided_at: str

class SubmitProcurementResponse(CamelBaseModel):
    procurement_id: str
    status: WorkflowStatus

class ProcurementItemSummary(CamelBaseModel):
    procurement_id: str
    vendor_name: str
    deal_size: float
    status: WorkflowStatus
    report: Optional[ProcurementReport] = None
    approval: Optional[ApprovalRecord] = None
    created_at: str

class PendingApprovalItem(CamelBaseModel):
    procurement_id: str
    vendor_name: str
    deal_size: float
    submitted_at: str
    overall_risk: RiskLevel
    confidence_score: float
    investigation_plan: InvestigationPlan
    summary: str

class ApprovalDecisionRequest(CamelBaseModel):
    decision: ApprovalDecision
    reason: Optional[str] = None
    decided_by: Optional[str] = "Procurement Officer"

class ApprovalDecisionResponse(CamelBaseModel):
    success: bool
    record: ApprovalRecord
