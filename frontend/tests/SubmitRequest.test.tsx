import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SubmitRequestForm } from '../src/pages/SubmitRequest/SubmitRequestForm';
import { mockProcurementAPI } from '../src/api/procurement';

// Wrap with router
const renderComponent = () =>
  render(
    <BrowserRouter>
      <SubmitRequestForm />
    </BrowserRouter>
  );

describe('SubmitRequestForm Component', () => {
  it('renders form inputs correctly', () => {
    renderComponent();
    expect(screen.getByLabelText(/Vendor Legal Entity Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quoted Deal Size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Scope of Procurement & Details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Launch Investigation/i })).toBeInTheDocument();
  });

  it('validates client-side constraints on empty submit', async () => {
    renderComponent();
    const submitBtn = screen.getByRole('button', { name: /Launch Investigation/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Vendor name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please enter a valid positive deal size/i)).toBeInTheDocument();
    expect(await screen.findByText(/Procurement details and scope of work are required/i)).toBeInTheDocument();
  });

  it('submits successfully with valid data', async () => {
    const submitSpy = vi.spyOn(mockProcurementAPI, 'submitRequest');

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Vendor Legal Entity Name/i), {
      target: { value: 'Acme Test Pharma Inc.' },
    });
    fireEvent.change(screen.getByLabelText(/Quoted Deal Size/i), {
      target: { value: '500000' },
    });
    fireEvent.change(screen.getByLabelText(/Scope of Procurement & Details/i), {
      target: { value: 'Comprehensive synthesis and cGMP certification batch supply.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Launch Investigation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorName: 'Acme Test Pharma Inc.',
          dealSize: 500000,
          investigationPlan: 'FULL',
        })
      );
    });
  });
});
