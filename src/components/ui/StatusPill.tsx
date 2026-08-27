/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, ReactNode } from 'react';

export type StatusPillTone = 'accent' | 'success' | 'warning' | 'destructive' | 'neutral';

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusPillTone;
  icon?: ReactNode;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

const toneStyles: Record<StatusPillTone, { wrapper: string; dot: string }> = {
  accent: {
    wrapper: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
    dot: 'bg-blue-400',
  },
  success: {
    wrapper: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  warning: {
    wrapper: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
    dot: 'bg-amber-400',
  },
  destructive: {
    wrapper: 'border-red-500/30 bg-red-500/15 text-red-400',
    dot: 'bg-red-400',
  },
  neutral: {
    wrapper: 'border-white/10 bg-white/5 text-slate-400',
    dot: 'bg-slate-400',
  },
};

export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ tone = 'accent', icon, pulse = false, children, className = '', ...props }, ref) => {
    const style = toneStyles[tone];

    return (
      <span
        ref={ref}
        role="status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold tracking-wider backdrop-blur-md ${style.wrapper} ${className}`}
        {...props}
      >
        {pulse && (
          <span
            data-testid="status-pill-dot"
            className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}
            aria-hidden="true"
          />
        )}
        {icon && (
          <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }
);

StatusPill.displayName = 'StatusPill';
