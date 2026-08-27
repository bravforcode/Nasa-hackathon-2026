/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import {
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
    flightRules: buildFlightRulesMatrix(84.5, 42.0, 'Class M1.2'),
  };

  it('builds compliant and warning flight rule statuses correctly', () => {
    const rules = buildFlightRulesMatrix(85.0, 45.0, 'Nominal');
    expect(rules.length).toBe(4);
    expect(rules[0].status).toBe('COMPLIANT');
    expect(rules[1].status).toBe('COMPLIANT');

    const degradedRules = buildFlightRulesMatrix(68.0, 22.0, 'Class X1.4');
    expect(degradedRules[0].status).toBe('WARNING');
    expect(degradedRules[1].status).toBe('WARNING');
    expect(degradedRules[2].status).toBe('NON_COMPLIANT');
  });

  it('generates deterministic provenance hashes', () => {
    const hash1 = generateProvenanceHash(sampleMission);
    const hash2 = generateProvenanceHash(sampleMission);
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('LUNAR-SHA256-')).toBe(true);
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
