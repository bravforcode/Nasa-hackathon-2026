/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { NasaPollingManager, type NasaLiveState } from './polling';
import { globalNasaCache } from './cache';

describe('NasaPollingManager service', () => {
  let manager: NasaPollingManager;

  beforeEach(() => {
    globalNasaCache.clear();
    manager = new NasaPollingManager({
      donkiIntervalMs: 100,
      cmrIntervalMs: 200,
      maxBackoffMs: 500,
      autoStart: false,
    });
  });

  afterEach(() => {
    manager.destroy();
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

  it('triggers manual refreshNow without throwing', async () => {
    manager.start();
    await manager.refreshNow();
    const state = manager.getState();
    expect(state.isPolling).toBe(true);
  });
});
