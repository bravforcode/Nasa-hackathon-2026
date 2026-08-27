/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import {
  sha256,
  buildFlightRulesMatrix,
  generateProvenanceHash,
  exportMissionAsJson,
  exportMissionAsMarkdown,
  type MissionExportData,
} from './export';

describe('Mission Export & Flight Rules Service', () => {
  const sampleMission: MissionExportData = {
    missionId: 'LUNAR-ARTEMIS-VII-09',
    timestampUtc: '2026-08-27T12:00:00Z',
    siteName: 'Shackleton Crater Ridge',
    strategyName: 'Balanced Viability Plan',
    overallScore: 88,
    commLinkCoveragePct: 84.5,
    batteryReservePct: 42.0,
    etaHours: 3.2,
    spaceWeatherRisk: 'Class M1.2',
    relayCount: 3,
    flightRules: buildFlightRulesMatrix(84.5, 42.0, 'Class M1.2', 11.4),
  };

  it('computes exact FIPS 180-4 standard SHA-256 digests', () => {
    // NIST Standard Test Vectors for SHA-256
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('builds compliant and warning flight rule statuses correctly for comms, power, space weather, and slope', () => {
    const rules = buildFlightRulesMatrix(85.0, 45.0, 'Nominal', 9.5);
    expect(rules.length).toBe(4);
    expect(rules[0].status).toBe('COMPLIANT');
    expect(rules[1].status).toBe('COMPLIANT');
    expect(rules[2].status).toBe('COMPLIANT');
    expect(rules[3].status).toBe('COMPLIANT');

    const degradedRules = buildFlightRulesMatrix(68.0, 22.0, 'Class X1.4', 16.8);
    expect(degradedRules[0].status).toBe('WARNING');
    expect(degradedRules[1].status).toBe('WARNING');
    expect(degradedRules[2].status).toBe('NON_COMPLIANT');
    expect(degradedRules[3].status).toBe('NON_COMPLIANT');
  });

  it('generates deterministic 256-bit (64-hex char) provenance hashes', () => {
    const hash1 = generateProvenanceHash(sampleMission);
    const hash2 = generateProvenanceHash(sampleMission);
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('LUNAR-SHA256-')).toBe(true);
    // Prefix 'LUNAR-SHA256-' is 13 chars + 64 hex chars = 77 chars
    expect(hash1.length).toBe(77);
    const hexPart = hash1.replace('LUNAR-SHA256-', '');
    expect(/^[0-9A-F]{64}$/.test(hexPart)).toBe(true);
  });

  it('exports valid JSON with provenance hash included', () => {
    const jsonStr = exportMissionAsJson(sampleMission);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.missionId).toBe('LUNAR-ARTEMIS-VII-09');
    expect(parsed.provenanceHash).toBeTruthy();
    expect(parsed.flightRules.length).toBe(4);
  });

  it('exports structured Markdown with Flight Rules table', () => {
    const md = exportMissionAsMarkdown(sampleMission);
    expect(md).toContain('# NASA FLIGHT OPERATIONS MISSION BRIEFING');
    expect(md).toContain('LUNAR-ARTEMIS-VII-09');
    expect(md).toContain('NASA-FR-COM-001');
    expect(md).toContain('NASA-FR-PWR-004');
    expect(md).toContain('Contingency Action Plan');
  });
});
