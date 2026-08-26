/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// suppress the module-resolution error for tsc while bun resolves it natively.
// @ts-expect-error — no type declarations available for 'bun:test'
import { afterEach, describe, expect, test } from 'bun:test';

import {
  DONKI_BASE_URL,
  DEFAULT_NASA_API_KEY,
  DonkiError,
  buildDonkiUrl,
  fetchDonkiEvents,
  recentWindowDays,
  resolveApiKey,
  utcDayString,
} from './donki';

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('buildDonkiUrl', () => {
  test('builds a well-formed FLR query (asserted via URL API, order-independent)', () => {
    const url = new URL(buildDonkiUrl('FLR', '2026-08-20', '2026-08-26', 'DEMO_KEY'));
    const base = new URL(DONKI_BASE_URL);

    expect(url.origin).toBe(base.origin);
    expect(url.pathname).toBe(`${base.pathname}/FLR`);
    expect(url.searchParams.get('startDate')).toBe('2026-08-20');
    expect(url.searchParams.get('endDate')).toBe('2026-08-26');
    expect(url.searchParams.get('api_key')).toBe('DEMO_KEY');
    // Exactly the three expected params.
    expect(Array.from(url.searchParams.keys()).sort()).toEqual(['api_key', 'endDate', 'startDate']);
  });

  test('encodes special characters in parameter values', () => {
    const url = new URL(buildDonkiUrl('CME', '2026-01-01', '2026-01-02', 'k y&x=1'));
    expect(url.searchParams.get('api_key')).toBe('k y&x=1');
  });

  test('supports every DONKI event type in the path', () => {
    const basePathname = new URL(DONKI_BASE_URL).pathname;
    for (const eventType of ['FLR', 'CME', 'SEP', 'GST', 'IPS', 'HSS', 'MPC', 'RBE'] as const) {
      const url = new URL(buildDonkiUrl(eventType, '2026-01-01', '2026-01-02', 'k'));
      expect(url.pathname).toBe(`${basePathname}/${eventType}`);
    }
  });
});

describe('resolveApiKey', () => {
  test('falls back to DEMO_KEY when VITE_NASA_API_KEY is unset', () => {
    expect(resolveApiKey()).toBe(DEFAULT_NASA_API_KEY);
    expect(DEFAULT_NASA_API_KEY).toBe('DEMO_KEY');
  });
});

describe('utcDayString / recentWindowDays', () => {
  test('utcDayString formats as yyyy-mm-dd UTC', () => {
    expect(utcDayString(new Date(Date.UTC(2026, 7, 26, 23, 59, 59)))).toBe('2026-08-26');
    expect(utcDayString(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01');
  });

  test(
    'recentWindowDays returns an inclusive window of `days` calendar days: endDate - startDate == days - 1',
    () => {
      const { startDate, endDate } = recentWindowDays(7);
      expect(startDate).toMatch(ISO_DAY_RE);
      expect(endDate).toMatch(ISO_DAY_RE);

      const diffDays =
        (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000;
      expect(diffDays).toBe(6); // 7 inclusive days span 6 day-boundaries
    }
  );

  test('recentWindowDays clamps days < 1 to a single-day window', () => {
    const { startDate, endDate } = recentWindowDays(0);
    expect(startDate).toBe(endDate);
  });
});

describe('fetchDonkiEvents', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('non-2xx response throws DonkiError with the HTTP status', async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 500,
    })) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await fetchDonkiEvents('FLR', '2026-08-20', '2026-08-26', 'DEMO_KEY');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(DonkiError);
    const donkiErr = caught as DonkiError;
    expect(donkiErr.status).toBe(500);
    expect(donkiErr.message).toContain('500');
  });

  test('network failure throws DonkiError without a status', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('boom');
    }) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await fetchDonkiEvents('CME', '2026-08-20', '2026-08-26', 'DEMO_KEY');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(DonkiError);
    expect((caught as DonkiError).status).toBeUndefined();
  });

  test('success path returns the parsed JSON array', async () => {
    const payload = [
      { flrID: '2026-08-26T01:00:00-FLR-001', classType: 'M1.2' },
      { flrID: '2026-08-26T02:00:00-FLR-002', classType: 'C4.0' },
    ];
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    })) as unknown as typeof fetch;

    const result = await fetchDonkiEvents<{ flrID: string }>(
      'FLR',
      '2026-08-20',
      '2026-08-26',
      'DEMO_KEY'
    );
    expect(result).toEqual(payload);
    expect(result).toHaveLength(2);
  });

  test('requests the built DONKI URL with resolved api key', async () => {
    let requestedUrl = '';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return { ok: true, status: 200, json: async () => [] } as Response;
    }) as unknown as typeof fetch;

    await fetchDonkiEvents('SEP', '2026-08-20', '2026-08-26');

    const url = new URL(requestedUrl);
    expect(url.origin).toBe(new URL(DONKI_BASE_URL).origin);
    expect(url.pathname).toBe(`${new URL(DONKI_BASE_URL).pathname}/SEP`);
    expect(url.searchParams.get('api_key')).toBe('DEMO_KEY');
  });
});
