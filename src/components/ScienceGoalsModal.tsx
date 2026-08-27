/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FlaskConical, Clock } from 'lucide-react';
import { ScienceSite } from '../types';
import { Modal, Button, StatusPill } from './ui';

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
            type="button"
            onClick={() => onToggleSiteStatus(site.id)}
            className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/25 transition-all cursor-pointer flex flex-col justify-between gap-2 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <div className="flex justify-between items-start w-full">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{site.name}</span>
                  <StatusPill tone={site.priority === 'High' ? 'destructive' : 'accent'} className="py-0.5 px-1.5">
                    {site.priority} PRIORITY
                  </StatusPill>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  {site.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <StatusPill
                  tone={site.status === 'completed' ? 'success' : site.status === 'active' ? 'accent' : 'neutral'}
                  className="py-0.5 px-2"
                >
                  {site.status.toUpperCase()}
                </StatusPill>
              </div>
            </div>

            <div className="flex justify-between items-center text-3xs text-blue-300 pt-2 border-t border-white/10 w-full">
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
