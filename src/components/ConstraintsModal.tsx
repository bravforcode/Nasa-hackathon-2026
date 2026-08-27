/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Save } from 'lucide-react';
import { Modal, Button } from './ui';

interface ConstraintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConstraintsModal: React.FC<ConstraintsModalProps> = ({ isOpen, onClose }) => {
  const [minBatteryReserve, setMinBatteryReserve] = useState<number>(20);
  const [maxCommsOutageMin, setMaxCommsOutageMin] = useState<number>(5);
  const [maxSlopeGradient, setMaxSlopeGradient] = useState<number>(15);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          <span>NASA Operational Flight Rules &amp; Constraints</span>
        </div>
      }
      description="Hard constraints enforced on trajectory planning and failure recovery algorithms."
      size="md"
      footer={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          onClick={onClose}
        >
          Save &amp; Apply Flight Rules
        </Button>
      }
    >
      <div className="space-y-4 text-xs text-slate-200 font-mono">
        {/* Constraint 1: Flight Rule 14.2 Battery Reserve */}
        <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
          <div className="flex justify-between">
            <span className="text-[var(--color-accent-subtle)] font-bold">Rule-14.2 Minimum Battery Reserve</span>
            <span className="text-emerald-400 font-bold">≥ {minBatteryReserve}%</span>
          </div>
          <p className="text-3xs text-slate-400 font-sans">
            Mandatory uncompromised power upon arrival at habitat shelter airlock.
          </p>
          <input
            type="range"
            min="10"
            max="40"
            value={minBatteryReserve}
            onChange={(e) => setMinBatteryReserve(Number(e.target.value))}
            aria-label="Rule-14.2 Minimum Battery Reserve"
            className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />
        </div>

        {/* Constraint 2: Maximum Comms Outage */}
        <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
          <div className="flex justify-between">
            <span className="text-[var(--color-accent-subtle)] font-bold">Maximum Allowed Comms Outage</span>
            <span className="text-cyan-400 font-bold">≤ {maxCommsOutageMin} minutes</span>
          </div>
          <p className="text-3xs text-slate-400 font-sans">
            Exceeding threshold triggers immediate safe-haven hold or autonomous abort.
          </p>
          <input
            type="range"
            min="1"
            max="20"
            value={maxCommsOutageMin}
            onChange={(e) => setMaxCommsOutageMin(Number(e.target.value))}
            aria-label="Maximum Allowed Comms Outage"
            className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />
        </div>

        {/* Constraint 3: Max Slope Gradient */}
        <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10">
          <div className="flex justify-between">
            <span className="text-[var(--color-accent-subtle)] font-bold">Slope Traversability Cap</span>
            <span className="text-amber-400 font-bold">≤ {maxSlopeGradient}°</span>
          </div>
          <p className="text-3xs text-slate-400 font-sans">
            Prevents wheel slip and rollover hazard on steep crater rim scarps.
          </p>
          <input
            type="range"
            min="8"
            max="25"
            value={maxSlopeGradient}
            onChange={(e) => setMaxSlopeGradient(Number(e.target.value))}
            aria-label="Slope Traversability Cap"
            className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />
        </div>
      </div>
    </Modal>
  );
};
