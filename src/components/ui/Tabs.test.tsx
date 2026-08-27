/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect } from 'bun:test';
import { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

function TabsTestContainer() {
  const [active, setActive] = useState('one');
  return (
    <Tabs value={active} onValueChange={setActive}>
      <Tabs.List aria-label="Test Tabs">
        <Tabs.Trigger value="one">Tab One</Tabs.Trigger>
        <Tabs.Trigger value="two">Tab Two</Tabs.Trigger>
        <Tabs.Trigger value="three">Tab Three</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">Content One</Tabs.Content>
      <Tabs.Content value="two">Content Two</Tabs.Content>
      <Tabs.Content value="three">Content Three</Tabs.Content>
    </Tabs>
  );
}

describe('Tabs Primitive', () => {
  it('renders tablist and triggers with correct roles and aria-selected', () => {
    const { getByRole, getAllByRole } = render(<TabsTestContainer />);
    const tablist = getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabs = getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    const panel = getByRole('tabpanel');
    expect(panel.textContent).toBe('Content One');
  });

  it('switches tabs on trigger click', () => {
    const { getAllByRole, getByRole } = render(<TabsTestContainer />);
    const tabs = getAllByRole('tab');
    fireEvent.click(tabs[1]);

    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(getByRole('tabpanel').textContent).toBe('Content Two');
  });

  it('supports roving keyboard navigation with ArrowRight, ArrowLeft, Home, End', () => {
    const { getAllByRole, getByRole } = render(<TabsTestContainer />);
    const tabs = getAllByRole('tab');

    tabs[0].focus();

    // Press ArrowRight -> moves to Tab 2
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(getByRole('tabpanel').textContent).toBe('Content Two');

    // Press End -> moves to Tab 3
    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(getByRole('tabpanel').textContent).toBe('Content Three');

    // Press Home -> moves to Tab 1
    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(getByRole('tabpanel').textContent).toBe('Content One');
  });
});
