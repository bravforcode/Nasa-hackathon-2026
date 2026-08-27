/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { HorizonProfile3D } from './HorizonProfile3D';

describe('HorizonProfile3D Component', () => {
  it('renders site telemetry and accessible SVG polar horizon chart', () => {
    const { getByRole, getByText } = render(
      <HorizonProfile3D
        siteName="Shackleton Rim Alpha"
        latDeg={-89.9}
        lonDeg={0.0}
        sunElevationDeg={1.5}
        sunAzimuthDeg={120}
      />
    );

    expect(getByText(/3D Lunar Horizon & LOS Mesh/i)).toBeInTheDocument();
    expect(getByText(/Shackleton Rim Alpha/i)).toBeInTheDocument();

    const svg = getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('aria-label')).toContain('Polar horizon profile');
  });

  it('updates selected azimuth when scrubbing slider', () => {
    const { getByRole, getAllByText } = render(
      <HorizonProfile3D
        siteName="Malapert Mountain"
        latDeg={-85.9}
        lonDeg={2.9}
        sunElevationDeg={2.0}
        sunAzimuthDeg={90}
      />
    );

    const slider = getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider.getAttribute('aria-valuenow')).toBe('90');

    // Change azimuth to 180 (South)
    fireEvent.input(slider, { target: { value: '180' } });
    fireEvent.change(slider, { target: { value: '180' } });
    expect(slider.getAttribute('aria-valuenow')).toBe('180');
    expect(getAllByText(/180°/).length).toBeGreaterThan(0);
  });

  it('updates mast height when clicking height buttons', () => {
    const { getByText } = render(
      <HorizonProfile3D
        siteName="de Gerlache Crater"
        latDeg={-88.5}
        lonDeg={-87.1}
      />
    );

    expect(getByText('12 meters')).toBeInTheDocument();

    // Click 20m button
    const btn20m = getByText('20m');
    fireEvent.click(btn20m);
    expect(getByText('20 meters')).toBeInTheDocument();
  });

  it('adjusts zoom level with zoom buttons', () => {
    const { getByRole } = render(
      <HorizonProfile3D
        siteName="Amundsen Siting"
        latDeg={-84.5}
        lonDeg={85.6}
      />
    );

    const zoomIn = getByRole('button', { name: /Zoom In/i });
    const zoomOut = getByRole('button', { name: /Zoom Out/i });

    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();

    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
  });
});
