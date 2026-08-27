import React, { useState } from 'react';
import { ApprovalDecision } from '../../api/types';
import { useApprovalActions } from '../../hooks/useApprovalActions';
import { CheckCircle2, XCircle, HelpCircle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ApprovalActionsProps {
  procurementId: string;
  vendorName: string;
  onDecisionSubmitted: () => void;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  procurementId,
  vendorName,
  onDecisionSubmitted,
}) => {
  const { submitDecision, submitting, error } = useApprovalActions(onDecisionSubmitted);

  const [activeModal, setActiveModal] = useState<ApprovalDecision | null>(null);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOpenModal = (decision: ApprovalDecision) => {
    setActiveModal(decision);
    setReason('');
    setValidationError(null);
  };

  const handleDirectApprove = async () => {
    const res = await submitDecision(procurementId, 'APPROVE');
    if (res) {
      setActiveModal(null);
    }
  };

  const handleConfirmModal = async () => {
    if (!activeModal) return;

    if ((activeModal === 'REJECT' || activeModal === 'REQUEST_MORE_INFO') && !reason.trim()) {
      setValidationError('A clear justification reason is mandatory for auditable records.');
      return;
    }

    const res = await submitDecision(procurementId, activeModal, reason);
    if (res) {
      setActiveModal(null);
      setReason('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 1. Direct Approve Button (No reason strictly required per POC §4 Step 9) */}
      <button
        type="button"
        disabled={submitting}
        onClick={handleDirectApprove}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-sm disabled:opacity-50"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Approve</span>
      </button>

      {/* 2. Reject Button (Opens reason modal) */}
      <button
        type="button"
        disabled={submitting}
        onClick={() => handleOpenModal('REJECT')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 transition disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Reject</span>
      </button>

      {/* 3. Request More Info Button (Opens reason modal, loops to Executor) */}
      <button
        type="button"
        disabled={submitting}
        onClick={() => handleOpenModal('REQUEST_MORE_INFO')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition disabled:opacity-50"
      >
        <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
        <span>Request Info</span>
      </button>

      {/* Decision Justification Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {activeModal === 'REJECT' && <XCircle className="w-5 h-5 text-rose-400" />}
                  {activeModal === 'REQUEST_MORE_INFO' && <HelpCircle className="w-5 h-5 text-teal-400" />}
                  {activeModal === 'REJECT' ? 'Reject Procurement Case' : 'Request Additional Evidence'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vendor: <span className="text-slate-200 font-semibold">{vendorName}</span> ({procurementId})
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(error || validationError) && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{validationError || error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase font-mono">
                Reason / Investigation Directive <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  activeModal === 'REJECT'
                    ? 'State regulatory or commercial grounds for rejection (e.g. Unresolved FDA Warning Letter, excess pricing)...'
                    : 'Specify what additional evidence the Executor should retrieve (e.g. Request updated ISO 13485 audit report)...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              {activeModal === 'REQUEST_MORE_INFO' && (
                <p className="text-[11px] text-teal-300/80">
                  Note: Requesting info will increment the revision counter and re-dispatch the LangGraph Executor agent.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmModal}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition shadow-sm flex items-center gap-1.5',
                  activeModal === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-teal-600 hover:bg-teal-500'
                )}
              >
                {submitting ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
