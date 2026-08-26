/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  BatteryCharging,
  PowerOff,
  WifiOff,
  SunMedium,
  CheckCircle2
} from 'lucide-react';
import { FailureScenarioType } from '../types';

interface FailureScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: FailureScenarioType;
  onSelectScenario: (scenario: FailureScenarioType) => void;
}

export const FailureScenarioModal: React.FC<FailureScenarioModalProps> = ({
  isOpen,
  onClose,
  activeScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const scenarios: {
    id: FailureScenarioType;
    title: string;
    description: string;
    icon: React.ReactNode;
    severity: 'critical' | 'warning' | 'nominal';
  }[] = [
    {
      id: 'relay_failure',
      title: 'Relay Failure',
      description: 'Node Relay-B dropout in active constellation. Creates critical comms dead zone along current trajectory.',
      icon: <BatteryCharging className="w-6 h-6 text-[#FF4C4C]" />,
      severity: 'critical',
    },
    {
      id: 'power_loss',
      title: 'Power Loss',
      description: 'Critical electrical power system (EPS) failure at base camp. Restricts rover excursion energy budget.',
      icon: <PowerOff className="w-6 h-6 text-[#FFB800]" />,
      severity: 'warning',
    },
    {
      id: 'comms_blackout',
      title: 'Comms Blackout',
      description: 'Complete loss of Earth DSN direct-to-Earth uplink. Forces autonomous surface mesh routing.',
      icon: <WifiOff className="w-6 h-6 text-[#FFB800]" />,
      severity: 'warning',
    },
    {
      id: 'space_weather',
      title: 'Space Weather (SEP Event)',
      description: 'High-energy solar particle event detected by SDO & DONKI. Degrades Ka-band orbital crosslinks.',
      icon: <SunMedium className="w-6 h-6 text-[#FF4C4C]" />,
      severity: 'critical',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#02040a]/85 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div>
            <h2 className="font-headline font-bold text-lg text-white">
              Failure Scenarios & Stress Testing
            </h2>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              Select a mission stress test to simulate systemic impact on lunar operations.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2x2 Grid of Scenarios */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {scenarios.map((sc) => {
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl ${
                  isSelected
                    ? 'bg-red-500/15 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-400/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                )}
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                    {sc.icon}
                  </div>
                  {isSelected && (
                    <span className="font-mono text-[9px] font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 uppercase">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-white">
                    {sc.title}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-400 mt-1 leading-snug">
                    {sc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Reset to Nominal Ops Button */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nominal baseline restores all relay nodes & 91% coverage.</span>
          </div>

          <button
            onClick={() => {
              onSelectScenario('nominal');
              onClose();
            }}
            className={`font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
              activeScenario === 'nominal'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Reset Nominal Ops
          </button>
        </div>
      </div>
    </div>
  );
};
