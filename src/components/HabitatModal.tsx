/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home, Save } from 'lucide-react';
import { Modal, Button, Input } from './ui';

interface HabitatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitatModal: React.FC<HabitatModalProps> = ({ isOpen, onClose }) => {
  const [habName, setHabName] = useState<string>('Artemis Outpost Alpha');
  const [habCoords, setHabCoords] = useState<string>('89.12°S 17.54°E');
  const [powerReserve, setPowerReserve] = useState<number>(84);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-400" />
          <span>Habitat &amp; Base Camp Configuration</span>
        </div>
      }
      description="Surface shelter, primary electrical power station, and DTE gateway."
      size="md"
      footer={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          onClick={onClose}
        >
          Save &amp; Apply Configuration
        </Button>
      }
    >
      <div className="space-y-4 text-xs text-slate-200 font-mono">
        <Input
          label="HABITAT OUTPOST DESIGNATION"
          value={habName}
          onChange={(e) => setHabName(e.target.value)}
        />

        <Input
          label="SITE COORDINATES (LATITUDE / LONGITUDE)"
          value={habCoords}
          onChange={(e) => setHabCoords(e.target.value)}
        />

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 uppercase tracking-wider text-3xs">
              Base Electrical Storage Buffer (EPS)
            </span>
            <span className="text-emerald-400 font-bold">{powerReserve}% (Fission Surface Power)</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={powerReserve}
            onChange={(e) => setPowerReserve(Number(e.target.value))}
            aria-label="Base Electrical Storage Buffer"
            className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />
        </div>

        <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-3xs">
            <span className="text-slate-400">Life Support EPS:</span>
            <span className="text-emerald-400 font-bold">NOMINAL (101.3 kPa)</span>
          </div>
          <div className="flex justify-between items-center text-3xs">
            <span className="text-slate-400">High-Gain Earth LOS:</span>
            <span className="text-cyan-400 font-bold">DIRECT (Elevation +1.8°)</span>
          </div>
          <div className="flex justify-between items-center text-3xs">
            <span className="text-slate-400">Emergency Air Lock Cycle:</span>
            <span className="text-white font-bold">READY (Bay 1 &amp; 2)</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
