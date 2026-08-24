/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home, Zap, Shield, Radio, CheckCircle2, Save } from 'lucide-react';

interface HabitatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitatModal: React.FC<HabitatModalProps> = ({ isOpen, onClose }) => {
  const [habName, setHabName] = useState<string>('Artemis Outpost Alpha');
  const [habCoords, setHabCoords] = useState<string>('89.12°S 17.54°E');
  const [powerReserve, setPowerReserve] = useState<number>(84);
  const [lifeSupportStatus, setLifeSupportStatus] = useState<string>('NOMINAL (Cabin Press: 101.3 kPa)');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0e1321] border border-[#424753] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-mono">
        <div className="p-4 md:p-5 border-b border-[#424753] flex justify-between items-center bg-[#161b2a]">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#4C8DFF]" />
            <div>
              <h2 className="font-headline font-bold text-base text-white">
                Habitat & Base Camp Configuration
              </h2>
              <p className="text-xs text-[#8c909f]">
                Surface shelter, primary electrical power station, and DTE gateway.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8c909f] hover:text-white px-2 py-1 rounded text-xs"
          >
            ESC
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-[#dee2f6]">
          <div className="space-y-1">
            <label className="text-[#8c909f] uppercase tracking-wider text-[10px]">
              Habitat Outpost Designation
            </label>
            <input
              type="text"
              value={habName}
              onChange={(e) => setHabName(e.target.value)}
              className="w-full bg-[#161b2a] border border-[#424753] rounded px-3 py-2 text-white focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#8c909f] uppercase tracking-wider text-[10px]">
              Site Coordinates (Latitude / Longitude)
            </label>
            <input
              type="text"
              value={habCoords}
              onChange={(e) => setHabCoords(e.target.value)}
              className="w-full bg-[#161b2a] border border-[#424753] rounded px-3 py-2 text-[#aec6ff] focus:outline-none focus:border-[#4C8DFF]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[#8c909f] uppercase tracking-wider text-[10px]">
                Base Electrical Storage Buffer (EPS)
              </label>
              <span className="text-[#00FF94] font-bold">{powerReserve}% (Fission Surface Power)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={powerReserve}
              onChange={(e) => setPowerReserve(Number(e.target.value))}
              className="w-full accent-[#4C8DFF] h-1.5 bg-[#303444] rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 bg-[#161b2a] rounded border border-[#424753]/60 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#8c909f]">Life Support EPS:</span>
              <span className="text-[#00FF94] font-bold">NOMINAL (101.3 kPa)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#8c909f]">High-Gain Earth LOS:</span>
              <span className="text-[#5de6ff] font-bold">DIRECT (Elevation +1.8°)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#8c909f]">Emergency Air Lock Cycle:</span>
              <span className="text-white font-bold">READY (Bay 1 & 2)</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#161b2a] border-t border-[#424753] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#8c909f] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-[#4C8DFF] hover:bg-[#3876e6] text-[#001a42] font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
