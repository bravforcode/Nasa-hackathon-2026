/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { globalCapcomAudio, type CapcomCalloutEntry } from '../services/audio/capcom';

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
  const [activeCallout, setActiveCallout] = useState<CapcomCalloutEntry | null>(null);

  // Subscribe to live CAPCOM voice broadcasts for synchronized closed captions
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const unsubscribe = globalCapcomAudio.onCallout((entry) => {
      setActiveCallout(entry);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setActiveCallout(null);
      }, 5000);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    globalCapcomAudio.setEnabled(!nextMuted);
    if (!nextMuted) {
      globalCapcomAudio.speak('CAPCOM audio communication channel enabled.', 'STATUS');
    }
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-2xl w-full top-0 border-b border-white/[0.08] flex justify-between items-center px-4 md:px-6 py-2.5 z-[var(--z-header,40)] shrink-0 h-[64px] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Left: Aerospace Brand & Mode Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 group cursor-default">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              <Radio className="w-4 h-4" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-blue-500/20 blur-sm -z-10 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-extrabold text-white text-base md:text-lg tracking-tight leading-tight">
                LUNAR RELAY OS
              </span>
              <span className="px-1.5 py-0.2 bg-blue-500/15 border border-blue-400/30 rounded text-[9px] font-mono font-bold text-blue-400">
                PRO
              </span>
            </div>
            <span className="font-mono text-3xs text-slate-400 tracking-[0.18em] uppercase">
              SOUTH POLE MISSION CONTINUITY INTEL
            </span>
          </div>
        </div>

        {isScenarioActive && (
          <button 
            type="button"
            onClick={onOpenScenarioModal}
            aria-label="Active Scenario Detected — Click to inspect"
            className="hidden sm:inline-flex cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-full transition-transform active:scale-95"
          >
            <StatusPill tone="destructive" pulse isLive={true} className="rounded-full px-3 py-0.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              SCENARIO ACTIVE
            </StatusPill>
          </button>
        )}

        {activeCallout && (
          <div 
            role="status" 
            aria-live="polite"
            className="hidden 2xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono text-3xs shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-fade-in"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[320px] font-semibold">{activeCallout.text}</span>
          </div>
        )}
      </div>

      {/* Center/Right: Network telemetry pill & Quick Action buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Operational Window & Provenance (Frosted Metrics via MetricLabel) */}
        <div className="hidden xl:flex items-center gap-5 pr-3 border-r border-white/[0.08]">
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

        {/* Coverage pill with concentric highlight */}
        <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
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
          leftIcon={<AlertTriangle className={`w-3.5 h-3.5 ${isScenarioActive ? 'text-white' : 'text-amber-400'}`} />}
          className={`font-mono text-xs rounded-full transition-all ${
            isScenarioActive 
              ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500' 
              : 'hover:border-amber-400/40'
          }`}
        >
          <span className="hidden sm:inline">Stress Test</span>
        </Button>

        {/* Design Assist Button with Luxury Blue Gradient & Glowing Halo */}
        <Button 
          variant="primary"
          size="sm"
          onClick={onOpenDesignAssist}
          leftIcon={<Sparkles className="w-3.5 h-3.5 fill-current text-blue-100 animate-pulse" />}
          className="font-mono text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] active:scale-[0.97] transition-all"
        >
          <span>Design Assist</span>
        </Button>

        {/* Desktop secondary actions wrapped in Tooltips */}
        <div className="hidden lg:flex items-center gap-1.5 bg-white/[0.02] p-1 rounded-full border border-white/[0.06]">
          {/* NASA Provenance Data Button */}
          <Tooltip content="NASA Data Provenance & Sources" side="bottom">
            <IconButton 
              icon={<Database className="w-4 h-4 text-slate-300 hover:text-white" />}
              aria-label="NASA Data Provenance & Sources"
              onClick={onOpenProvenance}
              size="md"
              variant="ghost"
              className="rounded-full hover:bg-white/10 transition-all active:scale-95"
            />
          </Tooltip>

          {/* Flight Rule Briefing Export */}
          <Tooltip content="Export NASA Flight Rule Briefing (PDF)" side="bottom">
            <IconButton 
              icon={<FileText className="w-4 h-4 text-slate-300 hover:text-white" />}
              aria-label="Export NASA Flight Rule Briefing"
              onClick={onOpenBriefing}
              size="md"
              variant="ghost"
              className="rounded-full hover:bg-white/10 transition-all active:scale-95"
            />
          </Tooltip>

          {/* CAPCOM Mission Audio Callout Toggle */}
          <Tooltip content={isAudioMuted ? 'Unmute NASA CAPCOM Audio Callouts' : 'Mute NASA CAPCOM Audio Callouts'} side="bottom">
            <IconButton
              icon={isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              aria-label={isAudioMuted ? 'Unmute NASA CAPCOM Audio Callouts' : 'Mute NASA CAPCOM Audio Callouts'}
              onClick={handleToggleAudio}
              size="md"
              variant="ghost"
              className="rounded-full hover:bg-white/10 transition-all active:scale-95"
            />
          </Tooltip>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          <Tooltip content="System Settings & Theme" side="bottom">
            <IconButton 
              icon={<Settings className="w-4 h-4 text-slate-300 hover:text-white" />}
              aria-label="System Settings & Theme"
              onClick={onOpenSettings || (() => {})}
              size="md"
              variant="ghost"
              className="rounded-full hover:bg-white/10 transition-all active:scale-95"
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
