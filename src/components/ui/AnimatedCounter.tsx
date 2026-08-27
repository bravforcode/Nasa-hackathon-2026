/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion, MOTION_DURATIONS } from '../../utils/motion';

export interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  duration = MOTION_DURATIONS.slow,
  decimals = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const isReduced = prefersReducedMotion();

    if (isReduced) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const proxy = { current: prevValueRef.current };

    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    tweenRef.current = gsap.to(proxy, {
      current: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(proxy.current);
      },
      onComplete: () => {
        setDisplayValue(value);
        prevValueRef.current = value;
      },
    });

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [value, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span className={`tabular-nums ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
};
