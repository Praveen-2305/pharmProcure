import { ApprovalDecision, ApprovalRecord, WorkflowStatus } from './types';
import { mockProcurementAPI } from './procurement';

export interface ApprovalAPI {
  getPendingApprovals(): Promise<
    Array<{
      procurementId: string;
      vendorName: string;
      dealSize: number;
      submittedAt: string;
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
      confidenceScore: number;
      investigationPlan: 'LIGHT' | 'FULL';
      summary: string;
    }>
  >;
  decide(
    procurementId: string,
    decision: ApprovalDecision,
    reason?: string,
    decidedBy?: string
  ): Promise<{ success: boolean; record: ApprovalRecord }>;
}

const mockApprovalDecisions: Map<string, ApprovalRecord> = new Map();

export const mockApprovalAPI: ApprovalAPI = {
  async getPendingApprovals() {
    const all = await mockProcurementAPI.getAllProcurements();
    // Return items in AWAITING_APPROVAL that haven't been decided yet
    return all
      .filter((item) => item.status.stage === 'AWAITING_APPROVAL' && !mockApprovalDecisions.has(item.procurementId))
      .map((item) => ({
        procurementId: item.procurementId,
        vendorName: item.vendorName,
        dealSize: item.dealSize,
        submittedAt: item.createdAt,
        overallRisk: item.report?.riskAssessment.overallRisk || 'MEDIUM',
        confidenceScore: item.report?.riskAssessment.confidenceScore || 0.85,
        investigationPlan: item.status.investigationPlan,
        summary:
          item.report?.vendorSummary ||
          `Procurement review awaiting executive decision for deal size of $${item.dealSize.toLocaleString()}.`,
      }));
  },

  async decide(procurementId: string, decision: ApprovalDecision, reason?: string, decidedBy = 'Procurement Officer') {
    if ((decision === 'REJECT' || decision === 'REQUEST_MORE_INFO') && (!reason || reason.trim() === '')) {
      throw new Error(`A justification reason is mandatory for ${decision} decisions.`);
    }

    const record: ApprovalRecord = {
      decision,
      reason: reason?.trim(),
      decidedBy,
      decidedAt: new Date().toISOString(),
    };

    mockApprovalDecisions.set(procurementId, record);

    // Update status in procurement store
    const status = await mockProcurementAPI.getStatus(procurementId);
    if (status) {
      if (decision === 'APPROVE') {
        status.stage = 'COMPLETE';
      } else if (decision === 'REJECT') {
        status.stage = 'COMPLETE';
      } else if (decision === 'REQUEST_MORE_INFO') {
        // Re-triggers Executor loop with increased revision count
        status.stage = 'EXECUTING';
        status.revisionCount = Math.min(status.revisionCount + 1, status.maxRevisions);
      }
    }

    return { success: true, record };
  },
};

export const httpApprovalAPI: ApprovalAPI = {
  async getPendingApprovals() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/approval/pending`);
    if (!res.ok) {
      throw new Error(`Failed to fetch pending approvals: ${res.statusText}`);
    }
    return res.json();
  },

  async decide(procurementId: string, decision: ApprovalDecision, reason?: string, decidedBy = 'Procurement Officer') {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/approval/${procurementId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason, decidedBy }),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit decision: ${res.statusText}`);
    }
    return res.json();
  },
};
