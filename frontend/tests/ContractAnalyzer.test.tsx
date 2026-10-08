import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ContractAnalyzerPage } from '../src/features/contract-analyzer/ContractAnalyzerPage';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ContractAnalyzerPage />
    </BrowserRouter>
  );

describe('ContractAnalyzerPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page header and sample action buttons', async () => {
    renderComponent();
    expect(
      await screen.findByText(/Contract Intelligence & Redline Negotiation Pack/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load High-Risk Sample/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Compliant Sample/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Audit Contract Clauses/i })
    ).toBeInTheDocument();
  });

  it('audits clauses and displays risk level, summary, and clause cards', async () => {
    renderComponent();
    // Initially auto-audits the high-risk contract
    expect(await screen.findByText(/HIGH RISK CONTRACT/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Violations/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Warnings/i).length).toBeGreaterThan(0);

    // Check that clause titles appear
    expect(await screen.findByText(/Cold-Chain Transit & Continuous Logging/i)).toBeInTheDocument();
    expect(await screen.findByText(/Limitation of Liability & Batch Recalls/i)).toBeInTheDocument();
  });

  it('generates negotiation pack and opens modal with email draft & replacement clauses', async () => {
    renderComponent();
    const genPackButton = await screen.findByRole('button', {
      name: /Generate Negotiation Pack/i,
    });
    fireEvent.click(genPackButton);

    expect(
      await screen.findByText(/Automated Redline & Negotiation Pack/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Executive Counsel Outreach Draft/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Statutory Replacement Clauses/i).length
    ).toBeGreaterThan(0);
  });
});
