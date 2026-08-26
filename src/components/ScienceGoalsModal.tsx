/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FlaskConical, Clock } from 'lucide-react';
import { ScienceSite } from '../types';
import { Modal, Button } from './ui';

interface ScienceGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scienceSites: ScienceSite[];
  onToggleSiteStatus: (siteId: string) => void;
}

export const ScienceGoalsModal: React.FC<ScienceGoalsModalProps> = ({
  isOpen,
  onClose,
  scienceSites,
  onToggleSiteStatus,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-blue-400" />
          <span>Science Mission Objectives & Payload Tasks</span>
        </div>
      }
      description="VIPER spectrometer samples, volatile assays, and core drilling targets."
      size="md"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-3 font-mono">
        {scienceSites.map((site) => (
          <button
            key={site.id}
            onClick={() => onToggleSiteStatus(site.id)}
            className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 transition-all cursor-pointer flex flex-col justify-between gap-2 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <div className="flex justify-between items-start w-full">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{site.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    site.priority === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/40' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {site.priority} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {site.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  site.status === 'completed' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' 
                    : site.status === 'active'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/40'
                    : 'bg-white/10 text-slate-400'
                }`}>
                  {site.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-blue-300 pt-2 border-t border-white/10 w-full">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Est. Duration: {site.estDurationHours}h
              </span>
              <span className="text-emerald-400 font-bold">
                Yield: +{site.scienceYieldPercent}% Campaign Value
              </span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};
