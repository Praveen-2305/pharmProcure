import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../src/pages/Dashboard/DashboardPage';
import { procurementApi } from '../src/api/client';

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );

describe('Dashboard Page - Vendor Deletion Feature', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard with cases and displays delete options on each row', async () => {
    renderDashboard();

    // Verify header and cases load
    expect(await screen.findByText(/Procurement Cases/i)).toBeInTheDocument();

    // Verify Delete buttons exist for rows
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('opens confirmation modal when delete button is clicked with vendor details', async () => {
    renderDashboard();

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Modal title should appear
    expect(await screen.findByText(/Delete Vendor Record/i)).toBeInTheDocument();
    expect(screen.getByText(/Also purge vendor from master directory catalog/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Delete/i })).toBeInTheDocument();
  });

  it('executes deleteProcurement and updates UI when confirmed without catalog purge', async () => {
    const deleteProcurementSpy = vi.spyOn(procurementApi, 'deleteProcurement');
    const deleteVendorSpy = vi.spyOn(procurementApi, 'deleteVendor');

    renderDashboard();

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteProcurementSpy).toHaveBeenCalled();
    });

    // Catalog delete should not be called if checkbox was not checked
    expect(deleteVendorSpy).not.toHaveBeenCalled();

    // Success alert should be displayed
    expect(await screen.findByText(/Vendor Record Removed/i)).toBeInTheDocument();
  });

  it('executes both deleteVendor and deleteProcurement when catalog purge is checked', async () => {
    const deleteProcurementSpy = vi.spyOn(procurementApi, 'deleteProcurement');
    const deleteVendorSpy = vi.spyOn(procurementApi, 'deleteVendor');

    renderDashboard();

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Check catalog checkbox
    const catalogCheckbox = await screen.findByLabelText(/Also purge vendor from master directory catalog/i);
    fireEvent.click(catalogCheckbox);

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteVendorSpy).toHaveBeenCalled();
      expect(deleteProcurementSpy).toHaveBeenCalled();
    });
  });
});
