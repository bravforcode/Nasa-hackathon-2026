/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, CheckCircle2, Plus } from 'lucide-react';
import { Modal, Button } from './ui';

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
  const coverageDelta = Math.round(coverageAfter - coverageBefore);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Design Assist · Constellation Optimizer</span>
        </div>
      }
      description="Algorithmic Topology & Dead-Zone Elimination"
      size="md"
      footer={
        <div className="w-full flex justify-between items-center">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Dismiss
          </Button>

          <Button
            variant={isMitigationActive ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={isMitigationActive ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            onClick={() => {
              onDeployMitigation();
              onClose();
            }}
            className={isMitigationActive ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : ''}
          >
            {isMitigationActive ? 'Apex Relay Deployed (Active)' : 'Deploy Shackleton Apex Relay'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-200 font-mono">
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
    </Modal>
  );
};
