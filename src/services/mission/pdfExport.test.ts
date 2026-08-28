/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'bun:test';
import { buildMissionPdfDocument, downloadMissionPdf } from './pdfExport';
import { buildFlightRulesMatrix, type MissionExportData } from './export';

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

describe('PDF Export Service — buildMissionPdfDocument', () => {
  it('returns a valid jsPDF document instance', () => {
    const doc = buildMissionPdfDocument(sampleMission);
    expect(doc).toBeDefined();
    expect(typeof doc.output).toBe('function');
    expect(typeof doc.save).toBe('function');
  });

  it('produces a non-empty data-uri output with valid PDF header', () => {
    const doc = buildMissionPdfDocument(sampleMission);
    const dataUri = doc.output('datauristring');
    expect(typeof dataUri).toBe('string');
    expect(dataUri.startsWith('data:application/pdf;filename=generated.pdf;base64,')).toBe(true);
    expect(dataUri.length).toBeGreaterThan(1000);
  });

  it('embeds flight rules and SHA-256 provenance in decoded PDF buffer', () => {
    const doc = buildMissionPdfDocument(sampleMission);
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.replace(/^data:application\/pdf[^,]+,/, '');
    const decoded = atob(base64);
    expect(decoded).toContain('LUNAR-SHA256-');
    expect(decoded).toContain('NASA ARTEMIS');
  });
});

describe('PDF Export Service — downloadMissionPdf', () => {
  it('executes download workflow without error', () => {
    expect(() => {
      downloadMissionPdf(sampleMission);
    }).not.toThrow();
  });
});
