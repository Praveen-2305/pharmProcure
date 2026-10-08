import React from 'react';
import { VendorComparisonCandidate } from '../../api/types';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Trophy, AlertTriangle, CheckCircle2, ShieldAlert, Truck, Scale } from 'lucide-react';

interface ComparisonMatrixTableProps {
  candidates: VendorComparisonCandidate[];
}

export const ComparisonMatrixTable: React.FC<ComparisonMatrixTableProps> = ({ candidates }) => {
  return (
    <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Scale className="size-4 text-primary" />
          Side-by-Side Evaluation Matrix
        </CardTitle>
        <CardDescription className="text-xs">
          Direct parameter comparison highlighting pricing compliance, cold chain warranties, and TCO
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Rank & Supplier</th>
                <th className="py-3 px-3">Composite Score</th>
                <th className="py-3 px-3">Quoted Unit Rate</th>
                <th className="py-3 px-3">DPCO Ceiling Status</th>
                <th className="py-3 px-3">Est. TCO (with Risk)</th>
                <th className="py-3 px-3">OTIF Fulfillment</th>
                <th className="py-3 px-3">Cold-Chain SLA</th>
                <th className="py-3 px-3">Audit Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {candidates.map((c, idx) => {
                const isWinner = idx === 0;
                return (
                  <tr
                    key={c.vendorName}
                    className={`transition-colors ${
                      isWinner ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Supplier & Rank */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        {isWinner ? (
                          <span className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Trophy className="size-3.5" />
                          </span>
                        ) : (
                          <span className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                            #{idx + 1}
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {c.vendorName}
                            {isWinner && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[9px] h-4 text-white">
                                Recommended
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.state} • Credit: {c.creditRating}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Composite Score */}
                    <td className="py-3.5 px-3 font-mono font-bold text-sm">
                      <span className={isWinner ? 'text-emerald-400' : 'text-foreground'}>
                        {c.compositeRankScore.toFixed(1)}/100
                      </span>
                    </td>

                    {/* Quoted Unit Rate */}
                    <td className="py-3.5 px-3 font-mono font-bold text-foreground">
                      {formatCurrency(c.quotedUnitPrice)}
                    </td>

                    {/* DPCO Compliance */}
                    <td className="py-3.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          c.isPriceCompliant
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                            : 'border-rose-500/40 text-rose-400 bg-rose-950/20'
                        }`}
                      >
                        {c.isPriceCompliant ? 'Within DPCO Ceiling' : 'Statutory Breach'}
                      </Badge>
                    </td>

                    {/* TCO */}
                    <td className="py-3.5 px-3 font-mono text-foreground font-semibold">
                      {formatCurrency(c.totalCostOfOwnershipInr)}
                    </td>

                    {/* OTIF */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className="text-foreground font-semibold">{c.otifRatePercent}%</span>
                    </td>

                    {/* Cold Chain SLA */}
                    <td className="py-3.5 px-3 max-w-[180px] truncate" title={c.coldChainSla}>
                      <span
                        className={`text-[11px] font-medium ${
                          c.coldChainSla.includes('Excursion') ? 'text-rose-400 font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {c.coldChainSla}
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="py-3.5 px-3">
                      {c.flags.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {c.flags.map((flag, fIdx) => (
                            <span
                              key={fIdx}
                              className="inline-flex items-center gap-1 text-[10px] text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30 font-medium"
                            >
                              <AlertTriangle className="size-2.5 shrink-0" />
                              <span className="truncate max-w-[160px]" title={flag}>
                                {flag}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Zero Adverse Flags
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
