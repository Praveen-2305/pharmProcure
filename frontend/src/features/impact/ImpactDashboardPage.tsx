import React, { useState, useEffect } from 'react';
import { impactApi } from '../../api/impactAnalytics';
import { ImpactAnalyticsResponse } from '../../api/types';
import { formatCurrency } from '../../lib/utils';
import { SavingsTrendChart } from './SavingsTrendChart';
import { VendorExposureTable } from './VendorExposureTable';
import { AssumptionsDrawer } from './AssumptionsDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  TrendingUp,
  ShieldAlert,
  Clock,
  Sparkles,
  HelpCircle,
  Coins,
  Scale,
  Zap,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export const ImpactDashboardPage: React.FC = () => {
  const [data, setData] = useState<ImpactAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await impactApi.getImpactAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load impact analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="container max-w-7xl py-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">
          Synthesizing procurement cases & statutory DPCO ceiling audit logs...
        </p>
      </div>
    );
  }

  const { riskDistribution } = data;
  const totalRiskCount = riskDistribution.low + riskDistribution.medium + riskDistribution.high || 1;
  const lowPct = Math.round((riskDistribution.low / totalRiskCount) * 100);
  const medPct = Math.round((riskDistribution.medium / totalRiskCount) * 100);
  const highPct = Math.round((riskDistribution.high / totalRiskCount) * 100);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-fade-in text-left">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-950/20 px-2.5 py-0.5">
              <TrendingUp className="size-3.5 mr-1" />
              Quantified Value Realization
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              DPCO 2013 / NPPA Statutory Enforcer
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Procurement Impact & ROI Cockpit
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Live audited financial return, blocked unlawful vendor markups, and regulatory penalty
            avoidance across active hospital procurement cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsDrawerOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-1.5 border-border/80 bg-muted/20 hover:bg-muted/50"
          >
            <HelpCircle className="size-3.5 text-primary" />
            <span>How We Calculate This</span>
          </Button>
        </div>
      </div>

      {/* 6 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Overpayment Caught */}
        <Card className="border border-emerald-500/30 bg-emerald-950/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-emerald-400 flex items-center justify-between">
              <span>Overpayment Blocked</span>
              <Coins className="size-4" />
            </CardDescription>
            <CardTitle className="text-xl font-extrabold text-foreground mt-1">
              {formatCurrency(data.totalOverpaymentBlockedInr)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Direct DPCO ceiling savings</p>
          </CardContent>
        </Card>

        {/* Card 2: Illegal Quotes Blocked */}
        <Card className="border border-rose-500/30 bg-rose-950/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-rose-400 flex items-center justify-between">
              <span>Unlawful Quotes Blocked</span>
              <ShieldAlert className="size-4" />
            </CardDescription>
            <CardTitle className="text-xl font-extrabold text-foreground mt-1">
              {data.illegalQuotesBlockedCount} <span className="text-xs font-normal text-muted-foreground">quotes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Ceiling markups intercepted</p>
          </CardContent>
        </Card>

        {/* Card 3: Analyst Hours Saved */}
        <Card className="border border-sky-500/30 bg-sky-950/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-sky-400 flex items-center justify-between">
              <span>Auditor Hours Saved</span>
              <Clock className="size-4" />
            </CardDescription>
            <CardTitle className="text-xl font-extrabold text-foreground mt-1">
              {data.analystHoursSaved} <span className="text-xs font-normal text-muted-foreground">hrs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              {formatCurrency(data.laborCostSavingsInr)} labor value
            </p>
          </CardContent>
        </Card>

        {/* Card 4: ROI Multiple */}
        <Card className="border border-primary/40 bg-primary/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-primary flex items-center justify-between">
              <span>ROI Multiple</span>
              <Sparkles className="size-4" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground mt-1 tracking-tight">
              {data.roiMultiple}x
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Net benefit vs platform cost</p>
          </CardContent>
        </Card>

        {/* Card 5: Total Cases */}
        <Card className="border border-border/70 bg-card/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Cases Audited</span>
              <Scale className="size-4" />
            </CardDescription>
            <CardTitle className="text-xl font-extrabold text-foreground mt-1">
              {data.totalCasesProcessed} <span className="text-xs font-normal text-muted-foreground">deals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              {formatCurrency(data.totalProcurementVolumeInr)} volume
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Average Turnaround */}
        <Card className="border border-border/70 bg-card/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Avg Turnaround</span>
              <Zap className="size-4 text-amber-400" />
            </CardDescription>
            <CardTitle className="text-xl font-extrabold text-foreground mt-1">
              {data.averageTurnaroundMinutes} <span className="text-xs font-normal text-muted-foreground">min</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">Down from 18 hours manual</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Risk Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <SavingsTrendChart data={data.savingsOverTime} />
        </div>

        {/* Risk Distribution Breakdown Card */}
        <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Risk Severity Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of all {data.totalCasesProcessed} evaluated cases across composite risk tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Low Risk */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Low Risk (Approved / Clean)
                </span>
                <span className="font-mono text-muted-foreground">
                  {riskDistribution.low} cases ({lowPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${lowPct}%` }}
                />
              </div>
            </div>

            {/* Medium Risk */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Medium Risk (Conditional)
                </span>
                <span className="font-mono text-muted-foreground">
                  {riskDistribution.medium} cases ({medPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${medPct}%` }}
                />
              </div>
            </div>

            {/* High Risk */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" />
                  High Risk (Blocked / Escalated)
                </span>
                <span className="font-mono text-muted-foreground">
                  {riskDistribution.high} cases ({highPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground mt-4">
              <p className="font-semibold text-foreground mb-1">Audit Safeguard Notice:</p>
              Cases flagged as High Risk automatically enforce executive human approval sign-off
              with mandatory rationale recording.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Exposed Vendors Table */}
      <VendorExposureTable vendors={data.topExposedVendors} />

      {/* Slide-out Drawer */}
      <AssumptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        assumptions={data.assumptions}
      />
    </div>
  );
};
