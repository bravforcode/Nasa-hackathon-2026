/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill Primitive', () => {
  it('renders children with default accent tone', () => {
    const { container } = render(<StatusPill>SCENARIO ACTIVE</StatusPill>);
    const el = container.querySelector('span');
    expect(el).toBeInTheDocument();
    expect(el?.textContent).toContain('SCENARIO ACTIVE');
    expect(el?.className).toContain('text-[var(--color-accent-subtle)]');
    // Static pills should NOT have role="status" unless isLive is true
    expect(el?.getAttribute('role')).toBeNull();
  });

  it('renders role="status" when isLive is true', () => {
    const { getByRole } = render(<StatusPill isLive={true}>TELEMETRY LIVE</StatusPill>);
    const el = getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain('TELEMETRY LIVE');
  });

  it('applies destructive tone styling correctly', () => {
    const { container } = render(<StatusPill tone="destructive">OFFLINE</StatusPill>);
    const el = container.querySelector('span');
    expect(el?.className).toContain('text-[var(--color-destructive-subtle)]');
    expect(el?.className).toContain('border-[var(--color-destructive-subtle)]/30');
  });

  it('renders pulse dot when pulse=true', () => {
    const { getByTestId } = render(<StatusPill tone="warning" pulse>WARNING STATE</StatusPill>);
    const dot = getByTestId('status-pill-dot');
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain('animate-pulse');
    expect(dot.className).toContain('bg-[var(--color-warning-subtle)]');
  });

  it('renders icon when provided', () => {
    const { getByTestId } = render(
      <StatusPill icon={<span data-testid="test-icon">⚡</span>}>
        POWER HIGH
      </StatusPill>
    );
    expect(getByTestId('test-icon')).toBeInTheDocument();
  });
});
