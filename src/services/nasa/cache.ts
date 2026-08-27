/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface CacheOptions {
  ttlMs?: number;
  storage?: Storage | null;
  storagePrefix?: string;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_PREFIX = 'nasa_cache_';

export class NasaCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private storage: Storage | null;
  private prefix: string;

  constructor(opts?: CacheOptions) {
    this.storage = opts?.storage !== undefined ? opts.storage : (typeof window !== 'undefined' ? window.sessionStorage : null);
    this.prefix = opts?.storagePrefix ?? STORAGE_PREFIX;
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (memEntry) {
      const isStale = now - memEntry.timestamp > memEntry.ttlMs;
      return { data: memEntry.data, isStale };
    }

    if (this.storage) {
      try {
        const raw = this.storage.getItem(this.prefix + key);
        if (raw) {
          const entry = JSON.parse(raw) as CacheEntry<T>;
          this.memoryCache.set(key, entry as CacheEntry<unknown>);
          const isStale = now - entry.timestamp > entry.ttlMs;
          return { data: entry.data, isStale };
        }
      } catch {
        // Storage access error fallback
      }
    }

    return null;
  }

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    this.memoryCache.set(key, entry as CacheEntry<unknown>);

    if (this.storage) {
      try {
        this.storage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch {
        // Storage quota / security policy fallback
      }
    }
  }

  delete(key: string): void {
    this.memoryCache.delete(key);
    if (this.storage) {
      try {
        this.storage.removeItem(this.prefix + key);
      } catch {
        // Ignore storage error
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    this.inFlightRequests.clear();
    if (this.storage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const k = this.storage.key(i);
          if (k?.startsWith(this.prefix)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          this.storage.removeItem(k);
        }
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Stale-While-Revalidate fetch wrapper:
   * 1. Returns cached item immediately if available.
   * 2. If no cache, awaits the fetcher.
   * 3. If cached item is stale or on demand, triggers background refresh and dedupes in-flight requests.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    opts?: { ttlMs?: number; forceRefresh?: boolean }
  ): Promise<{ data: T; fromCache: boolean; isStale: boolean }> {
    const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS;
    const cached = this.get<T>(key);

    if (cached && !opts?.forceRefresh) {
      if (cached.isStale) {
        // Trigger background revalidation (deduped)
        this.revalidateInBackground(key, fetcher, ttl);
      }
      return { data: cached.data, fromCache: true, isStale: cached.isStale };
    }

    // Check if identical request is in flight
    let inFlight = this.inFlightRequests.get(key) as Promise<T> | undefined;
    if (!inFlight) {
      inFlight = (async () => {
        try {
          const fresh = await fetcher();
          this.set(key, fresh, ttl);
          return fresh;
        } finally {
          this.inFlightRequests.delete(key);
        }
      })();
      this.inFlightRequests.set(key, inFlight as Promise<unknown>);
    }

    try {
      const data = await inFlight;
      return { data, fromCache: false, isStale: false };
    } catch (err) {
      // If network fails but we had stale cached data, gracefully return it
      if (cached) {
        return { data: cached.data, fromCache: true, isStale: true };
      }
      throw err;
    }
  }

  private revalidateInBackground<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): void {
    if (this.inFlightRequests.has(key)) return;

    const promise = (async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh, ttlMs);
      } catch {
        // Background revalidation silently preserves cached copy
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
  }
}

export const globalNasaCache = new NasaCache();
