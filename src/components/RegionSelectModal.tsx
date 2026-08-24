/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, CheckCircle2, Mountain, Sun, Sparkles } from 'lucide-react';
import { LUNAR_REGIONS } from '../data/lunarData';
import { LunarRegion } from '../types';

interface RegionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: LunarRegion;
  onSelectRegion: (region: LunarRegion) => void;
}

export const RegionSelectModal: React.FC<RegionSelectModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  onSelectRegion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0e1321] border border-[#424753] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-[#424753] flex justify-between items-center bg-[#161b2a]">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#4C8DFF]" />
            <div>
              <h2 className="font-headline font-bold text-lg text-white">
                Lunar South Pole Region Select
              </h2>
              <p className="font-mono text-xs text-[#8c909f]">
                LOLA 5m/10m DEM datasets with high-relief topography & volatile cold traps.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8c909f] hover:text-white px-2 py-1 rounded font-mono text-xs"
          >
            ESC
          </button>
        </div>

        <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {LUNAR_REGIONS.map((region) => {
            const isSelected = selectedRegion.id === region.id;
            return (
              <div
                key={region.id}
                onClick={() => {
                  onSelectRegion(region);
                  onClose();
                }}
                className={`p-4 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a1f2e] border-2 border-[#4C8DFF] shadow-[0_0_15px_rgba(76,141,255,0.2)]'
                    : 'bg-[#161b2a] border-[#424753] hover:border-[#aec6ff] hover:bg-[#1a1f2e]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono text-[10px] text-[#5de6ff] uppercase font-bold">
                      {region.code}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#00FF94]" />
                    )}
                  </div>
                  <h3 className="font-headline font-bold text-sm text-white">
                    {region.name}
                  </h3>
                  <p className="font-mono text-[11px] text-[#8c909f] mt-1 leading-snug">
                    {region.terrainType}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#424753]/50 flex justify-between items-center text-[10px] font-mono text-[#aec6ff]">
                  <span>Avg Sun: {region.illuminationAvg}%</span>
                  <span>{region.psrCount} Cold Traps</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-[#161b2a] border-t border-[#424753] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#4C8DFF] hover:bg-[#3876e6] text-[#001a42] font-mono font-bold text-xs px-4 py-1.5 rounded transition-all cursor-pointer"
          >
            Confirm Target Region
          </button>
        </div>
      </div>
    </div>
  );
};
