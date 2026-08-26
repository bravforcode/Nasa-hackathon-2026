import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Primitive', () => {
  it('renders children with default variant and size', () => {
    const { getByRole } = render(<Button>Click Me</Button>);
    const btn = getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('min-h-11'); // 44px min height for md
  });

  it('handles click events when enabled', () => {
    let clicked = false;
    const { getByRole } = render(<Button onClick={() => { clicked = true; }}>Submit</Button>);
    fireEvent.click(getByRole('button', { name: /submit/i }));
    expect(clicked).toBe(true);
  });

  it('disables interactions and renders loading spinner when loading is true', () => {
    let clicked = false;
    const { getByRole } = render(<Button loading onClick={() => { clicked = true; }}>Save</Button>);
    const btn = getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(btn);
    expect(clicked).toBe(false);
  });

  it('applies variant classes correctly', () => {
    const { getByRole, rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(getByRole('button', { name: /delete/i })).toHaveClass('bg-red-500/20');

    rerender(<Button variant="secondary">Cancel</Button>);
    expect(getByRole('button', { name: /cancel/i })).toHaveClass('bg-white/5');
  });

  it('renders icon-only with aria-label', () => {
    const { getByRole } = render(<Button aria-label="Settings" />);
    const btn = getByRole('button', { name: 'Settings' });
    expect(btn).toBeInTheDocument();
  });
});
