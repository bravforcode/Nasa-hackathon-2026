/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun } from 'lucide-react';

interface IlluminationTimelineProps {
  currentOrbitDeg?: number;
  onScrubTime?: (timeOffsetHours: number) => void;
}

export const IlluminationTimeline: React.FC<IlluminationTimelineProps> = ({
  onScrubTime,
}) => {
  const [playheadPercent, setPlayheadPercent] = useState<number>(50); // 50% = T-00:00 (NOW)

  // Time in hours from -24h to +24h
  const currentHour = Math.round(((playheadPercent - 50) / 50) * 24);
  const orbitalAngle = Math.round((playheadPercent / 100) * 360);

  const updateScrub = (newPercent: number) => {
    const clamped = Math.max(0, Math.min(100, newPercent));
    setPlayheadPercent(clamped);
    if (onScrubTime) {
      onScrubTime(Math.round(((clamped - 50) / 50) * 24));
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    updateScrub((clickX / rect.width) * 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      updateScrub(playheadPercent - (e.shiftKey ? 10 : 2));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      updateScrub(playheadPercent + (e.shiftKey ? 10 : 2));
    } else if (e.key === 'Home') {
      e.preventDefault();
      updateScrub(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      updateScrub(100);
    }
  };

  return (
    <footer className="h-[64px] w-full bg-white/5 backdrop-blur-xl border-t border-[var(--color-border,rgba(255,255,255,0.1))] flex flex-col justify-center px-4 md:px-6 z-[var(--z-nav,30)] shrink-0 select-none shadow-lg">
      {/* Top Labels */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-[var(--color-map-science,var(--color-warning,#f59e0b))]" />
          <span className="font-mono text-3xs text-[var(--color-text-muted,#94a3b8)] uppercase tracking-wider font-bold">
            POWER / ILLUMINATION TIMELINE (T-MINUS 24H TO T+24H)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-3xs">
          <span className="text-[var(--color-text-muted,#94a3b8)]">
            SUN ELEVATION: <strong className="text-[var(--color-map-safety,var(--color-success,#10b981))]">1.4°</strong>
          </span>
          <span className="text-[var(--color-accent-subtle,#60a5fa)] font-bold">
            CURRENT ORBIT: {orbitalAngle}°
          </span>
          <span className="text-[var(--color-text,#f1f5f9)] font-bold">
            {currentHour === 0 ? 'T-00:00 (NOW)' : currentHour > 0 ? `T+${currentHour}:00` : `T${currentHour}:00`}
          </span>
        </div>
      </div>

      {/* Scrubbable Timeline Track */}
      <div 
        role="slider"
        tabIndex={0}
        aria-label="Mission Illumination Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={playheadPercent}
        aria-valuetext={`${currentHour === 0 ? 'T-00:00 (NOW)' : currentHour > 0 ? `T+${currentHour}:00` : `T${currentHour}:00`}`}
        onClick={handleTimelineClick}
        onKeyDown={handleKeyDown}
        className="relative w-full h-3 rounded-full cursor-pointer group overflow-hidden border shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        style={{
          backgroundColor: 'var(--color-viz-timeline-track, rgba(15, 23, 42, 0.8))',
          borderColor: 'var(--color-viz-timeline-border, rgba(255, 255, 255, 0.1))',
        }}
      >
        {/* Illumination & Shadow Segment Bars */}
        <div className="absolute inset-0 flex">
          {/* Segment 1: Sunlit High Ridge (0 - 25%) */}
          <div
            className="w-[25%] border-r"
            style={{
              backgroundColor: 'var(--color-viz-sunlit, rgba(59, 130, 246, 0.40))',
              borderColor: 'var(--color-viz-timeline-border, rgba(255, 255, 255, 0.10))',
            }}
            title="Sunlit Plateau"
          />
          {/* Segment 2: Penumbra / Low Grazing Angle (25% - 40%) */}
          <div
            className="w-[15%] border-r"
            style={{
              backgroundColor: 'var(--color-viz-penumbra, rgba(245, 158, 11, 0.35))',
              borderColor: 'var(--color-viz-timeline-border, rgba(255, 255, 255, 0.10))',
            }}
            title="Low Grazing Angle"
          />
          {/* Segment 3: Deep Crater Shadow (40% - 60%) */}
          <div
            className="w-[20%] border-r"
            style={{
              backgroundColor: 'var(--color-viz-shadow, #02040a)',
              borderColor: 'var(--color-viz-timeline-border, rgba(255, 255, 255, 0.10))',
            }}
            title="Deep Crater Shadow"
          />
          {/* Segment 4: Peak of Eternal Light (60% - 85%) */}
          <div
            className="w-[25%] border-r"
            style={{
              backgroundColor: 'var(--color-viz-sunlit-peak, rgba(59, 130, 246, 0.55))',
              borderColor: 'var(--color-viz-timeline-border, rgba(255, 255, 255, 0.10))',
            }}
            title="High Solar Exposure"
          />
          {/* Segment 5: Approaching Eclipse (85% - 100%) */}
          <div
            className="w-[15%]"
            style={{
              backgroundColor: 'var(--color-viz-shadow-deep, #000206)',
            }}
            title="Cryogenic Shadow"
          />
        </div>

        {/* Playhead Cursor */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 transition-all"
          style={{
            left: `${playheadPercent}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-viz-playhead, var(--color-accent-subtle, #60a5fa))',
            boxShadow: '0 0 12px var(--color-viz-playhead-glow, rgba(96, 165, 250, 0.9))',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full -mt-0.5 -ml-0.5 shadow-sm"
            style={{
              backgroundColor: 'var(--color-viz-playhead-thumb, var(--color-accent-subtle, #93c5fd))',
              border: '1px solid var(--color-text, #ffffff)',
            }}
          />
        </div>
      </div>

      {/* Bottom Time Markers */}
      <div className="flex justify-between mt-1 px-1 text-3xs font-mono text-[var(--color-text-muted,#94a3b8)]">
        <span>T-24:00</span>
        <span>T-12:00</span>
        <span className="text-[var(--color-accent-subtle,#60a5fa)] font-bold">T-00:00 (NOW)</span>
        <span>T+12:00</span>
        <span>T+24:00</span>
      </div>
    </footer>
  );
};
