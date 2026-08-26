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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setPlayheadPercent(newPercent);
    if (onScrubTime) {
      onScrubTime(Math.round(((newPercent - 50) / 50) * 24));
    }
  };

  return (
    <footer className="h-[64px] w-full bg-white/5 backdrop-blur-xl border-t border-white/10 flex flex-col justify-center px-4 md:px-6 z-30 shrink-0 select-none shadow-lg">
      {/* Top Labels */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            POWER / ILLUMINATION TIMELINE (T-MINUS 24H TO T+24H)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-slate-400">
            SUN ELEVATION: <strong className="text-emerald-400">1.4°</strong>
          </span>
          <span className="text-blue-300 font-bold">
            CURRENT ORBIT: {orbitalAngle}°
          </span>
          <span className="text-slate-200 font-bold">
            {currentHour === 0 ? 'T-00:00 (NOW)' : currentHour > 0 ? `T+${currentHour}:00` : `T${currentHour}:00`}
          </span>
        </div>
      </div>

      {/* Scrubbable Timeline Track */}
      <div 
        onClick={handleTimelineClick}
        className="relative w-full h-3 bg-slate-900/80 rounded-full cursor-pointer group overflow-hidden border border-white/10 shadow-inner"
      >
        {/* Illumination & Shadow Segment Bars */}
        <div className="absolute inset-0 flex">
          {/* Segment 1: Sunlit High Ridge (0 - 25%) */}
          <div className="w-[25%] bg-blue-500/40 border-r border-white/10" title="Sunlit Plateau" />
          {/* Segment 2: Penumbra / Low Grazing Angle (25% - 40%) */}
          <div className="w-[15%] bg-amber-500/30 border-r border-white/10" title="Low Grazing Angle" />
          {/* Segment 3: Deep Crater Shadow (40% - 60%) */}
          <div className="w-[20%] bg-slate-950 border-r border-white/10" title="Deep Crater Shadow" />
          {/* Segment 4: Peak of Eternal Light (60% - 85%) */}
          <div className="w-[25%] bg-blue-500/50 border-r border-white/10" title="High Solar Exposure" />
          {/* Segment 5: Approaching Eclipse (85% - 100%) */}
          <div className="w-[15%] bg-slate-950" title="Cryogenic Shadow" />
        </div>

        {/* Playhead Cursor */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)] transition-all"
          style={{ left: `${playheadPercent}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-300 -mt-0.5 -ml-0.5 shadow-sm" />
        </div>
      </div>

      {/* Bottom Time Markers */}
      <div className="flex justify-between mt-1 px-1 text-[9px] font-mono text-slate-400">
        <span>T-24:00</span>
        <span>T-12:00</span>
        <span className="text-blue-300 font-bold">T-00:00 (NOW)</span>
        <span>T+12:00</span>
        <span>T+24:00</span>
      </div>
    </footer>
  );
};
