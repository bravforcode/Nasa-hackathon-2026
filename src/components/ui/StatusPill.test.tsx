/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill Primitive', () => {
  it('renders children with default accent tone and status role', () => {
    const { getByRole } = render(<StatusPill>SCENARIO ACTIVE</StatusPill>);
    const el = getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain('SCENARIO ACTIVE');
    expect(el.className).toContain('text-blue-400');
  });

  it('applies destructive tone styling correctly', () => {
    const { getByRole } = render(<StatusPill tone="destructive">OFFLINE</StatusPill>);
    const el = getByRole('status');
    expect(el.className).toContain('text-red-400');
    expect(el.className).toContain('bg-red-500/15');
  });

  it('renders pulse dot when pulse=true', () => {
    const { getByTestId } = render(<StatusPill tone="warning" pulse>WARNING STATE</StatusPill>);
    const dot = getByTestId('status-pill-dot');
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain('animate-pulse');
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
