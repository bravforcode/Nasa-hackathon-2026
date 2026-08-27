/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { NasaCache } from './cache';

describe('NasaCache service', () => {
  let cache: NasaCache;

  beforeEach(() => {
    cache = new NasaCache({ storage: null });
  });

  it('stores and retrieves cache entries within TTL', () => {
    cache.set('test_key', { flareCount: 3 }, 10_000);
    const result = cache.get<{ flareCount: number }>('test_key');
    expect(result).not.toBeNull();
    expect(result?.data.flareCount).toBe(3);
    expect(result?.isStale).toBe(false);
  });

  it('identifies expired items as isStale = true', async () => {
    cache.set('quick_key', 'quick_data', 10); // 10ms TTL
    await new Promise((r) => setTimeout(r, 25));

    const result = cache.get<string>('quick_key');
    expect(result).not.toBeNull();
    expect(result?.data).toBe('quick_data');
    expect(result?.isStale).toBe(true);
  });

  it('deletes and clears cache entries', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.delete('k1');
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')?.data).toBe('v2');

    cache.clear();
    expect(cache.get('k2')).toBeNull();
  });

  it('deduplicates concurrent in-flight requests', async () => {
    let callCount = 0;
    const slowFetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 30));
      return { val: 'result' };
    };

    const [r1, r2, r3] = await Promise.all([
      cache.fetchWithCache('concurrent_key', slowFetcher),
      cache.fetchWithCache('concurrent_key', slowFetcher),
      cache.fetchWithCache('concurrent_key', slowFetcher),
    ]);

    expect(callCount).toBe(1);
    expect(r1.data.val).toBe('result');
    expect(r2.data.val).toBe('result');
    expect(r3.data.val).toBe('result');
  });

  it('returns stale cache gracefully when fetcher throws error', async () => {
    cache.set('stale_key', 'safe_cached_data', 10);
    await new Promise((r) => setTimeout(r, 20));

    const failingFetcher = async () => {
      throw new Error('Network timeout');
    };

    const result = await cache.fetchWithCache('stale_key', failingFetcher);
    expect(result.data).toBe('safe_cached_data');
    expect(result.fromCache).toBe(true);
    expect(result.isStale).toBe(true);
  });
});
