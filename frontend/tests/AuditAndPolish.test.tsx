import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import { RoleSwitcher } from '../src/components/layout/RoleSwitcher';
import { DemoScenariosModal } from '../src/components/layout/DemoScenariosModal';
import { AuditTrailPage } from '../src/pages/AuditTrail/AuditTrailPage';
import * as auditApi from '../src/api/audit';

describe('Feature 10: Role Switcher & Enterprise Polish', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('RoleSwitcher renders active user and allows switching persona', () => {
    render(
      <AuthProvider>
        <RoleSwitcher />
      </AuthProvider>
    );

    // Initial default user is Aria Vance
    expect(screen.getByText('Aria Vance')).toBeInTheDocument();
    expect(screen.getByText('Procurement Officer')).toBeInTheDocument();

    // Open dropdown
    const trigger = screen.getByTitle('Click to switch persona role');
    fireEvent.click(trigger);

    // Should display other personas
    expect(screen.getByText('Dr. Rajesh Sharma')).toBeInTheDocument();
    expect(screen.getByText('Vikram Malhotra')).toBeInTheDocument();

    // Switch to Vikram Malhotra
    fireEvent.click(screen.getByText('Vikram Malhotra'));

    // Should now show Vikram Malhotra
    expect(screen.getByText('Vikram Malhotra')).toBeInTheDocument();
    expect(screen.getByText('Executive Approver')).toBeInTheDocument();
  });

  it('DemoScenariosModal renders all 5 HackForge scenarios and launches', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <DemoScenariosModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    expect(screen.getByText(/AutonoSource Enterprise Demo Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/DPCO Ceiling Overcharge Interception/i)).toBeInTheDocument();
    expect(screen.getByText(/Cold-Chain Excursion Interception/i)).toBeInTheDocument();
    expect(screen.getByText(/5-Pillar Multi-Vendor Radar RFP/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Contract Clause Audit & Pack/i)).toBeInTheDocument();
    expect(screen.getByText(/What-If Deal Term Simulator/i)).toBeInTheDocument();

    // Click close guide
    fireEvent.click(screen.getByRole('button', { name: /Close Guide/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('AuditTrailPage renders forensic KPIs and expandable timeline', async () => {
    vi.spyOn(auditApi, 'fetchGovernanceLogs').mockResolvedValue({
      count: 1,
      currency: 'INR',
      logs: [
        {
          procurementId: 'case-test-01',
          vendorName: 'Apex Biologics Test',
          dealSizeInr: 25000000,
          currency: 'INR',
          currentStage: 'COMPLETE',
          investigationPlan: 'standard',
          revisionsExecuted: 0,
          createdAt: new Date().toISOString(),
          governanceStatus: 'AUDITED_AND_VERIFIED',
          timeline: [
            {
              event: 'PROCUREMENT_INITIALIZED',
              timestamp: new Date().toISOString(),
              stage: 'PLANNING',
              detail: 'Scope initialized with cold chain verification.',
            },
          ],
          approvalRecord: {
            decision: 'APPROVE',
            decidedBy: 'Aria Vance',
            decidedAt: new Date().toISOString(),
            reason: 'Compliant with DPCO ceilings.',
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <AuditTrailPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Apex Biologics Test')).toBeInTheDocument();
    expect(screen.getByText('case-test-01')).toBeInTheDocument();
    expect(screen.getByText(/Forensic Execution Timeline/i)).toBeInTheDocument();
    expect(screen.getByText('PROCUREMENT_INITIALIZED')).toBeInTheDocument();
  });
});
