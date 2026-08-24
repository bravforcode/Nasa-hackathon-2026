/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, ShieldCheck, AlertCircle, Save } from 'lucide-react';

interface ConstraintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConstraintsModal: React.FC<ConstraintsModalProps> = ({ isOpen, onClose }) => {
  const [minBatteryReserve, setMinBatteryReserve] = useState<number>(20);
  const [maxCommsOutageMin, setMaxCommsOutageMin] = useState<number>(5);
  const [maxSlopeGradient, setMaxSlopeGradient] = useState<number>(15);
  const [minThermalTemp, setMinThermalTemp] = useState<number>(60); // Kelvin

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono">
      <div className="bg-[#0e1321] border border-[#424753] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-[#424753] flex justify-between items-center bg-[#161b2a]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#4C8DFF]" />
            <div>
              <h2 className="font-headline font-bold text-base text-white">
                NASA Operational Flight Rules & Constraints
              </h2>
              <p className="text-xs text-[#8c909f]">
                Hard constraints enforced on trajectory planning and failure recovery algorithms.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-white px-2 py-1 text-xs">
            ESC
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-[#dee2f6]">
          {/* Constraint 1: Flight Rule 14.2 Battery Reserve */}
          <div className="space-y-1 bg-[#161b2a] p-3 rounded border border-[#424753]/60">
            <div className="flex justify-between">
              <span className="text-[#aec6ff] font-bold">Rule-14.2 Minimum Battery Reserve</span>
              <span className="text-[#00FF94] font-bold">≥ {minBatteryReserve}%</span>
            </div>
            <p className="text-[10px] text-[#8c909f]">
              Mandatory uncompromised power upon arrival at habitat shelter airlock.
            </p>
            <input
              type="range"
              min="10"
              max="40"
              value={minBatteryReserve}
              onChange={(e) => setMinBatteryReserve(Number(e.target.value))}
              className="w-full accent-[#4C8DFF] h-1.5 bg-[#303444] rounded-lg cursor-pointer mt-1"
            />
          </div>

          {/* Constraint 2: Maximum Comms Outage */}
          <div className="space-y-1 bg-[#161b2a] p-3 rounded border border-[#424753]/60">
            <div className="flex justify-between">
              <span className="text-[#aec6ff] font-bold">Maximum Allowed Comms Outage</span>
              <span className="text-[#5de6ff] font-bold">≤ {maxCommsOutageMin} minutes</span>
            </div>
            <p className="text-[10px] text-[#8c909f]">
              Exceeding threshold triggers immediate safe-haven hold or autonomous abort.
            </p>
            <input
              type="range"
              min="1"
              max="20"
              value={maxCommsOutageMin}
              onChange={(e) => setMaxCommsOutageMin(Number(e.target.value))}
              className="w-full accent-[#4C8DFF] h-1.5 bg-[#303444] rounded-lg cursor-pointer mt-1"
            />
          </div>

          {/* Constraint 3: Max Slope Gradient */}
          <div className="space-y-1 bg-[#161b2a] p-3 rounded border border-[#424753]/60">
            <div className="flex justify-between">
              <span className="text-[#aec6ff] font-bold">Slope Traversability Cap</span>
              <span className="text-[#FFB800] font-bold">≤ {maxSlopeGradient}°</span>
            </div>
            <p className="text-[10px] text-[#8c909f]">
              Prevents wheel slip and rollover hazard on steep crater rim scarps.
            </p>
            <input
              type="range"
              min="8"
              max="25"
              value={maxSlopeGradient}
              onChange={(e) => setMaxSlopeGradient(Number(e.target.value))}
              className="w-full accent-[#4C8DFF] h-1.5 bg-[#303444] rounded-lg cursor-pointer mt-1"
            />
          </div>
        </div>

        <div className="p-3 bg-[#161b2a] border-t border-[#424753] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-[#4C8DFF] hover:bg-[#3876e6] text-[#001a42] font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Flight Constraints</span>
          </button>
        </div>
      </div>
    </div>
  );
};
