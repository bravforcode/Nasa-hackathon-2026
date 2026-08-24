/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Radio, 
  Settings, 
  User, 
  Sparkles, 
  FileText, 
  Database,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { FailureScenarioType } from '../types';

interface TopAppBarProps {
  coveragePercent: number;
  deadZonesCount: number;
  activeScenario: FailureScenarioType;
  onOpenDesignAssist: () => void;
  onOpenBriefing: () => void;
  onOpenProvenance: () => void;
  onOpenScenarioModal: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  coveragePercent,
  deadZonesCount,
  activeScenario,
  onOpenDesignAssist,
  onOpenBriefing,
  onOpenProvenance,
  onOpenScenarioModal,
}) => {
  const isScenarioActive = activeScenario !== 'nominal';

  return (
    <header className="bg-white/5 backdrop-blur-md w-full top-0 border-b border-white/10 flex justify-between items-center px-4 md:px-6 py-2.5 z-40 shrink-0 h-[64px]">
      {/* Left: Brand & Mode Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 backdrop-blur-md shadow-inner">
            <Radio className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-white text-base md:text-lg tracking-tight leading-tight">
              LUNAR RELAY OS
            </span>
            <span className="font-mono text-[10px] text-slate-400 tracking-[0.2em] uppercase">
              SOUTH POLE MISSION CONTINUITY INTEL
            </span>
          </div>
        </div>

        {isScenarioActive && (
          <button 
            onClick={onOpenScenarioModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/15 text-red-400 font-mono text-[11px] font-bold tracking-wider animate-pulse hover:bg-red-500/25 transition-colors cursor-pointer backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
            SCENARIO ACTIVE
          </button>
        )}
      </div>

      {/* Center/Right: Network telemetry pill & Quick Action buttons */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Operational Window & Provenance (Frosted Metrics) */}
        <div className="hidden xl:flex items-center gap-5 pr-2 border-r border-white/10">
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Operational Window</p>
            <p className="text-xs font-mono text-blue-400">14:22:09 LST</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Data Provenance</p>
            <p className="text-xs font-mono text-emerald-400">LRO / DONKI SYNCED</p>
          </div>
        </div>

        {/* Coverage pill */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-xs text-slate-300">
            Coverage: <strong className={coveragePercent >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{coveragePercent}%</strong>
            {' · '}
            <span className={deadZonesCount > 0 ? 'text-red-400' : 'text-emerald-400'}>
              {deadZonesCount} dead zone{deadZonesCount !== 1 ? 's' : ''}
            </span>
          </span>
        </div>

        {/* Stress test trigger button */}
        <button
          onClick={onOpenScenarioModal}
          className={`font-mono text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all cursor-pointer backdrop-blur-md ${
            isScenarioActive
              ? 'bg-red-500/20 border-red-500/40 text-red-200 hover:bg-red-500/30'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'
          }`}
          title="Inject Failure / Stress Test Scenario"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Stress Test</span>
        </button>

        {/* Design Assist Button */}
        <button 
          onClick={onOpenDesignAssist}
          className="bg-blue-600/90 hover:bg-blue-500 text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20 border border-blue-400/30 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current text-blue-200" />
          <span>Design Assist</span>
        </button>

        {/* NASA Provenance Data Button */}
        <button 
          onClick={onOpenProvenance}
          className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl transition-all cursor-pointer backdrop-blur-md"
          title="NASA Data Provenance & Sources"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Flight Rule Briefing Export */}
        <button 
          onClick={onOpenBriefing}
          className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl transition-all cursor-pointer backdrop-blur-md"
          title="Export NASA Flight Rule Briefing"
        >
          <FileText className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

        <button 
          onClick={() => {}}
          className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl transition-all backdrop-blur-md"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
