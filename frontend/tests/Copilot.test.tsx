import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CopilotSlideOver } from '../src/features/copilot/CopilotSlideOver';
import { copilotApi } from '../src/api/copilot';

const renderComponent = (props: { isOpen: boolean; onClose: () => void }) =>
  render(
    <BrowserRouter>
      <CopilotSlideOver {...props} />
    </BrowserRouter>
  );

describe('CopilotSlideOver Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderComponent({ isOpen: false, onClose: vi.fn() });
    expect(container.firstChild).toBeNull();
  });

  it('renders welcome message and input form when open', async () => {
    renderComponent({ isOpen: true, onClose: vi.fn() });
    expect(await screen.findByText(/Ask AutonoSource/i)).toBeInTheDocument();
    expect(screen.getByText(/AutonoSource Procurement Copilot/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ask about CDSCO laws, cold-chain SLAs, pricing.../i)
    ).toBeInTheDocument();
  });

  it('sends query and displays grounded response with citation badges', async () => {
    vi.spyOn(copilotApi, 'askCopilot').mockResolvedValueOnce({
      answer: 'WHO TRS 1025 mandates 2°C–8°C storage with continuous digital data loggers during transit.',
      citations: [
        {
          id: 'STAT-WHO-1025',
          title: 'WHO TRS 1025 Cold Chain',
          source: 'Storage & Distribution Standard',
          excerpt: 'Continuous digital data loggers mandatory for biologics.',
        },
      ],
      isGrounded: true,
      suggestedQueries: ['How is DPCO ceiling enforced?'],
    });

    renderComponent({ isOpen: true, onClose: vi.fn() });

    const input = screen.getByPlaceholderText(/Ask about CDSCO laws, cold-chain SLAs, pricing.../i);
    const askBtn = screen.getByRole('button', { name: /Ask/i });

    fireEvent.change(input, { target: { value: 'What are cold chain rules?' } });
    fireEvent.click(askBtn);

    expect(
      await screen.findByText(/WHO TRS 1025 mandates 2°C–8°C storage/i)
    ).toBeInTheDocument();
    const matches = screen.getAllByText(/WHO TRS 1025 Cold Chain/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
