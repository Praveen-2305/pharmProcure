import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import { fetchGovernanceLogs, CaseAuditLog } from '../../api/audit';

function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<CaseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchGovernanceLogs();
      setLogs(data.logs);
      // Auto-expand the first case
      if (data.logs.length > 0) {
        setExpandedCases({ [data.logs[0].procurementId]: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      item.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      item.procurementId.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || item.currentStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalValue = logs.reduce((sum, item) => sum + (item.dealSizeInr || 0), 0);
  const approvedCount = logs.filter((l) => l.approvalRecord?.decision === 'APPROVE').length;
  const ceilingBreaches = logs.filter((l) => l.riskSummary?.pricingRisk?.status === 'EXCEEDS_CEILING').length;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 text-left animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-primary/20 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <Badge variant="outline" className="font-mono text-xs">CDSCO & NPPA Regulatory Ledger</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Forensic Governance & Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Append-only tamper-evident event log recording agent executions, contradiction resolutions, DPCO price ceiling checks, and human sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Refresh Audit Log</span>
          </Button>
        </div>
      </div>

      {/* High-Level Governance KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Audited Cases</CardDescription>
            <CardTitle className="text-2xl font-bold">{logs.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            100% agent execution verified
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Total Spend Volume</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">{formatINR(totalValue)}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            All prices normalized in INR (₹)
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">DPCO Interceptions</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-400">{ceilingBreaches}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Statutory overcharges prevented
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Human Sign-Offs</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">{approvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Multi-tier governance approvals
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor name or case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-background/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-4 text-muted-foreground hidden sm:block" />
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'COMPLETE', 'AWAITING_APPROVAL', 'PLANNING'].map((stage) => (
              <Button
                key={stage}
                size="sm"
                variant={stageFilter === stage ? 'default' : 'outline'}
                onClick={() => setStageFilter(stage)}
                className="text-xs h-8 px-3"
              >
                {stage === 'ALL' ? 'All Stages' : stage.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Forensic Cases Ledger */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Decrypting and validating immutable audit chain...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center border rounded-xl border-dashed">
          <p className="text-sm text-muted-foreground">No audit entries matching filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((item) => {
            const isExpanded = !!expandedCases[item.procurementId];
            return (
              <Card
                key={item.procurementId}
                className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-border transition-all overflow-hidden"
              >
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(item.procurementId)}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">{item.procurementId}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.currentStage}
                      </Badge>
                      <Badge
                        variant={
                          item.riskSummary?.overallRisk === 'HIGH'
                            ? 'destructive'
                            : item.riskSummary?.overallRisk === 'MEDIUM'
                            ? 'secondary'
                            : 'default'
                        }
                        className="text-[10px]"
                      >
                        Risk: {item.riskSummary?.overallRisk || 'PENDING'}
                      </Badge>
                      {item.riskSummary?.pricingRisk?.status === 'EXCEEDS_CEILING' && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <BadgeAlert className="size-3" />
                          DPCO Exceeded (+{formatINR(item.riskSummary.pricingRisk.excessAmount || 0)})
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      {item.vendorName}
                      <span className="text-xs font-normal text-muted-foreground">
                        • {formatINR(item.dealSizeInr)}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-foreground">
                        {item.approvalRecord ? (
                          <span className={item.approvalRecord.decision === 'APPROVE' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {item.approvalRecord.decision}: {item.approvalRecord.decidedBy}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium">Pending Human Approval</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/review/${item.procurementId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View Full Case Dossier"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                      <button
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Toggle audit timeline"
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Forensic Event Timeline */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/20 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        Forensic Execution Timeline ({item.timeline.length} Recorded Steps)
                      </h4>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/review/${item.procurementId}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Open Dossier <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="relative pl-6 space-y-4 border-l-2 border-primary/30 ml-2">
                      {item.timeline.map((evt, idx) => (
                        <div key={idx} className="relative group">
                          {/* Dot indicator */}
                          <div className="absolute -left-[31px] top-1 size-3 rounded-full bg-background border-2 border-primary shadow-xs group-hover:scale-125 transition-transform" />

                          <div className="p-3 rounded-lg border border-border/50 bg-card/60 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-mono font-semibold text-foreground">
                                {evt.event}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[9px] font-mono py-0">
                                  {evt.stage}
                                </Badge>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(evt.timestamp).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {evt.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Governance Decision Block */}
                    {item.approvalRecord && (
                      <div className="mt-4 p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-primary" />
                            Final Human Sign-Off by {item.approvalRecord.decidedBy}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.approvalRecord.reason || 'Decision authorized under institutional procurement policy.'}
                          </p>
                        </div>
                        <Badge
                          variant={item.approvalRecord.decision === 'APPROVE' ? 'default' : 'destructive'}
                          className="shrink-0"
                        >
                          {item.approvalRecord.decision}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
