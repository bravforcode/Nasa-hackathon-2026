/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Radio, CheckCircle2, X, Plus } from 'lucide-react';

interface DesignAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMitigationActive: boolean;
  onDeployMitigation: () => void;
  /** Computed coverage without the Apex relay (live geometry). */
  coverageBefore: number;
  /** Computed coverage with the Apex relay deployed (live geometry). */
  coverageAfter: number;
  deadZonesBefore: number;
  deadZonesAfter: number;
}

export const DesignAssistModal: React.FC<DesignAssistModalProps> = ({
  isOpen,
  onClose,
  isMitigationActive,
  onDeployMitigation,
  coverageBefore,
  coverageAfter,
  deadZonesBefore,
  deadZonesAfter,
}) => {
  if (!isOpen) return null;

  const coverageDelta = Math.round(coverageAfter - coverageBefore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150 font-mono">
      <div className="bg-[#02040a]/85 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-white">
                Design Assist · Constellation Optimizer
              </h2>
              <p className="text-xs text-slate-400">
                Algorithmic Topology & Dead-Zone Elimination
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-200">
          <div className="p-4 bg-white/5 rounded-2xl border border-blue-500/30 space-y-2.5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-300 text-sm">
                RECOMMENDED: Deploy Shackleton Apex Relay (R-04)
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                +{coverageDelta}% COVERAGE
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Placing an additional solar-powered relay node at the <strong className="text-white">Shackleton Crater High Rim (+3,840m)</strong> provides direct line-of-sight across the south polar ridge, completely eliminating <strong className="text-red-400">Dead Zone 2</strong> even during secondary node outages.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="space-y-2.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              ESTIMATED CONSTELLATION IMPACT:
            </div>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center bg-white/5 border border-white/5 p-2.5 rounded-xl backdrop-blur-md">
                <span className="text-slate-400">Network Coverage:</span>
                <span className="text-emerald-400 font-bold">{coverageBefore}% → {coverageAfter}% (+{coverageDelta}%)</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 border border-white/5 p-2.5 rounded-xl backdrop-blur-md">
                <span className="text-slate-400">Critical Dead Zones:</span>
                <span className="text-emerald-400 font-bold">{deadZonesBefore} Dead Zones → {deadZonesAfter} Dead Zones</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 border border-white/5 p-2.5 rounded-xl backdrop-blur-md">
                <span className="text-slate-400">Mission Continuity Risk:</span>
                <span className="text-emerald-400 font-bold uppercase">High Risk → Resilient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            onClick={() => {
              onDeployMitigation();
              onClose();
            }}
            className={`font-mono font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer backdrop-blur-md ${
              isMitigationActive
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400/30 shadow-blue-500/20'
            }`}
          >
            {isMitigationActive ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Apex Relay Deployed (Active)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Deploy Shackleton Apex Relay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
