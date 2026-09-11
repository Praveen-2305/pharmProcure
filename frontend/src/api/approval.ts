import { ApprovalDecision, ApprovalRecord } from './types';
import { mockProcurementAPI, RequestOptions } from './procurement';
import { httpClient } from './httpClient';
import { ApiError } from './errors';

export interface PendingApprovalItem {
  procurementId: string;
  vendorName: string;
  dealSize: number;
  submittedAt: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  investigationPlan: 'LIGHT' | 'FULL';
  summary: string;
}

export interface ApprovalAPI {
  getPendingApprovals(options?: RequestOptions): Promise<PendingApprovalItem[]>;
  decide(
    procurementId: string,
    decision: ApprovalDecision,
    reason?: string,
    decidedBy?: string,
    options?: RequestOptions
  ): Promise<{ success: boolean; record: ApprovalRecord }>;
}

const mockApprovalDecisions: Map<string, ApprovalRecord> = new Map();

export const mockApprovalAPI: ApprovalAPI = {
  async getPendingApprovals(options?: RequestOptions) {
    const all = await mockProcurementAPI.getAllProcurements(options);
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

  async decide(
    procurementId: string,
    decision: ApprovalDecision,
    reason?: string,
    decidedBy = 'Procurement Officer',
    options?: RequestOptions
  ) {
    if ((decision === 'REJECT' || decision === 'REQUEST_MORE_INFO') && (!reason || reason.trim() === '')) {
      throw new ApiError({
        message: `A justification reason is mandatory for ${decision} decisions.`,
        status: 400,
        code: 'VALIDATION_ERROR',
        validationErrors: {
          reason: `A justification reason is mandatory for ${decision} decisions.`,
        },
      });
    }

    const record: ApprovalRecord = {
      decision,
      reason: reason?.trim(),
      decidedBy,
      decidedAt: new Date().toISOString(),
    };

    mockApprovalDecisions.set(procurementId, record);

    // Update status in procurement store
    const status = await mockProcurementAPI.getStatus(procurementId, options);
    if (status) {
      if (decision === 'APPROVE' || decision === 'REJECT') {
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
  async getPendingApprovals(options?: RequestOptions): Promise<PendingApprovalItem[]> {
    return httpClient.get<PendingApprovalItem[]>('/approval/pending', options);
  },

  async decide(
    procurementId: string,
    decision: ApprovalDecision,
    reason?: string,
    decidedBy = 'Procurement Officer',
    options?: RequestOptions
  ): Promise<{ success: boolean; record: ApprovalRecord }> {
    return httpClient.post<{ success: boolean; record: ApprovalRecord }>(
      `/approval/${encodeURIComponent(procurementId)}/decide`,
      { decision, reason, decidedBy },
      options
    );
  },
};
