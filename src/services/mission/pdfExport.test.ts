/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import { generateMissionPdfDocDefinition } from './pdfExport';
import { buildFlightRulesMatrix, type MissionExportData } from './export';

describe('PDF Export Service', () => {
  const sampleMission: MissionExportData = {
    missionId: 'NASA-VIPER-SECTOR4-2026',
    timestampUtc: '2026-08-28T00:00:00Z',
    siteName: 'Shackleton Crater High Ridge',
    strategyName: 'Balanced Viability Plan',
    overallScore: 88,
    commLinkCoveragePct: 85.0,
    batteryReservePct: 40.0,
    etaHours: 3.5,
    spaceWeatherRisk: 'Class M1.2',
    relayCount: 3,
    flightRules: buildFlightRulesMatrix(85.0, 40.0, 'Class M1.2', 11.4),
  };

  it('builds structured document layout with NASA compliance tables', () => {
    const docDef = generateMissionPdfDocDefinition(sampleMission);
    expect(docDef.title).toContain('NASA ARTEMIS MISSION OPERATIONS BRIEFING');
    expect(docDef.flightRulesTable.rows.length).toBe(4);
    expect(docDef.provenanceHash).toContain('LUNAR-SHA256-');
    expect(docDef.siteName).toBe('Shackleton Crater High Ridge');
  });
});
