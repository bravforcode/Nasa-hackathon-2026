/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FlaskConical, Clock } from 'lucide-react';
import { ScienceSite } from '../types';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono">
      <div className="bg-[#0e1321] border border-[#424753] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-[#424753] flex justify-between items-center bg-[#161b2a]">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#4C8DFF]" />
            <div>
              <h2 className="font-headline font-bold text-base text-white">
                Science Mission Objectives & Payload Tasks
              </h2>
              <p className="text-xs text-[#8c909f]">
                VIPER spectrometer samples, volatile assays, and core drilling targets.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-white px-2 py-1 text-xs">
            ESC
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {scienceSites.map((site) => (
            <div 
              key={site.id}
              onClick={() => onToggleSiteStatus(site.id)}
              className="p-3.5 rounded-lg bg-[#161b2a] border border-[#424753] hover:border-[#aec6ff] transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{site.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      site.priority === 'High' ? 'bg-[#FF4C4C]/15 text-[#FF4C4C] border border-[#FF4C4C]/40' : 'bg-[#5de6ff]/15 text-[#5de6ff] border border-[#5de6ff]/40'
                    }`}>
                      {site.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-[#8c909f] mt-1">
                    {site.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    site.status === 'completed' 
                      ? 'bg-[#00FF94]/15 text-[#00FF94] border border-[#00FF94]' 
                      : site.status === 'active'
                      ? 'bg-[#4C8DFF]/15 text-[#4C8DFF] border border-[#4C8DFF]'
                      : 'bg-[#303444] text-[#8c909f]'
                  }`}>
                    {site.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-[#aec6ff] pt-2 border-t border-[#424753]/50">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#5de6ff]" /> Est. Duration: {site.estDurationHours}h
                </span>
                <span className="text-[#00FF94] font-bold">
                  Yield: +{site.scienceYieldPercent}% Campaign Value
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#161b2a] border-t border-[#424753] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#4C8DFF] hover:bg-[#3876e6] text-[#001a42] font-bold text-xs px-4 py-1.5 rounded transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
