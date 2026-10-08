import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AlertsCenterPage } from '../src/features/alerts/AlertsCenterPage';
import * as alertsApi from '../src/api/alerts';

describe('AlertsCenterPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders alerts center header, statistics, and alert cards', async () => {
    render(
      <BrowserRouter>
        <AlertsCenterPage />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Regulatory Alerts & Cold-Chain Telemetry Center/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Alert Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Telemetry/i)).toBeInTheDocument();

    // Check alert headlines
    expect(
      await screen.findByText(/14.2°C Temperature Spike in Transit/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/CDSCO Monthly Drug Alert/i)
    ).toBeInTheDocument();
  });

  it('allows acknowledging an alert', async () => {
    render(
      <BrowserRouter>
        <AlertsCenterPage />
      </BrowserRouter>
    );

    const ackButtons = await screen.findAllByRole('button', { name: /Acknowledge/i });
    expect(ackButtons.length).toBeGreaterThan(0);

    fireEvent.click(ackButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/Acknowledged/i).length).toBeGreaterThan(0);
    });
  });

  it('opens simulate event modal when button clicked', async () => {
    render(
      <BrowserRouter>
        <AlertsCenterPage />
      </BrowserRouter>
    );

    const simButton = await screen.findByRole('button', {
      name: /Simulate Live Event/i,
    });
    fireEvent.click(simButton);

    expect(
      await screen.findByText(/Inject real-time CDSCO advisories/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Inject Live Alert Event/i })
    ).toBeInTheDocument();
  });
});
