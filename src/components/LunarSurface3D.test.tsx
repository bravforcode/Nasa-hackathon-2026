/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { LunarSurface3D } from './LunarSurface3D';

describe('LunarSurface3D WebGL Component', () => {
  it('renders 3D WebGL terrain container with title and accessible status', () => {
    const { getByRole, getByText } = render(
      <LunarSurface3D
        siteName="Shackleton High Ridge 3D"
        latDeg={-89.9}
        lonDeg={0.0}
        sunElevationDeg={1.6}
        sunAzimuthDeg={140}
      />
    );

    expect(getByText(/Interactive 3D WebGL Lunar Surface/i)).toBeInTheDocument();
    expect(getByText(/Shackleton High Ridge 3D/i)).toBeInTheDocument();
    expect(getByRole('region', { name: /Interactive 3D WebGL Lunar Surface/i })).toBeInTheDocument();
  });

  it('renders viewpoint preset selector and camera controls', () => {
    const { getByText } = render(
      <LunarSurface3D
        siteName="Amundsen Crater Rim"
        latDeg={-84.5}
        lonDeg={85.6}
        sunElevationDeg={2.1}
        sunAzimuthDeg={90}
      />
    );

    expect(getByText(/Orbit 360°/i)).toBeInTheDocument();
    expect(getByText(/Ridge Horizon/i)).toBeInTheDocument();
    expect(getByText(/Top-Down/i)).toBeInTheDocument();
  });
});
