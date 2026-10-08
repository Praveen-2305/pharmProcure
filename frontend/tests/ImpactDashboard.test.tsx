import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ImpactDashboardPage } from '../src/features/impact/ImpactDashboardPage';
import { impactApi } from '../src/api/impactAnalytics';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ImpactDashboardPage />
    </BrowserRouter>
  );

describe('ImpactDashboardPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state and then dashboard KPI metrics', async () => {
    vi.spyOn(impactApi, 'getImpactAnalytics').mockResolvedValueOnce({
      totalCasesProcessed: 20,
      illegalQuotesBlockedCount: 6,
      totalProcurementVolumeInr: 80000000.0,
      totalOverpaymentBlockedInr: 5200000.0,
      analystHoursSaved: 350.0,
      laborCostSavingsInr: 525000.0,
      statutoryPenaltiesPreventedInr: 7800000.0,
      netFinancialBenefitInr: 13525000.0,
      roiMultiple: 22.5,
      averageTurnaroundMinutes: 9.0,
      riskDistribution: { low: 12, medium: 5, high: 3 },
      savingsOverTime: [
        { month: '2026-07', savingsInr: 2000000, casesCount: 8, procurementVolumeInr: 30000000 },
      ],
      topExposedVendors: [
        {
          vendorName: 'Apex BioLogistics Pvt. Ltd.',
          casesCount: 3,
          totalDealSizeInr: 25000000,
          overpaymentCaughtInr: 3200000,
          riskLevel: 'HIGH',
          primaryViolation: 'Cold-Chain Excursion Risk',
        },
      ],
      assumptions: {
        analystHourlyRateInr: 1500,
        manualReviewHoursPerCase: 18,
        aiReviewHoursPerCase: 0.15,
        annualPlatformCostInr: 600000,
        statutoryPenaltyMultiplier: 1.5,
      },
    });

    renderComponent();

    expect(await screen.findByText(/Procurement Impact & ROI Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/22.5x/i)).toBeInTheDocument();
    expect(screen.getByText(/Apex BioLogistics Pvt. Ltd./i)).toBeInTheDocument();
  });

  it('opens "How We Calculate ROI" drawer on button click', async () => {
    renderComponent();

    const drawerBtn = await screen.findByRole('button', { name: /How We Calculate This/i });
    fireEvent.click(drawerBtn);

    expect(await screen.findByText(/How We Calculate ROI/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Overpayment Blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/Essential Commodities Act \(1955\)/i)).toBeInTheDocument();
  });
});
