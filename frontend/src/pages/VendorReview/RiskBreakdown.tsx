import React from 'react';
import { RiskAssessment } from '../../api/types';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, cn } from '../../lib/utils';
import {
  ShieldAlert,
  FileCheck2,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface RiskBreakdownProps {
  riskAssessment: RiskAssessment;
}

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({ riskAssessment }) => {
  const { financialRisk, complianceRisk, contractRisk, pricingRisk, overallRisk, confidenceScore } = riskAssessment;

  return (
    <div className="space-y-4">
      {/* Top Banner: Decoupled Overall Risk vs Confidence Score */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2 border-b mb-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Overall Risk Severity</CardTitle>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Evidence Completeness</p>
              <div className="flex justify-end">
                <ConfidenceBadge score={confidenceScore} size="sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <RiskLevelTag level={overallRisk} size="lg" />
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Synthesized risk profile evaluating Financial Solvency, Regulatory Compliance, Contractual Liability, and Category Benchmark Ceilings.
            </p>
          </CardContent>
        </Card>

      {/* 4 Risk Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Financial Risk Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4" />
              Financial Solvency
            </CardTitle>
            <RiskLevelTag level={financialRisk.level} size="sm" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-sm text-foreground leading-relaxed">{financialRisk.rationale}</p>
          </CardContent>
        </Card>

        {/* 2. Compliance Risk Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4" />
              Regulatory & Compliance
            </CardTitle>
            <RiskLevelTag level={complianceRisk.level} size="sm" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-sm text-foreground leading-relaxed">{complianceRisk.rationale}</p>
          </CardContent>
        </Card>

        {/* 3. Contractual Risk Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="size-4" />
              Contract Liability
            </CardTitle>
            <RiskLevelTag level={contractRisk.level} size="sm" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-sm text-foreground leading-relaxed">{contractRisk.rationale}</p>
          </CardContent>
        </Card>

        {/* 4. Pricing Risk Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="size-4" />
              Pricing & Ceiling
            </CardTitle>
            {pricingRisk.status === 'WITHIN_CEILING' && (
              <Badge variant="outline">Within Ceiling</Badge>
            )}
            {pricingRisk.status === 'EXCEEDS_CEILING' && (
              <Badge variant="destructive">Exceeds Ceiling</Badge>
            )}
            {pricingRisk.status === 'INDETERMINATE' && (
              <Badge variant="secondary">Indeterminate</Badge>
            )}
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {pricingRisk.status === 'WITHIN_CEILING' && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-muted/50 p-3 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground">Quoted Amount</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(pricingRisk.quotedPrice)}</p>
                  </div>
                  <div className="space-y-1 bg-muted/50 p-3 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground">Category Ceiling</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(pricingRisk.ceilingPrice)}</p>
                  </div>
                </div>
              </div>
            )}

            {pricingRisk.status === 'EXCEEDS_CEILING' && (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-destructive font-medium leading-relaxed">
                  Quote exceeds benchmark ceiling by {formatCurrency(pricingRisk.excessAmount || (pricingRisk.quotedPrice - (pricingRisk.ceilingPrice || 0)))}.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 bg-muted/50 p-3 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground">Quoted</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(pricingRisk.quotedPrice)}</p>
                  </div>
                  <div className="space-y-1 bg-muted/50 p-3 rounded-xl border">
                    <p className="text-xs font-medium text-muted-foreground">Ceiling</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(pricingRisk.ceilingPrice)}</p>
                  </div>
                  <div className="space-y-1 bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                    <p className="text-xs font-medium text-destructive">Excess</p>
                    <p className="text-sm font-semibold text-destructive">+{formatCurrency(pricingRisk.excessAmount || (pricingRisk.quotedPrice - (pricingRisk.ceilingPrice || 0)))}</p>
                  </div>
                </div>
              </div>
            )}

            {pricingRisk.status === 'INDETERMINATE' && (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No historical benchmark or index data matched this custom procurement scope.
                </p>
                <div className="space-y-1 bg-muted/50 p-3 rounded-xl border">
                  <p className="text-xs font-medium text-muted-foreground">Quoted Deal Size</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(pricingRisk.quotedPrice)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
