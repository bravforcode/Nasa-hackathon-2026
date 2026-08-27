/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { NasaPollingManager, type NasaLiveState } from './polling';
import { globalNasaCache } from './cache';

describe('NasaPollingManager service', () => {
  let manager: NasaPollingManager;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalNasaCache.clear();

    // Hermetic fetch mock
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('DONKI')) {
        return new Response(
          JSON.stringify([
            {
              flrID: '2026-08-27T10:00:00-FLR-001',
              classType: 'M1.2',
              beginTime: '2026-08-27T10:00Z',
              peakTime: '2026-08-27T10:15Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('cmr.earthdata.nasa.gov')) {
        return new Response(
          JSON.stringify({
            hits: 5,
            feed: {
              entry: [{ title: 'LOLA Lunar Digital Elevation Model 30m' }],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({}), { status: 200 });
    }) as typeof globalThis.fetch;

    manager = new NasaPollingManager({
      donkiIntervalMs: 100,
      cmrIntervalMs: 200,
      maxBackoffMs: 500,
      autoStart: false,
    });
  });

  afterEach(() => {
    manager.destroy();
    globalThis.fetch = originalFetch;
  });

  it('initializes with idle state', () => {
    const state = manager.getState();
    expect(state.isPolling).toBe(false);
    expect(state.status).toBe('idle');
    expect(state.flares).toEqual([]);
    expect(state.cmrData).toBeNull();
  });

  it('notifies subscribers upon registration and state changes', () => {
    const receivedStates: NasaLiveState[] = [];
    const unsubscribe = manager.subscribe((s) => {
      receivedStates.push(s);
    });

    expect(receivedStates.length).toBe(1);
    expect(receivedStates[0].status).toBe('idle');

    manager.start();
    expect(receivedStates.length).toBeGreaterThanOrEqual(2);
    expect(receivedStates[receivedStates.length - 1].isPolling).toBe(true);

    manager.stop();
    expect(receivedStates[receivedStates.length - 1].isPolling).toBe(false);

    unsubscribe();
  });

  it('updates live state with mocked DONKI and CMR payloads on refreshNow', async () => {
    manager.start();
    await manager.refreshNow();
    const state = manager.getState();
    expect(state.isPolling).toBe(true);
    expect(state.flares.length).toBe(1);
    expect(state.flares[0].classType).toBe('M1.2');
    expect(state.cmrData).not.toBeNull();
    expect(state.cmrData?.hits).toBe(5);
    expect(state.status).toBe('success');
  });

  it('handles simulated fetch errors with degraded or error status', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Simulated Network Offline');
    }) as typeof globalThis.fetch;

    const errorManager = new NasaPollingManager({
      donkiIntervalMs: 50,
      cmrIntervalMs: 50,
      autoStart: false,
    });

    errorManager.start();
    await errorManager.refreshNow();
    const state = errorManager.getState();
    expect(state.error).not.toBeNull();
    expect(state.status).toBe('error');
    errorManager.destroy();
  });
});
