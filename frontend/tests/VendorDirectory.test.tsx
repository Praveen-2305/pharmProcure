import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { VendorDirectoryPage } from '../src/features/vendors/VendorDirectoryPage';
import { Vendor360Page } from '../src/features/vendors/Vendor360Page';
import * as vendorApi from '../src/api/vendorDirectory';

describe('Vendor Directory & Vendor 360 Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders VendorDirectoryPage with statistics and vendor cards', async () => {
    render(
      <BrowserRouter>
        <VendorDirectoryPage />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/Pharmaceutical Vendor Directory & 360° Intelligence/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Verified Vendors/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cold-Chain Capable/i).length).toBeGreaterThan(0);

    // Verify vendor cards render
    expect(await screen.findByText(/Bharat Biotherapeutics Labs/i)).toBeInTheDocument();
    expect(screen.getByText(/Apex Pharma Chem Solutions/i)).toBeInTheDocument();
  });

  it('filters vendor directory by search input', async () => {
    render(
      <BrowserRouter>
        <VendorDirectoryPage />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/Search vendor by name/i);
    fireEvent.change(searchInput, { target: { value: 'Bharat' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Bharat Biotherapeutics Labs/i)).toBeInTheDocument();
    });
  });

  it('renders Vendor360Page with 5-pillars, products catalog, and historical cases', async () => {
    render(
      <MemoryRouter initialEntries={['/vendors/VND-002']}>
        <Routes>
          <Route path="/vendors/:id" element={<Vendor360Page />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Bharat Biotherapeutics Labs/i)).toBeInTheDocument();
    expect(screen.getByText(/Entity Overview & Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Power/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Quarter Risk Score Trajectory/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Pharmaceutical Product Catalog & DPCO 2013 Ceiling Status/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trastuzumab 440mg Lyophilized Injection/i)
    ).toBeInTheDocument();
  });
});
