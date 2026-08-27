/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../test/setup';
import { describe, it, expect, mock } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { TelemetryCards } from './TelemetryCards';
import { RelayNode } from '../types';

const mockRelays: RelayNode[] = [
  {
    id: 'relay-1',
    name: 'Shackleton Apex Alpha',
    code: 'SHK-01',
    lat: -89.9,
    lon: 0.0,
    elevKm: 4.2,
    type: 'ridge_mast',
    status: 'active',
    coverageRadiusKm: 25,
    frequencyBand: 'Ka-Band',
    healthPercent: 100,
  },
  {
    id: 'relay-2',
    name: 'Malapert Mountain Mast',
    code: 'MLP-02',
    lat: -86.0,
    lon: 2.7,
    elevKm: 5.1,
    type: 'surface_tower',
    status: 'active',
    coverageRadiusKm: 30,
    frequencyBand: 'S-Band',
    healthPercent: 95,
  },
  {
    id: 'relay-3',
    name: 'Shoemaker Rim Node',
    code: 'SHK-03',
    lat: -88.1,
    lon: 45.0,
    elevKm: 2.3,
    type: 'ridge_mast',
    status: 'offline',
    coverageRadiusKm: 18,
    frequencyBand: 'Ka-Band',
    healthPercent: 0,
  },
  {
    id: 'relay-4',
    name: 'Lunar Pathfinder Orbiter',
    code: 'LUN-04',
    lat: 0.0,
    lon: 0.0,
    elevKm: 500.0,
    type: 'orbital_lunanet',
    status: 'candidate',
    coverageRadiusKm: 150,
    frequencyBand: 'Optical/X',
    healthPercent: 100,
    isCandidate: true,
  },
];

describe('TelemetryCards Component Suite', () => {
  it('renders the 3 Golden KPI strip with nominal telemetry values and micro-trends', () => {
    const { getByText, getAllByRole } = render(
      <TelemetryCards
        coveragePercent={92}
        batteryPercent={85}
        isReplanning={false}
        distanceKm={3.45}
        relays={mockRelays}
      />
    );

    // Assert KPI 1: Communication Link
    expect(getByText('Communication Link')).toBeInTheDocument();
    expect(getByText('92%')).toBeInTheDocument();
    expect(getByText('NOMINAL')).toBeInTheDocument();
    expect(getByText('+12.0%')).toBeInTheDocument(); // 92 - 80 = +12.0%

    // Assert KPI 2: Battery SoC
    expect(getByText('Rover Battery SoC')).toBeInTheDocument();
    expect(getByText('85%')).toBeInTheDocument();
    expect(getByText('OPTIMAL')).toBeInTheDocument();
    expect(getByText('+0.4 kW')).toBeInTheDocument();

    // Assert KPI 3: Route Status
    expect(getByText('Route Status')).toBeInTheDocument();
    expect(getByText('ON TRACK')).toBeInTheDocument();
    expect(getByText('LOCKED')).toBeInTheDocument();
    expect(getByText('ETA: T-2.5h')).toBeInTheDocument();

    // Assert progress bars
    const progressBars = getAllByRole('progressbar');
    expect(progressBars.length).toBe(3);
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('92');
    expect(progressBars[1].getAttribute('aria-valuenow')).toBe('85');
    expect(progressBars[2].getAttribute('aria-valuenow')).toBe('100');
  });

  it('handles degraded communication coverage state (<80%) with alert styling and negative delta', () => {
    const { getByText, getAllByRole } = render(
      <TelemetryCards
        coveragePercent={72}
        batteryPercent={75}
        isReplanning={false}
        distanceKm={5.12}
        relays={mockRelays}
      />
    );

    expect(getByText('72%')).toBeInTheDocument();
    expect(getByText('DEGRADED')).toBeInTheDocument();
    expect(getByText('-8.0%')).toBeInTheDocument(); // 72 - 80 = -8.0%

    const progressBars = getAllByRole('progressbar');
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('72');
  });

  it('renders caution and critical battery states appropriately', () => {
    // Caution state: 30% <= battery < 60%
    const { getByText: getByTextCaution, unmount } = render(
      <TelemetryCards
        coveragePercent={88}
        batteryPercent={45}
        isReplanning={false}
        distanceKm={2.1}
        relays={mockRelays}
      />
    );

    expect(getByTextCaution('45%')).toBeInTheDocument();
    expect(getByTextCaution('CAUTION')).toBeInTheDocument();
    expect(getByTextCaution('-1.8%/h')).toBeInTheDocument();
    expect(getByTextCaution('Constrained')).toBeInTheDocument();

    unmount();

    // Critical state: battery < 30%
    const { getByText: getByTextCritical } = render(
      <TelemetryCards
        coveragePercent={88}
        batteryPercent={22}
        isReplanning={false}
        distanceKm={2.1}
        relays={mockRelays}
      />
    );

    expect(getByTextCritical('22%')).toBeInTheDocument();
    expect(getByTextCritical('CRITICAL')).toBeInTheDocument();
  });

  it('renders active replanning state with warning tone and ARIA live region announcement', () => {
    const { getByText, container } = render(
      <TelemetryCards
        coveragePercent={68}
        batteryPercent={50}
        isReplanning={true}
        distanceKm={4.8}
        relays={mockRelays}
      />
    );

    expect(getByText('REPLANNING...')).toBeInTheDocument();
    expect(getByText('REPLANNING')).toBeInTheDocument();
    expect(getByText('+14m 22s')).toBeInTheDocument();

    // Live region check for screen readers
    const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion?.textContent).toContain('Active route replanning in progress');
    expect(liveRegion?.textContent).toContain('Communication coverage degraded below 80 percent floor');
  });

  it('opens and closes diagnostics drawer with full accessibility and interactive controls', () => {
    const handleForceRecalc = mock(() => {});

    const { getByRole, queryByRole, getByText, getAllByText, queryByText } = render(
      <TelemetryCards
        coveragePercent={91}
        batteryPercent={80}
        isReplanning={false}
        distanceKm={3.5}
        relays={mockRelays}
        onForceRecalc={handleForceRecalc}
      />
    );

    const toggleButton = getByRole('button', { name: /Constellation Diagnostics & Space Weather/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    // Drawer should not be present initially
    expect(queryByRole('region', { name: /Constellation Diagnostics and Space Weather/i })).toBeNull();
    expect(queryByText('Shackleton Apex Alpha')).toBeNull();

    // Open drawer
    fireEvent.click(toggleButton);

    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(getByRole('region', { name: /Constellation Diagnostics and Space Weather/i })).toBeInTheDocument();
    expect(getByText('Shackleton Apex Alpha')).toBeInTheDocument();
    expect(getByText('[SHK-01]')).toBeInTheDocument();
    expect(getByText('Space Weather [DONKI]')).toBeInTheDocument();
    expect(getByText('Class M2.4')).toBeInTheDocument();
    expect(getByText('Excursion Telemetry')).toBeInTheDocument();
    expect(getByText('Shelter Range')).toBeInTheDocument();
    const distanceMatches = getAllByText(/3\.50/i);
    expect(distanceMatches.length).toBeGreaterThan(0);

    // Click recalculate button
    const recalcButton = getByRole('button', { name: /RE-CALCULATE TELEMETRY/i });
    fireEvent.click(recalcButton);
    expect(handleForceRecalc).toHaveBeenCalledTimes(1);

    // Close drawer
    fireEvent.click(getByRole('button', { name: /Hide Diagnostics/i }));
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(queryByRole('region', { name: /Constellation Diagnostics and Space Weather/i })).toBeNull();
  });
});
