/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { NavItem } from './NavItem';

describe('NavItem Primitive', () => {
  it('renders label, icon, and sets aria-current when active', () => {
    let clicked = false;
    const { getByRole, getByTestId } = render(
      <NavItem
        icon={<span data-testid="nav-icon">📍</span>}
        label="Region Select"
        active={true}
        onClick={() => { clicked = true; }}
      />
    );

    const btn = getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('aria-current')).toBe('page');
    expect(btn.textContent).toContain('Region Select');
    expect(getByTestId('nav-icon')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(clicked).toBe(true);
  });

  it('renders badge with correct status pill', () => {
    const { getByRole } = render(
      <NavItem
        icon={<span>📡</span>}
        label="Relay Network"
        badge={{ text: '95%', tone: 'success' }}
        onClick={() => {}}
      />
    );

    const badge = getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('95%');
  });

  it('satisfies WCAG touch target floor (min-h-11 = 44px)', () => {
    const { getByRole } = render(
      <NavItem
        icon={<span>⚙️</span>}
        label="Constraints"
        onClick={() => {}}
      />
    );

    const btn = getByRole('button');
    expect(btn).toHaveClass('min-h-11');
  });
});
