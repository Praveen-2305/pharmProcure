import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';

export interface EvaluationWeights {
  price: number;        // e.g. 0.35
  compliance: number;   // e.g. 0.25
  resilience: number;   // e.g. 0.20
  governance: number;   // e.g. 0.20
}

interface WeightAdjusterSlidersProps {
  weights: EvaluationWeights;
  onChange: (weights: EvaluationWeights) => void;
  onReset: () => void;
}

export const WeightAdjusterSliders: React.FC<WeightAdjusterSlidersProps> = ({
  weights,
  onChange,
  onReset,
}) => {
  const handleChange = (key: keyof EvaluationWeights, value: number) => {
    onChange({
      ...weights,
      [key]: value / 100,
    });
  };

  return (
    <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Dynamic Weight Calibration
            </CardTitle>
            <CardDescription className="text-xs">
              Adjust priorities to simulate hospital RFP scoring criteria and live re-rank vendors
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {/* Price Weight */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-foreground">Price & DPCO Savings Weight</span>
            <span className="font-mono text-primary">{Math.round(weights.price * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(weights.price * 100)}
            onChange={(e) => handleChange('price', Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        {/* Compliance Weight */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-foreground">Regulatory & Schedule M GMP Weight</span>
            <span className="font-mono text-emerald-400">{Math.round(weights.compliance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(weights.compliance * 100)}
            onChange={(e) => handleChange('compliance', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        {/* Operational Resiliency Weight */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-foreground">Cold-Chain SLA & OTIF Delivery Weight</span>
            <span className="font-mono text-sky-400">{Math.round(weights.resilience * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(weights.resilience * 100)}
            onChange={(e) => handleChange('resilience', Number(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        {/* Governance Weight */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-foreground">Corporate Governance & ESG Weight</span>
            <span className="font-mono text-amber-400">{Math.round(weights.governance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(weights.governance * 100)}
            onChange={(e) => handleChange('governance', Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
};
