import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../src/components/layout/Sidebar';
import { procurementApi } from '../src/api/client';

const renderSidebar = () =>
  render(
    <BrowserRouter>
      <Sidebar isOpen={true} />
    </BrowserRouter>
  );

describe('Sidebar Component - Recent Reviews & Weekly Refresh', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders Recent Reviews header with Weekly indicator and loads reviews', async () => {
    renderSidebar();

    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();

    // Verify dynamic cases are loaded from API
    await waitFor(() => {
      expect(screen.getByText(/BioGen Diagnostics/i)).toBeInTheDocument();
    });
  });

  it('caches reviews in localStorage with weekly timestamp on initial fetch', async () => {
    const getAllSpy = vi.spyOn(procurementApi, 'getAllProcurements');

    renderSidebar();

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(1);
    });

    const cachedReviews = localStorage.getItem('pharmprocure_sidebar_reviews');
    const cachedTimestamp = localStorage.getItem('pharmprocure_sidebar_last_refreshed');

    expect(cachedReviews).not.toBeNull();
    expect(cachedTimestamp).not.toBeNull();
    expect(JSON.parse(cachedReviews!).length).toBeGreaterThan(0);
  });

  it('uses cached reviews when cache is within 7 days without hitting API again', async () => {
    const mockCached = [
      {
        procurementId: 'PR-TEST-CACHED',
        vendorName: 'Cached Pharma Solutions',
        dealSize: 100000,
        createdAt: new Date().toISOString(),
        status: {
          procurementId: 'PR-TEST-CACHED',
          stage: 'COMPLETE',
          investigationPlan: 'FULL',
          revisionCount: 0,
          maxRevisions: 3,
        },
      },
    ];

    // Timestamp 2 days ago (less than 7 days)
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pharmprocure_sidebar_reviews', JSON.stringify(mockCached));
    localStorage.setItem('pharmprocure_sidebar_last_refreshed', twoDaysAgo.toString());

    const getAllSpy = vi.spyOn(procurementApi, 'getAllProcurements');

    renderSidebar();

    expect(await screen.findByText('Cached Pharma Solutions')).toBeInTheDocument();
    // API should not be called because cache is valid for 7 days
    expect(getAllSpy).not.toHaveBeenCalled();
  });

  it('refreshes fresh reviews when cache is older than 7 days (weekly expiration)', async () => {
    const mockOldCached = [
      {
        procurementId: 'PR-OLD-EXPIRED',
        vendorName: 'Old Expired Vendor',
        dealSize: 50000,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: {
          procurementId: 'PR-OLD-EXPIRED',
          stage: 'COMPLETE',
          investigationPlan: 'LIGHT',
          revisionCount: 0,
          maxRevisions: 3,
        },
      },
    ];

    // Timestamp 8 days ago (expired weekly cache)
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pharmprocure_sidebar_reviews', JSON.stringify(mockOldCached));
    localStorage.setItem('pharmprocure_sidebar_last_refreshed', eightDaysAgo.toString());

    const getAllSpy = vi.spyOn(procurementApi, 'getAllProcurements');

    renderSidebar();

    // Since it's older than 7 days, it should re-fetch
    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('allows manual weekly refresh button click', async () => {
    const getAllSpy = vi.spyOn(procurementApi, 'getAllProcurements');

    renderSidebar();

    await waitFor(() => {
      expect(screen.getByText(/BioGen Diagnostics/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle(/Refresh reviews now/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('refreshes when pharmprocure_reviews_updated event is dispatched', async () => {
    const getAllSpy = vi.spyOn(procurementApi, 'getAllProcurements');

    renderSidebar();

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(1);
    });

    // Simulate delete or update event from dashboard
    window.dispatchEvent(new CustomEvent('pharmprocure_reviews_updated'));

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(2);
    });
  });
});
