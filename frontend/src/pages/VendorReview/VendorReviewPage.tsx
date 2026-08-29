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
  UserCheck,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button, buttonVariants } from '../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

const WORKFLOW_STAGES: Array<{ id: WorkflowStage; label: string; icon: any; description: string }> = [
  { id: 'PLANNING', label: 'Planner', icon: BrainCircuit, description: 'Decompose procurement scope & schedule investigation plan.' },
  { id: 'EXECUTING', label: 'Executor', icon: Search, description: 'Query Graph ontology & Vector embeddings in parallel.' },
  { id: 'SCORING', label: 'Risk Scorer', icon: Scale, description: 'Compute 4D risk metrics across Financial, Compliance, Contract, Pricing.' },
  { id: 'CRITIQUING', label: 'Critic Loop', icon: RefreshCw, description: 'Audit evidence completeness & resolve source contradictions.' },
  { id: 'WRITING_REPORT', label: 'Report Writer', icon: FileCheck, description: 'Synthesize audit trail & executive recommendation.' },
  { id: 'AWAITING_APPROVAL', label: 'Human Authorization', icon: UserCheck, description: 'Awaiting procurement officer sign-off.' },
];

export const VendorReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { status, report, loading, error } = useProcurementStatus(id);

  if (loading && !status) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Connecting to LangGraph multi-agent runtime...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-left space-y-4">
        <Alert variant="destructive">
          <AlertOctagon className="size-4" />
          <AlertTitle>Investigation Runtime Exception</AlertTitle>
          <AlertDescription>{error || 'Unknown workflow identifier.'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === status.stage);
  const isFailed = status.stage === 'FAILED';
  const isCompleteOrReview = status.stage === 'COMPLETE' || status.stage === 'AWAITING_APPROVAL';

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-left">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <Link to="/" className="hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="size-3.5" /> All Cases
            </Link>
            <span>/</span>
            <Badge variant="secondary" className="px-2 font-mono text-[11px] bg-muted/50 text-foreground border">
              {status.procurementId}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            Investigation & Audit Casefile
          </h1>
        </div>

        {/* Critic Revision Loop Badge */}
        <div className="flex items-center gap-3">
          {status.revisionCount > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 px-3 rounded-full text-primary border-primary/30 bg-primary/5">
              <RefreshCw className="size-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-xs">
                Critic Loop: Revision {status.revisionCount} of {status.maxRevisions}
              </span>
            </Badge>
          )}

          {status.stage === 'AWAITING_APPROVAL' && (
            <Link to="/queue" className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2 shadow-md")}>
              <UserCheck className="size-4" /> Go to Approval Action
            </Link>
          )}
        </div>
      </div>

      {/* Multi-Agent Progress Tracker (Active during non-terminal or complete) */}
      {!isFailed && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-base font-semibold">Autonomous Workflow Stage Pipeline</CardTitle>
            <Badge variant={status.stage === 'COMPLETE' ? 'default' : 'secondary'} className="shadow-sm rounded-full px-3 text-xs">
              {status.stage === 'COMPLETE' ? 'Investigation Complete' : `Executing: ${status.stage}`}
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {WORKFLOW_STAGES.map((stg, idx) => {
                const Icon = stg.icon;
                const isCurrent = status.stage === stg.id;

                return (
                  <div key={stg.id} className={cn(
                    "flex flex-col space-y-3 p-4 rounded-lg border transition-colors",
                    isCurrent ? "border-primary bg-primary/5 shadow-sm" : "bg-background shadow-sm hover:border-muted-foreground/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <Icon className={cn("size-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                      <Badge variant="outline" className="text-[10px] size-6 flex items-center justify-center p-0 rounded-full bg-muted/50">
                        {idx + 1}
                      </Badge>
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", isCurrent ? "text-primary" : "text-foreground")}>
                        {stg.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failure Cases Rendered Distinctly */}
      {isFailed && (
        <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <AlertOctagon className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Investigation Terminated (Regulatory Protocol Section 8.3)</h2>
                <p className="text-sm text-destructive mt-1">
                  {status.failureReason || 'The workflow encountered an unrecoverable regulatory or validation stop condition.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border text-sm text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Encountered Failure State:</div>
              <p className="text-destructive">
                {status.failureReason?.includes('Vendor record not found')
                  ? '• Vendor record could not be matched in official SEC EDGAR, D&B, or State Licensing databases. Pipeline halted.'
                  : status.failureReason?.includes('Max revision limit')
                  ? '• Critic revision ceiling reached without consensus. Case routed to human compliance officer.'
                  : '• Unresolved external dependency constraint.'}
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <Link to="/submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Submit New Request
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Report Findings */}
      {isCompleteOrReview && report && (
        <div className="space-y-8">
          {/* Executive Summary & Recommendation Banner */}
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary border-b pb-3">
                <Sparkles className="size-4" />
                <span>Report Writer Synthesis (Multi-Agent Synthesis Engine)</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Executive Case Summary</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.vendorSummary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <span className="font-semibold text-primary text-sm block">
                    Strategic Recommendation:
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{report.recommendation}</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
                  <span className="font-semibold text-muted-foreground text-sm block">
                    Risk Assessment Rationale:
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.riskExplanation}</p>
                </div>
              </div>

              {/* Flagged Contract Clauses */}
              {report.flaggedContractClauses.length > 0 && (
                <div className="pt-2 space-y-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Flagged Contract Clauses:
                  </span>
                  <div className="space-y-2">
                    {report.flaggedContractClauses.map((clause, i) => (
                      <Alert key={i} variant="default" className="bg-orange-500/10 border-orange-500/30 text-orange-900 dark:text-orange-100 shadow-sm transition-colors hover:bg-orange-500/15">
                        <FileWarning className="size-4.5 text-orange-600 dark:text-orange-400" />
                        <AlertDescription className="text-[13px] font-medium leading-relaxed ml-2">{clause}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4D Risk Breakdown */}
          <RiskBreakdown riskAssessment={report.riskAssessment} />

          {/* Hybrid RAG Evidence Trail */}
          <EvidenceTrail fusedContext={report.fusedContext} />
        </div>
      )}
    </div>
  );
};
