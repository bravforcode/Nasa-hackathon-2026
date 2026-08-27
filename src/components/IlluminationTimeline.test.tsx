/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../test/setup';
import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { IlluminationTimeline } from './IlluminationTimeline';

describe('IlluminationTimeline Component', () => {
  it('renders timeline track slider with proper accessibility attributes', () => {
    const { getByRole, getByText } = render(<IlluminationTimeline />);

    const slider = getByRole('slider', { name: /Mission Illumination Timeline scrubber/i });
    expect(slider).toBeInTheDocument();
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
    expect(slider.getAttribute('aria-valuenow')).toBe('50');

    expect(getByText(/POWER \/ ILLUMINATION TIMELINE/i)).toBeInTheDocument();
    expect(getByText(/SUN ELEVATION:/i)).toBeInTheDocument();
  });

  it('renders all 5 shadow and sunlit segments with titles', () => {
    const { getByTitle } = render(<IlluminationTimeline />);

    expect(getByTitle('Sunlit Plateau')).toBeInTheDocument();
    expect(getByTitle('Low Grazing Angle')).toBeInTheDocument();
    expect(getByTitle('Deep Crater Shadow')).toBeInTheDocument();
    expect(getByTitle('High Solar Exposure')).toBeInTheDocument();
    expect(getByTitle('Cryogenic Shadow')).toBeInTheDocument();
  });

  it('handles keyboard navigation with arrow keys and home/end', () => {
    let scrubbedOffset: number | null = null;
    const { getByRole } = render(
      <IlluminationTimeline onScrubTime={(offset) => { scrubbedOffset = offset; }} />
    );

    const slider = getByRole('slider');
    slider.focus();

    // ArrowLeft decreases
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider.getAttribute('aria-valuenow')).toBe('48');
    expect(scrubbedOffset).toBe(-1);

    // ArrowRight increases
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
    expect(scrubbedOffset).toBe(0);

    // End goes to 100% (+24h)
    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider.getAttribute('aria-valuenow')).toBe('100');
    expect(scrubbedOffset).toBe(24);

    // Home goes to 0% (-24h)
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider.getAttribute('aria-valuenow')).toBe('0');
    expect(scrubbedOffset).toBe(-24);
  });
});
