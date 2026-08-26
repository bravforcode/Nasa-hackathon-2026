/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * NASA Earthdata CMR (Common Metadata Repository) collection search client.
 * Public, unauthenticated, CORS-enabled. Verified live 2026-08-26:
 * GET https://cmr.earthdata.nasa.gov/search/collections.json?keyword=LOLA&page_size=3
 * → { hits: number, feed: { entry: [{ title: string, ... }] } }
 * Docs: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html
 */

export const CMR_SEARCH_URL = 'https://cmr.earthdata.nasa.gov/search/collections.json';

export interface CmrResult {
  hits: number;
  titles: string[];
}

export class CmrError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'CmrError';
  }
}

/** Pure URL builder (unit-testable). */
export function buildCmrUrl(keyword: string, pageSize: number): string {
  const url = new URL(CMR_SEARCH_URL);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('page_size', String(Math.max(1, Math.min(2000, pageSize))));
  return url.toString();
}

/**
 * Fetch collection titles matching a free-text keyword.
 * 10s timeout; non-2xx or malformed body → CmrError.
 */
export async function fetchCmrCollections(
  keyword: string,
  pageSize?: number,
  apiKey?: string,
  signal?: AbortSignal
): Promise<CmrResult> {
  const size = pageSize ?? 5;
  const url = buildCmrUrl(keyword, size);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  // Chain caller signal so early disposal cancels immediately.
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new CmrError(`CMR request failed with status ${res.status}`, res.status);
    const body = (await res.json()) as {
      hits?: number;
      feed?: { entry?: { title?: string }[] };
    };
    const entries = body.feed?.entry ?? [];
    return {
      hits: typeof body.hits === 'number' ? body.hits : entries.length,
      titles: entries.map((e) => (typeof e.title === 'string' ? e.title : '')).filter(Boolean),
    };
  } catch (err) {
    if (err instanceof CmrError) throw err;
    throw new CmrError(err instanceof Error ? err.message : 'CMR network failure', undefined);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
