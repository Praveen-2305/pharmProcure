import React from 'react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { TrendingDown, TrendingUp, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

interface ScoreDeltaBarProps {
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  riskBefore: string;
  riskAfter: string;
  isDpcoBefore: boolean;
  isDpcoAfter: boolean;
}

export const ScoreDeltaBar: React.FC<ScoreDeltaBarProps> = ({
  scoreBefore,
  scoreAfter,
  delta,
  riskBefore,
  riskAfter,
  isDpcoBefore,
  isDpcoAfter,
}) => {
  const isImproved = delta < 0;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'HIGH':
        return 'bg-rose-600 text-white';
      case 'MEDIUM':
        return 'bg-amber-600 text-white';
      case 'LOW':
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header Summary Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">Simulated Impact</span>
            <div className="flex items-center gap-1.5">
              <Badge className={`${getRiskBadgeColor(riskBefore)} text-[11px] px-2 py-0.5`}>
                {riskBefore}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <Badge className={`${getRiskBadgeColor(riskAfter)} text-[11px] px-2 py-0.5 font-bold`}>
                {riskAfter}
              </Badge>
            </div>
          </div>

          {/* Delta Pill */}
          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold px-2.5 py-1 ${
                isImproved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : delta > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isImproved ? (
                <TrendingDown className="size-3.5 mr-1 text-emerald-400 inline" />
              ) : delta > 0 ? (
                <TrendingUp className="size-3.5 mr-1 text-rose-400 inline" />
              ) : null}
              <span>
                {delta < 0 ? `${delta} pts (Risk Reduced)` : delta > 0 ? `+${delta} pts (Risk Increased)` : 'No Delta'}
              </span>
            </Badge>

            {/* DPCO Compliance Tag */}
            <Badge
              variant="outline"
              className={`text-[11px] font-mono ${
                isDpcoAfter
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20'
                  : 'border-rose-500/50 text-rose-400 bg-rose-950/20'
              }`}
            >
              {isDpcoAfter ? 'DPCO Compliant' : 'DPCO Breach'}
            </Badge>
          </div>
        </div>

        {/* Visual Score Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Baseline Score Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Original Risk Score</span>
              <span className="font-bold text-foreground">{scoreBefore}/100</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden p-0.5 border border-border/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  scoreBefore > 65 ? 'bg-rose-500' : scoreBefore > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, scoreBefore))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {isDpcoBefore ? 'Complied with price ceiling' : 'Exceeded statutory ceiling'}
            </span>
          </div>

          {/* Simulated Score Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Simulated Risk Score</span>
              <span className={`font-bold ${isImproved ? 'text-emerald-400' : 'text-foreground'}`}>
                {scoreAfter}/100
              </span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden p-0.5 border border-border/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  scoreAfter > 65 ? 'bg-rose-500' : scoreAfter > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, scoreAfter))}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {isDpcoAfter ? 'Within DPCO ceiling' : 'Exceeds DPCO ceiling'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
