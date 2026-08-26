/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, 
  Home, 
  Radio, 
  FlaskConical, 
  Sliders,
  Layers,
  BatteryCharging
} from 'lucide-react';
import { NavigationTab } from '../types';

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
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'region', label: 'Region Select', icon: <Compass className="w-4 h-4" /> },
    { id: 'habitat', label: 'Habitat Config', icon: <Home className="w-4 h-4" /> },
    { id: 'relay', label: 'Relay Network', icon: <Radio className="w-4 h-4" />, badge: `${relayHealthAvg}%` },
    { id: 'science', label: 'Science Goals', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'constraints', label: 'Constraints', icon: <Sliders className="w-4 h-4" /> },
    { id: 'components', label: 'Component Library', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-white/5 backdrop-blur-xl w-64 border-r border-white/10 flex flex-col justify-between py-5 shrink-0 hidden md:flex h-full select-none">
      <div>
        {/* Header */}
        <div className="px-5 mb-5">
          <h2 className="font-headline font-bold text-sm text-white tracking-wider uppercase">
            MISSION CONFIG
          </h2>
          <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
            V0.48-STABLE · FLIGHT READY
          </div>
        </div>

        {/* Menu list */}
        <div className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer backdrop-blur-sm ${
                  isActive
                    ? 'border-l-2 border-blue-400 bg-blue-500/15 text-blue-300 font-medium shadow-inner'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-300 transition-colors'}>
                    {item.icon}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    relayHealthAvg >= 90 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Mini Telemetry Status: Rover Telemetry VIPER-1 */}
      <div className="px-4 mx-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col gap-2.5 shadow-lg">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-wider">
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
            {roverBatteryPercent}%
          </span>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${roverBatteryPercent >= 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${roverBatteryPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/10">
          <span>POWER DRAW</span>
          <span className="text-blue-300 font-bold">2.1 kW</span>
        </div>
      </div>
    </nav>
  );
};
