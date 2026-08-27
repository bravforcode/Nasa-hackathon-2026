/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';
import { LUNAR_REGIONS } from '../data/lunarData';
import { LunarRegion } from '../types';
import { Modal, Button } from './ui';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-400" />
          <span>Lunar South Pole Region Select</span>
        </div>
      }
      description="LOLA 5m/10m DEM datasets with high-relief topography & volatile cold traps."
      size="lg"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Confirm Target Region
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
        {LUNAR_REGIONS.map((region) => {
          const isSelected = selectedRegion.id === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => {
                onSelectRegion(region);
                onClose();
              }}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                isSelected
                  ? 'bg-blue-500/15 border-2 border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-3xs text-cyan-400 uppercase font-bold">
                    {region.code}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h3 className="font-headline font-bold text-sm text-white">
                  {region.name}
                </h3>
                <p className="font-mono text-3xs text-slate-400 mt-1 leading-snug">
                  {region.terrainType}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-3xs font-mono text-blue-300">
                <span>Avg Sun: {region.illuminationAvg}%</span>
                <span>{region.psrCount} Cold Traps</span>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
