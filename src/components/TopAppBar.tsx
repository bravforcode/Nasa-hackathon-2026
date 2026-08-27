/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Radio, 
  Settings,
  Sparkles, 
  FileText, 
  Database, 
  Activity, 
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FailureScenarioType } from '../types';
import { Button, IconButton, StatusPill, MetricLabel, Tooltip, AnimatedCounter } from './ui';
import { TopAppBarOverflowMenu } from './TopAppBarOverflowMenu';
import { globalCapcomAudio } from '../services/audio/capcom';

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
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!globalCapcomAudio.isEnabled());

  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    globalCapcomAudio.setEnabled(!nextMuted);
    if (!nextMuted) {
      globalCapcomAudio.speak('CAPCOM audio communication channel enabled.', 'STATUS');
    }
  };

  return (
    <header className="bg-white/5 backdrop-blur-md w-full top-0 border-b border-white/10 flex justify-between items-center px-4 md:px-6 py-2.5 z-[var(--z-header,40)] shrink-0 h-[64px]">
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
            <span className="font-mono text-3xs text-slate-400 tracking-[0.2em] uppercase">
              SOUTH POLE MISSION CONTINUITY INTEL
            </span>
          </div>
        </div>

        {isScenarioActive && (
          <button 
            type="button"
            onClick={onOpenScenarioModal}
            aria-label="Active Scenario Detected — Click to inspect"
            className="hidden sm:inline-flex cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-lg"
          >
            <StatusPill tone="destructive" pulse isLive={true}>
              SCENARIO ACTIVE
            </StatusPill>
          </button>
        )}
      </div>

      {/* Center/Right: Network telemetry pill & Quick Action buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Operational Window & Provenance (Frosted Metrics via MetricLabel) */}
        <div className="hidden xl:flex items-center gap-5 pr-2 border-r border-white/10">
          <MetricLabel
            label="Operational Window"
            value="14:22:09 LST"
            valueTone="accent"
            align="right"
          />
          <MetricLabel
            label="Data Provenance"
            value="LRO / DONKI SYNCED"
            valueTone="success"
            align="right"
          />
        </div>

        {/* Coverage pill */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-xs text-slate-300">
            Coverage:{' '}
            <strong className={coveragePercent >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
              <AnimatedCounter value={coveragePercent} suffix="%" />
            </strong>
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

        {/* Desktop secondary actions wrapped in Tooltips */}
        <div className="hidden lg:flex items-center gap-2">
          {/* NASA Provenance Data Button */}
          <Tooltip content="NASA Data Provenance & Sources" side="bottom">
            <IconButton 
              icon={<Database className="w-4 h-4" />}
              aria-label="NASA Data Provenance & Sources"
              onClick={onOpenProvenance}
              size="md"
            />
          </Tooltip>

          {/* Flight Rule Briefing Export */}
          <Tooltip content="Export NASA Flight Rule Briefing" side="bottom">
            <IconButton 
              icon={<FileText className="w-4 h-4" />}
              aria-label="Export NASA Flight Rule Briefing"
              onClick={onOpenBriefing}
              size="md"
            />
          </Tooltip>

          {/* CAPCOM Mission Audio Callout Toggle */}
          <Tooltip content={isAudioMuted ? 'Unmute NASA CAPCOM Audio Callouts' : 'Mute NASA CAPCOM Audio Callouts'} side="bottom">
            <IconButton
              icon={isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              aria-label={isAudioMuted ? 'Unmute NASA CAPCOM Audio Callouts' : 'Mute NASA CAPCOM Audio Callouts'}
              onClick={handleToggleAudio}
              size="md"
            />
          </Tooltip>

          <div className="h-4 w-px bg-white/10"></div>

          <Tooltip content="System Settings & Theme" side="bottom">
            <IconButton 
              icon={<Settings className="w-4 h-4" />}
              aria-label="System Settings & Theme"
              onClick={onOpenSettings || (() => {})}
              size="md"
            />
          </Tooltip>
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
