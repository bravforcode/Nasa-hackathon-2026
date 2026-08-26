/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// suppress the module-resolution error for tsc while bun resolves it natively.
// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import { buildCmrUrl, fetchCmrCollections, CMR_SEARCH_URL, CmrError } from './cmr';

describe('buildCmrUrl', () => {
  test('produces correct endpoint and params', () => {
    const url = new URL(buildCmrUrl('LOLA', 5));
    expect(url.origin + url.pathname).toBe(CMR_SEARCH_URL);
    expect(url.searchParams.get('keyword')).toBe('LOLA');
    expect(url.searchParams.get('page_size')).toBe('5');
  });

  test('clamps page size into [1, 2000]', () => {
    expect(new URL(buildCmrUrl('x', 0)).searchParams.get('page_size')).toBe('1');
    expect(new URL(buildCmrUrl('x', -5)).searchParams.get('page_size')).toBe('1');
    expect(new URL(buildCmrUrl('x', 9999)).searchParams.get('page_size')).toBe('2000');
  });

  test('encodes keyword safely', () => {
    const url = new URL(buildCmrUrl('LRO LOLA illumination', 3));
    expect(url.searchParams.get('keyword')).toBe('LRO LOLA illumination');
  });
});

describe('fetchCmrCollections', () => {
  const originalFetch = globalThis.fetch;

  test('parses hits + titles from a well-formed body', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ hits: 42, feed: { entry: [{ title: 'A' }, { title: 'B' }] } }), {
        status: 200,
      })) as typeof fetch;
    try {
      const r = await fetchCmrCollections('LOLA', 2);
      expect(r.hits).toBe(42);
      expect(r.titles).toEqual(['A', 'B']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('non-2xx → CmrError with status', async () => {
    globalThis.fetch = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    try {
      let caught: unknown;
      await fetchCmrCollections('LOLA').catch((e) => (caught = e));
      expect(caught).toBeInstanceOf(CmrError);
      expect((caught as CmrError).status).toBe(500);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('network failure → CmrError without status', async () => {
    globalThis.fetch = (async () => {
      throw new Error('boom');
    }) as typeof fetch;
    try {
      let caught: unknown;
      await fetchCmrCollections('LOLA').catch((e) => (caught = e));
      expect(caught).toBeInstanceOf(CmrError);
      expect((caught as CmrError).status).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('malformed body still returns empty result (defensive)', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ unexpected: true }), { status: 200 })) as typeof fetch;
    try {
      const r = await fetchCmrCollections('LOLA');
      expect(r.titles).toEqual([]);
      expect(r.hits).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
