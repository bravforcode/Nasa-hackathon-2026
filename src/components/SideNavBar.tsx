/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { 
  Compass, 
  Home, 
  Radio, 
  FlaskConical, 
  Sliders, 
  Layers, 
  BatteryCharging,
  Zap
} from 'lucide-react';
import gsap from 'gsap';
import { NavigationTab } from '../types';
import { NavItem, StatusPillTone, AnimatedCounter } from './ui';
import { prefersReducedMotion, MOTION_DURATIONS } from '../utils/motion';

interface SideNavBarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  roverBatteryPercent: number;
  relayHealthAvg: number;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  onSelectTab,
  roverBatteryPercent,
  relayHealthAvg,
}) => {
  const batteryBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!batteryBarRef.current) return;

    if (prefersReducedMotion()) {
      batteryBarRef.current.style.width = `${roverBatteryPercent}%`;
      return;
    }

    const tween = gsap.to(batteryBarRef.current, {
      width: `${roverBatteryPercent}%`,
      duration: MOTION_DURATIONS.slow,
      ease: 'power2.out',
    });

    return () => {
      tween.kill();
    };
  }, [roverBatteryPercent]);

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: { text: string; tone: StatusPillTone };
  }[] = [
    { id: 'region', label: 'Region Select', icon: <Compass className="w-4 h-4" /> },
    { id: 'habitat', label: 'Habitat Config', icon: <Home className="w-4 h-4" /> },
    {
      id: 'relay',
      label: 'Relay Network',
      icon: <Radio className="w-4 h-4" />,
      badge: {
        text: `${relayHealthAvg}%`,
        tone: relayHealthAvg >= 90 ? 'success' : 'destructive',
      },
    },
    { id: 'science', label: 'Science Goals', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'constraints', label: 'Constraints', icon: <Sliders className="w-4 h-4" /> },
    { id: 'components', label: 'Component Library', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Mission Configuration"
      className="bg-slate-950/70 backdrop-blur-2xl w-64 border-r border-white/[0.08] flex flex-col justify-between py-5 shrink-0 hidden md:flex h-full select-none shadow-[4px_0_30px_rgba(0,0,0,0.4)]"
    >
      <div>
        {/* Header with high-tech badge */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-xs text-slate-200 tracking-widest uppercase">
              Mission Config
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
              ONLINE
            </span>
          </div>
          <div className="font-mono text-3xs text-slate-400 uppercase tracking-widest mt-1">
            V1.0-STABLE · FLIGHT READY
          </div>
        </div>

        {/* Menu list using NavItem primitive */}
        <div className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              badge={item.badge}
              onClick={() => onSelectTab(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Double-Bezel Telemetry Status: Rover VIPER-1 */}
      <div className="mx-3 ring-1 ring-white/10 bg-white/[0.03] p-1 rounded-2xl shadow-xl">
        <div className="p-3.5 bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl border border-white/[0.06] flex flex-col gap-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="flex justify-between items-center text-3xs font-mono text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              ROVER VIPER-01
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[9px]">
              ACTIVE
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Battery Margin
            </span>
            <span className={`font-bold font-mono ${roverBatteryPercent >= 30 ? 'text-emerald-400' : 'text-red-400'}`}>
              <AnimatedCounter value={roverBatteryPercent} suffix="%" />
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              ref={batteryBarRef}
              className={`h-full rounded-full transition-all duration-300 ${
                roverBatteryPercent >= 30 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              }`}
              style={{ width: `${roverBatteryPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-3xs font-mono text-slate-400 pt-1.5 border-t border-white/[0.06]">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> POWER DRAW
            </span>
            <span className="text-blue-300 font-bold">2.1 kW</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
