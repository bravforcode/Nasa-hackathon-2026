/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check whether the user has requested reduced motion at system/browser level.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Durations in seconds (for GSAP).
 */
export const MOTION_DURATIONS = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

/**
 * Standard cubic-bezier easings matching tokens.css.
 */
export const MOTION_EASINGS = {
  standard: 'power2.out',
  decelerate: 'power1.out',
  accelerate: 'power1.in',
} as const;

/**
 * Helper to run GSAP animations in a component scope and automatically
 * revert / clean up upon component unmount to prevent memory leaks.
 */
export function createGsapContext(
  scope: HTMLElement | SVGElement | null | undefined,
  callback: (ctx: gsap.Context) => void
): () => void {
  const ctx = gsap.context(callback, scope || undefined);
  return () => ctx.revert();
}
