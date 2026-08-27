/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { StatusPillTone } from './StatusPill';

export interface MetricLabelProps extends HTMLAttributes<HTMLDListElement> {
  label: string;
  value: ReactNode;
  valueTone?: StatusPillTone;
  align?: 'left' | 'right';
  className?: string;
}

const valueToneStyles: Record<StatusPillTone, string> = {
  accent: 'text-[var(--color-accent-subtle)]',
  success: 'text-[var(--color-success-subtle)]',
  warning: 'text-[var(--color-warning-subtle)]',
  destructive: 'text-[var(--color-destructive-subtle)]',
  neutral: 'text-[var(--color-text)]',
};

export const MetricLabel = forwardRef<HTMLDListElement, MetricLabelProps>(
  ({ label, value, valueTone = 'accent', align = 'left', className = '', ...props }, ref) => {
    return (
      <dl
        ref={ref}
        className={`flex flex-col m-0 p-0 ${align === 'right' ? 'text-right items-end' : 'text-left items-start'} ${className}`}
        {...props}
      >
        <dt className="text-3xs text-[var(--color-text-muted)] uppercase font-bold tracking-wider leading-tight">
          {label}
        </dt>
        <dd className={`text-xs font-mono font-bold m-0 p-0 leading-tight mt-0.5 ${valueToneStyles[valueTone]}`}>
          {value}
        </dd>
      </dl>
    );
  }
);

MetricLabel.displayName = 'MetricLabel';
