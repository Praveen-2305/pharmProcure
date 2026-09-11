import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiskBreakdown } from '../src/pages/VendorReview/RiskBreakdown';
import { EvidenceTrail } from '../src/pages/VendorReview/EvidenceTrail';
import { RiskAssessment, RankedContext } from '../src/api/types';

describe('VendorReview Subcomponents', () => {
  it('renders RiskBreakdown with decoupled confidence and pricing states', () => {
    const mockAssessment: RiskAssessment = {
      financialRisk: { level: 'LOW', rationale: 'Strong liquidity' },
      complianceRisk: { level: 'MEDIUM', rationale: 'Minor warning letter' },
      contractRisk: { level: 'LOW', rationale: 'Standard indemnity' },
      pricingRisk: {
        status: 'EXCEEDS_CEILING',
        ceilingPrice: 1000000,
        quotedPrice: 1350000,
        excessAmount: 350000,
      },
      overallRisk: 'MEDIUM',
      confidenceScore: 0.86,
    };

    render(<RiskBreakdown riskAssessment={mockAssessment} />);

    // Check evidence completeness decoupled badge
    expect(screen.getByText(/Evidence Completeness:/i)).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();

    // Check pricing ceiling breach
    expect(screen.getByText(/Ceiling Breach Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Exceeds Ceiling/i)).toBeInTheDocument();
    expect(screen.getByText('+$350,000')).toBeInTheDocument();
  });

  it('renders INDETERMINATE pricing risk status correctly without blanks', () => {
    const mockAssessment: RiskAssessment = {
      financialRisk: { level: 'LOW', rationale: 'Adequate capital' },
      complianceRisk: { level: 'LOW', rationale: 'Clean' },
      contractRisk: { level: 'LOW', rationale: 'Standard' },
      pricingRisk: {
        status: 'INDETERMINATE',
        quotedPrice: 620000,
      },
      overallRisk: 'LOW',
      confidenceScore: 0.72,
    };

    render(<RiskBreakdown riskAssessment={mockAssessment} />);

    expect(screen.getByText(/Reference price data unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Indeterminate/i)).toBeInTheDocument();
  });

  it('renders EvidenceTrail with sorted facts and contradiction flag popover', () => {
    const mockFusedContext: RankedContext = {
      overallConfidence: 0.82,
      fallbackToVectorOnly: false,
      facts: [
        {
          factId: 'fact-1',
          text: 'Knowledge Graph node: Active FDA warning issued in 2024.',
          source: 'graph',
          retrieverScore: 0.98,
          sourceWeight: 1.0,
          finalScore: 0.98,
          isPrimary: true,
          contradictionFlag: true,
          conflictsWith: 'fact-2',
        },
        {
          factId: 'fact-2',
          text: 'Vector Chunk: Self-certified clean inspection in 2023.',
          source: 'vector',
          retrieverScore: 0.85,
          sourceWeight: 0.75,
          finalScore: 0.6375,
          isPrimary: false,
          contradictionFlag: true,
          conflictsWith: 'fact-1',
        },
      ],
    };

    render(<EvidenceTrail fusedContext={mockFusedContext} />);

    // Check ranked facts
    expect(screen.getByText(/Active FDA warning issued in 2024/i)).toBeInTheDocument();

    // Check contradiction flag inspection button
    const inspectBtn = screen.getAllByRole('button', { name: /Fusion Contradiction Flagged/i })[0];
    expect(inspectBtn).toBeInTheDocument();

    // Click inspect button to open conflict resolution modal
    fireEvent.click(inspectBtn);
    expect(screen.getByText(/Hybrid RAG Contradiction Resolution/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected Primary/i)).toBeInTheDocument();
    expect(screen.getByText(/Contradicted Runner-Up/i)).toBeInTheDocument();
  });
});
