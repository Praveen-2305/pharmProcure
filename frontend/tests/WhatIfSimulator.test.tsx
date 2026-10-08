import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatIfSimulatorTab } from '../src/features/simulator/WhatIfSimulatorTab';
import * as simulatorApi from '../src/api/simulator';

const mockReport: any = {
  vendorSummary: 'Apex BioLogistics is a primary cold-chain biologics vendor.',
  recommendation: 'Proceed with caution.',
  riskExplanation: 'High contract and pricing risk.',
  flaggedContractClauses: [],
  fusedContext: { facts: [], overallConfidence: 0.85, fallbackToVectorOnly: false },
  riskAssessment: {
    financialRisk: { level: 'MEDIUM', rationale: 'Moderate liquidity' },
    complianceRisk: { level: 'LOW', rationale: 'Clean CDSCO' },
    contractRisk: { level: 'HIGH', rationale: 'Short cure period and micro liability' },
    pricingRisk: {
      status: 'EXCEEDS_CEILING',
      quotedPrice: 27900000.0,
      ceilingPrice: 24900000.0,
      excessAmount: 3000000.0,
    },
    overallRisk: 'HIGH',
    confidenceScore: 0.88,
  },
};

describe('WhatIfSimulatorTab Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders simulator inputs, preset buttons, and description', async () => {
    render(<WhatIfSimulatorTab procurementId="case-101" report={mockReport} />);

    expect(screen.getByText(/What-If Deal Term Simulator/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Optimal Compromise/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exact DPCO Ceiling/i })).toBeInTheDocument();
    expect(screen.getByText(/Adjustable Deal Terms/i)).toBeInTheDocument();
  });

  it('calculates score delta and renders ScoreDeltaBar and dimensions', async () => {
    render(<WhatIfSimulatorTab procurementId="case-101" report={mockReport} />);

    // Waits for the default simulation to resolve
    expect(await screen.findByText(/Simulated Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/4D Risk Evaluation Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Pricing Compliance/i)).toBeInTheDocument();
  });

  it('clicking Optimal Compromise updates inputs and updates simulated results', async () => {
    render(<WhatIfSimulatorTab procurementId="case-101" report={mockReport} />);

    const optimalButton = screen.getByRole('button', { name: /Optimal Compromise/i });
    fireEvent.click(optimalButton);

    await waitFor(() => {
      expect(screen.getByText(/Optimal deal posture achieved/i)).toBeInTheDocument();
    });
  });
});
