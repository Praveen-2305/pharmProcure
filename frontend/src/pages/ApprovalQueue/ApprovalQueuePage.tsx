import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { approvalApi } from '../../api/client';
import { ApprovalActions } from './ApprovalActions';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CheckSquare, ArrowRight, ShieldAlert, Sparkles, Inbox } from 'lucide-react';

interface PendingApprovalItem {
  procurementId: string;
  vendorName: string;
  dealSize: number;
  submittedAt: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  investigationPlan: 'LIGHT' | 'FULL';
  summary: string;
}

export const ApprovalQueuePage: React.FC = () => {
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      const data = await approvalApi.getPendingApprovals();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDecisionSubmitted = (procurementId: string) => {
    // Optimistically remove from queue
    setItems((prev) => prev.filter((item) => item.procurementId !== procurementId));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Human-in-the-loop Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Executive Approval Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review completed multi-agent risk assessments and issue auditable procurement determinations.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          Pending Authorization: <strong className="text-teal-400">{items.length}</strong>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 mt-3">Loading pending authorizations...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Queue is Clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All submitted cases have been adjudicated or are currently being processed by autonomous worker agents.
          </p>
          <div className="pt-2">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              Submit a new procurement case <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.procurementId}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{item.procurementId}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      Plan: {item.investigationPlan}
                    </span>
                    <span className="text-xs text-slate-400">• {formatDate(item.submittedAt)}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{item.vendorName}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Deal Size:</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatCurrency(item.dealSize)}
                    </span>
                  </div>
                  <RiskLevelTag level={item.overallRisk} size="md" />
                </div>
              </div>

              {/* Summary and Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 text-xs text-slate-300 leading-relaxed">
                  {item.summary}
                </div>
                <div className="flex md:justify-end">
                  <ConfidenceBadge score={item.confidenceScore} size="sm" />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <Link
                  to={`/review/${item.procurementId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium transition"
                >
                  <span>Inspect Complete Casefile & Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <ApprovalActions
                  procurementId={item.procurementId}
                  vendorName={item.vendorName}
                  onDecisionSubmitted={() => handleDecisionSubmitted(item.procurementId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
