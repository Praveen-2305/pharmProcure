import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VendorReviewPage } from '../src/pages/VendorReview/VendorReviewPage';
import * as useProcurementStatusModule from '../src/hooks/useProcurementStatus';

vi.mock('../src/hooks/useProcurementStatus');

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

describe('Dossier PDF Export on VendorReviewPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Download PDF Dossier button when stage is COMPLETE', () => {
    vi.spyOn(useProcurementStatusModule, 'useProcurementStatus').mockReturnValue({
      status: {
        stage: 'COMPLETE',
        investigationPlan: 'standard',
        agentStatus: 'COMPLETED',
        startedAt: new Date().toISOString(),
      } as any,
      report: mockReport,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/procurement/case-123/review']}>
        <Routes>
          <Route path="/procurement/:id/review" element={<VendorReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PDF Dossier/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('renders Download PDF Dossier button when stage is AWAITING_APPROVAL', () => {
    vi.spyOn(useProcurementStatusModule, 'useProcurementStatus').mockReturnValue({
      status: {
        stage: 'AWAITING_APPROVAL',
        investigationPlan: 'comprehensive',
        agentStatus: 'COMPLETED',
        startedAt: new Date().toISOString(),
      } as any,
      report: mockReport,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/procurement/case-123/review']}>
        <Routes>
          <Route path="/procurement/:id/review" element={<VendorReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PDF Dossier/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('triggers PDF download link on click with correct href', () => {
    vi.spyOn(useProcurementStatusModule, 'useProcurementStatus').mockReturnValue({
      status: {
        stage: 'COMPLETE',
        investigationPlan: 'standard',
        agentStatus: 'COMPLETED',
        startedAt: new Date().toISOString(),
      } as any,
      report: mockReport,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Spy on document.createElement('a')
    const createdLinks: HTMLAnchorElement[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        createdLinks.push(el as HTMLAnchorElement);
      }
      return el;
    });

    render(
      <MemoryRouter initialEntries={['/procurement/case-123/review']}>
        <Routes>
          <Route path="/procurement/:id/review" element={<VendorReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PDF Dossier/i });
    fireEvent.click(downloadBtn);

    const link = createdLinks.find(a => a.href.includes('/procurement/case-123/dossier.pdf'));
    expect(link).toBeDefined();
    expect(link?.download).toBe('AutonoSource_Dossier_case-123.pdf');
  });
});
