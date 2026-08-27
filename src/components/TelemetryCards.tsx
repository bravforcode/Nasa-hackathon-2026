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
  Navigation
} from 'lucide-react';
import { RelayNode } from '../types';
import { Button, Card, StatusPill, AnimatedCounter } from './ui';

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
            <span className="font-mono text-3xs text-slate-400 uppercase font-bold tracking-wider">
              Communication Link
            </span>
            {isCommCritical ? (
              <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-blue-400" />
            )}
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className={`font-headline text-3xl font-extrabold tracking-tight ${
              isCommCritical ? 'text-red-400' : 'text-blue-400'
            }`}>
              <AnimatedCounter value={coveragePercent} suffix="%" />
            </span>
            <span className="font-mono text-xs text-slate-400">Coverage Area</span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isCommCritical ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, coveragePercent))}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Battery State of Charge */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl hover:border-white/20">
          <div className="flex justify-between items-start">
            <span className="font-mono text-3xs text-slate-400 uppercase font-bold tracking-wider">
              Rover Battery SoC
            </span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="font-headline text-3xl font-extrabold text-emerald-400 tracking-tight">
              <AnimatedCounter value={batteryPercent} suffix="%" />
            </span>
            <span className="font-mono text-xs text-slate-400">Reserve Margin</span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
              style={{ width: `${batteryPercent}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Route Plan Status */}
        <div className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl ${
          isReplanning 
            ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' 
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}>
          <div className="flex justify-between items-start">
            <span className="font-mono text-3xs text-slate-400 uppercase font-bold tracking-wider">
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

          <div className="flex items-center justify-between text-3xs font-mono text-slate-400 mt-1">
            <span>{isReplanning ? 'EST. DELAY: +14m 22s' : 'ETA: T-Minus 2.5h'}</span>
            <StatusPill tone="success" className="py-0.5 px-2">
              LOCKED
            </StatusPill>
          </div>
        </div>
      </div>

      {/* Drawer Toggle */}
      <div className="flex justify-center -mt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          rightIcon={isDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          className="text-3xs font-mono uppercase tracking-widest px-4 !py-1 !min-h-[32px] rounded-full shadow-md backdrop-blur-md"
        >
          {isDrawerOpen ? 'Hide Diagnostics' : 'Constellation Diagnostics & Space Weather'}
        </Button>
      </div>

      {/* Expandable Diagnostics Drawer */}
      {isDrawerOpen && (
        <Card variant="default" padding="md" className="backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Current Relay Links */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-3xs text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Current Relay Links</span>
                <Radio className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <div className="space-y-2">
                {relays.map((r) => {
                  const isOffline = r.status === 'offline';
                  const isCandidate = r.status === 'candidate';
                  const tone = isOffline ? 'destructive' : isCandidate ? 'accent' : 'success';
                  const label = isOffline ? 'FAILURE' : isCandidate ? 'STANDBY' : 'ACTIVE';

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
                      <StatusPill tone={tone} className="py-0.5 px-2">
                        {label}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Space Weather [DONKI] */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-3xs text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>Space Weather [DONKI]</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-3xs text-slate-300 italic font-sans">Solar Particle Event Risk</span>
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
                <p className="text-3xs text-slate-400 leading-tight">
                  CME impact expected in T-04:20:00. Comm margins may degrade in high-polar shadow corridors.
                </p>
              </div>
            </div>

            {/* Column 3: Distance and Mission Trajectory */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-3xs text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onForceRecalc}
                  className="bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300 font-mono text-3xs font-bold !min-h-[32px]"
                >
                  RE-CALCULATE TELEMETRY
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
