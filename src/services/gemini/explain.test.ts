/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// suppress the module-resolution error for tsc while bun resolves it natively.
// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  buildExplanationPrompt,
  deterministicExplanation,
  fetchGeminiExplanation,
  GEMINI_MODEL,
  type ExplanationState,
} from './explain';

const state: ExplanationState = {
  regionName: 'Shackleton Crater & Connecting Ridge',
  illuminationPercent: 88,
  scenario: 'relay_failure',
  planName: 'Balanced (Alternate Link Bypass)',
  coveragePercent: 49.8,
  batteryMarginPercent: 32,
  viabilityPercent: 56,
  minSignalDbm: -94,
  relaysActive: 2,
  relaysTotal: 3,
  deadZonesCount: 2,
};

describe('buildExplanationPrompt', () => {
  test('embeds every live metric and forbids invented figures', () => {
    const p = buildExplanationPrompt(state);
    expect(p).toContain('Shackleton Crater & Connecting Ridge');
    expect(p).toContain('88%');
    expect(p).toContain('relay_failure');
    expect(p).toContain('49.8%');
    expect(p).toContain('32%');
    expect(p).toContain('56%');
    expect(p).toContain('-94 dBm');
    expect(p).toContain('2/3');
    expect(p).toContain('do not invent new figures');
  });
});

describe('deterministicExplanation', () => {
  test('derives text strictly from live state values', () => {
    const t = deterministicExplanation(state);
    expect(t).toContain('56%');
    expect(t).toContain('88%');
    expect(t).toContain('49.8%');
    expect(t).toContain('-94 dBm');
    expect(t).not.toContain('undefined');
    expect(t).not.toContain('NaN');
  });
});

describe('fetchGeminiExplanation', () => {
  test('uses injected generator on success (source=gemini)', async () => {
    const r = await fetchGeminiExplanation(state, async () => 'AI says: route is sound.');
    expect(r.source).toBe('gemini');
    expect(r.text).toBe('AI says: route is sound.');
  });

  test('falls back to deterministic explainer when generator throws', async () => {
    const r = await fetchGeminiExplanation(state, async () => {
      throw new Error('no key');
    });
    expect(r.source).toBe('fallback');
    expect(r.text).toContain('56%');
  });

  test('model id is the documented flash variant', () => {
    expect(GEMINI_MODEL).toBe('gemini-2.5-flash');
  });
});
