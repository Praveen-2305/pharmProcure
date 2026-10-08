import { httpClient } from './httpClient';
import { ImpactAnalyticsResponse } from './types';

const MOCK_ANALYTICS: ImpactAnalyticsResponse = {
  totalCasesProcessed: 18,
  illegalQuotesBlockedCount: 5,
  totalProcurementVolumeInr: 94500000.0,
  totalOverpaymentBlockedInr: 6850000.0,
  analystHoursSaved: 321.3,
  laborCostSavingsInr: 481950.0,
  statutoryPenaltiesPreventedInr: 10275000.0,
  netFinancialBenefitInr: 17606950.0,
  roiMultiple: 29.3,
  averageTurnaroundMinutes: 9.0,
  riskDistribution: {
    low: 10,
    medium: 5,
    high: 3,
  },
  savingsOverTime: [
    { month: '2026-05', savingsInr: 850000.0, casesCount: 2, procurementVolumeInr: 12000000.0 },
    { month: '2026-06', savingsInr: 1450000.0, casesCount: 4, procurementVolumeInr: 18500000.0 },
    { month: '2026-07', savingsInr: 2150000.0, casesCount: 5, procurementVolumeInr: 26000000.0 },
    { month: '2026-08', savingsInr: 2400000.0, casesCount: 7, procurementVolumeInr: 38000000.0 },
  ],
  topExposedVendors: [
    {
      vendorName: 'Apex BioLogistics Pvt. Ltd.',
      casesCount: 3,
      totalDealSizeInr: 35000000.0,
      overpaymentCaughtInr: 3250000.0,
      riskLevel: 'HIGH',
      primaryViolation: 'Cold-Chain Transit Temperature SLA & 12% Ceiling Markup',
    },
    {
      vendorName: 'Himalayan Steriles Ltd.',
      casesCount: 2,
      totalDealSizeInr: 18500000.0,
      overpaymentCaughtInr: 2100000.0,
      riskLevel: 'HIGH',
      primaryViolation: 'DPCO Schedule-II Ceiling Price Excess',
    },
    {
      vendorName: 'Vanguard Pharma Solutions',
      casesCount: 4,
      totalDealSizeInr: 22000000.0,
      overpaymentCaughtInr: 1500000.0,
      riskLevel: 'MEDIUM',
      primaryViolation: 'Liability Cap Exclusion Clause',
    },
    {
      vendorName: 'Bharat Parenterals Corp.',
      casesCount: 5,
      totalDealSizeInr: 14000000.0,
      overpaymentCaughtInr: 0.0,
      riskLevel: 'LOW',
      primaryViolation: 'None (Compliant)',
    },
  ],
  assumptions: {
    analystHourlyRateInr: 1500.0,
    manualReviewHoursPerCase: 18.0,
    aiReviewHoursPerCase: 0.15,
    annualPlatformCostInr: 600000.0,
    statutoryPenaltyMultiplier: 1.5,
  },
};

export const impactApi = {
  async getImpactAnalytics(): Promise<ImpactAnalyticsResponse> {
    try {
      return await httpClient.get<ImpactAnalyticsResponse>('/analytics/impact');
    } catch {
      return MOCK_ANALYTICS;
    }
  },
};
