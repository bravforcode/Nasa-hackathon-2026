/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach } from 'bun:test';
import { prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS, createGsapContext } from './motion';

describe('Motion Utilities', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should detect prefers-reduced-motion: reduce when true', () => {
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

    expect(prefersReducedMotion()).toBe(true);
  });

  it('should detect prefers-reduced-motion: reduce when false', () => {
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

    expect(prefersReducedMotion()).toBe(false);
  });

  it('should provide standard durations and easing constants', () => {
    expect(MOTION_DURATIONS.fast).toBe(0.15);
    expect(MOTION_DURATIONS.base).toBe(0.2);
    expect(MOTION_DURATIONS.slow).toBe(0.3);
    expect(MOTION_EASINGS.standard).toBeDefined();
  });

  it('should create and revert GSAP context without throwing', () => {
    let executed = false;
    const cleanup = createGsapContext(null, () => {
      executed = true;
    });

    expect(executed).toBe(true);
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});
