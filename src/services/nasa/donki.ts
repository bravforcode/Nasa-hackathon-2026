/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real REST client for NASA api.nasa.gov DONKI (Space Weather Database Of
 * Notifications, Knowledge, Information).
 *
 * Verified endpoint shape:
 *   GET https://api.nasa.gov/DONKI/FLR?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=DEMO_KEY
 * returns a JSON array (same for /CME and other event types).
 */

/** Base URL of the NASA DONKI REST API. */
export const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI';

/** Fallback public API key used when VITE_NASA_API_KEY is not configured. */
export const DEFAULT_NASA_API_KEY = 'DEMO_KEY';

/** AbortController timeout applied to every DONKI request, in ms. */
export const DONKI_TIMEOUT_MS = 10_000;

export type DonkiEventType = 'FLR' | 'CME' | 'SEP' | 'GST' | 'IPS' | 'HSS' | 'MPC' | 'RBE';

/** Solar flare event (partial typing — response objects vary). */
export interface DonkiFlare {
  flrID: string;
  beginTime?: string;
  peakTime?: string;
  endTime?: string;
  classType?: string;
  sourceLocation?: string;
  activeRegionNum?: number;
  link?: string;
}

/** Coronal mass ejection event (partial typing — response objects vary). */
export interface DonkiCme {
  activityID: string;
  startTime?: string;
  link?: string;
}

/**
 * Pure URL builder for a DONKI event query. Parameter values are
 * URL-encoded; api_key resolution happens elsewhere (resolveApiKey).
 */
export function buildDonkiUrl(
  eventType: DonkiEventType,
  startDate: string,
  endDate: string,
  apiKey: string
): string {
  const params = new URLSearchParams({
    startDate,
    endDate,
    api_key: apiKey,
  });
  return `${DONKI_BASE_URL}/${eventType}?${params.toString()}`;
}

/**
 * Resolve the NASA API key from Vite env (VITE_NASA_API_KEY), falling back to
 * the public DEMO_KEY. Cast keeps import.meta.env typing local to this module.
 */
export function resolveApiKey(): string {
  const env = (import.meta as any).env;
  return env?.VITE_NASA_API_KEY ?? DEFAULT_NASA_API_KEY;
}

/** Error thrown for any DONKI request failure (HTTP, network, timeout, bad JSON). */
export class DonkiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'DonkiError';
  }
}

/**
 * Fetch DONKI events of one type and return the parsed JSON array.
 *
 * - Applies a DONKI_TIMEOUT_MS AbortController timeout.
 * - Honors an optional external AbortSignal (composed with the timeout).
 * - Non-2xx responses throw DonkiError with the HTTP status.
 * - Network failures / timeouts throw DonkiError (status undefined).
 */
export async function fetchDonkiEvents<T>(
  eventType: DonkiEventType,
  startDate: string,
  endDate: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<T[]> {
  const url = buildDonkiUrl(eventType, startDate, endDate, apiKey ?? resolveApiKey());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DONKI_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (err) {
      throw new DonkiError(
        `Network error fetching DONKI ${eventType}: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err
      );
    }

    if (!res.ok) {
      throw new DonkiError(`DONKI ${eventType} request failed with HTTP ${res.status}`, res.status);
    }

    try {
      return (await res.json()) as T[];
    } catch (err) {
      throw new DonkiError(`Invalid JSON from DONKI ${eventType}`, res.status, err);
    }
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

/** Format a Date as a UTC calendar day string (ISO yyyy-mm-dd). */
export function utcDayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Inclusive UTC window of exactly `days` calendar days ending today:
 * endDate - startDate == days - 1. Days < 1 are clamped to 1.
 */
export function recentWindowDays(days: number): { startDate: string; endDate: string } {
  const n = Math.max(1, Math.floor(days));
  const end = new Date();
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - (n - 1))
  );
  return { startDate: utcDayString(start), endDate: utcDayString(end) };
}

/**
 * Convenience wrapper: recent flares + CMEs over the last `days` UTC days
 * (default 7). Both requests run in parallel; either failing rejects.
 */
export async function fetchRecentSpaceWeather(
  days: number = 7,
  apiKey?: string
): Promise<{ flares: DonkiFlare[]; cmes: DonkiCme[] }> {
  const { startDate, endDate } = recentWindowDays(days);
  const [flares, cmes] = await Promise.all([
    fetchDonkiEvents<DonkiFlare>('FLR', startDate, endDate, apiKey),
    fetchDonkiEvents<DonkiCme>('CME', startDate, endDate, apiKey),
  ]);
  return { flares, cmes };
}
