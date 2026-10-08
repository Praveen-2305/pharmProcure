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

export type MarketPowerLevel = "DOMINANT" | "STRONG" | "MODERATE" | "COMPETITIVE";

export interface OperationalResilience {
  onTimeDeliveryRate: number;
  manufacturingCapacityScore: number;
  coldChainReliability: string;
  fulfillmentRiskSummary: string;
}

export interface RegulatoryQualityRecord {
  cdscoLicenseValid: boolean;
  scheduleMStatus: string;
  nsqBatchAlertsCount: number;
  regulatoryTrackRecord: string;
}

export interface GovernanceIntegrity {
  blacklistingStatus: string;
  litigationCount: number;
  ncltInsolvencyFlag: boolean;
  governanceSummary: string;
}

export interface VendorTransparencyMatrix {
  annualRevenueCr: number;
  solvencyRatio: number;
  creditRating: string;
  financialHealthSummary: string;
  marketStanding: string;
  marketPowerLevel: MarketPowerLevel;
  bargainingLeverage: string;
  operationalResilience: OperationalResilience;
  regulatoryQuality: RegulatoryQualityRecord;
  governanceIntegrity: GovernanceIntegrity;
  overallTransparencyScore: number;
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
  vendorTransparency?: VendorTransparencyMatrix;
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

// --- Instant Price Checker Types
export interface DrugCatalogItem {
  category: string;
  name: string;
  ceilingPrice: number;
  currency: string;
  unitMeasure: string;
  regulatoryNotification: string;
  therapeuticUse?: string;
}

export interface PriceCheckRequest {
  drugName: string;
  strengthOrPack?: string;
  quotedPrice: number;
  quantity: number;
  vendorName?: string;
}

export interface PriceCheckResponse {
  drugName: string;
  category: string;
  quotedPrice: number;
  ceilingPrice: number;
  quantity: number;
  totalQuoted: number;
  totalCeiling: number;
  unitVariance: number;
  totalOverpayment: number;
  percentageDifference: number;
  isCompliant: boolean;
  verdict: 'LEGAL' | 'STATUTORY_VIOLATION';
  verdictMessage: string;
  dpcoReference: string;
  unitMeasure: string;
  therapeuticUse?: string;
}

// --- Impact & ROI Analytics Types
export interface ImpactAssumptionData {
  analystHourlyRateInr: number;
  manualReviewHoursPerCase: number;
  aiReviewHoursPerCase: number;
  annualPlatformCostInr: number;
  statutoryPenaltyMultiplier: number;
}

export interface MonthlySavingsPoint {
  month: string;
  savingsInr: number;
  casesCount: number;
  procurementVolumeInr: number;
}

export interface ExposedVendorSummary {
  vendorName: string;
  casesCount: number;
  totalDealSizeInr: number;
  overpaymentCaughtInr: number;
  riskLevel: string;
  primaryViolation: string;
}

export interface RiskDistributionSummary {
  low: number;
  medium: number;
  high: number;
}

export interface ImpactAnalyticsResponse {
  totalCasesProcessed: number;
  illegalQuotesBlockedCount: number;
  totalProcurementVolumeInr: number;
  totalOverpaymentBlockedInr: number;
  analystHoursSaved: number;
  laborCostSavingsInr: number;
  statutoryPenaltiesPreventedInr: number;
  netFinancialBenefitInr: number;
  roiMultiple: number;
  averageTurnaroundMinutes: number;
  riskDistribution: RiskDistributionSummary;
  savingsOverTime: MonthlySavingsPoint[];
  topExposedVendors: ExposedVendorSummary[];
  assumptions: ImpactAssumptionData;
}

// --- AI Copilot Types
export interface CitationItem {
  id: string;
  title: string;
  source: string;
  excerpt: string;
}

export interface CopilotAskRequest {
  query: string;
  caseId?: string;
  vendorName?: string;
  currentRoute?: string;
}

export interface CopilotAskResponse {
  answer: string;
  citations: CitationItem[];
  isGrounded: boolean;
  suggestedQueries: string[];
}

// --- Multi-Vendor Comparison Types
export interface VendorPillarScores {
  financialScore: number;
  marketPowerScore: number;
  operationalScore: number;
  complianceScore: number;
  governanceScore: number;
}

export interface VendorComparisonCandidate {
  vendorName: string;
  vendorId?: string;
  state: string;
  creditRating: string;
  quotedUnitPrice: number;
  ceilingUnitPrice: number;
  totalCostOfOwnershipInr: number;
  isPriceCompliant: boolean;
  coldChainSla: string;
  scheduleMStatus: string;
  otifRatePercent: number;
  compositeRankScore: number;
  pillars: VendorPillarScores;
  flags: string[];
}

export interface DisqualificationRationale {
  vendorName: string;
  disqualificationReason: string;
}

export interface ComparisonRecommendation {
  recommendedVendor: string;
  selectionRationale: string;
  whyNotOthers: DisqualificationRationale[];
}

export interface MultiVendorCompareRequest {
  vendorNames: string[];
  drugName: string;
  quantity: number;
  priceWeight?: number;
  complianceWeight?: number;
  resilienceWeight?: number;
  governanceWeight?: number;
}

export interface MultiVendorCompareResponse {
  drugName: string;
  quantity: number;
  ceilingPriceInr: number;
  dpcoReference: string;
  candidates: VendorComparisonCandidate[];
  recommendation: ComparisonRecommendation;
}

// --- Contract Analyzer & Negotiation Pack (Feature 6)
export interface AuditedClauseCard {
  clauseId: string;
  clauseTitle: string;
  extractedText: string;
  complianceStatus: "COMPLIANT" | "WARNING" | "VIOLATION";
  severity: "LOW" | "MEDIUM" | "HIGH";
  statuteCited: string;
  legalBenchmark: string;
  recommendedRemedy: string;
}

export interface ContractAuditResponse {
  documentName: string;
  overallContractRisk: "LOW" | "MEDIUM" | "HIGH";
  totalClausesAnalyzed: number;
  violationsCount: number;
  warningsCount: number;
  compliantCount: number;
  summaryRationale: string;
  clauses: AuditedClauseCard[];
}

export interface ReplacementClauseItem {
  clauseTitle: string;
  problematicOriginal: string;
  statutoryReplacementClause: string;
  rationale: string;
}

export interface NegotiationPackRequest {
  vendorName?: string;
  contractTitle?: string;
  flaggedClauses?: string[];
}

export interface NegotiationPackResponse {
  vendorName: string;
  contractTitle: string;
  emailSubject: string;
  emailBodyDraft: string;
  replacementClauses: ReplacementClauseItem[];
  negotiationStrategyTips: string[];
}

// --- What-If Scenario Simulator (Feature 7)
export interface SimulationInputs {
  quotedPrice?: number;
  coldChainSla?: string;
  liabilityCapPercent?: number;
  liabilityCapInr?: number;
  otifRatePercent?: number;
  paymentTermsDays?: number;
  creditScore?: number;
  curePeriodDays?: number;
}

export interface DimensionScore {
  dimension: string;
  originalLevel: string;
  simulatedLevel: string;
  originalRationale: string;
  simulatedRationale: string;
  improved: boolean;
}

export interface SimulationResponse {
  procurementId: string;
  vendorName: string;
  originalOverallRisk: RiskLevel | string;
  simulatedOverallRisk: RiskLevel | string;
  riskScoreBefore: number;
  riskScoreAfter: number;
  riskScoreDelta: number;
  isDpcoCompliantBefore: boolean;
  isDpcoCompliantAfter: boolean;
  ceilingPriceInr: number;
  quotedPriceBefore: number;
  quotedPriceAfter: number;
  priceVariancePercentAfter: number;
  dimensions: DimensionScore[];
  negotiationRecommendation: string;
}

// --- Vendor Directory & Vendor 360 (Feature 3)
export interface VendorDirectoryItem {
  vendorId: string;
  vendorName: string;
  productCategory: string;
  country: string;
  state: string;
  city: string;
  creditRating: string;
  annualRevenueInrCr: number;
  solvencyRatio: number;
  whoTrs1025Compliant: boolean;
  scheduleMCompliant: boolean;
  coldChainCapable: boolean;
  auditRiskLevel: string;
  caseCount: number;
  productCount: number;
  otifRatePercent: number;
  compositeQualityScore: number;
}

export interface VendorDirectoryResponse {
  total: number;
  currency: string;
  vendors: VendorDirectoryItem[];
}

export interface VendorProductItem {
  productId: string;
  productName: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  quotedUnitPrice: number;
  regulatedCeilingPrice?: number;
  isDpcoCompliant: boolean;
  coldChainRequired: boolean;
}

export interface LinkedCaseItem {
  procurementId: string;
  dealSize: number;
  stage: string;
  overallRisk: string;
  createdAt: string;
}

export interface RiskTrendPoint {
  quarter: string;
  riskScore: number;
  auditedCases: number;
}

export interface PillarBreakdown {
  financialScore: number;
  marketPowerScore: number;
  operationalScore: number;
  complianceScore: number;
  governanceScore: number;
}

export interface Vendor360Response {
  vendorId: string;
  vendorName: string;
  productCategory: string;
  country: string;
  state: string;
  city: string;
  headquartersAddress: string;
  contactEmail: string;
  contactPhone: string;
  taxIdentificationNumber: string;
  drugLicenseNumber: string;
  incorporationYear: number;
  annualRevenueInrCr: number;
  currency: string;
  creditRating: string;
  solvencyRatio: number;
  whoGmpCertified: boolean;
  fdaApproved: boolean;
  scheduleMCompliant: boolean;
  whoTrs1025Compliant: boolean;
  coldChainCapable: boolean;
  auditRiskLevel: string;
  otifRatePercent: number;
  pillars: PillarBreakdown;
  riskTrend: RiskTrendPoint[];
  products: VendorProductItem[];
  linkedCases: LinkedCaseItem[];
}
