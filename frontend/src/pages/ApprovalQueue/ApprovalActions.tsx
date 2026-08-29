import React, { useState } from 'react';
import { ApprovalDecision } from '../../api/types';
import { useApprovalActions } from '../../hooks/useApprovalActions';
import { CheckCircle2, XCircle, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';

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
    <div className="flex flex-wrap items-center gap-2.5">
      {/* 3. Request More Info Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={submitting}
        onClick={() => {
          setActiveModal('REQUEST_MORE_INFO');
          setReason('');
          setValidationError(null);
        }}
        className="gap-1.5 font-medium"
      >
        <HelpCircle className="size-3.5 text-primary" />
        Request Info
      </Button>

      {/* 2. Reject Button */}
      <Button
        variant="destructive"
        size="sm"
        disabled={submitting}
        onClick={() => {
          setActiveModal('REJECT');
          setReason('');
          setValidationError(null);
        }}
        className="gap-1.5 font-medium"
      >
        <XCircle className="size-3.5" />
        Reject
      </Button>

      {/* 1. Direct Approve Button */}
      <Button
        variant="default"
        size="sm"
        disabled={submitting}
        onClick={handleDirectApprove}
        className="gap-1.5 font-medium"
      >
        <CheckCircle2 className="size-3.5" />
        Approve
      </Button>

      {/* Decision Justification Modal */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-2xl p-6 sm:p-8 space-y-2">
          <DialogHeader className="space-y-3 border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              {activeModal === 'REJECT' && <XCircle className="size-6 text-destructive" />}
              {activeModal === 'REQUEST_MORE_INFO' && <HelpCircle className="size-6 text-primary" />}
              {activeModal === 'REJECT' ? 'Reject Procurement Case' : 'Request Additional Evidence'}
            </DialogTitle>
            <DialogDescription className="text-[15px] mt-2 leading-relaxed">
              Reviewing vendor <strong className="text-foreground font-semibold">{vendorName}</strong> <span className="font-mono text-xs opacity-75">({procurementId})</span>. Please provide explicit justification below.
            </DialogDescription>
          </DialogHeader>

          {(error || validationError) && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{validationError || error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <Label className="font-semibold text-[15px]">
              Reason / Investigation Directive <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={5}
              placeholder={
                activeModal === 'REJECT'
                  ? 'State regulatory or commercial grounds for rejection (e.g. Unresolved FDA Warning Letter, excess pricing)...'
                  : 'Specify what additional evidence the Executor should retrieve (e.g. Request updated ISO 13485 audit report)...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none text-[15px] p-4 bg-background leading-relaxed"
            />
            {activeModal === 'REQUEST_MORE_INFO' && (
              <p className="text-[13px] text-primary/90 font-medium">
                Note: Requesting info will increment the revision counter and re-dispatch the LangGraph Executor agent.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              disabled={submitting}
              onClick={handleConfirmModal}
              variant={activeModal === 'REJECT' ? 'destructive' : 'default'}
            >
              {submitting ? 'Submitting...' : 'Confirm Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
