import { describe, expect, it } from 'bun:test';
import { contrastRatio, checks } from './check-contrast';

describe('WCAG Automated Contrast Suite', () => {
  it('calculates accurate relative luminance and contrast ratio', () => {
    // Pure black on pure white is 21:1
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21.0, 1);
    // Same color has contrast ratio of 1:1
    expect(contrastRatio('#05060a', '#05060a')).toBeCloseTo(1.0, 1);
  });

  it('validates that ALL registered tokens (Dark, Light, HC) pass their required WCAG thresholds', () => {
    const failures: string[] = [];

    for (const check of checks) {
      const ratio = contrastRatio(check.foregroundHex, check.backgroundHex);
      if (ratio < check.requiredRatio) {
        failures.push(
          `[${check.theme.toUpperCase()}] ${check.foregroundToken} (${check.foregroundHex}) on ${check.backgroundToken} (${check.backgroundHex}) ratio ${ratio.toFixed(2)}:1 < required ${check.requiredRatio}:1`
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it('ensures all light theme tokens meet WCAG AA standards (>= 4.5:1 text, >= 3.0:1 UI/maps)', () => {
    const lightChecks = checks.filter((c) => c.theme === 'light');
    expect(lightChecks.length).toBeGreaterThanOrEqual(15);

    for (const check of lightChecks) {
      const ratio = contrastRatio(check.foregroundHex, check.backgroundHex);
      expect(ratio).toBeGreaterThanOrEqual(check.requiredRatio);
    }
  });
});
