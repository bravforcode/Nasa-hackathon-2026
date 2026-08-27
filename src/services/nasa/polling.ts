/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchDonkiEvents, type DonkiFlare } from './donki';
import { fetchCmrCollections, type CmrResult } from './cmr';
import { globalNasaCache } from './cache';

export interface NasaPollingConfig {
  donkiIntervalMs?: number;
  cmrIntervalMs?: number;
  maxBackoffMs?: number;
  autoStart?: boolean;
}

export interface NasaLiveState {
  flares: DonkiFlare[];
  cmrData: CmrResult | null;
  lastUpdated: number | null;
  isPolling: boolean;
  error: Error | null;
  status: 'idle' | 'fetching' | 'success' | 'degraded' | 'error';
}

export type PollingListener = (state: NasaLiveState) => void;

const DEFAULT_DONKI_INTERVAL_MS = 45_000; // 45 seconds nominal
const DEFAULT_CMR_INTERVAL_MS = 180_000;  // 3 minutes nominal
const MAX_BACKOFF_MS = 300_000;            // 5 minutes max backoff

export class NasaPollingManager {
  private donkiIntervalMs: number;
  private cmrIntervalMs: number;
  private maxBackoffMs: number;
  private donkiTimer: ReturnType<typeof setTimeout> | null = null;
  private cmrTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<PollingListener>();
  private failureCount = 0;
  private isRunning = false;

  private state: NasaLiveState = {
    flares: [],
    cmrData: null,
    lastUpdated: null,
    isPolling: false,
    error: null,
    status: 'idle',
  };

  constructor(config?: NasaPollingConfig) {
    this.donkiIntervalMs = config?.donkiIntervalMs ?? DEFAULT_DONKI_INTERVAL_MS;
    this.cmrIntervalMs = config?.cmrIntervalMs ?? DEFAULT_CMR_INTERVAL_MS;
    this.maxBackoffMs = config?.maxBackoffMs ?? MAX_BACKOFF_MS;

    // Attach visibility change listener if in browser environment
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (config?.autoStart) {
      this.start();
    }
  }

  getState(): NasaLiveState {
    return { ...this.state };
  }

  subscribe(listener: PollingListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch {
        // Safe listener failure isolation
      }
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.state.isPolling = true;
    this.notify();

    // Fire immediate polls
    this.pollDonki();
    this.pollCmr();
  }

  stop(): void {
    this.isRunning = false;
    this.state.isPolling = false;
    if (this.donkiTimer) {
      clearTimeout(this.donkiTimer);
      this.donkiTimer = null;
    }
    if (this.cmrTimer) {
      clearTimeout(this.cmrTimer);
      this.cmrTimer = null;
    }
    this.notify();
  }

  async refreshNow(): Promise<void> {
    await Promise.allSettled([this.pollDonki(), this.pollCmr()]);
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      // Pause timers to conserve CPU / bandwidth
      if (this.donkiTimer) clearTimeout(this.donkiTimer);
      if (this.cmrTimer) clearTimeout(this.cmrTimer);
    } else if (this.isRunning) {
      // User returned to tab -> trigger immediate update and schedule next
      this.refreshNow();
    }
  };

  private async pollDonki(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const cacheKey = 'donki_flr_active';
      const { data } = await globalNasaCache.fetchWithCache<DonkiFlare[]>(
        cacheKey,
        async () => {
          const now = new Date();
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const start = past.toISOString().slice(0, 10);
          const end = now.toISOString().slice(0, 10);
          return (await fetchDonkiEvents('FLR', start, end)) as DonkiFlare[];
        },
        { ttlMs: this.donkiIntervalMs }
      );

      this.state.flares = Array.isArray(data) ? data : [];
      this.state.lastUpdated = Date.now();
      this.state.status = 'success';
      this.state.error = null;
      this.failureCount = 0;
    } catch (err) {
      this.failureCount++;
      this.state.error = err instanceof Error ? err : new Error(String(err));
      this.state.status = this.state.flares.length > 0 ? 'degraded' : 'error';
    } finally {
      this.notify();
      this.scheduleNextDonki();
    }
  }

  private async pollCmr(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const cacheKey = 'cmr_lola_collections';
      const { data } = await globalNasaCache.fetchWithCache<CmrResult>(
        cacheKey,
        async () => {
          return await fetchCmrCollections('LOLA', 5);
        },
        { ttlMs: this.cmrIntervalMs }
      );

      this.state.cmrData = data;
      this.state.lastUpdated = Date.now();
      if (this.state.status !== 'degraded' && this.state.status !== 'error') {
        this.state.status = 'success';
      }
    } catch (err) {
      if (!this.state.cmrData) {
        this.state.error = err instanceof Error ? err : new Error(String(err));
      }
    } finally {
      this.notify();
      this.scheduleNextCmr();
    }
  }

  private scheduleNextDonki(): void {
    if (!this.isRunning) return;
    // Exponential backoff if consecutive failures occurred
    const backoffMultiplier = Math.min(Math.pow(1.5, this.failureCount), 6);
    const interval = Math.min(this.donkiIntervalMs * backoffMultiplier, this.maxBackoffMs);
    this.donkiTimer = setTimeout(() => this.pollDonki(), interval);
  }

  private scheduleNextCmr(): void {
    if (!this.isRunning) return;
    this.cmrTimer = setTimeout(() => this.pollCmr(), this.cmrIntervalMs);
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

export const globalNasaPolling = new NasaPollingManager();
