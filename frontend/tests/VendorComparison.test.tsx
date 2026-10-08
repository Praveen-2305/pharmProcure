import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VendorComparisonPage } from '../src/features/compare/VendorComparisonPage';
import { comparisonApi } from '../src/api/comparison';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <VendorComparisonPage />
    </BrowserRouter>
  );

describe('VendorComparisonPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title, vendor chips, and run comparative audit button', async () => {
    renderComponent();
    expect(await screen.findByText(/Multi-Vendor RFP Comparison & Radar Matrix/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Run Comparative Audit/i })).toBeInTheDocument();
  });

  it('renders comparative results with recommendation and matrix', async () => {
    vi.spyOn(comparisonApi, 'compareVendors').mockResolvedValueOnce({
      drugName: 'Biopharmaceutical Cold-Chain Monoclonal Antibodies',
      quantity: 2,
      ceilingPriceInr: 24900000.0,
      dpcoReference: 'DPCO Schedule-I Form-II',
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
          coldChainSla: 'WHO TRS 1025 Verified',
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
          coldChainSla: 'Ambient 15°C–25°C Proposed',
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
          flags: ['DPCO Ceiling Breach: +12.0% Unlawful Markup'],
        },
      ],
      recommendation: {
        recommendedVendor: 'Bharat Parenterals Corp.',
        selectionRationale: 'Bharat Parenterals Corp. scored highest (92.5/100). Quoted price is within DPCO ceiling.',
        whyNotOthers: [
          {
            vendorName: 'Apex BioLogistics Pvt. Ltd.',
            disqualificationReason: 'DPCO Ceiling Breach: +12.0% Unlawful Markup',
          },
        ],
      },
    });

    renderComponent();

    // Verify recommended vendor
    expect(await screen.findByText(/Recommended Supplier/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bharat Parenterals Corp./i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Side-by-Side Evaluation Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Why Not The Others/i)).toBeInTheDocument();
  });
});
