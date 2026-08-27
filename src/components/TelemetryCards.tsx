/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  BatteryCharging,
  Zap,
  Route,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Radio,
  Navigation,
  TrendingUp,
  TrendingDown,
  Clock,
  RotateCcw,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { RelayNode } from '../types';
import { Button, Card, StatusPill, MetricLabel, AnimatedCounter } from './ui';

export interface TelemetryCardsProps {
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
  const isBatteryLow = batteryPercent < 30;
  const isBatteryCaution = batteryPercent >= 30 && batteryPercent < 60;

  const activeRelays = relays.filter((r) => r.status === 'active');
  const totalRelays = relays.length;
  const coverageDelta = coveragePercent - 80;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Accessible Live Region for Route Replanning & System State Changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isReplanning
          ? 'Alert: Active route replanning in progress. Estimated delay plus 14 minutes and 22 seconds.'
          : 'Route trajectory nominal and on track. ETA T-minus 2.5 hours.'}
        {isCommCritical
          ? ' Warning: Communication coverage degraded below 80 percent floor.'
          : ' Communication link nominal.'}
      </div>

      {/* 3 Golden KPI Header Strip — Umami/Plausible High-Density Analytics Layout */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        aria-label="Telemetry Golden KPIs"
      >
        {/* KPI 1: Communication Link & Coverage */}
        <article
          className={`p-4 md:p-4.5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden group ${
            isCommCritical
              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 shadow-red-500/5'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          aria-label="Communication Link Telemetry"
        >
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              {isCommCritical ? (
                <WifiOff className="w-4 h-4 text-red-400 animate-pulse shrink-0" aria-hidden="true" />
              ) : (
                <Wifi className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
              )}
              <span className="font-mono text-3xs text-slate-300 uppercase font-bold tracking-wider">
                Communication Link
              </span>
            </div>
            <StatusPill
              tone={isCommCritical ? 'destructive' : 'accent'}
              pulse={isCommCritical}
              isLive={true}
              className="py-0.5 px-2 text-3xs"
            >
              {isCommCritical ? 'DEGRADED' : 'NOMINAL'}
            </StatusPill>
          </div>

          {/* Hero Metric & Micro-Trend */}
          <div className="flex items-baseline justify-between gap-2 my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-headline text-3xl font-extrabold tracking-tight tabular-nums ${
                  isCommCritical ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                <AnimatedCounter value={coveragePercent} suffix="%" />
              </span>
              <span className="font-mono text-3xs text-slate-400">Area QoS</span>
            </div>

            {/* Micro-trend Delta Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-3xs font-semibold border ${
                coverageDelta >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
              title={coverageDelta >= 0 ? `${coverageDelta.toFixed(1)}% above critical floor` : `${Math.abs(coverageDelta).toFixed(1)}% below critical floor`}
            >
              {coverageDelta >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>+{coverageDelta.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{coverageDelta.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>

          {/* Telemetry Progress Bar with 80% Threshold Marker */}
          <div className="space-y-1.5">
            <div
              className="relative w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden border border-white/5"
              role="progressbar"
              aria-valuenow={Math.round(coveragePercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Communication coverage percentage"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCommCritical
                    ? 'bg-red-500 shadow-sm shadow-red-500/50'
                    : 'bg-blue-500 shadow-sm shadow-blue-500/50'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, coveragePercent))}%` }}
              />
              {/* 80% Critical Floor Tick */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                style={{ left: '80%' }}
                title="80% Mission Critical Floor"
                aria-hidden="true"
              />
            </div>

            {/* Sub-bar Metadata Row */}
            <div className="flex justify-between items-center text-3xs font-mono text-slate-400 leading-none pt-0.5">
              <span>Relays: <strong className="text-slate-200">{activeRelays.length}/{totalRelays}</strong> Online</span>
              <span className="text-slate-400">Floor: <strong className="text-slate-300">80%</strong></span>
            </div>
          </div>
        </article>

        {/* KPI 2: Rover Battery State of Charge (SoC) */}
        <article
          className={`p-4 md:p-4.5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden group ${
            isBatteryLow
              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 shadow-red-500/5'
              : isBatteryCaution
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          aria-label="Rover Battery SoC Telemetry"
        >
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              {isBatteryLow ? (
                <Zap className="w-4 h-4 text-red-400 animate-pulse shrink-0" aria-hidden="true" />
              ) : isBatteryCaution ? (
                <BatteryCharging className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              ) : (
                <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              )}
              <span className="font-mono text-3xs text-slate-300 uppercase font-bold tracking-wider">
                Rover Battery SoC
              </span>
            </div>
            <StatusPill
              tone={isBatteryLow ? 'destructive' : isBatteryCaution ? 'warning' : 'success'}
              pulse={isBatteryLow || isBatteryCaution}
              isLive={true}
              className="py-0.5 px-2 text-3xs"
            >
              {isBatteryLow ? 'CRITICAL' : isBatteryCaution ? 'CAUTION' : 'OPTIMAL'}
            </StatusPill>
          </div>

          {/* Hero Metric & Micro-Trend */}
          <div className="flex items-baseline justify-between gap-2 my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-headline text-3xl font-extrabold tracking-tight tabular-nums ${
                  isBatteryLow
                    ? 'text-red-400'
                    : isBatteryCaution
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                <AnimatedCounter value={batteryPercent} suffix="%" />
              </span>
              <span className="font-mono text-3xs text-slate-400">Reserve SoC</span>
            </div>

            {/* Micro-trend Delta Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-3xs font-semibold border ${
                batteryPercent >= 50
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
              title={batteryPercent >= 50 ? 'Net positive solar recharge balance' : 'Discharge rate elevated'}
            >
              {batteryPercent >= 50 ? (
                <>
                  <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>+0.4 kW</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>-1.8%/h</span>
                </>
              )}
            </div>
          </div>

          {/* Telemetry Progress Bar with 20% Return Threshold Marker */}
          <div className="space-y-1.5">
            <div
              className="relative w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden border border-white/5"
              role="progressbar"
              aria-valuenow={Math.round(batteryPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Rover battery state of charge percentage"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBatteryLow
                    ? 'bg-red-500 shadow-sm shadow-red-500/50'
                    : isBatteryCaution
                    ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                    : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, batteryPercent))}%` }}
              />
              {/* 20% Safe Return Floor */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                style={{ left: '20%' }}
                title="20% Safe Return Reserve Floor"
                aria-hidden="true"
              />
            </div>

            {/* Sub-bar Metadata Row */}
            <div className="flex justify-between items-center text-3xs font-mono text-slate-400 leading-none pt-0.5">
              <span>Margin: <strong className={batteryPercent >= 50 ? 'text-emerald-300' : 'text-amber-300'}>{batteryPercent >= 50 ? 'Safe' : 'Constrained'}</strong></span>
              <span className="text-slate-400">Reserve Floor: <strong className="text-slate-300">20%</strong></span>
            </div>
          </div>
        </article>

        {/* KPI 3: Route Plan Status & Navigation Trajectory */}
        <article
          className={`p-4 md:p-4.5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden group ${
            isReplanning
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 shadow-amber-500/5'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
          aria-label="Route Trajectory Telemetry"
        >
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Route
                className={`w-4 h-4 shrink-0 ${isReplanning ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`}
                aria-hidden="true"
              />
              <span className="font-mono text-3xs text-slate-300 uppercase font-bold tracking-wider">
                Route Status
              </span>
            </div>
            <StatusPill
              tone={isReplanning ? 'warning' : 'success'}
              pulse={isReplanning}
              isLive={true}
              className="py-0.5 px-2 text-3xs"
            >
              {isReplanning ? 'REPLANNING' : 'LOCKED'}
            </StatusPill>
          </div>

          {/* Hero Metric & Micro-Trend */}
          <div className="flex items-baseline justify-between gap-2 my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-tight ${
                  isReplanning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {isReplanning ? 'REPLANNING...' : 'ON TRACK'}
              </span>
            </div>

            {/* Micro-trend / ETA Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-3xs font-semibold border ${
                isReplanning
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{isReplanning ? '+14m 22s' : 'ETA: T-2.5h'}</span>
            </div>
          </div>

          {/* Telemetry Trajectory Segment Indicator */}
          <div className="space-y-1.5">
            <div
              className="relative w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden border border-white/5 flex gap-1"
              role="progressbar"
              aria-valuenow={isReplanning ? 65 : 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Route trajectory progress"
            >
              <div className={`h-full rounded-l-full flex-1 transition-all duration-500 ${isReplanning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className={`h-full flex-1 transition-all duration-500 ${isReplanning ? 'bg-amber-500/80' : 'bg-emerald-500'}`} />
              <div className={`h-full flex-1 transition-all duration-500 ${isReplanning ? 'bg-amber-500/50' : 'bg-emerald-500'}`} />
              <div className={`h-full rounded-r-full flex-1 transition-all duration-500 ${isReplanning ? 'bg-slate-700/60 animate-pulse' : 'bg-emerald-500'}`} />
            </div>

            {/* Sub-bar Metadata Row */}
            <div className="flex justify-between items-center text-3xs font-mono text-slate-400 leading-none pt-0.5">
              <span>Distance: <strong className="text-slate-200 font-bold">{distanceKm.toFixed(2)} km</strong></span>
              <span>Waypoints: <strong className={isReplanning ? 'text-amber-300' : 'text-emerald-300'}>{isReplanning ? 'Recalculating' : '8/8 Clear'}</strong></span>
            </div>
          </div>
        </article>
      </section>

      {/* Expandable Drawer Toggle Control */}
      <div className="flex justify-center -mt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          aria-expanded={isDrawerOpen}
          aria-controls="constellation-diagnostics-drawer"
          rightIcon={
            isDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )
          }
          className="text-3xs font-mono uppercase tracking-widest px-4 !py-1 !min-h-[32px] rounded-full shadow-md backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-150"
        >
          {isDrawerOpen ? 'Hide Diagnostics' : 'Constellation Diagnostics & Space Weather'}
        </Button>
      </div>

      {/* Expandable Diagnostics Drawer — Umami/Plausible Drilldown Dashboard */}
      {isDrawerOpen && (
        <Card
          id="constellation-diagnostics-drawer"
          role="region"
          aria-label="Constellation Diagnostics and Space Weather"
          variant="default"
          padding="md"
          className="backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200 border border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Current Relay Links (Constellation) */}
            <section className="flex flex-col gap-2.5" aria-label="Relay Constellation Status">
              <header className="font-mono text-3xs text-slate-300 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                  <span>Current Relay Links</span>
                </div>
                <span className="text-3xs font-mono text-slate-400 font-normal">
                  {activeRelays.length}/{totalRelays} Online
                </span>
              </header>

              <div className="space-y-2" role="list">
                {relays.map((r) => {
                  const isOffline = r.status === 'offline';
                  const isCandidate = r.status === 'candidate';
                  const isDegraded = r.status === 'degraded';
                  const tone = isOffline
                    ? 'destructive'
                    : isCandidate
                    ? 'accent'
                    : isDegraded
                    ? 'warning'
                    : 'success';
                  const label = isOffline
                    ? 'FAILURE'
                    : isCandidate
                    ? 'STANDBY'
                    : isDegraded
                    ? 'DEGRADED'
                    : 'ACTIVE';

                  return (
                    <div
                      key={r.id}
                      role="listitem"
                      className={`flex justify-between items-center text-xs p-2.5 rounded-xl border backdrop-blur-md transition-all duration-150 ${
                        isOffline
                          ? 'bg-red-500/10 border-red-500/20 text-red-200'
                          : isCandidate
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                          : isDegraded
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-100">{r.name}</span>
                          <span className="font-mono text-3xs text-slate-400 uppercase">
                            [{r.code}]
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-3xs font-mono text-slate-400">
                          <span>{r.frequencyBand}</span>
                          <span>•</span>
                          <span>{r.elevKm} km el</span>
                        </div>
                      </div>

                      <StatusPill tone={tone} className="py-0.5 px-2">
                        {label}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Column 2: Space Weather [DONKI] */}
            <section className="flex flex-col gap-2.5" aria-label="Space Weather DONKI Status">
              <header className="font-mono text-3xs text-slate-300 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>Space Weather [DONKI]</span>
                </div>
                <StatusPill tone="warning" className="py-0.5 px-2 text-3xs">
                  MODERATE
                </StatusPill>
              </header>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-3xs text-slate-300 font-medium">Solar Particle Event (SPE) Risk</span>
                  <span className="text-xs font-mono font-bold text-amber-400">Class M2.4</span>
                </div>

                {/* Histogram Bar Graphic — Umami Spark-Bar Analytics */}
                <div
                  className="flex flex-col gap-1 my-1"
                  aria-label="Solar particle event flux histogram over time"
                >
                  <div className="flex gap-1.5 h-10 items-end">
                    <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[25%]" title="T-06h: Baseline" />
                    <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[40%]" title="T-04h: Minor Fluctuation" />
                    <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[35%]" title="T-02h: Nominal" />
                    <div className="flex-1 bg-amber-500 rounded-t-sm h-[75%] shadow-sm shadow-amber-500/50" title="NOW: Rising Solar Flux" />
                    <div className="flex-1 bg-amber-500 rounded-t-sm h-[90%] shadow-sm shadow-amber-500/50" title="+02h: Peak Flux Forecast" />
                    <div className="flex-1 bg-slate-700/80 rounded-t-sm h-[30%]" title="+04h: Recovery Expected" />
                  </div>
                  {/* Histogram Timeline Axis Labels */}
                  <div className="flex justify-between text-3xs font-mono text-slate-400 px-0.5">
                    <span>-6h</span>
                    <span>-4h</span>
                    <span>-2h</span>
                    <span className="text-amber-300 font-bold">NOW</span>
                    <span>+2h</span>
                    <span>+4h</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-3xs text-amber-200/90 leading-relaxed">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>CME shock front arrival in T-04:20:00. Comm margins may degrade in high-polar shadow corridors.</span>
                </div>
              </div>
            </section>

            {/* Column 3: Excursion Telemetry & Dynamics */}
            <section className="flex flex-col gap-2.5" aria-label="Excursion Flight Telemetry">
              <header className="font-mono text-3xs text-slate-300 uppercase tracking-wider font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Excursion Telemetry</span>
                </div>
                <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </header>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <MetricLabel
                    label="Shelter Range"
                    value={`${distanceKm.toFixed(2)} km`}
                    valueTone="neutral"
                  />
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <MetricLabel
                    label="Surface Temp"
                    value="-153 °C"
                    valueTone="accent"
                  />
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <MetricLabel
                    label="Avg Velocity"
                    value="4.2 km/h"
                    valueTone="success"
                  />
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <MetricLabel
                    label="Sun Elevation"
                    value="1.8° Polar"
                    valueTone="warning"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onForceRecalc}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  className="w-full bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300 font-mono text-3xs font-bold !min-h-[36px]"
                >
                  RE-CALCULATE TELEMETRY
                </Button>
              </div>
            </section>
          </div>
        </Card>
      )}
    </div>
  );
};
