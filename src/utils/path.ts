/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Format a coordinate: one decimal place, trailing '.0' stripped. */
function fmt(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

/**
 * Build an SVG path string through the given points.
 * - 0 points => ''
 * - 1 point  => 'M x,y'
 * - 2 points => 'M p0 L p1'
 * - >=3      => quadratic curves anchored at segment midpoints
 */
export function smoothThrough(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';

  const coords = points.map((p) => `${fmt(p.x)},${fmt(p.y)}`);

  if (points.length === 1) return `M ${coords[0]}`;
  if (points.length === 2) return `M ${coords[0]} L ${coords[1]}`;

  let d = `M ${coords[0]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cur = points[i];
    const next = points[i + 1];
    const midX = fmt((cur.x + next.x) / 2);
    const midY = fmt((cur.y + next.y) / 2);
    d += ` Q ${coords[i]} ${midX},${midY}`;
  }
  d += ` L ${coords[points.length - 1]}`;
  return d;
}
