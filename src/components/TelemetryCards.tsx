/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff,
  BatteryCharging, 
  Route, 
  ChevronDown, 
  ChevronUp, 
  Thermometer, 
  Radio, 
  ShieldAlert,
  Clock,
  Navigation
} from 'lucide-react';
import { RelayNode } from '../types';

interface TelemetryCardsProps {
  coveragePercent: number;
  batteryPercent: number;
  isReplanning: boolean;
  distanceKm: number;
  relays: RelayNode[];
  onForceRecalc?: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  coveragePercent,
  batteryPercent,
  isReplanning,
  distanceKm,
  relays,
  onForceRecalc,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const isCommCritical = coveragePercent < 80;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* 3 Golden KPI Header Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Communication */}
        <div className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl ${
          isCommCritical 
            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}>
          <div className="flex justify-between items-start">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Communication Link
            </span>
            {isCommCritical ? (
              <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-blue-400" />
            )}
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className={`font-headline text-3xl font-bold tracking-tight ${
              isCommCritical ? 'text-red-400' : 'text-white'
            }`}>
              {coveragePercent}<span className="text-sm font-light text-slate-400">%</span>
            </span>
            <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold ${
              isCommCritical 
                ? 'bg-red-500/20 border-red-500/40 text-red-300' 
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {isCommCritical ? 'Critical Outage' : 'Nominal'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCommCritical ? 'bg-red-500' : 'bg-blue-400'
                }`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
              {isCommCritical ? 'BW: 4 Kbps' : 'BW: 120 Mbps'}
            </span>
          </div>
        </div>

        {/* KPI 2: Power Cell */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all duration-200 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Power Cell / Margin
            </span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="font-headline text-3xl font-bold text-white tracking-tight">
              {batteryPercent}<span className="text-sm font-light text-slate-400">%</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">
              DRAW: 2.1 kW
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>12h 15m reserve (Rule-14.2 safe)</span>
          </div>
        </div>

        {/* KPI 3: Route Status */}
        <div className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl ${
          isReplanning 
            ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' 
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}>
          <div className="flex justify-between items-start">
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Route Status
            </span>
            <Route className={`w-4 h-4 ${isReplanning ? 'text-amber-400' : 'text-blue-400'}`} />
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className={`font-headline text-2xl font-bold uppercase tracking-wide ${
              isReplanning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
            }`}>
              {isReplanning ? 'REPLANNING...' : 'ON TRACK'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>{isReplanning ? 'EST. DELAY: +14m 22s' : 'ETA: T-Minus 2.5h'}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase font-bold">
              Locked
            </span>
          </div>
        </div>
      </div>

      {/* Drawer Toggle */}
      <div className="flex justify-center -mt-1">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-[10px] font-mono uppercase tracking-widest px-4 py-1 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all cursor-pointer"
        >
          <span>{isDrawerOpen ? 'Hide Diagnostics' : 'Constellation Diagnostics & Space Weather'}</span>
          {isDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Diagnostics Drawer */}
      {isDrawerOpen && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Current Relay Links */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Current Relay Links</span>
                <Radio className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <div className="space-y-2">
                {relays.map((r) => {
                  const isOffline = r.status === 'offline';
                  const isCandidate = r.status === 'candidate';
                  return (
                    <div 
                      key={r.id} 
                      className={`flex justify-between items-center text-xs p-2.5 rounded-xl border backdrop-blur-md ${
                        isOffline 
                          ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                          : isCandidate
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                          : 'bg-white/5 border-white/5 text-slate-200'
                      }`}
                    >
                      <span className="font-mono font-medium">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                        isOffline 
                          ? 'bg-red-500/20 text-red-400' 
                          : isCandidate 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isOffline ? 'Failure' : isCandidate ? 'Standby' : 'Active'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Space Weather [DONKI] */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Space Weather [DONKI]</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] text-slate-300 italic font-sans">Solar Particle Event Risk</span>
                  <span className="text-xs font-mono font-bold text-amber-400">Moderate</span>
                </div>
                {/* Histogram Bar Graphic */}
                <div className="flex gap-1.5 h-8 items-end my-1">
                  <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[25%]"></div>
                  <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[40%]"></div>
                  <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[35%]"></div>
                  <div className="flex-1 bg-amber-500 rounded-t-sm h-[70%]"></div>
                  <div className="flex-1 bg-amber-500 rounded-t-sm h-[85%]"></div>
                  <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[30%]"></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  CME impact expected in T-04:20:00. Comm margins may degrade in high-polar shadow corridors.
                </p>
              </div>
            </div>

            {/* Column 3: Distance and Mission Trajectory */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Excursion Telemetry</span>
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Distance to Shelter</span>
                  <span className="text-white font-bold">{distanceKm.toFixed(2)} km</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400">Surface Temp</span>
                  <span className="text-blue-300 font-bold">-153 °C (120 K)</span>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={onForceRecalc}
                  className="bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer backdrop-blur-md"
                >
                  RE-CALCULATE TELEMETRY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
