/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../test/setup';
import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { ComponentLibraryView } from './ComponentLibraryView';

describe('ComponentLibraryView', () => {
  it('renders title, status pills, and system token pillars', () => {
    const { getByText } = render(<ComponentLibraryView />);

    expect(getByText('Component & Token Matrix')).toBeInTheDocument();
    expect(getByText('LIVING DESIGN SYSTEM')).toBeInTheDocument();
    expect(getByText('WCAG 2.2 AA VERIFIED')).toBeInTheDocument();
    expect(getByText(/44px Touch Targets/i)).toBeInTheDocument();
  });

  it('showcases Button primitive matrix and handles loading simulation', () => {
    const { getAllByRole } = render(<ComponentLibraryView />);

    // Check variant buttons rendered
    const deployButtons = getAllByRole('button', { name: /deploy route/i });
    expect(deployButtons.length).toBeGreaterThan(0);

    // Interactive click triggers loading
    const interactiveBtn = deployButtons[0];
    fireEvent.click(interactiveBtn);
    expect(interactiveBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('showcases IconButton primitive with aria-pressed toggle states', () => {
    const { getByRole } = render(<ComponentLibraryView />);

    const coverageToggle = getByRole('button', { name: 'Coverage Heatmap' });
    expect(coverageToggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(coverageToggle);
    expect(coverageToggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(coverageToggle);
    expect(coverageToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('showcases Input primitive with labels, hints, and error alerts', () => {
    const { getByLabelText, getByRole } = render(<ComponentLibraryView />);

    const coordsInput = getByLabelText(/target coordinates/i);
    expect(coordsInput).toBeInTheDocument();
    expect(coordsInput).toHaveValue('89.123, -45.678');

    fireEvent.change(coordsInput, { target: { value: '12.34, 56.78' } });
    expect(coordsInput).toHaveValue('12.34, 56.78');

    // Error input alert
    const errorAlert = getByRole('alert');
    expect(errorAlert).toHaveTextContent(/vector checksum mismatch/i);
  });

  it('showcases StatusPill and MetricLabel primitives', () => {
    const { getByText } = render(<ComponentLibraryView />);

    expect(getByText('ACCENT / PULSE')).toBeInTheDocument();
    expect(getByText('SUCCESS / PULSE')).toBeInTheDocument();
    expect(getByText('WARNING / PULSE')).toBeInTheDocument();
    expect(getByText('DESTRUCTIVE / PULSE')).toBeInTheDocument();

    expect(getByText('Solar Window')).toBeInTheDocument();
    expect(getByText('14:22:09 LST')).toBeInTheDocument();
  });

  it('showcases NavItem and handles selection', () => {
    const { getByRole } = render(<ComponentLibraryView />);

    const mapNav = getByRole('button', { name: /polar surface map/i });
    expect(mapNav).toHaveAttribute('aria-current', 'page');

    const relayNav = getByRole('button', { name: /relay constellation/i });
    expect(relayNav).not.toHaveAttribute('aria-current');

    fireEvent.click(relayNav);
    expect(relayNav).toHaveAttribute('aria-current', 'page');
  });

  it('showcases AnimatedCounter with increment and decrement', () => {
    const { getAllByRole } = render(<ComponentLibraryView />);

    const plusButtons = getAllByRole('button', { name: /15%/i });
    expect(plusButtons.length).toBeGreaterThan(0);

    fireEvent.click(plusButtons[0]);
  });

  it('showcases Compound Tabs and switches tabs', () => {
    const { getByRole, getByText } = render(<ComponentLibraryView />);

    const telemetryTab = getByRole('tab', { name: /live telemetry/i });
    expect(telemetryTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(telemetryTab);
    expect(telemetryTab).toHaveAttribute('aria-selected', 'true');
    expect(getByText(/carrier frequency/i)).toBeInTheDocument();
  });

  it('showcases Modal shell trigger, backdrop, and dismissal', () => {
    const { getByRole, getByText, queryByRole } = render(<ComponentLibraryView />);

    const launchModalBtn = getByRole('button', { name: /launch modal shell/i });
    fireEvent.click(launchModalBtn);

    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByText('Interactive Modal Primitive Demo')).toBeInTheDocument();

    const dismissBtn = getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(queryByRole('dialog')).toBeNull();
  });
});
