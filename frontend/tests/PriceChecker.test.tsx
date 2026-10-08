import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PriceCheckPage } from '../src/features/price-check/PriceCheckPage';
import { priceCheckerApi } from '../src/api/priceChecker';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <PriceCheckPage />
    </BrowserRouter>
  );

describe('PriceCheckPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and input fields', async () => {
    renderComponent();
    expect(await screen.findByText(/Instant DPCO Price Ceiling Checker/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paracetamol 650mg/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/2905000/i)).toBeInTheDocument();
  });

  it('fills inputs when a test scenario button is clicked', async () => {
    renderComponent();
    const presetBtn = await screen.findByRole('button', { name: /Overpriced Paracetamol/i });
    fireEvent.click(presetBtn);

    const priceInput = screen.getByPlaceholderText(/2905000/i) as HTMLInputElement;
    expect(priceInput.value).toBe('3450000');
  });

  it('submits evaluation and renders PriceVerdictCard with statutory violation', async () => {
    vi.spyOn(priceCheckerApi, 'checkPrice').mockResolvedValueOnce({
      drugName: 'Essential Scheduled Generic Tablets (Paracetamol 650mg, Metformin 500mg, Azithromycin)',
      category: 'solid_oral_dosage',
      quotedPrice: 3450000,
      ceilingPrice: 2905000,
      quantity: 1,
      totalQuoted: 3450000,
      totalCeiling: 2905000,
      unitVariance: 545000,
      totalOverpayment: 545000,
      percentageDifference: 18.76,
      isCompliant: false,
      verdict: 'STATUTORY_VIOLATION',
      verdictMessage: 'ALERT: Quote of ₹3,450,000.00 exceeds NPPA statutory ceiling of ₹2,905,000.00.',
      dpcoReference: 'DPCO Schedule-II Ceiling Price Order (Updated WPI 2024)',
      unitMeasure: 'per 100,000 blister pack units',
      therapeuticUse: 'First-line analgesics, antidiabetic, and anti-infectives',
    });

    renderComponent();

    const drugInput = screen.getByPlaceholderText(/Paracetamol 650mg/i);
    const priceInput = screen.getByPlaceholderText(/2905000/i);
    const submitBtn = screen.getByRole('button', { name: /Verify Price/i });

    fireEvent.change(drugInput, { target: { value: 'Paracetamol 650mg' } });
    fireEvent.change(priceInput, { target: { value: '3450000' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/STATUTORY PRICE VIOLATION/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Full Vendor Review/i)).toBeInTheDocument();
  });
});
