import React, { useState, useEffect } from 'react';
import {
  ProcurementReport,
  SimulationInputs,
  SimulationResponse,
} from '../../api/types';
import { simulateScenario } from '../../api/simulator';
import { ScoreDeltaBar } from './ScoreDeltaBar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Scale,
} from 'lucide-react';

interface WhatIfSimulatorTabProps {
  procurementId: string;
  report?: ProcurementReport | null;
}

export const WhatIfSimulatorTab: React.FC<WhatIfSimulatorTabProps> = ({
  procurementId,
  report,
}) => {
  // Extract initial baseline from report if available
  const baselineQuotedPrice = report?.riskAssessment?.pricingRisk?.quotedPrice || 27900000.0;
  const ceilingPrice = report?.riskAssessment?.pricingRisk?.ceilingPrice || 24900000.0;

  // Simulator Inputs State
  const [quotedPrice, setQuotedPrice] = useState<number>(baselineQuotedPrice);
  const [coldChainSla, setColdChainSla] = useState<string>('Ambient 15°C–25°C');
  const [liabilityCapPercent, setLiabilityCapPercent] = useState<number>(50);
  const [otifRatePercent, setOtifRatePercent] = useState<number>(88);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [creditScore, setCreditScore] = useState<number>(720);
  const [curePeriodDays, setCurePeriodDays] = useState<number>(14);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  // Automatically trigger simulation on mount and when key inputs change
  useEffect(() => {
    handleRunSimulation();
  }, [quotedPrice, coldChainSla, liabilityCapPercent, otifRatePercent, creditScore]);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const inputs: SimulationInputs = {
        quotedPrice,
        coldChainSla,
        liabilityCapPercent,
        otifRatePercent,
        paymentTermsDays,
        creditScore,
        curePeriodDays,
      };
      const res = await simulateScenario(procurementId, inputs);
      setResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetOptimal = () => {
    setQuotedPrice(23500000.0);
    setColdChainSla('WHO TRS 1025 (2°C–8°C Loggers)');
    setLiabilityCapPercent(150);
    setOtifRatePercent(98.5);
    setPaymentTermsDays(45);
    setCreditScore(780);
    setCurePeriodDays(30);
  };

  const handlePresetAtCeiling = () => {
    setQuotedPrice(ceilingPrice);
    setColdChainSla('WHO TRS 1025 (2°C–8°C Loggers)');
    setLiabilityCapPercent(100);
    setOtifRatePercent(95.0);
    setPaymentTermsDays(30);
    setCreditScore(750);
    setCurePeriodDays(30);
  };

  const handleResetBaseline = () => {
    setQuotedPrice(baselineQuotedPrice);
    setColdChainSla('Ambient 15°C–25°C');
    setLiabilityCapPercent(50);
    setOtifRatePercent(88);
    setPaymentTermsDays(30);
    setCreditScore(720);
    setCurePeriodDays(14);
  };

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header & Preset Actions */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-md">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/40 font-mono text-xs">
                Feature 7 • Counterfactual Engine
              </Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                Zero-Persistence Sandbox
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              What-If Deal Term Simulator
            </h2>
            <p className="text-xs text-muted-foreground">
              Test commercial concessions, pricing discounts, and cold-chain warranties in real-time. Changes are simulated against the risk scorer without modifying database records.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePresetOptimal}
              className="text-xs gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/20"
            >
              <Sparkles className="size-3 text-emerald-400" />
              <span>Optimal Compromise</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePresetAtCeiling}
              className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/20"
            >
              <ShieldCheck className="size-3" />
              <span>Exact DPCO Ceiling</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetBaseline}
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <Card className="lg:col-span-1 border border-border/80 bg-card/60 shadow-md">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              <span>Adjustable Deal Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-5 text-xs">
            {/* 1. Quoted Price Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-medium">
                <span className="text-foreground">Quoted Price:</span>
                <span className="font-mono font-bold text-primary">{formatInr(quotedPrice)}</span>
              </div>
              <input
                type="range"
                min={20000000}
                max={32000000}
                step={250000}
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>₹2.0 Cr</span>
                <span className="text-amber-400">Ceiling: {formatInr(ceilingPrice)}</span>
                <span>₹3.2 Cr</span>
              </div>
            </div>

            {/* 2. Cold Chain Transit SLA */}
            <div className="space-y-1.5">
              <label className="text-foreground font-medium block">
                Cold-Chain SLA Specification:
              </label>
              <select
                value={coldChainSla}
                onChange={(e) => setColdChainSla(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-md p-2 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="WHO TRS 1025 (2°C–8°C Loggers)">
                  WHO TRS 1025 (2°C–8°C Continuous Digital Loggers)
                </option>
                <option value="Ambient 15°C–25°C">
                  Ambient 15°C–25°C (Excursion Risk Flagged)
                </option>
                <option value="Standard Unmonitored">
                  Standard Commercial Transit (Unmonitored)
                </option>
              </select>
            </div>

            {/* 3. Liability Cap % */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-medium">
                <span className="text-foreground">Liability Cap:</span>
                <span className="font-mono font-bold">{liabilityCapPercent}% of PO</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={liabilityCapPercent}
                onChange={(e) => setLiabilityCapPercent(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>10% (Micro)</span>
                <span>100% (Par)</span>
                <span>200% (Robust)</span>
              </div>
            </div>

            {/* 4. OTIF Delivery Benchmark */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-medium">
                <span className="text-foreground">OTIF Fulfillment SLA:</span>
                <span className="font-mono font-bold">{otifRatePercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={100}
                step={0.5}
                value={otifRatePercent}
                onChange={(e) => setOtifRatePercent(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>80%</span>
                <span className="text-emerald-400">95% (CDSCO Target)</span>
                <span>100%</span>
              </div>
            </div>

            {/* 5. Credit Score & Payment Terms */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Credit Rating Score
                </label>
                <input
                  type="number"
                  min={500}
                  max={850}
                  value={creditScore}
                  onChange={(e) => setCreditScore(Number(e.target.value))}
                  className="w-full bg-background border border-border/80 rounded-md p-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  min={15}
                  max={90}
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                  className="w-full bg-background border border-border/80 rounded-md p-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Score Delta Bar */}
              <ScoreDeltaBar
                scoreBefore={result.riskScoreBefore}
                scoreAfter={result.riskScoreAfter}
                delta={result.riskScoreDelta}
                riskBefore={result.originalOverallRisk}
                riskAfter={result.simulatedOverallRisk}
                isDpcoBefore={result.isDpcoCompliantBefore}
                isDpcoAfter={result.isDpcoCompliantAfter}
              />

              {/* Recommendation Banner */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  <span>Strategic Counter-Negotiation Synthesis</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {result.negotiationRecommendation}
                </p>
              </div>

              {/* 4-Dimension Comparative Matrix */}
              <Card className="border border-border/80 bg-card/60 shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Scale className="size-4 text-primary" />
                      <span>4D Risk Evaluation Matrix (Baseline vs Simulated)</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Deterministic Scorer Engine
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="divide-y divide-border/50 text-xs">
                    {result.dimensions.map((dim, idx) => (
                      <div key={idx} className="py-3 space-y-2 first:pt-2 last:pb-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-xs">
                            {dim.dimension}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {dim.originalLevel}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                dim.improved
                                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20'
                                  : 'border-border text-foreground'
                              }`}
                            >
                              {dim.simulatedLevel}
                              {dim.improved && ' (Improved)'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded bg-background/50 border border-border/40 text-muted-foreground">
                            <span className="font-medium text-foreground block">Baseline Rationale:</span>
                            {dim.originalRationale}
                          </div>
                          <div className="p-2 rounded bg-primary/5 border border-primary/20 text-foreground">
                            <span className="font-medium text-primary block">Simulated Rationale:</span>
                            {dim.simulatedRationale}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
