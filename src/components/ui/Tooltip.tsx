/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useRef,
  ReactNode,
  ReactElement,
  cloneElement,
  useEffect,
  useId,
} from 'react';

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement;
  className?: string;
  delayMs?: number;
}

export function Tooltip({
  content,
  side = 'top',
  children,
  className = '',
  delayMs = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayMs <= 0) {
      setIsVisible(true);
    } else {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delayMs);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  const sidePositions: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const child = React.Children.only(children);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {cloneElement(child as React.ReactElement<any>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          className={`absolute z-[var(--z-dropdown,50)] whitespace-nowrap px-2.5 py-1 text-[11px] font-mono font-medium text-slate-200 bg-[#05060a]/95 border border-white/15 rounded-lg shadow-xl backdrop-blur-xl pointer-events-auto transition-opacity duration-150 ${
            sidePositions[side]
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
