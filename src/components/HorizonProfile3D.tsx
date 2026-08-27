/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useId } from 'react';
import { Card, StatusPill, MetricLabel, IconButton } from './ui';
import { SyntheticPolarTerrain, detailedHorizonSweep, type DetailedHorizonSweepResult } from '../utils/terrain';
import { Compass, Sun, Radio, Mountain, ZoomIn, ZoomOut } from 'lucide-react';

export interface HorizonProfile3DProps {
  latDeg?: number;
  lonDeg?: number;
  siteName?: string;
  sunElevationDeg?: number;
  sunAzimuthDeg?: number;
  className?: string;
}

export const HorizonProfile3D: React.FC<HorizonProfile3DProps> = ({
  latDeg = -89.9,
  lonDeg = 0.0,
  siteName = 'Shackleton Rim Site A',
  sunElevationDeg = 1.4,
  sunAzimuthDeg = 135,
  className = '',
}) => {
  const sliderId = useId();
  const [selectedAzimuth, setSelectedAzimuth] = useState<number>(sunAzimuthDeg);
  const [mastHeightM, setMastHeightM] = useState<number>(12);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const terrain = useMemo(() => new SyntheticPolarTerrain(), []);

  const sweep: DetailedHorizonSweepResult = useMemo(() => {
    return detailedHorizonSweep(terrain, latDeg, lonDeg, {
      azimuths: 36,
      maxDistKm: 30,
      stepKm: 0.75,
      mastHeightM,
    });
  }, [terrain, latDeg, lonDeg, mastHeightM]);

  // Find ray closest to selected azimuth
  const currentRay = useMemo(() => {
    return sweep.rays.reduce((prev, curr) => {
      return Math.abs(curr.azimuthDeg - selectedAzimuth) < Math.abs(prev.azimuthDeg - selectedAzimuth)
        ? curr
        : prev;
    }, sweep.rays[0]);
  }, [sweep, selectedAzimuth]);

  // Sun obstruction status
  const sunRay = useMemo(() => {
    return sweep.rays.reduce((prev, curr) => {
      return Math.abs(curr.azimuthDeg - sunAzimuthDeg) < Math.abs(prev.azimuthDeg - sunAzimuthDeg)
        ? curr
        : prev;
    }, sweep.rays[0]);
  }, [sweep, sunAzimuthDeg]);

  const isSunOccluded = sunRay.horizonAngleDeg > sunElevationDeg;

  // Polar radar path calculation
  const polarCenter = 120;
  const polarRadius = 95 * zoomLevel;

  const polarPath = useMemo(() => {
    if (!sweep.rays.length) return '';
    return sweep.rays
      .map((r, i) => {
        const rad = (r.azimuthDeg * Math.PI) / 180 - Math.PI / 2;
        // Clamp elevation angle to radius: max 15 deg = full radius, -5 deg = inner ring
        const normalizedH = Math.max(0, Math.min(1, (r.horizonAngleDeg + 5) / 20));
        const dist = 30 + normalizedH * (polarRadius - 30);
        const x = polarCenter + dist * Math.cos(rad);
        const y = polarCenter + dist * Math.sin(rad);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .concat('Z')
      .join(' ');
  }, [sweep.rays, polarRadius]);

  // Selected Azimuth pointer line
  const cursorRad = (selectedAzimuth * Math.PI) / 180 - Math.PI / 2;
  const cursorX = polarCenter + polarRadius * Math.cos(cursorRad);
  const cursorY = polarCenter + polarRadius * Math.sin(cursorRad);

  // Sun pointer line
  const sunRad = (sunAzimuthDeg * Math.PI) / 180 - Math.PI / 2;
  const sunX = polarCenter + polarRadius * Math.cos(sunRad);
  const sunY = polarCenter + polarRadius * Math.sin(sunRad);

  return (
    <Card
      as="section"
      variant="default"
      aria-label="Lunar Horizon and Line-of-Sight Polar Elevation Sweep"
      className={`relative overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
              Lunar Horizon & LOS Elevation Sweep (2D Polar Analysis)
            </h3>
            <p className="text-3xs text-[var(--color-text-muted)] font-mono">
              {siteName} ({latDeg.toFixed(2)}°S, {lonDeg.toFixed(2)}°E) · {sweep.observerElevationM}m ASL · Ray-Marched Polar Relief
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone={isSunOccluded ? 'warning' : 'success'}>
            {isSunOccluded ? 'SOLAR OCCLUSION' : 'DIRECT ILLUMINATION'}
          </StatusPill>
          <StatusPill tone={sweep.losFactor >= 0.85 ? 'success' : 'warning'}>
            LOS: {Math.round(sweep.losFactor * 100)}%
          </StatusPill>
        </div>
      </div>

      {/* Visualizer Canvas / SVG */}
      <div className="my-4 grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-xl bg-[var(--color-bg)]/80 p-3 border border-[var(--color-border-subtle)] relative">
          {/* Zoom controls */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <IconButton
              icon={<ZoomIn className="h-3.5 w-3.5" />}
              aria-label="Zoom In Horizon View"
              size="sm"
              variant="ghost"
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
            />
            <IconButton
              icon={<ZoomOut className="h-3.5 w-3.5" />}
              aria-label="Zoom Out Horizon View"
              size="sm"
              variant="ghost"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            />
          </div>

          <svg
            viewBox="0 0 240 240"
            className="h-56 w-56 md:h-64 md:w-64 max-w-full drop-shadow-md select-none"
            role="img"
            aria-label={`Polar horizon profile for ${siteName}. Max terrain angle ${sweep.maxHorizonDeg} degrees.`}
          >
            {/* Range rings */}
            <circle cx="120" cy="120" r={polarRadius} fill="none" stroke="var(--color-border-subtle)" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx="120" cy="120" r={polarRadius * 0.66} fill="none" stroke="var(--color-border-subtle)" strokeWidth="0.75" />
            <circle cx="120" cy="120" r={polarRadius * 0.33} fill="none" stroke="var(--color-border-subtle)" strokeWidth="0.75" />
            <circle cx="120" cy="120" r="4" fill="var(--color-accent)" />

            {/* Cardinal crosshairs */}
            <line x1="120" y1={120 - polarRadius} x2="120" y2={120 + polarRadius} stroke="var(--color-border-subtle)" strokeWidth="0.75" />
            <line x1={120 - polarRadius} y1="120" x2={120 + polarRadius} y2="120" stroke="var(--color-border-subtle)" strokeWidth="0.75" />

            {/* Cardinal Labels */}
            <text x="120" y={120 - polarRadius + 10} textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontWeight="bold">0° N</text>
            <text x={120 + polarRadius - 10} y="123" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontWeight="bold">90° E</text>
            <text x="120" y={120 + polarRadius - 3} textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontWeight="bold">180° S</text>
            <text x={120 - polarRadius + 10} y="123" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontWeight="bold">270° W</text>

            {/* Terrain Horizon Polygon */}
            <path
              d={polarPath}
              fill="var(--color-accent-subtle)"
              fillOpacity="0.25"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Blocked sectors highlighted */}
            {sweep.rays.filter((r) => r.isBlocked).map((r) => {
              const rad = (r.azimuthDeg * Math.PI) / 180 - Math.PI / 2;
              const x = polarCenter + polarRadius * Math.cos(rad);
              const y = polarCenter + polarRadius * Math.sin(rad);
              return (
                <circle
                  key={r.azimuthDeg}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="var(--color-warning)"
                  aria-hidden="true"
                />
              );
            })}

            {/* Sun Azimuth Vector */}
            <line
              x1="120"
              y1="120"
              x2={sunX}
              y2={sunY}
              stroke="var(--color-warning)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <circle cx={sunX} cy={sunY} r="4" fill="var(--color-warning)" />

            {/* Active Scrubbing Cursor */}
            <line
              x1="120"
              y1="120"
              x2={cursorX}
              y2={cursorY}
              stroke="var(--color-text)"
              strokeWidth="2"
            />
            <circle cx={cursorX} cy={cursorY} r="4" fill="var(--color-text)" />
          </svg>
        </div>

        {/* Telemetry & Siting Stats */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <MetricLabel label="Selected Azimuth" value={`${currentRay.azimuthDeg}°`} />
            <MetricLabel
              label="Horizon Elevation"
              value={`${currentRay.horizonAngleDeg > 0 ? '+' : ''}${currentRay.horizonAngleDeg}°`}
            />
            <MetricLabel label="Ridge Distance" value={`${currentRay.peakDistanceKm} km`} />
            <MetricLabel label="Ridge Peak" value={`${currentRay.peakElevationM} m`} />
          </div>

          <div className="rounded-lg bg-[var(--color-bg)]/50 p-2.5 border border-[var(--color-border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between text-3xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                <Sun className="h-3 w-3 text-[var(--color-warning)]" /> Sun Vector:
              </span>
              <span className="font-mono text-[var(--color-text)]">
                Az {sunAzimuthDeg}° · Elev +{sunElevationDeg}°
              </span>
            </div>
            <div className="flex items-center justify-between text-3xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                <Mountain className="h-3 w-3 text-[var(--color-accent)]" /> Max Obstruction:
              </span>
              <span className="font-mono text-[var(--color-text)]">
                +{sweep.maxHorizonDeg}° ({Math.round(sweep.blockedFraction * 100)}% arc blocked)
              </span>
            </div>
            <div className="flex items-center justify-between text-3xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                <Radio className="h-3 w-3 text-[var(--color-success)]" /> Mast Height:
              </span>
              <span className="font-mono text-[var(--color-text)]">{mastHeightM} meters</span>
            </div>
          </div>

          {/* Interactive Azimuth Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-3xs text-[var(--color-text-muted)]">
              <label htmlFor={sliderId} className="font-medium text-[var(--color-text)]">
                Scrub Azimuth Bearing
              </label>
              <span className="font-mono">{selectedAzimuth}°</span>
            </div>
            <input
              id={sliderId}
              type="range"
              min="0"
              max="350"
              step="10"
              value={selectedAzimuth}
              onChange={(e) => setSelectedAzimuth(Number(e.target.value))}
              onInput={(e) => setSelectedAzimuth(Number((e.target as HTMLInputElement).value))}
              aria-valuemin={0}
              aria-valuemax={350}
              aria-valuenow={selectedAzimuth}
              aria-valuetext={`${selectedAzimuth} degrees azimuth bearing, horizon angle ${currentRay.horizonAngleDeg} degrees`}
              className="w-full h-2 bg-[var(--color-border-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </div>

          {/* Mast Height Controls */}
          <div className="flex items-center gap-2">
            <span className="text-3xs text-[var(--color-text-muted)]">Mast Height:</span>
            {[6, 12, 20].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setMastHeightM(h)}
                className={`px-2 py-1 text-3xs rounded font-mono transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                  mastHeightM === h
                    ? 'bg-[var(--color-accent)] text-white font-bold'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {h}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
