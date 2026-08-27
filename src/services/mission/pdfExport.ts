/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type MissionExportData, generateProvenanceHash } from './export';

export interface MissionPdfDocDefinition {
  title: string;
  missionId: string;
  siteName: string;
  strategyName: string;
  provenanceHash: string;
  flightRulesTable: {
    headers: string[];
    rows: Array<[string, string, string, string, string]>;
  };
}

export function generateMissionPdfDocDefinition(data: MissionExportData): MissionPdfDocDefinition {
  const hash = generateProvenanceHash(data);
  const rows = data.flightRules.map((r) => [
    r.id,
    r.category,
    r.threshold,
    r.actualValue,
    r.status,
  ] as [string, string, string, string, string]);

  return {
    title: 'NASA ARTEMIS MISSION OPERATIONS BRIEFING // FLIGHT DIRECTIVE',
    missionId: data.missionId,
    siteName: data.siteName,
    strategyName: data.strategyName,
    provenanceHash: hash,
    flightRulesTable: {
      headers: ['Rule ID', 'Category', 'Threshold', 'Actual Telemetry', 'Compliance'],
      rows,
    },
  };
}

/**
 * Builds a publication-ready NASA Flight Directive PDF document.
 */
export function buildMissionPdfDocument(data: MissionExportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hash = generateProvenanceHash(data);

  // Top Header Banner
  doc.setFillColor(11, 29, 58); // NASA Navy
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('NASA ARTEMIS MISSION OPERATIONS // LUNAR RELAY OS', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 170, 255);
  doc.text('SOUTH POLE SECTOR 4 CONTINUITY DIRECTIVE · FLIGHT DIRECT APPROVED', 14, 18);

  doc.setFontSize(7);
  doc.setTextColor(200, 210, 230);
  doc.text(`DATE (UTC): ${data.timestampUtc}`, 145, 11);
  doc.text(`MISSION ID: ${data.missionId}`, 145, 18);

  // Classification Sub-bar
  doc.setFillColor(235, 240, 250);
  doc.rect(0, 26, 210, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(60, 80, 110);
  doc.text('SECURITY: UNCLASSIFIED // PUBLIC RELEASE PER NASA SPACE ACT AGREEMENT', 14, 30.5);

  // Section 1: Executive Mission Parameters
  let currentY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 29, 58);
  doc.text('1.0 EXECUTIVE MISSION PARAMETERS', 14, currentY);

  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(0.3);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Site: ${data.siteName}`, 18, currentY + 7);
  doc.text(`Selected Strategy: ${data.strategyName}`, 18, currentY + 14);
  doc.text(`Overall Viability Score: ${data.overallScore}%`, 18, currentY + 21);

  doc.text(`Continuous RF Coverage: ${data.commLinkCoveragePct.toFixed(1)}%`, 110, currentY + 7);
  doc.text(`Battery SoC at Habitat: ${data.batteryReservePct.toFixed(1)}%`, 110, currentY + 14);
  doc.text(`Space Weather Alert Level: ${data.spaceWeatherRisk}`, 110, currentY + 21);

  // Section 2: NASA Flight Rules Matrix Table
  currentY += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 29, 58);
  doc.text('2.0 NASA FLIGHT RULES COMPLIANCE MATRIX', 14, currentY);
  doc.line(14, currentY + 2, 196, currentY + 2);

  const tableRows = data.flightRules.map((r) => [
    r.id,
    r.category,
    r.threshold,
    r.actualValue,
    r.status,
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Rule ID', 'Category', 'Threshold', 'Actual Telemetry', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 29, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 48 },
      3: { cellWidth: 46 },
      4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 4) {
        const val = dataCell.cell.raw as string;
        if (val === 'COMPLIANT') {
          dataCell.cell.styles.textColor = [4, 120, 87];
        } else if (val === 'WARNING') {
          dataCell.cell.styles.textColor = [180, 83, 9];
        } else {
          dataCell.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  // Section 3: Provenance & Cryptographic Audit Verification
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 29, 58);
  doc.text('3.0 CRYPTOGRAPHIC PROVENANCE & AUDIT TRAIL', 14, finalY);
  doc.line(14, finalY + 2, 196, finalY + 2);

  doc.setFillColor(245, 247, 250);
  doc.rect(14, finalY + 5, 182, 16, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SHA-256 PROVENANCE HASH:', 18, finalY + 11);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.text(hash, 18, finalY + 16);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 165);
  doc.text('LUNAR RELAY OS · FLIGHT DISPATCH VERIFIED · PAGE 1 OF 1', 14, 285);
  doc.text('NASA SPACE APPS HACKATHON 2026', 150, 285);

  return doc;
}

/**
 * Downloads the NASA Flight Operations PDF in the browser.
 */
export function downloadMissionPdf(data: MissionExportData): void {
  const doc = buildMissionPdfDocument(data);
  doc.save(`NASA-FLIGHT-DIRECTIVE-${data.missionId}.pdf`);
}
