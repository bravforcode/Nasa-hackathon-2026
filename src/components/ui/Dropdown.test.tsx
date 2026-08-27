/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect, mock } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { Dropdown } from './Dropdown';

function DropdownTestContainer({
  onSelectAction,
  onDeleteAction,
}: {
  onSelectAction?: () => void;
  onDeleteAction?: () => void;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        Actions Menu
      </Dropdown.Trigger>
      <Dropdown.Menu aria-label="Relay Options">
        <Dropdown.Label>Relay Controls</Dropdown.Label>
        <Dropdown.Item onClick={onSelectAction} shortcut="⌘S">
          Configure Sector
        </Dropdown.Item>
        <Dropdown.Item disabled shortcut="⌘P">
          Calibrate Power (Offline)
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item tone="destructive" onClick={onDeleteAction}>
          Emergency Shutdown
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

describe('Dropdown Primitive', () => {
  it('renders trigger button with aria-haspopup and aria-expanded="false"', () => {
    const { getByRole, queryByRole } = render(<DropdownTestContainer />);
    const trigger = getByRole('button', { name: /actions menu/i });

    expect(trigger).toBeInTheDocument();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(queryByRole('menu')).toBeNull();
  });

  it('opens menu with role="menu" and items with role="menuitem" on click', () => {
    const { getByRole, getAllByRole } = render(<DropdownTestContainer />);
    const trigger = getByRole('button', { name: /actions menu/i });

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu.style.zIndex).toBe('var(--z-dropdown, 50)');

    const items = getAllByRole('menuitem');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Configure Sector');
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(items[2].textContent).toContain('Emergency Shutdown');
  });

  it('triggers item onClick and closes menu on selection', () => {
    const handleSelect = mock();
    const { getByRole, getAllByRole, queryByRole } = render(
      <DropdownTestContainer onSelectAction={handleSelect} />
    );
    const trigger = getByRole('button', { name: /actions menu/i });

    fireEvent.click(trigger);
    const items = getAllByRole('menuitem');
    fireEvent.click(items[0]);

    expect(handleSelect).toHaveBeenCalled();
    expect(queryByRole('menu')).toBeNull();
  });

  it('does not trigger onClick for disabled item', () => {
    const handleSelect = mock();
    const { getByRole, getAllByRole, queryByRole } = render(
      <DropdownTestContainer onSelectAction={handleSelect} />
    );
    const trigger = getByRole('button', { name: /actions menu/i });

    fireEvent.click(trigger);
    const items = getAllByRole('menuitem');
    fireEvent.click(items[1]); // Disabled item

    expect(handleSelect).not.toHaveBeenCalled();
    expect(queryByRole('menu')).toBeInTheDocument();
  });

  it('supports keyboard navigation through menu items and Escape dismissal', () => {
    const { getByRole, getAllByRole, queryByRole } = render(<DropdownTestContainer />);
    const trigger = getByRole('button', { name: /actions menu/i });

    // Open via Enter
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();

    const items = getAllByRole('menuitem');
    expect(items.length).toBeGreaterThan(0);
    // ArrowDown navigation
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });

    // Escape closes menu and restores focus to trigger
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(queryByRole('menu')).toBeNull();
  });

  it('renders separator with role="separator"', () => {
    const { getByRole } = render(<DropdownTestContainer />);
    const trigger = getByRole('button', { name: /actions menu/i });

    fireEvent.click(trigger);
    const separator = getByRole('separator');
    expect(separator).toBeInTheDocument();
  });
});
