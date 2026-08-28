import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProcurementStatus } from '../../hooks/useProcurementStatus';
import { RiskBreakdown } from './RiskBreakdown';
import { EvidenceTrail } from './EvidenceTrail';
import { WorkflowStage } from '../../api/types';
import { cn } from '../../lib/utils';
import {
  BrainCircuit,
  Search,
  Scale,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowLeft,
  Clock,
  ShieldCheck,
  FileWarning,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';

const WORKFLOW_STAGES: Array<{ id: WorkflowStage; label: string; icon: any; description: string }> = [
  { id: 'PLANNING', label: 'Planner', icon: BrainCircuit, description: 'Decompose procurement scope & schedule investigation plan.' },
  { id: 'EXECUTING', label: 'Executor', icon: Search, description: 'Query Graph ontology & Vector embeddings in parallel.' },
  { id: 'SCORING', label: 'Risk Scorer', icon: Scale, description: 'Compute 4D risk metrics across Financial, Compliance, Contract, Pricing.' },
  { id: 'CRITIQUING', label: 'Critic Loop', icon: RefreshCw, description: 'Audit evidence completeness & resolve source contradictions.' },
  { id: 'WRITING_REPORT', label: 'Report Writer', icon: FileCheck, description: 'Synthesize audit trail & executive recommendation.' },
  { id: 'AWAITING_APPROVAL', label: 'Human Authorization', icon: ShieldCheck, description: 'Awaiting procurement officer sign-off.' },
];

export const VendorReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { status, report, loading, error } = useProcurementStatus(id);

  if (loading && !status) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono text-slate-500">Connecting to LangGraph multi-agent runtime...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-left space-y-4">
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <div className="flex items-center gap-3 font-semibold text-base mb-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            <span>Investigation Runtime Exception</span>
          </div>
          <p className="text-sm text-rose-600">{error || 'Unknown workflow identifier.'}</p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === status.stage);
  const isFailed = status.stage === 'FAILED';
  const isCompleteOrReview = status.stage === 'COMPLETE' || status.stage === 'AWAITING_APPROVAL';

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 text-left">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link to="/" className="hover:text-teal-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> All Cases
            </Link>
            <span>/</span>
            <span className="text-teal-600">{status.procurementId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Investigation & Audit Casefile
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
              Plan: {status.investigationPlan}
            </span>
          </h1>
        </div>

        {/* Critic Revision Loop Badge */}
        <div className="flex items-center gap-3">
          {status.revisionCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span>
                Critic Loop: Revision {status.revisionCount} of {status.maxRevisions}
              </span>
            </div>
          )}

          {status.stage === 'AWAITING_APPROVAL' && (
            <Link
              to="/queue"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition"
            >
              <ShieldCheck className="w-4 h-4" /> Go to Approval Action
            </Link>
          )}
        </div>
      </div>

      {/* Multi-Agent Progress Tracker (Active during non-terminal or complete) */}
      {!isFailed && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400">
            <span>Autonomous Workflow Stage Pipeline</span>
            <span className="text-teal-600 font-semibold">
              {status.stage === 'COMPLETE' ? 'Investigation Complete' : `Executing: ${status.stage}`}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {WORKFLOW_STAGES.map((stg, idx) => {
              const Icon = stg.icon;
              const isPast = status.stage === 'COMPLETE' || currentStageIndex > idx;
              const isCurrent = status.stage === stg.id;

              return (
                <div
                  key={stg.id}
                  className={cn(
                    'p-3 rounded-lg border flex flex-col justify-between text-left transition-all',
                    isCurrent
                      ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-400/30 text-slate-900'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-white border-slate-100 text-slate-400 opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isCurrent ? 'text-teal-500 animate-pulse' : isPast ? 'text-emerald-500' : 'text-slate-300'
                      )}
                    />
                    <span className="text-[10px] font-mono text-slate-400">0{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{stg.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {stg.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failure Cases Rendered Distinctly */}
      {isFailed && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 border border-rose-200 text-rose-500">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Investigation Terminated (Regulatory Protocol §8.3)</h2>
              <p className="text-sm text-rose-600 mt-1">
                {status.failureReason || 'The workflow encountered an unrecoverable regulatory or validation stop condition.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white border border-rose-200 text-xs font-mono text-slate-600 space-y-2">
            <div className="text-slate-500 font-semibold uppercase">Encountered Failure State:</div>
            <p className="text-rose-600">
              {status.failureReason?.includes('Vendor record not found')
                ? '• Vendor record could not be matched in official SEC EDGAR, D&B, or State Licensing databases. Pipeline halted.'
                : status.failureReason?.includes('Max revision limit')
                ? '• Critic revision ceiling reached without consensus. Case routed to human compliance officer.'
                : '• Unresolved external dependency constraint.'}
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              to="/submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
            >
              Submit New Request
            </Link>
          </div>
        </div>
      )}

      {/* Complete Report Findings */}
      {isCompleteOrReview && report && (
        <div className="space-y-8">
          {/* Executive Summary & Recommendation Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-600 border-b border-slate-100 pb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Report Writer Synthesis (Multi-Agent Synthesis Engine)</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">Executive Case Summary</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{report.vendorSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 text-xs space-y-1.5">
                <span className="font-semibold text-teal-700 uppercase font-mono text-[11px] block">
                  Strategic Recommendation:
                </span>
                <p className="text-slate-700 leading-relaxed">{report.recommendation}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="font-semibold text-slate-600 uppercase font-mono text-[11px] block">
                  Risk Assessment Rationale:
                </span>
                <p className="text-slate-600 leading-relaxed">{report.riskExplanation}</p>
              </div>
            </div>

            {/* Flagged Contract Clauses */}
            {report.flaggedContractClauses.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-600 uppercase font-mono">
                  Flagged Contract Clauses:
                </span>
                <div className="space-y-1.5">
                  {report.flaggedContractClauses.map((clause, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-slate-700 flex items-start gap-2"
                    >
                      <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{clause}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4D Risk Breakdown */}
          <RiskBreakdown riskAssessment={report.riskAssessment} />

          {/* Hybrid RAG Evidence Trail */}
          <EvidenceTrail fusedContext={report.fusedContext} />
        </div>
      )}
    </div>
  );
};
