import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowStatus, ProcurementReport } from '../api/types';
import { procurementApi } from '../api/client';

export function useProcurementStatus(procurementId?: string) {
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [report, setReport] = useState<ProcurementReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isTerminal = (stage?: string) =>
    stage === 'COMPLETE' || stage === 'AWAITING_APPROVAL' || stage === 'FAILED';

  const fetchData = useCallback(async () => {
    if (!procurementId) return;

    try {
      const currentStatus = await procurementApi.getStatus(procurementId);
      setStatus(currentStatus);

      // If in report-ready stage, retrieve report
      if (
        currentStatus.stage === 'COMPLETE' ||
        currentStatus.stage === 'AWAITING_APPROVAL' ||
        currentStatus.stage === 'WRITING_REPORT'
      ) {
        const reportData = await procurementApi.getReport(procurementId);
        setReport(reportData);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [procurementId]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Setup polling for non-terminal stages
    const interval = setInterval(async () => {
      if (status && isTerminal(status.stage)) {
        clearInterval(interval);
        return;
      }
      await fetchData();
    }, 1500);

    return () => clearInterval(interval);
  }, [procurementId, fetchData, status?.stage]);

  return {
    status,
    report,
    loading,
    error,
    refetch: fetchData,
    isTerminal: status ? isTerminal(status.stage) : false,
  };
}
