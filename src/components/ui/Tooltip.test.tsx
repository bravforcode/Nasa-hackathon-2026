/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { render, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip Primitive', () => {
  it('renders child button without showing tooltip initially', () => {
    const { getByRole, queryByRole } = render(
      <Tooltip content="NASA Data Provenance" delayMs={0}>
        <button type="button">Trigger</button>
      </Tooltip>
    );

    expect(getByRole('button').textContent).toBe('Trigger');
    expect(queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on focus and hides on blur', async () => {
    const { getByRole, queryByRole } = render(
      <Tooltip content="NASA Data Provenance" delayMs={0}>
        <button type="button">Trigger</button>
      </Tooltip>
    );

    const btn = getByRole('button');

    act(() => {
      fireEvent.focus(btn);
    });

    const tooltip = getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.textContent).toContain('NASA Data Provenance');
    expect(btn.getAttribute('aria-describedby')).toBe(tooltip.id);

    act(() => {
      fireEvent.blur(btn);
    });

    expect(queryByRole('tooltip')).toBeNull();
  });

  it('dismisses tooltip when Escape is pressed (WCAG 1.4.13)', () => {
    const { getByRole, queryByRole } = render(
      <Tooltip content="NASA Data Provenance" delayMs={0}>
        <button type="button">Trigger</button>
      </Tooltip>
    );

    const btn = getByRole('button');

    act(() => {
      fireEvent.focus(btn);
    });

    expect(getByRole('tooltip')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(queryByRole('tooltip')).toBeNull();
  });
});
