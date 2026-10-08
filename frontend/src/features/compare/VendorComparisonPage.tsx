import React, { useState, useEffect } from 'react';
import { comparisonApi } from '../../api/comparison';
import { MultiVendorCompareResponse, VendorComparisonCandidate } from '../../api/types';
import { RadarComparisonChart } from './RadarComparisonChart';
import { WeightAdjusterSliders, EvaluationWeights } from './WeightAdjusterSliders';
import { ComparisonMatrixTable } from './ComparisonMatrixTable';
import { RecommendationBanner } from './RecommendationBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  Scale,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  FileCheck2,
} from 'lucide-react';

const PRESET_VENDORS = [
  'Bharat Parenterals Corp.',
  'Apex BioLogistics Pvt. Ltd.',
  'Himalayan Steriles Ltd.',
  'Vanguard Pharma Solutions',
  'Zenith Formulations Inc.',
];

const DEFAULT_WEIGHTS: EvaluationWeights = {
  price: 0.35,
  compliance: 0.25,
  resilience: 0.20,
  governance: 0.20,
};

export const VendorComparisonPage: React.FC = () => {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([
    'Bharat Parenterals Corp.',
    'Apex BioLogistics Pvt. Ltd.',
    'Himalayan Steriles Ltd.',
  ]);
  const [drugName, setDrugName] = useState(
    'Biopharmaceutical Cold-Chain Monoclonal Antibodies (Trastuzumab, Rituximab 2°C–8°C)'
  );
  const [quantity, setQuantity] = useState('2');
  const [weights, setWeights] = useState<EvaluationWeights>(DEFAULT_WEIGHTS);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MultiVendorCompareResponse | null>(null);
  const [reRankedCandidates, setReRankedCandidates] = useState<VendorComparisonCandidate[]>([]);

  const handleCompare = async () => {
    if (selectedVendors.length < 2) return;
    setLoading(true);

    try {
      const res = await comparisonApi.compareVendors({
        vendorNames: selectedVendors,
        drugName: drugName,
        quantity: parseInt(quantity, 10) || 1,
        priceWeight: weights.price,
        complianceWeight: weights.compliance,
        resilienceWeight: weights.resilience,
        governanceWeight: weights.governance,
      });
      setData(res);
      setReRankedCandidates(res.candidates);
    } catch (err) {
      console.error('Error running vendor comparison', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompare();
  }, []);

  // Real-time re-ranking when sliders change without needing a network round-trip!
  const handleWeightChange = (newWeights: EvaluationWeights) => {
    setWeights(newWeights);
    if (!data) return;

    const ceiling = data.ceilingPriceInr;
    const updated = data.candidates.map((c) => {
      const normPrice = Math.max(
        0,
        Math.min(100, 100 - (((c.quotedUnitPrice - ceiling) / ceiling) * 100))
      );
      const composite = Number(
        (
          normPrice * newWeights.price +
          c.pillars.complianceScore * newWeights.compliance +
          c.pillars.operationalScore * newWeights.resilience +
          c.pillars.governanceScore * newWeights.governance
        ).toFixed(1)
      );
      return {
        ...c,
        compositeRankScore: composite,
      };
    });

    updated.sort((a, b) => b.compositeRankScore - a.compositeRankScore);
    setReRankedCandidates(updated);
  };

  const handleToggleVendor = (vName: string) => {
    if (selectedVendors.includes(vName)) {
      if (selectedVendors.length > 2) {
        setSelectedVendors(selectedVendors.filter((v) => v !== vName));
      }
    } else {
      if (selectedVendors.length < 5) {
        setSelectedVendors([...selectedVendors, vName]);
      }
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-2.5 py-0.5">
            <Scale className="size-3.5 mr-1" />
            Competitive Procurement Intelligence
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            Concurrent Multi-Agent Audit
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Multi-Vendor RFP Comparison & Radar Matrix
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Concurrently audit competing pharmaceutical suppliers for a specific formulation.
          Evaluate DPCO 2013 price variance, Total Cost of Ownership (TCO), and 5-Pillar due diligence side by side.
        </p>
      </div>

      {/* Supplier & Drug Selection Bar */}
      <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Drug Formulation or Active Molecule
              </label>
              <Input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. Biopharmaceutical Cold-Chain Monoclonal Antibodies..."
                className="bg-background/80 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Batch Volume / Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background/80 font-mono text-xs"
              />
            </div>
          </div>

          {/* Vendor Chips Selection */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                Select 2 to 5 Competing Suppliers:
              </label>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedVendors.length} of 5 selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_VENDORS.map((v) => {
                const isSelected = selectedVendors.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleToggleVendor(v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                    }`}
                  >
                    <span>{v}</span>
                    {isSelected ? <X className="size-3" /> : <Plus className="size-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleCompare}
              disabled={loading || selectedVendors.length < 2}
              className="gap-2 font-semibold bg-primary text-primary-foreground min-w-44"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Auditing Concurrently...
                </>
              ) : (
                <>
                  <Scale className="size-4" />
                  Run Comparative Audit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Winner Banner */}
          <RecommendationBanner
            recommendation={{
              ...data.recommendation,
              recommendedVendor: reRankedCandidates[0]?.vendorName || data.recommendation.recommendedVendor,
            }}
          />

          {/* Visuals Row: Radar Chart + Weight Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <RadarComparisonChart candidates={reRankedCandidates} />
            <WeightAdjusterSliders
              weights={weights}
              onChange={handleWeightChange}
              onReset={() => handleWeightChange(DEFAULT_WEIGHTS)}
            />
          </div>

          {/* Side-by-Side Matrix Table */}
          <ComparisonMatrixTable candidates={reRankedCandidates} />
        </div>
      )}
    </div>
  );
};
