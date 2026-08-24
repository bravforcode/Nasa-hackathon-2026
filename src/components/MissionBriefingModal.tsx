/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { RoutePlan, FailureScenarioType } from '../types';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono">
      <div className="bg-[#0e1321] border border-[#424753] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#424753] flex justify-between items-center bg-[#161b2a]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4C8DFF]" />
            <div>
              <h2 className="font-headline font-bold text-base text-white">
                NASA Flight Rule Operational Briefing
              </h2>
              <p className="text-xs text-[#8c909f]">
                DOCUMENT ID: JSC-EVA-2026-0824 · CONTINGENCY ROUTING
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-white px-2 py-1 text-xs">
            ESC
          </button>
        </div>

        {/* Briefing Printable Document Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#dee2f6] leading-relaxed bg-[#0a0d17]">
          {/* Header block */}
          <div className="border-b border-[#424753] pb-3 flex justify-between items-start">
            <div>
              <div className="text-[10px] text-[#8c909f] uppercase">ORIGINATOR</div>
              <div className="font-bold text-white">NASA ARTEMIS MISSION CONTROL / LUNAR RELAY OS</div>
              <div className="text-[11px] text-[#5de6ff]">VIPER EXCURSION SOUTH POLE SECTOR 4</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#8c909f] uppercase">STATUS</div>
              <span className="bg-[#00FF94]/15 border border-[#00FF94] text-[#00FF94] px-2 py-0.5 rounded font-bold text-[10px]">
                FLIGHT DIRECT APPROVED
              </span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-[#aec6ff] text-xs uppercase tracking-wider">
              1.0 MISSION STATE & INCIDENT ASSESSMENT
            </h3>
            <p className="text-[#c2c6d6]">
              Current Scenario: <strong className="text-white uppercase">{activeScenario.replace('_', ' ')}</strong>. 
              Surface constellation coverage stands at <strong className="text-[#00FF94]">{coveragePercent}%</strong>.
              {isMitigationActive ? ' Shackleton Apex mitigation relay is active and covering Dead Zone 2.' : ''}
            </p>
          </div>

          {/* Section 2: Selected Action Plan */}
          <div className="space-y-1.5 bg-[#161b2a] p-3.5 rounded border border-[#424753]">
            <h3 className="font-bold text-[#aec6ff] text-xs uppercase tracking-wider flex items-center justify-between">
              <span>2.0 SELECTED TRAJECTORY PLAN: {activePlan.name}</span>
              <span className="text-[#00FF94] font-bold">VIABILITY {activePlan.viabilityPercent}%</span>
            </h3>
            <p className="text-[#c2c6d6] text-[11px]">
              Estimated Traversal Time: <strong>{activePlan.travelTimeHours} hours</strong> | Power Margin upon Arrival: <strong className="text-[#00FF94]">{activePlan.batteryMarginPercent}%</strong> (Rule-14.2 requirement satisfied).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-[#8c909f]">
              <div className="bg-[#0e1321] p-1.5 rounded">COMMS: {activePlan.radarScores.communication}/10</div>
              <div className="bg-[#0e1321] p-1.5 rounded">SAFETY: {activePlan.radarScores.safety}/10</div>
              <div className="bg-[#0e1321] p-1.5 rounded">POWER: {activePlan.radarScores.power}/10</div>
              <div className="bg-[#0e1321] p-1.5 rounded">SCIENCE: {activePlan.radarScores.science}/10</div>
            </div>
          </div>

          {/* Section 3: Go/No-Go Checklist */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-[#aec6ff] text-xs uppercase tracking-wider">
              3.0 FLIGHT RULE GO / NO-GO CRITERIA
            </h3>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2 text-[#00FF94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rule-14.2: Final battery reserve {activePlan.batteryMarginPercent}% ≥ 20.0% [GO]</span>
              </div>
              <div className="flex items-center gap-2 text-[#00FF94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Max continuous RF loss {activePlan.coveragePercent >= 80 ? '< 3.0 min' : '< 5.0 min'} [GO]</span>
              </div>
              <div className="flex items-center gap-2 text-[#00FF94]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Slope maximum terrain gradient &lt; 14.8° within LOLA envelope [GO]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#161b2a] border-t border-[#424753] flex justify-between items-center">
          <span className="text-[10px] text-[#8c909f]">
            Generated via Lunar Relay OS Decisional Engine
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#0e1321] border border-[#424753] hover:border-white text-white text-xs rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Briefing</span>
            </button>
            <button
              onClick={onClose}
              className="bg-[#4C8DFF] hover:bg-[#3876e6] text-[#001a42] font-bold text-xs px-4 py-1.5 rounded transition-all cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
