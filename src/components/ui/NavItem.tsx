/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, ReactNode } from 'react';
import { StatusPill, StatusPillTone } from './StatusPill';

export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: { text: string; tone?: StatusPillTone };
  onClick: () => void;
  className?: string;
}

export const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(
  ({ icon, label, active = false, badge, onClick, className = '', disabled = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
        className={`w-full min-h-11 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed ${
          active
            ? 'border-l-2 border-blue-400 bg-blue-500/15 text-blue-300 font-medium shadow-inner'
            : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
        } ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          <span
            className={`shrink-0 flex items-center justify-center ${
              active ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-300 transition-colors'
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider">
            {label}
          </span>
        </div>

        {badge && (
          <StatusPill tone={badge.tone ?? 'accent'} className="py-0.5 px-2 text-[10px]">
            {badge.text}
          </StatusPill>
        )}
      </button>
    );
  }
);

NavItem.displayName = 'NavItem';
