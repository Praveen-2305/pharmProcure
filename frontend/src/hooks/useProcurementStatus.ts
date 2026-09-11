import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowStatus, ProcurementReport, WorkflowStage } from '../api/types';
import { procurementApi, normalizeError, ApiError } from '../api/client';

export function useProcurementStatus(procurementId?: string) {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [report, setReport] = useState<ProcurementReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const isTerminal = (stage?: WorkflowStage) =>
    stage === 'COMPLETE' || stage === 'AWAITING_APPROVAL' || stage === 'FAILED';

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!procurementId) return;

      try {
        const currentStatus = await procurementApi.getStatus(procurementId, { signal });
        if (signal?.aborted) return;
        setStatus(currentStatus);

        // If in report-ready stage, retrieve report
        if (
          currentStatus.stage === 'COMPLETE' ||
          currentStatus.stage === 'AWAITING_APPROVAL' ||
          currentStatus.stage === 'WRITING_REPORT'
        ) {
          const reportData = await procurementApi.getReport(procurementId, { signal });
          if (signal?.aborted) return;
          setReport(reportData);
        }
        setError(null);
        setApiError(null);
      } catch (err: unknown) {
        const normalized = normalizeError(err);
        if (normalized.isAborted) return;

        setApiError(normalized);
        setError(normalized.message || 'Failed to fetch status');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [procurementId]
  );

  const statusStageRef = useRef<WorkflowStage | undefined>(status?.stage);
  statusStageRef.current = status?.stage;

  useEffect(() => {
    if (!procurementId) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);
    fetchData(abortController.signal);

    // Polling setup for active progress
    const interval = setInterval(async () => {
      if (statusStageRef.current && isTerminal(statusStageRef.current)) {
        clearInterval(interval);
        return;
      }
      await fetchData(abortController.signal);
    }, 1500);

    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [procurementId, fetchData]);

  return {
    status,
    report,
    loading,
    error,
    apiError,
    refetch: fetchData,
    isTerminal: status ? isTerminal(status.stage) : false,
  };
}
