/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Radio, 
  Settings,
  Sparkles, 
  FileText, 
  Database, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { FailureScenarioType } from '../types';
import { Button, IconButton } from './ui';
import { TopAppBarOverflowMenu } from './TopAppBarOverflowMenu';

interface TopAppBarProps {
  coveragePercent: number;
  deadZonesCount: number;
  activeScenario: FailureScenarioType;
  onOpenDesignAssist: () => void;
  onOpenBriefing: () => void;
  onOpenProvenance: () => void;
  onOpenScenarioModal: () => void;
  onOpenSettings?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  coveragePercent,
  deadZonesCount,
  activeScenario,
  onOpenDesignAssist,
  onOpenBriefing,
  onOpenProvenance,
  onOpenScenarioModal,
  onOpenSettings,
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
      <div className="flex items-center gap-2 md:gap-3">
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
        <Button
          variant={isScenarioActive ? 'destructive' : 'secondary'}
          size="sm"
          onClick={onOpenScenarioModal}
          leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          className="font-mono text-xs"
        >
          <span className="hidden sm:inline">Stress Test</span>
        </Button>

        {/* Design Assist Button */}
        <Button 
          variant="primary"
          size="sm"
          onClick={onOpenDesignAssist}
          leftIcon={<Sparkles className="w-3.5 h-3.5 fill-current text-blue-200" />}
          className="font-mono text-xs font-bold"
        >
          <span>Design Assist</span>
        </Button>

        {/* Desktop secondary actions (hidden on mobile, in overflow menu) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* NASA Provenance Data Button */}
          <IconButton 
            icon={<Database className="w-4 h-4" />}
            aria-label="NASA Data Provenance & Sources"
            onClick={onOpenProvenance}
            size="md"
          />

          {/* Flight Rule Briefing Export */}
          <IconButton 
            icon={<FileText className="w-4 h-4" />}
            aria-label="Export NASA Flight Rule Briefing"
            onClick={onOpenBriefing}
            size="md"
          />

          <div className="h-4 w-px bg-white/10"></div>

          <IconButton 
            icon={<Settings className="w-4 h-4" />}
            aria-label="System Settings & Theme"
            onClick={onOpenSettings || (() => {})}
            size="md"
          />
        </div>

        {/* Mobile/Tablet Overflow Menu */}
        <TopAppBarOverflowMenu
          onOpenProvenance={onOpenProvenance}
          onOpenBriefing={onOpenBriefing}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
};
