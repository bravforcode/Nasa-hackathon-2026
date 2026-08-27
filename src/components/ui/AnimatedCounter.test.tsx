/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../../test/setup';
import { describe, it, expect, afterEach } from 'bun:test';
import { render } from '@testing-library/react';
import { AnimatedCounter } from './AnimatedCounter';

describe('AnimatedCounter Primitive', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders initial value and suffix immediately under reduced motion', () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;

    const { getByText } = render(<AnimatedCounter value={87} suffix="%" />);
    expect(getByText('87%')).toBeInTheDocument();
  });

  it('renders numeric value without crashing when normal motion is active', () => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;

    const { getByText } = render(<AnimatedCounter value={95} suffix="%" duration={0.1} />);
    expect(getByText(/95%/)).toBeInTheDocument();
  });
});
