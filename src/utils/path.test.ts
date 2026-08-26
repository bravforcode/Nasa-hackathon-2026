/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, test } from 'bun:test';

import { smoothThrough } from './path';

describe('smoothThrough (trajectory path builder)', () => {
  test('two points => straight line', () => {
    const d = smoothThrough([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    expect(d).toBe('M 0,0 L 10,10');
  });

  test('three points => quadratic through midpoint technique', () => {
    const d = smoothThrough([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 10 },
    ]);
    // M P0; Q P1 mid(P1,P2); L P2
    expect(d).toBe('M 0,0 Q 10,0 15,5 L 20,10');
  });

  test('numbers are rounded to 1 decimal', () => {
    const d = smoothThrough([{ x: 0.12, y: 0 }, { x: 10.345, y: 9.999 }]);
    expect(d).toBe('M 0.1,0 L 10.3,10');
  });

  test('single point degenerates to move-only', () => {
    expect(smoothThrough([{ x: 5, y: 6 }])).toBe('M 5,6');
  });
});
