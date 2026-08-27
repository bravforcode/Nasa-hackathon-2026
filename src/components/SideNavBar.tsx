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
  BatteryCharging 
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
      className="bg-white/5 backdrop-blur-xl w-64 border-r border-white/10 flex flex-col justify-between py-5 shrink-0 hidden md:flex h-full select-none"
    >
      <div>
        {/* Header */}
        <div className="px-5 mb-5">
          <h2 className="font-headline font-bold text-sm text-white tracking-wider uppercase">
            MISSION CONFIG
          </h2>
          <div className="font-mono text-3xs text-slate-400 uppercase tracking-widest mt-0.5">
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

      {/* Bottom Mini Telemetry Status: Rover Telemetry VIPER-1 */}
      <div className="px-4 mx-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col gap-2.5 shadow-lg">
        <div className="flex justify-between items-center text-3xs font-mono text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ROVER VIPER-01
          </span>
          <span className="text-emerald-400 font-bold">
            ACTIVE
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Battery Margin
          </span>
          <span className={`font-bold font-mono ${roverBatteryPercent >= 30 ? 'text-emerald-400' : 'text-red-400'}`}>
            <AnimatedCounter value={roverBatteryPercent} suffix="%" />
          </span>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            ref={batteryBarRef}
            className={`h-full ${roverBatteryPercent >= 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${roverBatteryPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-3xs font-mono text-slate-400 pt-1.5 border-t border-white/10">
          <span>POWER DRAW</span>
          <span className="text-blue-300 font-bold">2.1 kW</span>
        </div>
      </div>
    </nav>
  );
};
