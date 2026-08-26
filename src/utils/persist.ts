/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Typed, validated persistence for the mission layout (review fix C1).
 * A malformed or schema-drifted payload must NEVER reach component state —
 * parseSavedState returns null and callers fall back to defaults.
 */

import type { DeadZone, FailureScenarioType, RelayNode } from '../types';

export const STORAGE_KEY = 'lunar-relay-os-v1';
const SCENARIO_VALUES: FailureScenarioType[] = [
  'nominal',
  'relay_failure',
  'power_loss',
  'comms_blackout',
  'space_weather',
];

export interface SavedState {
  version: 1;
  relays: RelayNode[];
  deadZones: DeadZone[];
  regionId: string;
  scenario: FailureScenarioType;
}

const isFiniteNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function isValidRelay(r: unknown): r is RelayNode {
  if (typeof r !== 'object' || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.code === 'string' &&
    isFiniteNum(x.lat) &&
    isFiniteNum(x.lon) &&
    isFiniteNum(x.elevKm) &&
    typeof x.type === 'string' &&
    typeof x.status === 'string' &&
    isFiniteNum(x.coverageRadiusKm) &&
    typeof x.frequencyBand === 'string' &&
    isFiniteNum(x.healthPercent)
  );
}

function isValidDeadZone(d: unknown): d is DeadZone {
  if (typeof d !== 'object' || d === null) return false;
  const x = d as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.code === 'string' &&
    isFiniteNum(x.xPercent) &&
    isFiniteNum(x.yPercent) &&
    isFiniteNum(x.radiusKm) &&
    typeof x.reason === 'string' &&
    typeof x.severity === 'string'
  );
}

/** Parse raw localStorage text into a validated SavedState, or null. */
export function parseSavedState(raw: string | null): SavedState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const p = parsed as Record<string, unknown>;

  if (p.version !== 1) return null; // schema drift => discard, use defaults
  if (!Array.isArray(p.relays) || !p.relays.every(isValidRelay)) return null;
  if (!Array.isArray(p.deadZones) || !p.deadZones.every(isValidDeadZone)) return null;
  if (typeof p.regionId !== 'string') return null;
  if (typeof p.scenario !== 'string' || !SCENARIO_VALUES.includes(p.scenario as FailureScenarioType)) {
    return null;
  }

  return {
    version: 1,
    relays: p.relays as RelayNode[],
    deadZones: p.deadZones as DeadZone[],
    regionId: p.regionId,
    scenario: p.scenario as FailureScenarioType,
  };
}

export function loadSavedState(): SavedState | null {
  try {
    return parseSavedState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null; // storage unavailable (private mode etc.)
  }
}

export function serializeState(state: SavedState): string {
  return JSON.stringify({ ...state, version: 1 });
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    /* quota/private mode — session-only fallback */
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
