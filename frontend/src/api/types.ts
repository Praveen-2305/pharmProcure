// Domain model for AutonoSource (Source of truth: POC v2.0)

export type InvestigationPlan = "LIGHT" | "FULL";

export type WorkflowStage =
  | "PLANNING"
  | "EXECUTING"
  | "SCORING"
  | "CRITIQUING"
  | "WRITING_REPORT"
  | "AWAITING_APPROVAL"
  | "COMPLETE"
  | "FAILED";

export interface WorkflowStatus {
  procurementId: string;
  stage: WorkflowStage;
  investigationPlan: InvestigationPlan;
  revisionCount: number;
  maxRevisions: number;
  failureReason?: string; // see §1.4 failure cases
}

// --- Fusion / hybrid RAG (POC §3.3)
export interface RankedFact {
  factId: string;
  text: string;
  source: "vector" | "graph";
  retrieverScore: number;      // normalized [0,1]
  sourceWeight: number;        // source-priority weight
  finalScore: number;          // retrieverScore * sourceWeight
  isPrimary: boolean;
  contradictionFlag: boolean;
  conflictsWith?: string;      // factId of the runner-up, if flagged
}

export interface RankedContext {
  facts: RankedFact[];
  overallConfidence: number;   // weighted_avg(top facts) * (1 - contradiction_penalty)
  fallbackToVectorOnly: boolean; // true when graph retriever returned no path
}

// --- Risk assessment (POC §3.4, four dimensions incl. Pricing Risk)
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PricingRiskStatus = "WITHIN_CEILING" | "EXCEEDS_CEILING" | "INDETERMINATE";

export interface PricingRisk {
  status: PricingRiskStatus;
  ceilingPrice?: number;
  quotedPrice: number;
  excessAmount?: number;       // only when EXCEEDS_CEILING
}

export interface RiskAssessment {
  financialRisk: { level: RiskLevel; rationale: string };
  complianceRisk: { level: RiskLevel; rationale: string };
  contractRisk: { level: RiskLevel; rationale: string };
  pricingRisk: PricingRisk;
  overallRisk: RiskLevel;
  confidenceScore: number; // 0-1 — evidence completeness, NOT risk severity. Never merge these two concepts in the UI.
}

// --- Report Writer output (POC §4 Step 8)
export interface ProcurementReport {
  vendorSummary: string;
  financialAssessment: string;
  complianceFindings: string;
  flaggedContractClauses: string[];
  evidenceSummary: string;
  fusedContext: RankedContext;
  riskAssessment: RiskAssessment;
  riskExplanation: string;
  recommendation: string;
}

// --- Human approval (POC §4 Step 9)
export type ApprovalDecision = "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";

export interface ApprovalRecord {
  decision: ApprovalDecision;
  reason?: string; // required for REJECT and REQUEST_MORE_INFO
  decidedBy: string;
  decidedAt: string;
}

// Request and summary types for views and audit trails
export interface SubmitProcurementRequest {
  vendorName: string;
  dealSize: number;
  contractDocument?: File | string;
  procurementDetails: string;
  investigationPlan?: InvestigationPlan;
}

export interface ProcurementItemSummary {
  procurementId: string;
  vendorName: string;
  dealSize: number;
  status: WorkflowStatus;
  report?: ProcurementReport;
  approval?: ApprovalRecord;
  createdAt: string;
}
