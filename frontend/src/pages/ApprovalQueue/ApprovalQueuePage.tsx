import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { approvalApi } from '../../api/client';
import { ApprovalActions } from './ApprovalActions';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { CheckSquare, ArrowRight, Inbox } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button, buttonVariants } from '../../components/ui/button';

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
    document.title = "Approval Queue | AutonoSource";
    loadPending();
  }, []);

  const handleDecisionSubmitted = (procurementId: string) => {
    setItems((prev) => prev.filter((item) => item.procurementId !== procurementId));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Executive Approval Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review completed multi-agent risk assessments and issue auditable procurement determinations.
          </p>
        </div>

        <Badge variant="secondary" className="px-3 py-1.5 rounded-lg text-xs shadow-sm border text-muted-foreground">
          Pending Authorization: <strong className="text-foreground ml-1">{items.length}</strong>
        </Badge>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">Loading pending authorizations...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center shadow-sm">
          <Inbox className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Queue is Clear</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            All submitted cases have been adjudicated or are currently being processed by autonomous worker agents.
          </p>
          <Link to="/submit" className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}>
            Submit a new procurement case <ArrowRight className="size-4" />
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.procurementId} className="hover:border-primary/40 transition-colors duration-150 shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3.5 border-b border-border/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-md">
                        Plan: {item.investigationPlan}
                      </Badge>
                      <span className="text-xs text-muted-foreground">• {formatDate(item.submittedAt)}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/75 bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        {item.procurementId}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                      {item.vendorName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3.5 self-start md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Deal Size</div>
                      <div className="text-base font-bold text-foreground leading-none mt-0.5">
                        {formatCurrency(item.dealSize)}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border/60 hidden sm:block" />
                    <RiskLevelTag level={item.overallRisk} size="md" />
                  </div>
                </div>

                {/* AI Assessment Inner Container */}
                <div className="bg-muted/30 dark:bg-zinc-900/40 p-4 rounded-xl border border-border/60 space-y-2 min-h-[85px] flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                      <span className="size-2 rounded-full bg-primary" />
                      Executive Summary Findings
                    </div>
                    <ConfidenceBadge score={item.confidenceScore} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <Link to={`/review/${item.procurementId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 rounded-lg font-medium border-border/80")}>
                    Inspect Casefile & Evidence
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <ApprovalActions
                    procurementId={item.procurementId}
                    vendorName={item.vendorName}
                    onDecisionSubmitted={() => handleDecisionSubmitted(item.procurementId)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
