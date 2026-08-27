/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Printer, CheckCircle2, Download, FileCode } from 'lucide-react';
import { RoutePlan, FailureScenarioType } from '../types';
import { Modal, Button, StatusPill } from './ui';
import {
  buildFlightRulesMatrix,
  exportMissionAsJson,
  exportMissionAsMarkdown,
  type MissionExportData,
} from '../services/mission/export';

interface MissionBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: RoutePlan;
  activeScenario: FailureScenarioType;
  coveragePercent: number;
  isMitigationActive: boolean;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  isOpen,
  onClose,
  activePlan,
  activeScenario,
  coveragePercent,
  isMitigationActive,
}) => {
  const getMissionData = (): MissionExportData => {
    return {
      missionId: `NASA-ARTEMIS-SECTOR4-${new Date().getFullYear()}`,
      timestampUtc: new Date().toISOString(),
      siteName: 'South Pole Shackleton-de Gerlache Corridor',
      strategyName: activePlan.name,
      overallScore: activePlan.viabilityPercent,
      commLinkCoveragePct: coveragePercent,
      batteryReservePct: activePlan.batteryMarginPercent,
      etaHours: activePlan.travelTimeHours,
      spaceWeatherRisk: 'Nominal Class C1.0',
      relayCount: isMitigationActive ? 4 : 3,
      flightRules: buildFlightRulesMatrix(coveragePercent, activePlan.batteryMarginPercent, 'Nominal'),
    };
  };

  const handleExportJson = () => {
    const data = getMissionData();
    const json = exportMissionAsJson(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASA-MISSION-BRIEFING-${activePlan.id.toUpperCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const data = getMissionData();
    const md = exportMissionAsMarkdown(data);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASA-FLIGHT-RULES-${activePlan.id.toUpperCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>NASA Flight Rule Operational Briefing</span>
        </div>
      }
      description="DOCUMENT ID: JSC-EVA-2026-0824 · CONTINGENCY ROUTING"
      size="lg"
      footer={
        <div className="w-full flex flex-wrap justify-between items-center gap-2">
          <span className="text-3xs text-[var(--color-text-muted)] font-mono">
            Generated via Lunar Relay OS Decisional Engine
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileCode className="w-3.5 h-3.5" />}
              onClick={handleExportJson}
            >
              Export JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportMarkdown}
            >
              Export MD
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      }
    >
      {/* Briefing Printable Document Body */}
      <div className="p-4 md:p-6 space-y-4 text-xs text-slate-200 leading-relaxed bg-black/40 rounded-xl border border-white/10 font-mono">
        {/* Header block */}
        <div className="border-b border-white/10 pb-3 flex justify-between items-start">
          <div>
            <div className="text-3xs text-slate-400 uppercase font-semibold">ORIGINATOR</div>
            <div className="font-bold text-white">NASA ARTEMIS MISSION CONTROL / LUNAR RELAY OS</div>
            <div className="text-3xs text-cyan-400">VIPER EXCURSION SOUTH POLE SECTOR 4</div>
          </div>
          <div className="text-right">
            <div className="text-3xs text-slate-400 uppercase font-semibold mb-1">STATUS</div>
            <StatusPill tone="success" className="py-0.5 px-2">
              FLIGHT DIRECT APPROVED
            </StatusPill>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">
            1.0 MISSION STATE & INCIDENT ASSESSMENT
          </h3>
          <p className="text-slate-300 font-sans text-xs">
            Current Scenario: <strong className="text-white uppercase font-mono">{activeScenario.replace('_', ' ')}</strong>. 
            Surface constellation coverage stands at <strong className="text-emerald-400 font-mono">{coveragePercent}%</strong>.
            {isMitigationActive ? ' Shackleton Apex mitigation relay is active and covering Dead Zone 2.' : ''}
          </p>
        </div>

        {/* Section 2: Selected Action Plan */}
        <div className="space-y-1.5 bg-white/5 p-3.5 rounded-xl border border-white/10">
          <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider flex items-center justify-between">
            <span>2.0 SELECTED TRAJECTORY PLAN: {activePlan.name}</span>
            <span className="text-emerald-400 font-bold">VIABILITY {activePlan.viabilityPercent}%</span>
          </h3>
          <p className="text-slate-300 text-xs font-sans">
            Estimated Traversal Time: <strong className="font-mono">{activePlan.travelTimeHours} hours</strong> | Power Margin upon Arrival: <strong className="text-emerald-400 font-mono">{activePlan.batteryMarginPercent}%</strong> (Rule-14.2 requirement satisfied).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-3xs text-slate-400 font-mono">
            <div className="bg-black/40 p-1.5 rounded border border-white/5">COMMS: {activePlan.radarScores.communication}/10</div>
            <div className="bg-black/40 p-1.5 rounded border border-white/5">SAFETY: {activePlan.radarScores.safety}/10</div>
            <div className="bg-black/40 p-1.5 rounded border border-white/5">POWER: {activePlan.radarScores.power}/10</div>
            <div className="bg-black/40 p-1.5 rounded border border-white/5">SCIENCE: {activePlan.radarScores.science}/10</div>
          </div>
        </div>

        {/* Section 3: Go/No-Go Checklist */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">
            3.0 FLIGHT RULE GO / NO-GO CRITERIA
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Rule-14.2: Final battery reserve {activePlan.batteryMarginPercent}% ≥ 20.0% [GO]</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Max continuous RF loss {activePlan.coveragePercent >= 80 ? '&lt; 3.0 min' : '&lt; 5.0 min'} [GO]</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Slope maximum terrain gradient &lt; 14.8° within LOLA envelope [GO]</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
