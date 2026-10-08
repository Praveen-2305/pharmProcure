import { httpClient } from './httpClient';
import { MultiVendorCompareRequest, MultiVendorCompareResponse } from './types';

const MOCK_COMPARE_RESPONSE: MultiVendorCompareResponse = {
  drugName: 'Biopharmaceutical Cold-Chain Monoclonal Antibodies (Trastuzumab, Rituximab 2°C–8°C)',
  quantity: 2,
  ceilingPriceInr: 24900000.0,
  dpcoReference: 'DPCO Schedule-I Form-II Biologics Price Regulation',
  candidates: [
    {
      vendorName: 'Bharat Parenterals Corp.',
      vendorId: 'V-102',
      state: 'Gujarat',
      creditRating: 'AAA',
      quotedUnitPrice: 22800000.0,
      ceilingUnitPrice: 24900000.0,
      totalCostOfOwnershipInr: 45600000.0,
      isPriceCompliant: true,
      coldChainSla: 'WHO TRS 1025 Verified (2°C–8°C continuous loggers)',
      scheduleMStatus: 'Schedule M Compliant',
      otifRatePercent: 98.4,
      compositeRankScore: 92.5,
      pillars: {
        financialScore: 95,
        marketPowerScore: 88,
        operationalScore: 94,
        complianceScore: 96,
        governanceScore: 90,
      },
      flags: [],
    },
    {
      vendorName: 'Apex BioLogistics Pvt. Ltd.',
      vendorId: 'V-101',
      state: 'Maharashtra',
      creditRating: 'BBB',
      quotedUnitPrice: 27900000.0,
      ceilingUnitPrice: 24900000.0,
      totalCostOfOwnershipInr: 64800000.0,
      isPriceCompliant: false,
      coldChainSla: 'Ambient 15°C–25°C Proposed (Excursion Risk)',
      scheduleMStatus: 'Schedule M Compliant',
      otifRatePercent: 91.2,
      compositeRankScore: 61.0,
      pillars: {
        financialScore: 65,
        marketPowerScore: 78,
        operationalScore: 55,
        complianceScore: 50,
        governanceScore: 60,
      },
      flags: [
        'DPCO Ceiling Breach: +12.0% Unlawful Markup',
        'Cold-Chain Transit Risk: Lacks continuous data logger SLA',
      ],
    },
  ],
  recommendation: {
    recommendedVendor: 'Bharat Parenterals Corp.',
    selectionRationale:
      'Bharat Parenterals Corp. scored highest (92.5/100). Quoted price (₹2,28,00,000) is within the statutory DPCO ceiling (₹2,49,00,000) and contract includes full WHO TRS 1025 cold-chain digital data logger warranties.',
    whyNotOthers: [
      {
        vendorName: 'Apex BioLogistics Pvt. Ltd.',
        disqualificationReason:
          'DPCO Ceiling Breach: +12.0% Unlawful Markup | Cold-Chain Transit Risk: Lacks continuous data logger SLA',
      },
    ],
  },
};

export const comparisonApi = {
  async compareVendors(request: MultiVendorCompareRequest): Promise<MultiVendorCompareResponse> {
    try {
      return await httpClient.post<MultiVendorCompareResponse>('/procurement/compare', request);
    } catch {
      return MOCK_COMPARE_RESPONSE;
    }
  },
};
