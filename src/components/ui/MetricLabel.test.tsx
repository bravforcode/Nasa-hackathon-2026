/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { MetricLabel } from './MetricLabel';

describe('MetricLabel Primitive', () => {
  it('renders semantic dl/dt/dd with label and value', () => {
    const { container } = render(
      <MetricLabel label="Operational Window" value="14:22:09 LST" valueTone="accent" />
    );
    const dt = container.querySelector('dt');
    const dd = container.querySelector('dd');

    expect(dt).not.toBeNull();
    expect(dt?.textContent).toBe('Operational Window');
    expect(dt?.className).toContain('text-[var(--color-text-muted)]');
    expect(dd).not.toBeNull();
    expect(dd?.textContent).toBe('14:22:09 LST');
    expect(dd?.className).toContain('text-[var(--color-accent-subtle)]');
  });

  it('applies right alignment when requested', () => {
    const { container } = render(
      <MetricLabel label="Data Provenance" value="LRO SYNCED" align="right" valueTone="success" />
    );
    const dl = container.querySelector('dl');
    const dd = container.querySelector('dd');

    expect(dl?.className).toContain('text-right');
    expect(dd?.className).toContain('text-[var(--color-success-subtle)]');
  });
});
