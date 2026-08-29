import { useState, useCallback } from 'react';
import { ApprovalDecision, ApprovalRecord } from '../api/types';
import { approvalApi, normalizeError, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useApprovalActions(onActionComplete?: () => void) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const submitDecision = useCallback(
    async (
      procurementId: string,
      decision: ApprovalDecision,
      reason?: string,
      signal?: AbortSignal
    ): Promise<ApprovalRecord | null> => {
      setSubmitting(true);
      setError(null);
      setApiError(null);

      try {
        if ((decision === 'REJECT' || decision === 'REQUEST_MORE_INFO') && (!reason || !reason.trim())) {
          throw new ApiError({
            message: `A justification reason is required for ${decision} decisions.`,
            status: 400,
            code: 'VALIDATION_ERROR',
            validationErrors: { reason: `A justification reason is required for ${decision} decisions.` },
          });
        }

        const res = await approvalApi.decide(procurementId, decision, reason, user.name, { signal });
        if (onActionComplete) {
          onActionComplete();
        }
        return res.record;
      } catch (err: unknown) {
        const normalized = normalizeError(err);
        if (normalized.isAborted) return null;

        setApiError(normalized);
        setError(normalized.message || 'Failed to submit decision');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [user.name, onActionComplete]
  );

  return {
    submitDecision,
    submitting,
    error,
    apiError,
  };
}
