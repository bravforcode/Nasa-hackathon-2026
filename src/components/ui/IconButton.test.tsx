import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton Primitive', () => {
  it('renders with required aria-label and title', () => {
    const { getByRole } = render(<IconButton icon={<span>🔍</span>} aria-label="Search" />);
    const btn = getByRole('button', { name: 'Search' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Search');
    expect(btn).toHaveClass('min-h-11'); // 44px
  });

  it('sets aria-pressed correctly when active is true', () => {
    const { getByRole } = render(<IconButton icon={<span>📡</span>} aria-label="Coverage Layer" active />);
    const btn = getByRole('button', { name: 'Coverage Layer' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveClass('text-blue-400');
  });

  it('fires onClick when clicked', () => {
    let clicked = false;
    const { getByRole } = render(<IconButton icon={<span>⚙</span>} aria-label="Settings" onClick={() => { clicked = true; }} />);
    fireEvent.click(getByRole('button', { name: 'Settings' }));
    expect(clicked).toBe(true);
  });
});
