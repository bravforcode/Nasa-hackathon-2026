import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card Primitive', () => {
  it('renders with glass-panel and rounded-2xl by default', () => {
    const { getByTestId } = render(<Card data-testid="test-card">Content</Card>);
    const el = getByTestId('test-card');
    expect(el).toHaveClass('glass-panel');
    expect(el).toHaveClass('rounded-2xl');
    expect(el).toHaveTextContent('Content');
  });

  it('supports polymorphic as="section"', () => {
    const { getByRole } = render(<Card as="section" aria-label="telemetry-panel">Data</Card>);
    const el = getByRole('region', { name: 'telemetry-panel' });
    expect(el.tagName).toBe('SECTION');
  });

  it('applies modal variant and custom padding', () => {
    const { getByTestId } = render(<Card variant="modal" padding="lg" data-testid="modal-card">Modal Content</Card>);
    const el = getByTestId('modal-card');
    expect(el).toHaveClass('glass-modal');
    expect(el).toHaveClass('p-6');
  });
});
