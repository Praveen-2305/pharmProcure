import React from 'react';
import { ImpactAssumptionData } from '../../api/types';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { X, HelpCircle, Calculator, ShieldCheck, Clock, Coins } from 'lucide-react';

interface AssumptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: ImpactAssumptionData;
}

export const AssumptionsDrawer: React.FC<AssumptionsDrawerProps> = ({
  isOpen,
  onClose,
  assumptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">How We Calculate ROI</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          AutonoSource calculates business impact using transparent, statutory-grounded
          benchmarks calibrated for the Indian pharmaceutical and healthcare supply chain.
        </p>

        {/* 1. Direct DPCO Price Overpayments */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Coins className="size-4 text-emerald-400" />
            <span>1. Direct Overpayment Blocked</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Calculated as the exact mathematical difference between the vendor's quoted unit rate
            and the statutory ceiling price fixed under the Drugs (Prices Control) Order, 2013 (DPCO),
            multiplied by total requested batch volume.
          </p>
          <div className="font-mono text-[11px] bg-background/60 p-2.5 rounded border border-border/40 text-emerald-300">
            Overpayment = MAX(0, Quoted Rate - DPCO Ceiling) × Quantity
          </div>
        </div>

        {/* 2. Analyst Hours Saved */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Clock className="size-4 text-sky-400" />
            <span>2. Labor Hours Saved & Efficiency</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Historical manual review requires deep manual cross-referencing across CDSCO registries,
            Schedule M audits, and cold-chain specs (~{assumptions.manualReviewHoursPerCase} hours per case).
            AutonoSource autonomous agents complete synthesis in ~{assumptions.aiReviewHoursPerCase * 60} minutes.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded bg-background/40">
              <span className="text-muted-foreground text-[10px] block">Analyst Hourly Rate</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(assumptions.analystHourlyRateInr)} / hr
              </span>
            </div>
            <div className="p-2 rounded bg-background/40">
              <span className="text-muted-foreground text-[10px] block">Turnaround Reduction</span>
              <span className="font-mono font-bold text-sky-400">99.1% Faster</span>
            </div>
          </div>
        </div>

        {/* 3. Statutory Penalty Prevention */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <ShieldCheck className="size-4 text-amber-400" />
            <span>3. Statutory Penalty Avoidance</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Under the Essential Commodities Act (1955) Section 7, purchasing or supplying above DPCO
            ceilings subjects institutions to mandatory disgorgement plus a statutory fine multiplier
            of {assumptions.statutoryPenaltyMultiplier}x.
          </p>
          <div className="font-mono text-[11px] bg-background/60 p-2.5 rounded border border-border/40 text-amber-300">
            Penalty Avoided = Overpayment × {assumptions.statutoryPenaltyMultiplier}
          </div>
        </div>

        {/* 4. ROI Multiple Formula */}
        <div className="space-y-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2 font-semibold text-sm text-primary">
            <HelpCircle className="size-4" />
            <span>4. Net ROI Multiple Formula</span>
          </div>
          <div className="font-mono text-[11px] bg-background/80 p-2.5 rounded border border-primary/20 text-foreground">
            ROI Multiple = (Overpayment Blocked + Labor Savings + Penalties Avoided) / Platform Cost
          </div>
          <p className="text-[11px] text-muted-foreground">
            Annual platform operational cost baseline: {formatCurrency(assumptions.annualPlatformCostInr)} / yr.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={onClose} className="w-full font-semibold">
            Got it, Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
