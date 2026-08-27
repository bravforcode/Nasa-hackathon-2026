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
  /** When true, marks the element as an ARIA live region (role="status"). Defaults to false for static badges. */
  isLive?: boolean;
  children: ReactNode;
  className?: string;
}

const toneStyles: Record<StatusPillTone, { wrapper: string; dot: string }> = {
  accent: {
    wrapper: 'border-[var(--color-accent-subtle)]/30 bg-[var(--color-accent)]/15 text-[var(--color-accent-subtle)]',
    dot: 'bg-[var(--color-accent-subtle)]',
  },
  success: {
    wrapper: 'border-[var(--color-success-subtle)]/30 bg-[var(--color-success)]/15 text-[var(--color-success-subtle)]',
    dot: 'bg-[var(--color-success-subtle)]',
  },
  warning: {
    wrapper: 'border-[var(--color-warning-subtle)]/30 bg-[var(--color-warning)]/15 text-[var(--color-warning-subtle)]',
    dot: 'bg-[var(--color-warning-subtle)]',
  },
  destructive: {
    wrapper: 'border-[var(--color-destructive-subtle)]/30 bg-[var(--color-destructive)]/15 text-[var(--color-destructive-subtle)]',
    dot: 'bg-[var(--color-destructive-subtle)]',
  },
  neutral: {
    wrapper: 'border-[var(--color-border)] bg-white/5 text-[var(--color-text-faint)]',
    dot: 'bg-[var(--color-text-faint)]',
  },
};

export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ tone = 'accent', icon, pulse = false, isLive = false, role, children, className = '', ...props }, ref) => {
    const style = toneStyles[tone];
    const resolvedRole = role ?? (isLive ? 'status' : undefined);

    return (
      <span
        ref={ref}
        role={resolvedRole}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-3xs font-bold tracking-wider backdrop-blur-md ${style.wrapper} ${className}`}
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
