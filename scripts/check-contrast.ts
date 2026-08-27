/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Automated WCAG 2.1 Contrast Validator for Lunar Relay OS Design Tokens
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const srgb = val / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface ContrastCheck {
  theme: string;
  foregroundToken: string;
  foregroundHex: string;
  backgroundToken: string;
  backgroundHex: string;
  requiredRatio: number;
  type: 'normal-text' | 'large-text/ui';
}

export const checks: ContrastCheck[] = [
  // Dark theme checks
  { theme: 'dark', foregroundToken: '--color-text', foregroundHex: '#f1f5f9', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-text-muted', foregroundHex: '#94a3b8', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-text-faint', foregroundHex: '#94a3b8', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-accent-subtle', foregroundHex: '#60a5fa', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-destructive-subtle', foregroundHex: '#f87171', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-success-subtle', foregroundHex: '#34d399', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-warning-subtle', foregroundHex: '#fbbf24', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'dark', foregroundToken: '--color-map-safety', foregroundHex: '#00ff94', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'dark', foregroundToken: '--color-map-balanced', foregroundHex: '#4c8dff', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'dark', foregroundToken: '--color-map-science', foregroundHex: '#ffb800', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'dark', foregroundToken: '--color-map-danger', foregroundHex: '#ff4c4c', backgroundToken: '--color-bg', backgroundHex: '#05060a', requiredRatio: 3.0, type: 'large-text/ui' },

  // Light theme checks
  { theme: 'light', foregroundToken: '--color-text', foregroundHex: '#0f172a', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-text-muted', foregroundHex: '#475569', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-text-faint', foregroundHex: '#64748b', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-accent', foregroundHex: '#2563eb', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-accent-subtle', foregroundHex: '#1d4ed8', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-destructive', foregroundHex: '#dc2626', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-destructive-subtle', foregroundHex: '#b91c1c', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-success', foregroundHex: '#047857', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-success-subtle', foregroundHex: '#047857', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-warning', foregroundHex: '#b45309', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-warning-subtle', foregroundHex: '#92400e', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'light', foregroundToken: '--color-map-safety', foregroundHex: '#047857', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'light', foregroundToken: '--color-map-balanced', foregroundHex: '#1d4ed8', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'light', foregroundToken: '--color-map-science', foregroundHex: '#b45309', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'light', foregroundToken: '--color-map-danger', foregroundHex: '#dc2626', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'light', foregroundToken: '--color-map-cursor', foregroundHex: '#0284c7', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },
  { theme: 'light', foregroundToken: '--color-map-terrain-line', foregroundHex: '#64748b', backgroundToken: '--color-bg', backgroundHex: '#f8fafc', requiredRatio: 3.0, type: 'large-text/ui' },

  // High contrast theme checks
  { theme: 'hc', foregroundToken: '--color-text', foregroundHex: '#ffffff', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 7.0, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-text-muted', foregroundHex: '#d4d4d8', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 7.0, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-text-faint', foregroundHex: '#e4e4e7', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 7.0, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-accent', foregroundHex: '#66aaff', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-destructive', foregroundHex: '#ff6b6b', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-success', foregroundHex: '#33ffb0', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 4.5, type: 'normal-text' },
  { theme: 'hc', foregroundToken: '--color-warning', foregroundHex: '#ffcc33', backgroundToken: '--color-bg', backgroundHex: '#000000', requiredRatio: 4.5, type: 'normal-text' },
];

export function runContrastChecks(): { passed: number; total: number; failed: number } {
  let failed = 0;
  console.log('🔍 Running Automated WCAG 2.1 Contrast Checks...\n');

  for (const check of checks) {
    const ratio = contrastRatio(check.foregroundHex, check.backgroundHex);
    const pass = ratio >= check.requiredRatio;
    const status = pass ? '✓ PASS' : '✗ FAIL';
    const formattedRatio = ratio.toFixed(2) + ':1';
    
    if (!pass) failed++;
    
    console.log(
      `[${check.theme.toUpperCase()}] ${status} ${check.foregroundToken} (${check.foregroundHex}) on ${check.backgroundToken} (${check.backgroundHex}) = ${formattedRatio} (req: >= ${check.requiredRatio}:1)`
    );
  }

  console.log(`\nResults: ${checks.length - failed}/${checks.length} checks passed.`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} contrast check(s) failed WCAG criteria!`);
  } else {
    console.log('\n✅ All token contrast checks passed WCAG AA/AAA standards!');
  }

  return { passed: checks.length - failed, total: checks.length, failed };
}

if (import.meta.main) {
  const { failed } = runContrastChecks();
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
