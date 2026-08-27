import React from 'react';
import { RiskAssessment } from '../../api/types';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, cn } from '../../lib/utils';
import {
  DollarSign,
  ShieldAlert,
  FileCheck2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Scale,
} from 'lucide-react';

interface RiskBreakdownProps {
  riskAssessment: RiskAssessment;
}

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({ riskAssessment }) => {
  const { financialRisk, complianceRisk, contractRisk, pricingRisk, overallRisk, confidenceScore } =
    riskAssessment;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner: Decoupled Overall Risk vs Confidence Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Overall Risk Severity
          </div>
          <div className="flex items-center gap-3">
            <RiskLevelTag level={overallRisk} size="lg" />
            <span className="text-xs text-slate-400 max-w-md hidden sm:inline-block">
              Calculated across composite weighted multidimensional risk matrix.
            </span>
          </div>
        </div>

        {/* Confidence Badge placed in visibly distinct right-aligned container */}
        <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Data Quality & Evidence Completeness
          </div>
          <ConfidenceBadge score={confidenceScore} showProgress size="md" />
        </div>
      </div>

      {/* 4 Risk Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Financial Risk Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-800 text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Financial Solvency Risk</h3>
              </div>
              <RiskLevelTag level={financialRisk.level} size="sm" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{financialRisk.rationale}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Altman Z & Liquidity Ratios</span>
            <span className="text-slate-400">Audited SEC Filings</span>
          </div>
        </div>

        {/* 2. Compliance Risk Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-800 text-teal-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Regulatory & Compliance</h3>
              </div>
              <RiskLevelTag level={complianceRisk.level} size="sm" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{complianceRisk.rationale}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>FDA 483 / Warning Letters / ISO</span>
            <span className="text-slate-400">Knowledge Graph Node</span>
          </div>
        </div>

        {/* 3. Contractual Risk Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-800 text-teal-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Contract & Clause Liability</h3>
              </div>
              <RiskLevelTag level={contractRisk.level} size="sm" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{contractRisk.rationale}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Indemnity & Termination Terms</span>
            <span className="text-slate-400">Vector Chunk Scan</span>
          </div>
        </div>

        {/* 4. Pricing Risk Card (3 Distinct States) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-800 text-teal-400">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Pricing & Ceiling Risk</h3>
              </div>

              {/* Status Indicator for Pricing Risk */}
              {pricingRisk.status === 'WITHIN_CEILING' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Within Ceiling
                </span>
              )}
              {pricingRisk.status === 'EXCEEDS_CEILING' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Exceeds Ceiling
                </span>
              )}
              {pricingRisk.status === 'INDETERMINATE' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-300">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  Indeterminate
                </span>
              )}
            </div>

            {/* State-specific Body */}
            {pricingRisk.status === 'WITHIN_CEILING' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Quoted pricing complies with enterprise procurement benchmark ceilings for this service category.
                </p>
                <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quoted Amount:</span>
                    <span className="text-white font-semibold">{formatCurrency(pricingRisk.quotedPrice)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category Ceiling:</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(pricingRisk.ceilingPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            {pricingRisk.status === 'EXCEEDS_CEILING' && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Ceiling Breach Detected
                  </div>
                  <p className="text-[11px] mt-0.5 text-rose-300/90">
                    Quote exceeds benchmark ceiling by{' '}
                    <strong className="text-white underline">
                      {formatCurrency(pricingRisk.excessAmount || (pricingRisk.quotedPrice - (pricingRisk.ceilingPrice || 0)))}
                    </strong>
                    . Executive pricing waiver required.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quoted:</span>
                    <span className="text-white font-semibold">{formatCurrency(pricingRisk.quotedPrice)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ceiling:</span>
                    <span className="text-slate-300 font-semibold">{formatCurrency(pricingRisk.ceilingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-rose-400 block text-[10px]">Excess:</span>
                    <span className="text-rose-300 font-bold">
                      +{formatCurrency(pricingRisk.excessAmount || (pricingRisk.quotedPrice - (pricingRisk.ceilingPrice || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {pricingRisk.status === 'INDETERMINATE' && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 text-xs flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Reference price data unavailable</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No historical benchmark or index data matched this custom procurement scope. Pricing risk cannot be autonomously bounded.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded-lg text-xs font-mono flex justify-between items-center">
                  <span className="text-slate-400">Quoted Deal Size:</span>
                  <span className="text-white font-semibold">{formatCurrency(pricingRisk.quotedPrice)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Historical Baseline DB</span>
            <span className="text-slate-400">POC §3.4 Pricing Model</span>
          </div>
        </div>
      </div>
    </div>
  );
};
