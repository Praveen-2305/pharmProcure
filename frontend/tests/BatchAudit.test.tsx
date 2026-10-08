import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchAuditPage } from '../src/features/batch-audit/BatchAuditPage';

describe('BatchAuditPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title, summary KPI cards, and line item table', () => {
    render(<BatchAuditPage />);

    expect(screen.getByText(/Bulk Procurement & RFP Line-Item Auditor/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Tender Quoted/i)).toBeInTheDocument();
    expect(screen.getByText(/Statutory Overcharges/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliant Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Trastuzumab 440mg Lyophilized Vial/i)).toBeInTheDocument();
  });

  it('filters table by Violations and Compliant tabs', () => {
    render(<BatchAuditPage />);

    // Click Violations tab
    const violationsBtn = screen.getByRole('button', { name: /Violations/i });
    fireEvent.click(violationsBtn);

    // Trastuzumab is a violation, should be visible
    expect(screen.getByText(/Trastuzumab 440mg Lyophilized Vial/i)).toBeInTheDocument();
    // Amoxicillin is compliant, should not be visible
    expect(screen.queryByText(/Amoxicillin \+ Clavulanic Acid 625mg/i)).not.toBeInTheDocument();

    // Click Compliant tab
    const compliantBtn = screen.getByRole('button', { name: /Compliant/i });
    fireEvent.click(compliantBtn);

    // Amoxicillin should now be visible
    expect(screen.getByText(/Amoxicillin \+ Clavulanic Acid 625mg/i)).toBeInTheDocument();
    // Trastuzumab should not be visible
    expect(screen.queryByText(/Trastuzumab 440mg Lyophilized Vial/i)).not.toBeInTheDocument();
  });

  it('caps a single item to ceiling when Cap to Ceiling button is clicked', () => {
    render(<BatchAuditPage />);

    const capButtons = screen.getAllByRole('button', { name: /Cap to Ceiling/i });
    expect(capButtons.length).toBeGreaterThan(0);

    // Click first cap button (Trastuzumab)
    fireEvent.click(capButtons[0]);

    // Trastuzumab quoted price should now equal ceiling 24,900 (both quoted and ceiling show ₹24,900)
    expect(screen.getAllByText('₹24,900').length).toBeGreaterThanOrEqual(2);
  });

  it('caps all violations when "Cap All to Ceilings" banner button is clicked', () => {
    render(<BatchAuditPage />);

    const capAllBtn = screen.getByRole('button', { name: /Cap All to Ceilings/i });
    fireEvent.click(capAllBtn);

    // Overcharges should now be 0 or 100% compliant
    expect(screen.getByText(/10 \/ 10 Items/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('triggers CSV export download on click', () => {
    render(<BatchAuditPage />);

    const createdLinks: HTMLAnchorElement[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        createdLinks.push(el as HTMLAnchorElement);
      }
      return el;
    });

    const exportBtn = screen.getByRole('button', { name: /Export Audited CSV/i });
    fireEvent.click(exportBtn);

    const link = createdLinks.find(a => a.download?.includes('AutonoSource_Audited_Tender'));
    expect(link).toBeDefined();
  });
});
