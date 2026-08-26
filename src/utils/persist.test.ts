/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  parseSavedState,
  serializeState,
  STORAGE_KEY,
  type SavedState,
} from './persist';
import { INITIAL_DEAD_ZONES, INITIAL_RELAYS } from '../data/lunarData';

const validState: SavedState = {
  version: 1,
  relays: INITIAL_RELAYS,
  deadZones: INITIAL_DEAD_ZONES,
  regionId: 'shackleton',
  scenario: 'relay_failure',
};

describe('parseSavedState (C1: unsafe restore guard)', () => {
  test('accepts a well-formed v1 payload', () => {
    const raw = JSON.stringify(validState);
    const out = parseSavedState(raw);
    expect(out).not.toBeNull();
    expect(out?.regionId).toBe('shackleton');
    expect(out?.relays.length).toBe(INITIAL_RELAYS.length);
  });

  test('rejects invalid JSON', () => {
    expect(parseSavedState('{oops')).toBeNull();
  });

  test('rejects wrong/missing version (schema drift)', () => {
    expect(parseSavedState(JSON.stringify({ ...validState, version: 99 }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ relays: [] }))).toBeNull();
  });

  test('rejects non-array or malformed relays', () => {
    expect(parseSavedState(JSON.stringify({ ...validState, relays: 'oops' }))).toBeNull();
    const broken = {
      ...validState,
      relays: [{ ...INITIAL_RELAYS[0], lat: 'NaN-ish' }],
    };
    expect(parseSavedState(JSON.stringify(broken))).toBeNull();
  });

  test('rejects relay missing finite lat/lon/coverageRadiusKm', () => {
    for (const field of ['lat', 'lon', 'coverageRadiusKm'] as const) {
      const broken = {
        ...validState,
        relays: [{ ...INITIAL_RELAYS[0], [field]: Number.NaN }],
      };
      expect(parseSavedState(JSON.stringify(broken))).toBeNull();
    }
  });

  test('rejects malformed dead zones', () => {
    const broken = {
      ...validState,
      deadZones: [{ ...INITIAL_DEAD_ZONES[0], xPercent: undefined }],
    };
    expect(parseSavedState(JSON.stringify(broken))).toBeNull();
  });

  test('rejects unknown scenario string', () => {
    expect(parseSavedState(JSON.stringify({ ...validState, scenario: 'alien_invasion' }))).toBeNull();
  });

  test('null/empty raw input => null', () => {
    expect(parseSavedState('')).toBeNull();
    expect(parseSavedState('null')).toBeNull();
  });
});

describe('serializeState', () => {
  test('embeds version:1 and round-trips through parseSavedState', () => {
    const raw = serializeState(validState);
    expect(JSON.parse(raw).version).toBe(1);
    const back = parseSavedState(raw);
    expect(back?.scenario).toBe('relay_failure');
    expect(back?.relays[0].id).toBe(INITIAL_RELAYS[0].id);
  });

  test('exposes the storage key constant', () => {
    expect(STORAGE_KEY).toBe('lunar-relay-os-v1');
  });
});
