import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriceCheckResponse } from '../../api/types';
import { formatCurrency } from '../../lib/utils';
import { ShieldCheck, ShieldAlert, ArrowRight, Scale, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface PriceVerdictCardProps {
  result: PriceCheckResponse;
}

export const PriceVerdictCard: React.FC<PriceVerdictCardProps> = ({ result }) => {
  const navigate = useNavigate();
  const isViolation = result.verdict === 'STATUTORY_VIOLATION';

  const handleRunFullReview = () => {
    // Navigate to /submit with pre-filled state
    navigate('/submit', {
      state: {
        drugName: result.drugName,
        dealSize: result.totalQuoted,
        procurementDetails: `Procurement request for ${result.drugName}. Quoted Unit: ₹${result.quotedPrice.toLocaleString('en-IN')}, Statutory DPCO Ceiling: ₹${result.ceilingPrice.toLocaleString('en-IN')}. Initial check verdict: ${result.verdict}.`,
      },
    });
  };

  return (
    <Card
      className={`border-2 transition-all shadow-lg animate-fade-in ${
        isViolation
          ? 'border-rose-500/50 bg-rose-950/15 text-rose-50'
          : 'border-emerald-500/50 bg-emerald-950/15 text-emerald-50'
      }`}
    >
      <CardHeader className="p-6 pb-4 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl flex items-center justify-center ${
                isViolation ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isViolation ? <ShieldAlert className="size-8" /> : <ShieldCheck className="size-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={isViolation ? 'destructive' : 'default'}
                  className={
                    isViolation
                      ? 'bg-rose-500 hover:bg-rose-600 text-white font-bold tracking-wider'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider'
                  }
                >
                  {isViolation ? 'STATUTORY PRICE VIOLATION' : 'STATUTORY PRICE COMPLIANT'}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  DPCO 2013 / NPPA Schedule
                </span>
              </div>
              <CardTitle className="text-xl font-bold mt-1 text-foreground">
                {result.drugName}
              </CardTitle>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Evaluation</p>
            <p className="text-2xl font-extrabold text-foreground">
              {formatCurrency(result.totalQuoted)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Core Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card/60 border border-border/60">
            <p className="text-xs text-muted-foreground font-medium">Quoted Unit Rate</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {formatCurrency(result.quotedPrice)}
            </p>
            <p className="text-[11px] text-muted-foreground">{result.unitMeasure}</p>
          </div>

          <div className="p-4 rounded-lg bg-card/60 border border-border/60">
            <p className="text-xs text-muted-foreground font-medium">DPCO Statutory Ceiling</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {formatCurrency(result.ceilingPrice)}
            </p>
            <p className="text-[11px] text-muted-foreground">Legal Max Benchmark</p>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isViolation
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <p className="text-xs font-medium">Price Variance</p>
            <p className="text-lg font-bold mt-1">
              {result.percentageDifference > 0 ? `+${result.percentageDifference}%` : `${result.percentageDifference}%`}
            </p>
            <p className="text-[11px] opacity-80">
              {isViolation ? 'Exceeds Ceiling' : 'Within Statutory Limit'}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isViolation
                ? 'bg-rose-900/40 border-rose-500/60 text-rose-100'
                : 'bg-emerald-900/40 border-emerald-500/60 text-emerald-100'
            }`}
          >
            <p className="text-xs font-medium">Total Unlawful Markup</p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(result.totalOverpayment)}
            </p>
            <p className="text-[11px] opacity-80">
              {result.quantity} units requested
            </p>
          </div>
        </div>

        {/* Verdict Callout Banner */}
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            isViolation
              ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200'
          }`}
        >
          {isViolation ? (
            <AlertTriangle className="size-5 shrink-0 text-rose-400 mt-0.5" />
          ) : (
            <Scale className="size-5 shrink-0 text-emerald-400 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold">{result.verdictMessage}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <FileText className="size-3.5" />
              <span>Statutory Reference: {result.dpcoReference}</span>
            </p>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Ready to perform complete multi-agent due diligence including Cold-Chain, Schedule M GMP, and Litigation?
          </p>
          <Button
            onClick={handleRunFullReview}
            size="lg"
            className="w-full sm:w-auto font-semibold gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <span>Run Full Vendor Review</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
