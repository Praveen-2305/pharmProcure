import React from 'react';
import { RiskAssessment, VendorTransparencyMatrix } from '../../api/types';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, cn } from '../../lib/utils';
import {
  ShieldAlert,
  FileCheck2,
  TrendingUp,
  Scale,
  Building2,
  Truck,
  Award,
  Gavel,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface RiskBreakdownProps {
  riskAssessment: RiskAssessment;
  vendorTransparency?: VendorTransparencyMatrix;
}

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({ riskAssessment, vendorTransparency }) => {
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

      {/* 5-Pillar Vendor Transparency & Due Diligence Matrix */}
      {vendorTransparency && (
        <Card className="shadow-sm border-primary/20 bg-primary/[0.01]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-5 pb-3 border-b gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle className="text-base font-semibold">5-Pillar Vendor Transparency Matrix</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                  {vendorTransparency.overallTransparencyScore}/100 Disclosure Score
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Autonomous due diligence synthesis across Solvency, Market Dominance, Supply Chain Resiliency, Quality Audits, and Corporate Governance.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-medium">
                {vendorTransparency.marketStanding}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-semibold",
                  vendorTransparency.marketPowerLevel === 'DOMINANT' ? "border-amber-500/40 text-amber-600 bg-amber-500/10" :
                  vendorTransparency.marketPowerLevel === 'STRONG' ? "border-blue-500/40 text-blue-600 bg-blue-500/10" :
                  "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                )}
              >
                Power: {vendorTransparency.marketPowerLevel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Pillar 1: Financial Condition */}
              <div className="p-3.5 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-primary" />
                    1. Financial Health
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Rating: {vendorTransparency.creditRating}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">₹{vendorTransparency.annualRevenueCr.toFixed(1)} Cr</p>
                  <p className="text-[11px] text-muted-foreground">Solvency: <span className="font-semibold text-foreground">{vendorTransparency.solvencyRatio.toFixed(2)}</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                  {vendorTransparency.financialHealthSummary}
                </p>
              </div>

              {/* Pillar 2: Market Power */}
              <div className="p-3.5 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-blue-500" />
                    2. Market Standing
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600">
                    {vendorTransparency.marketPowerLevel}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground truncate">{vendorTransparency.marketStanding}</p>
                  <p className="text-[11px] text-muted-foreground">Leverage: <span className="font-semibold text-foreground">{vendorTransparency.bargainingLeverage}</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Pricing dynamic: {vendorTransparency.bargainingLeverage === 'Supplier-Dominated' ? 'High supplier pricing power.' : 'Balanced commercial terms.'}
                </p>
              </div>

              {/* Pillar 3: Operational Resilience */}
              <div className="p-3.5 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Truck className="size-3.5 text-emerald-500" />
                    3. Fulfillment & OTIF
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600">
                    {(vendorTransparency.operationalResilience.onTimeDeliveryRate * 100).toFixed(0)}% OTIF
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Cold-Chain: {vendorTransparency.operationalResilience.coldChainReliability}</p>
                  <p className="text-[11px] text-muted-foreground">Capacity Score: <span className="font-semibold text-foreground">{(vendorTransparency.operationalResilience.manufacturingCapacityScore * 100).toFixed(0)}%</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                  {vendorTransparency.operationalResilience.fulfillmentRiskSummary}
                </p>
              </div>

              {/* Pillar 4: Regulatory Integrity */}
              <div className="p-3.5 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Award className="size-3.5 text-purple-500" />
                    4. CDSCO Quality
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-600">
                    {vendorTransparency.regulatoryQuality.cdscoLicenseValid ? "Valid License" : "Suspended"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground truncate">{vendorTransparency.regulatoryQuality.scheduleMStatus}</p>
                  <p className="text-[11px] text-muted-foreground">NSQ Alerts: <span className="font-semibold text-foreground">{vendorTransparency.regulatoryQuality.nsqBatchAlertsCount}</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                  {vendorTransparency.regulatoryQuality.regulatoryTrackRecord}
                </p>
              </div>

              {/* Pillar 5: Governance & ESG */}
              <div className="p-3.5 rounded-xl border bg-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Gavel className="size-3.5 text-amber-500" />
                    5. Governance & Debarment
                  </span>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", vendorTransparency.governanceIntegrity.blacklistingStatus.includes("Clean") ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive")}>
                    {vendorTransparency.governanceIntegrity.blacklistingStatus.includes("Clean") ? "Not Debarred" : "Debarred"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground truncate">{vendorTransparency.governanceIntegrity.blacklistingStatus}</p>
                  <p className="text-[11px] text-muted-foreground">Litigation Count: <span className="font-semibold text-foreground">{vendorTransparency.governanceIntegrity.litigationCount}</span></p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                  {vendorTransparency.governanceIntegrity.governanceSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
