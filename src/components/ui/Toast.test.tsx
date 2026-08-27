/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect, mock } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from './Toast';

describe('Toast Primitive', () => {
  it('renders role="status" and aria-live="polite" for accent and success tones', () => {
    const { getByRole, rerender } = render(
      <Toast tone="accent" title="Telemetry Synced" description="Relay connected" />
    );

    const statusToast = getByRole('status');
    expect(statusToast).toBeInTheDocument();
    expect(statusToast.getAttribute('aria-live')).toBe('polite');
    expect(statusToast.textContent).toContain('Telemetry Synced');

    rerender(<Toast tone="success" title="Mission Safe" description="Orbit confirmed" />);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('renders role="alert" and aria-live="assertive" for warning and destructive tones', () => {
    const { getByRole, rerender } = render(
      <Toast tone="warning" title="Signal Degraded" description="High latency detected" />
    );

    let alertToast = getByRole('alert');
    expect(alertToast).toBeInTheDocument();
    expect(alertToast.getAttribute('aria-live')).toBe('assertive');

    rerender(
      <Toast tone="destructive" title="Power Grid Failure" description="Switching to backup" />
    );
    alertToast = getByRole('alert');
    expect(alertToast).toBeInTheDocument();
    expect(alertToast.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders action button and triggers its onClick callback', () => {
    const handleAction = mock();
    const { getByRole } = render(
      <Toast
        tone="accent"
        title="Software Update"
        description="Version 2.4 available"
        action={{ label: 'Install Now', onClick: handleAction }}
      />
    );

    const actionButton = getByRole('button', { name: 'Install Now' });
    expect(actionButton).toBeInTheDocument();
    fireEvent.click(actionButton);
    expect(handleAction).toHaveBeenCalled();
  });

  it('calls onDismiss when close button is clicked', () => {
    const handleDismiss = mock();
    const { getByRole } = render(
      <Toast
        tone="accent"
        title="Notification"
        description="Dismissable item"
        onDismiss={handleDismiss}
      />
    );

    const closeButton = getByRole('button', { name: /close notification/i });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('integrates with ToastProvider and useToast hook', () => {
    function TestConsumer() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast.success('Command Acknowledged', 'Rover executing path plan');
          }}
        >
          Dispatch Command
        </button>
      );
    }

    const { getByRole, queryByRole } = render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    expect(queryByRole('status')).toBeNull();

    const button = getByRole('button', { name: 'Dispatch Command' });
    fireEvent.click(button);

    const toastElement = getByRole('status');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement.textContent).toContain('Command Acknowledged');
    expect(toastElement.textContent).toContain('Rover executing path plan');
  });

  it('renders ToastContainer with token z-index --z-toast', () => {
    function TestConsumer() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast.accent('Status Active');
          }}
        >
          Trigger Toast
        </button>
      );
    }

    const { getByRole } = render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(getByRole('button', { name: 'Trigger Toast' }));
    const container = getByRole('region', { name: 'Notifications' });
    expect(container).toBeInTheDocument();
    expect(container.style.zIndex).toBe('var(--z-toast, 70)');
  });
});
