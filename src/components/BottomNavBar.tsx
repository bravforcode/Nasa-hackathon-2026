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
  Layers 
} from 'lucide-react';
import { NavigationTab } from '../types';
import { StatusPill } from './ui';

interface BottomNavBarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  relayHealthAvg: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  relayHealthAvg,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'region', label: 'Region', icon: <Compass className="w-4 h-4" /> },
    { id: 'habitat', label: 'Habitat', icon: <Home className="w-4 h-4" /> },
    { id: 'relay', label: 'Relays', icon: <Radio className="w-4 h-4" />, badge: `${relayHealthAvg}%` },
    { id: 'science', label: 'Science', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'constraints', label: 'Rules', icon: <Sliders className="w-4 h-4" /> },
    { id: 'components', label: 'Library', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-nav,30)] bg-[#05060a]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-1.5 select-none shadow-2xl"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
              isActive
                ? 'text-[var(--color-accent-subtle)] font-bold bg-[var(--color-accent)]/15 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 active:bg-white/5'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {item.icon}
              {item.badge && (
                <div className="absolute -top-2 -right-3.5">
                  <StatusPill tone="success" className="py-0 px-1 font-mono min-h-0">
                    {item.badge}
                  </StatusPill>
                </div>
              )}
            </div>
            <span className="font-mono text-3xs uppercase tracking-wider">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
