import { httpClient } from './httpClient';

export interface AuditEventItem {
  event: string;
  timestamp: string;
  stage: string;
  detail: string;
}

export interface CaseAuditLog {
  procurementId: string;
  vendorName: string;
  dealSizeInr: number;
  currency: string;
  currentStage: string;
  investigationPlan: string;
  revisionsExecuted: number;
  createdAt: string;
  timeline: AuditEventItem[];
  riskSummary?: {
    overallRisk: string;
    confidenceScore?: number;
    financialRisk?: { level: string; rationale: string };
    complianceRisk?: { level: string; rationale: string };
    contractRisk?: { level: string; rationale: string };
    pricingRisk?: { status: string; quotedPrice?: number; ceilingPrice?: number; excessAmount?: number };
  };
  approvalRecord?: {
    decision: string;
    decidedBy: string;
    decidedAt: string;
    reason?: string;
  };
  governanceStatus: string;
}

export interface GovernanceLogsResponse {
  count: number;
  currency: string;
  logs: CaseAuditLog[];
}

const FALLBACK_LOGS: CaseAuditLog[] = [
  {
    procurementId: 'case-001',
    vendorName: 'Apex BioLogistics Pvt Ltd',
    dealSizeInr: 27900000,
    currency: 'INR',
    currentStage: 'COMPLETE',
    investigationPlan: 'comprehensive',
    revisionsExecuted: 1,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    governanceStatus: 'AUDITED_AND_VERIFIED',
    timeline: [
      {
        event: 'PROCUREMENT_INITIALIZED',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        stage: 'PLANNING',
        detail: 'Procurement case ingested: 10,000 vials Trastuzumab 440mg with active cold-chain IoT tracking.',
      },
      {
        event: 'EVIDENCE_SYNTHESIZED',
        timestamp: new Date(Date.now() - 3600000 * 46).toISOString(),
        stage: 'SCORING',
        detail: 'Extracted 14 facts from Graph ontology & Vector index. CDSCO WHO-GMP valid; monsoon temperature breach detected.',
      },
      {
        event: 'RISK_AUDIT_COMPLETED',
        timestamp: new Date(Date.now() - 3600000 * 45).toISOString(),
        stage: 'WRITING_REPORT',
        detail: 'Assessed Overall Risk: HIGH. DPCO ceiling breach of ₹30,00,000 flagged by Price Verifier agent.',
      },
      {
        event: 'GOVERNANCE_DECISION_RECORDED',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        stage: 'COMPLETE',
        detail: 'Decided by Vikram Malhotra: REJECT. Rationale: Quoted price ₹2,790 exceeds statutory DPCO 2013 ceiling of ₹2,490.',
      },
    ],
    riskSummary: {
      overallRisk: 'HIGH',
      confidenceScore: 0.92,
      financialRisk: { level: 'MEDIUM', rationale: 'Adequate liquidity but high working capital leverage' },
      complianceRisk: { level: 'LOW', rationale: 'Active CDSCO Form 28 manufacturing license' },
      contractRisk: { level: 'HIGH', rationale: 'Liquidated damages capped below DPCO statutory penalties' },
      pricingRisk: {
        status: 'EXCEEDS_CEILING',
        quotedPrice: 27900000,
        ceilingPrice: 24900000,
        excessAmount: 3000000,
      },
    },
    approvalRecord: {
      decision: 'REJECT',
      decidedBy: 'Vikram Malhotra',
      decidedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      reason: 'Statutory DPCO ceiling violation of ₹30,00,000. Re-tender required under revised NPPA order terms.',
    },
  },
  {
    procurementId: 'case-002',
    vendorName: 'Bharat Pharma Labs',
    dealSizeInr: 14500000,
    currency: 'INR',
    currentStage: 'COMPLETE',
    investigationPlan: 'standard',
    revisionsExecuted: 0,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    governanceStatus: 'AUDITED_AND_VERIFIED',
    timeline: [
      {
        event: 'PROCUREMENT_INITIALIZED',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        stage: 'PLANNING',
        detail: 'Scope: 50,000 packs Amoxicillin + Clavulanic Acid 625mg bulk supply.',
      },
      {
        event: 'EVIDENCE_SYNTHESIZED',
        timestamp: new Date(Date.now() - 3600000 * 71).toISOString(),
        stage: 'SCORING',
        detail: 'CDSCO Form 25 verified clean. 0 FDA 483 citations in past 24 months.',
      },
      {
        event: 'RISK_AUDIT_COMPLETED',
        timestamp: new Date(Date.now() - 3600000 * 70).toISOString(),
        stage: 'WRITING_REPORT',
        detail: 'Overall Risk: LOW. Quoted ₹145/pack vs DPCO ceiling ₹182/pack (20.3% margin buffer).',
      },
      {
        event: 'GOVERNANCE_DECISION_RECORDED',
        timestamp: new Date(Date.now() - 3600000 * 68).toISOString(),
        stage: 'COMPLETE',
        detail: 'Decided by Aria Vance: APPROVE. Full compliance verified with CDSCO Schedule M.',
      },
    ],
    riskSummary: {
      overallRisk: 'LOW',
      confidenceScore: 0.96,
      pricingRisk: {
        status: 'WITHIN_CEILING',
        quotedPrice: 14500000,
        ceilingPrice: 18200000,
      },
    },
    approvalRecord: {
      decision: 'APPROVE',
      decidedBy: 'Aria Vance',
      decidedAt: new Date(Date.now() - 3600000 * 68).toISOString(),
      reason: 'Best commercial offer well below NPPA price cap. Excellent GMP track record.',
    },
  },
  {
    procurementId: 'case-003',
    vendorName: 'MedVantage Logistics',
    dealSizeInr: 8900000,
    currency: 'INR',
    currentStage: 'AWAITING_APPROVAL',
    investigationPlan: 'standard',
    revisionsExecuted: 0,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    governanceStatus: 'AUDITED_AND_VERIFIED',
    timeline: [
      {
        event: 'PROCUREMENT_INITIALIZED',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        stage: 'PLANNING',
        detail: 'Annual secondary distributor logistics contract for Tier-2 clinical centers.',
      },
      {
        event: 'RISK_AUDIT_COMPLETED',
        timestamp: new Date(Date.now() - 3600000 * 11).toISOString(),
        stage: 'WRITING_REPORT',
        detail: 'Assessed Overall Risk: MEDIUM. Cold-chain validation cert expiring in 45 days.',
      },
    ],
    riskSummary: {
      overallRisk: 'MEDIUM',
      confidenceScore: 0.88,
    },
  },
];

export async function fetchGovernanceLogs(): Promise<GovernanceLogsResponse> {
  try {
    const raw = await httpClient.get<any>('/procurement/logs');
    if (raw && raw.logs && Array.isArray(raw.logs) && raw.logs.length > 0) {
      // Map snake_case to camelCase
      const mappedLogs: CaseAuditLog[] = raw.logs.map((item: any) => ({
        procurementId: item.procurement_id || item.procurementId,
        vendorName: item.vendor_name || item.vendorName,
        dealSizeInr: item.deal_size_inr || item.dealSize || 0,
        currency: item.currency || 'INR',
        currentStage: item.current_stage || item.currentStage,
        investigationPlan: item.investigation_plan || item.investigationPlan,
        revisionsExecuted: item.revisions_executed ?? item.revisionsExecuted ?? 0,
        createdAt: item.created_at || item.createdAt,
        timeline: (item.timeline || []).map((t: any) => ({
          event: t.event,
          timestamp: t.timestamp,
          stage: t.stage,
          detail: t.detail,
        })),
        riskSummary: item.risk_summary ? {
          overallRisk: item.risk_summary.overall_risk || item.risk_summary.overallRisk,
          confidenceScore: item.risk_summary.confidence_score ?? item.risk_summary.confidenceScore,
          financialRisk: item.risk_summary.financial_risk,
          complianceRisk: item.risk_summary.compliance_risk,
          contractRisk: item.risk_summary.contract_risk,
          pricingRisk: item.risk_summary.pricing_risk ? {
            status: item.risk_summary.pricing_risk.status,
            quotedPrice: item.risk_summary.pricing_risk.quoted_price ?? item.risk_summary.pricing_risk.quotedPrice,
            ceilingPrice: item.risk_summary.pricing_risk.ceiling_price ?? item.risk_summary.pricing_risk.ceilingPrice,
            excessAmount: item.risk_summary.pricing_risk.excess_amount ?? item.risk_summary.pricing_risk.excessAmount,
          } : undefined,
        } : undefined,
        approvalRecord: item.approval_record ? {
          decision: item.approval_record.decision,
          decidedBy: item.approval_record.decided_by || item.approval_record.decidedBy,
          decidedAt: item.approval_record.decided_at || item.approval_record.decidedAt,
          reason: item.approval_record.reason,
        } : undefined,
        governanceStatus: item.governance_status || 'AUDITED_AND_VERIFIED',
      }));

      return {
        count: mappedLogs.length,
        currency: raw.currency || 'INR',
        logs: mappedLogs,
      };
    }
  } catch (err) {
    console.warn('Backend /procurement/logs call failed or in mock mode; using fallback audit logs', err);
  }

  return {
    count: FALLBACK_LOGS.length,
    currency: 'INR',
    logs: FALLBACK_LOGS,
  };
}
