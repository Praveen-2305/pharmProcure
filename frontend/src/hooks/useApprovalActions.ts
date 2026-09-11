import { useState, useCallback } from 'react';
import { ApprovalDecision, ApprovalRecord } from '../api/types';
import { approvalApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useApprovalActions(onActionComplete?: () => void) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const submitDecision = useCallback(
    async (
      procurementId: string,
      decision: ApprovalDecision,
      reason?: string
    ): Promise<ApprovalRecord | null> => {
      setSubmitting(true);
      setError(null);

      try {
        if ((decision === 'REJECT' || decision === 'REQUEST_MORE_INFO') && (!reason || !reason.trim())) {
          throw new Error(`A justification reason is required for ${decision} decisions.`);
        }

        const res = await approvalApi.decide(procurementId, decision, reason, user.name);
        if (onActionComplete) {
          onActionComplete();
        }
        return res.record;
      } catch (err: any) {
        setError(err.message || 'Failed to submit decision');
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
  };
}
