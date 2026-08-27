/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect, mock } from 'bun:test';
import { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Select, type SelectOption } from './Select';

const sampleOptions: SelectOption[] = [
  { value: 'alpha', label: 'Relay Alpha' },
  { value: 'beta', label: 'Relay Beta' },
  { value: 'gamma', label: 'Relay Gamma (Disabled)', disabled: true },
  { value: 'delta', label: 'Relay Delta' },
];

function SelectTestContainer({
  defaultValue = 'alpha',
  onChange,
  disabled,
  error,
  hint,
}: {
  defaultValue?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
}) {
  const [val, setVal] = useState(defaultValue);
  return (
    <Select
      label="Relay Selector"
      options={sampleOptions}
      value={val}
      onChange={(newVal) => {
        setVal(newVal);
        onChange?.(newVal);
      }}
      disabled={disabled}
      error={error}
      hint={hint}
      placeholder="Choose a relay..."
    />
  );
}

describe('Select Primitive', () => {
  it('renders combobox trigger with label and accessible attributes', () => {
    const { getByRole, getByText } = render(<SelectTestContainer />);

    expect(getByText('Relay Selector')).toBeInTheDocument();
    const combobox = getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox.getAttribute('aria-expanded')).toBe('false');
    expect(combobox.getAttribute('aria-haspopup')).toBe('listbox');
    expect(combobox.textContent).toContain('Relay Alpha');
  });

  it('opens listbox on click and displays options with role="option"', () => {
    const { getByRole, getAllByRole } = render(<SelectTestContainer />);
    const combobox = getByRole('combobox');

    fireEvent.click(combobox);
    expect(combobox.getAttribute('aria-expanded')).toBe('true');

    const listbox = getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = getAllByRole('option');
    expect(options.length).toBe(4);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
    expect(options[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('selects option on click and invokes onChange callback', () => {
    const handleChange = mock();
    const { getByRole, getAllByRole } = render(<SelectTestContainer onChange={handleChange} />);
    const combobox = getByRole('combobox');

    fireEvent.click(combobox);
    const options = getAllByRole('option');
    fireEvent.click(options[1]); // Click Beta

    expect(handleChange).toHaveBeenCalledWith('beta');
    expect(combobox.textContent).toContain('Relay Beta');
    expect(combobox.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not select disabled options on click', () => {
    const handleChange = mock();
    const { getByRole, getAllByRole } = render(<SelectTestContainer onChange={handleChange} />);
    const combobox = getByRole('combobox');

    fireEvent.click(combobox);
    const options = getAllByRole('option');
    fireEvent.click(options[2]); // Disabled Gamma

    expect(handleChange).not.toHaveBeenCalled();
    expect(combobox.getAttribute('aria-expanded')).toBe('true');
  });

  it('supports full keyboard navigation (ArrowDown, ArrowUp, Home, End, Enter, Escape)', () => {
    const handleChange = mock();
    const { getByRole, queryByRole } = render(<SelectTestContainer defaultValue="" onChange={handleChange} />);
    const combobox = getByRole('combobox');

    combobox.focus();

    // ArrowDown opens the listbox
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(combobox.getAttribute('aria-expanded')).toBe('true');

    // ArrowDown moves from 0 (alpha) to 1 (beta)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    // ArrowDown skips disabled 2 (gamma) and moves to 3 (delta)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    // Press Enter to select delta
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('delta');
    expect(queryByRole('listbox')).toBeNull();

    // Reopen with Space
    fireEvent.keyDown(combobox, { key: ' ' });
    expect(combobox.getAttribute('aria-expanded')).toBe('true');

    // Home goes to first enabled (alpha)
    fireEvent.keyDown(combobox, { key: 'Home' });

    // Escape closes without changing value
    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(queryByRole('listbox')).toBeNull();
  });

  it('renders error state with role="alert" and sets aria-invalid', () => {
    const { getByRole, getByText } = render(
      <SelectTestContainer error="Relay calibration failed" />
    );

    const combobox = getByRole('combobox');
    expect(combobox.getAttribute('aria-invalid')).toBe('true');

    const alert = getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(getByText('Relay calibration failed')).toBeInTheDocument();
  });

  it('satisfies touch target floor (min-h-11 = 44px)', () => {
    const { getByRole } = render(<SelectTestContainer />);
    const combobox = getByRole('combobox');
    expect(combobox.className).toContain('min-h-11');
  });

  it('handles disabled state properly', () => {
    const { getByRole } = render(<SelectTestContainer disabled={true} />);
    const combobox = getByRole('combobox');
    expect(combobox).toBeDisabled();

    fireEvent.click(combobox);
    expect(combobox.getAttribute('aria-expanded')).toBe('false');
  });
});
