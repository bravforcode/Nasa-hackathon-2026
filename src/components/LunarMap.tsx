/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Radio,
  Sun,
  Navigation,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RelayNode, ScienceSite, DeadZone, PlanOption, FailureScenarioType, LunarRegion } from '../types';
import { latLonToLocalKm, localKmToLatLon } from '../utils/powerModel';

// NASA Trek Moon WMTS — LOLA-derived shaded relief (live-verified 2026-08-26).
// Max native zoom is 5 (z6+ returns 404); Leaflet upscales beyond that.
const TREK_TILE_URL =
  'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png';

// SVG viewBox and world scale — MUST stay consistent with solver.ts mapping
// (MAP_EXTENT_HALF_KM = 30 km maps onto +/-50% of each axis).
const VB_W = 1000;
const VB_H = 800;
const MAP_HALF_KM = 30;
const PX_PER_KM_X = VB_W / (2 * MAP_HALF_KM); // ~16.67 px/km
const PX_PER_KM_Y = VB_H / (2 * MAP_HALF_KM); // ~13.33 px/km

interface LunarMapProps {
  relays: RelayNode[];
  scienceSites: ScienceSite[];
  deadZones: DeadZone[];
  activePlan: PlanOption;
  activeScenario: FailureScenarioType;
  isMitigationActive: boolean;
  /** Region anchor used for the lat/lon <-> map-plane projection. */
  region?: Pick<LunarRegion, 'centerLat' | 'centerLon'>;
  /** Live geometry update when a relay node is dragged. */
  onMoveRelay?: (relayId: string, lat: number, lon: number) => void;
  /** Live update when a dead zone is dragged (map percentages). */
  onMoveDeadZone?: (zoneId: string, xPercent: number, yPercent: number) => void;
  onSelectRelay?: (relay: RelayNode) => void;
  onDeployMitigationRelay?: () => void;
}

function parseAnchor(value: string | undefined, negativeHemisphere: RegExp, fallback: number): number {
  if (!value) return fallback;
  const num = Number(value.replace(/[^\d.\-]/g, ''));
  if (!Number.isFinite(num)) return fallback;
  return negativeHemisphere.test(value) ? -Math.abs(num) : Math.abs(num);
}

export const LunarMap: React.FC<LunarMapProps> = ({
  relays,
  scienceSites,
  deadZones,
  activePlan,
  activeScenario,
  isMitigationActive,
  region,
  onMoveRelay,
  onMoveDeadZone,
  onSelectRelay,
  onDeployMitigationRelay,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCoverage, setShowCoverage] = useState<boolean>(true);
  const [showLinks, setShowLinks] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showIllumination, setShowIllumination] = useState<boolean>(true);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [hoveredRelay, setHoveredRelay] = useState<RelayNode | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragKind, setDragKind] = useState<'relay' | 'deadzone' | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Region anchor (signed decimal degrees). Falls back to Shackleton area.
  const anchorLat = parseAnchor(region?.centerLat, /S/i, -89.9);
  const anchorLon = parseAnchor(region?.centerLon, /W/i, 0);

  // --- Projection helpers (single source of truth with the solver) ---
  const project = (lat: number, lon: number): { x: number; y: number } => {
    const { xKm, yKm } = latLonToLocalKm(lat, lon, anchorLat, anchorLon);
    return { x: VB_W / 2 + xKm * PX_PER_KM_X, y: VB_H / 2 - yKm * PX_PER_KM_Y };
  };

  const unproject = (vx: number, vy: number): { lat: number; lon: number } => {
    let xKm = (vx - VB_W / 2) / PX_PER_KM_X;
    let yKm = (VB_H / 2 - vy) / PX_PER_KM_Y;
    xKm = Math.max(-MAP_HALF_KM + 1, Math.min(MAP_HALF_KM - 1, xKm));
    yKm = Math.max(-MAP_HALF_KM + 1, Math.min(MAP_HALF_KM - 1, yKm));
    return localKmToLatLon(xKm, yKm, anchorLat, anchorLon);
  };

  // --- NASA Trek basemap (non-interactive layer under the SVG overlay) ---
  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = L.map(mapDivRef.current, {
      crs: L.CRS.EPSG4326,
      center: [anchorLat, anchorLon],
      zoom: 7,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer(TREK_TILE_URL, {
      maxNativeZoom: 5,
      maxZoom: 8,
      attribution: 'Imagery: NASA LRO / LOLA shaded relief via Trek',
    }).addTo(map);
    return () => {
      map.remove();
    };
  }, [anchorLat, anchorLon]);

  // --- Drag handling (relays -> lat/lon, dead zones -> map %) ---
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * VB_W;
    const vy = ((e.clientY - rect.top) / rect.height) * VB_H;
    if (dragKind === 'relay' && onMoveRelay) {
      const { lat, lon } = unproject(vx, vy);
      onMoveRelay(dragId, lat, lon);
    } else if (dragKind === 'deadzone' && onMoveDeadZone) {
      const xPercent = Math.max(2, Math.min(98, vx / 10));
      const yPercent = Math.max(2, Math.min(98, vy / 8));
      onMoveDeadZone(dragId, xPercent, yPercent);
    }
  };

  const endDrag = () => { setDragId(null); setDragKind(null); };

  // Projected positions for every data-backed node.
  const nodePos: Record<string, { x: number; y: number }> = {};
  for (const r of relays) nodePos[r.id] = project(r.lat, r.lon);

  const relayB = relays.find(r => r.id === 'relay_bravo');
  const isRelayBFailure = relayB?.status === 'offline';

  // Decorative anchors (illustrative, not data-projected)
  const baseAlpha = { x: 220, y: 760, name: 'LUNAR BASE ALPHA', code: 'BASE-01' };
  const roverPos = { x: 740, y: 280, name: 'VIPER ROVER 01', distKm: 6.0 };

  const pos = (id: string, fb: { x: number; y: number }) => nodePos[id] ?? fb;

  return (
    <div className="relative w-full h-full bg-[#030611] overflow-hidden flex flex-col select-none">
      {/* Top Map Overlays */}
      <div className="absolute top-3.5 left-3.5 z-30 flex flex-wrap gap-2.5 pointer-events-none">
        <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 backdrop-blur-xl shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="font-mono text-[10px] text-slate-400 font-bold tracking-wider uppercase">ANCHOR:</span>
          <span className="font-mono text-xs font-semibold text-white">
            {region ? `${region.centerLat} ${region.centerLon}` : `${Math.abs(anchorLat).toFixed(2)}°S ${anchorLon.toFixed(2)}°E`}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">| Trek LOLA Tiles</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 backdrop-blur-xl shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="font-mono text-[10px] text-slate-400 font-bold tracking-wider uppercase">SOLAR INCIDENCE:</span>
          <span className="font-mono text-xs text-emerald-400 font-bold">1.4° AZ 142°</span>
        </div>
      </div>

      {/* Map Layer Toolbar (Left Floating Rail) */}
      <div className="absolute top-16 left-3.5 z-30 flex flex-col gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-2xl shadow-2xl">
        <button
          onClick={() => setShowCoverage(!showCoverage)}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showCoverage ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-inner' : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
          title="Toggle RF Coverage Radii"
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowLinks(!showLinks)}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showLinks ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-inner' : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
          title="Toggle Line-of-Sight Mesh Links"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowContours(!showContours)}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showContours ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-inner' : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
          title="Toggle Topographic Slope Contours"
        >
          <Navigation className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowIllumination(!showIllumination)}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showIllumination ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner' : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
          title="Toggle Solar Shadow / Peak Exposure"
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom and Center Controls (Bottom Left) */}
      <div className="absolute bottom-4 left-3.5 z-30 flex items-center gap-1.5 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-2xl shadow-2xl">
        <button
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 flex items-center justify-center font-mono transition-all cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-slate-300 px-1.5 min-w-[36px] text-center font-semibold">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 flex items-center justify-center font-mono transition-all cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-px bg-white/10 mx-1"></div>
        <button
          onClick={() => setZoomLevel(1)}
          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-blue-300 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Reset Center"
        >
          <Crosshair className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Interactive Canvas: Trek tiles under a data-projected SVG layer */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <div
          className="relative w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* NASA Trek WMTS basemap (LOLA shaded relief) */}
          <div ref={mapDivRef} className="absolute inset-0 z-0 grayscale opacity-80 [&_.leaflet-control-attribution]:!bg-black/60 [&_.leaflet-control-attribution]:!text-[9px] [&_.leaflet-control-attribution]:!text-slate-400" />

          {/* Vignette above tiles for UI legibility */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 45%, rgba(5,6,10,0.05) 0%, rgba(5,6,10,0.55) 85%)' }}
          />

          {/* SVG Map Graphics Layer (data-projected) */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full z-10"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <defs>
              <radialGradient id="grad-relay-nominal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4C8DFF" stopOpacity="0.30" />
                <stop offset="70%" stopColor="#4C8DFF" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#4C8DFF" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-relay-mitigated" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00FF94" stopOpacity="0.34" />
                <stop offset="65%" stopColor="#00FF94" stopOpacity="0.11" />
                <stop offset="100%" stopColor="#00FF94" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-deadzone" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF4C4C" stopOpacity="0.18" />
                <stop offset="80%" stopColor="#FF4C4C" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#FF4C4C" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="sun-shadow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Topographic Contours (decorative) */}
            {showContours && (
              <g className="stroke-[#424753]/40 stroke-[0.75] fill-none" opacity="0.5">
                <ellipse cx="500" cy="420" rx="340" ry="240" />
                <ellipse cx="500" cy="420" rx="270" ry="190" strokeDasharray="3 3" />
                <ellipse cx="500" cy="420" rx="190" ry="130" />
                <path d="M 120,700 Q 300,500 500,450 T 880,240" stroke="#424753" strokeWidth="1" />
              </g>
            )}

            {/* Permanent Shadow Region (PSR) indicator */}
            {showIllumination && (
              <g opacity="0.45">
                <path d="M 440,380 Q 500,340 560,390 L 590,470 Q 500,520 410,460 Z" fill="url(#sun-shadow-grad)" />
                <text x="470" y="440" fill="#8c909f" fontSize="9" fontFamily="JetBrains Mono" opacity="0.6">
                  PSR VOLATILES COLD TRAP (38 K)
                </text>
              </g>
            )}

            {/* Dead Zones — SAME km scale as the coverage model */}
            {deadZones.map((dz) => {
              const cx = (dz.xPercent / 100) * VB_W;
              const cy = (dz.yPercent / 100) * VB_H;
              const rx = dz.radiusKm * PX_PER_KM_X;
              const ry = dz.radiusKm * PX_PER_KM_Y;
              const isMitigated = isMitigationActive && dz.id === 'dzone_2';

              return (
                <g
                  key={dz.id}
                  className="transition-opacity duration-300"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => {
                    if (onMoveDeadZone) {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      setDragId(dz.id);
                      setDragKind('deadzone');
                    }
                  }}
                >
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill={isMitigated ? 'none' : 'url(#grad-deadzone)'}
                    stroke={isMitigated ? '#00FF94' : '#FF4C4C'}
                    strokeWidth={isMitigated ? '1' : '1.5'}
                    strokeDasharray={isMitigated ? '4 4' : '6 4'}
                    opacity={isMitigated ? 0.3 : 0.9}
                  />
                  <text x={cx} y={cy} textAnchor="middle" fill={isMitigated ? '#00FF94' : '#FF4C4C'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="700" className="select-none">
                    {dz.code} {isMitigated ? '[CLOSED]' : '[DEAD ZONE]'}
                  </text>
                </g>
              );
            })}

            {/* RF Coverage Footprints — TRUE projected ellipses in km scale */}
            {showCoverage && relays.map((relay) => {
              if (relay.status === 'offline') return null;
              if (relay.isCandidate && !isMitigationActive) return null;
              const p = nodePos[relay.id];
              if (!p) return null;
              return (
                <ellipse
                  key={`cov-${relay.id}`}
                  cx={p.x}
                  cy={p.y}
                  rx={relay.coverageRadiusKm * PX_PER_KM_X}
                  ry={relay.coverageRadiusKm * PX_PER_KM_Y}
                  fill={relay.isCandidate ? 'url(#grad-relay-mitigated)' : 'url(#grad-relay-nominal)'}
                  stroke={relay.isCandidate ? '#00FF94' : '#4C8DFF'}
                  strokeWidth="0.75"
                  opacity={0.65}
                />
              );
            })}
            {/* Line-of-Sight Mesh Links between projected nodes */}
            {showLinks && (() => {
              const a = pos('relay_alpha', { x: 410, y: 290 });
              const b = pos('relay_bravo', { x: 680, y: 520 });
              const c = pos('relay_charlie', { x: 820, y: 220 });
              const apex = pos('relay_shackleton_apex', { x: 580, y: 460 });
              return (
                <g strokeWidth="1.2">
                  <line x1={baseAlpha.x} y1={baseAlpha.y} x2={a.x} y2={a.y} stroke="#4C8DFF" strokeDasharray="4 4" opacity="0.8" />
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isRelayBFailure ? '#FF4C4C' : '#4C8DFF'}
                    strokeDasharray={isRelayBFailure ? '3 3' : '4 4'}
                    strokeWidth={isRelayBFailure ? 1.5 : 1.2}
                    className={isRelayBFailure ? 'broken-link' : undefined}
                    opacity={isRelayBFailure ? 0.7 : 0.6}
                  />
                  <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#4C8DFF" strokeDasharray="4 4" opacity="0.5" />
                  {isMitigationActive && (
                    <>
                      <line x1={apex.x} y1={apex.y} x2={a.x} y2={a.y} stroke="#00FF94" strokeWidth="1.8" opacity="0.9" />
                      <line x1={apex.x} y1={apex.y} x2={baseAlpha.x} y2={baseAlpha.y} stroke="#00FF94" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.8" />
                    </>
                  )}
                </g>
              );
            })()}

            {/* Planned Trajectory Paths (decorative overlays) */}
            {activePlan === 'safety' && (
              <path
                d={`M ${roverPos.x},${roverPos.y} Q 540,420 ${baseAlpha.x},${baseAlpha.y}`}
                fill="none" stroke="#00FF94" strokeWidth="3.5" strokeLinecap="round" className="animate-dash-slow"
              />
            )}

            {activePlan === 'balanced' && (
              <g>
                <path
                  d={`M ${roverPos.x},${roverPos.y} Q 620,240 450,290 T 320,540 T ${baseAlpha.x},${baseAlpha.y}`}
                  fill="none" stroke="#4C8DFF" strokeWidth="3.5" strokeLinecap="round" className="animate-dash-slow"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(76,141,255,0.7))' }}
                />
                <circle cx="450" cy="290" r="3" fill="#ffffff" />
                <circle cx="320" cy="540" r="3" fill="#ffffff" />
              </g>
            )}

            {activePlan === 'science' && (
              <path
                d={`M ${roverPos.x},${roverPos.y} L 850,380 Q 750,680 480,720 L ${baseAlpha.x},${baseAlpha.y}`}
                fill="none"
                stroke={isRelayBFailure ? '#FF4C4C' : '#FFB800'}
                strokeWidth={isRelayBFailure ? '2.5' : '3.5'}
                strokeDasharray={isRelayBFailure ? '4 4' : 'none'}
                strokeLinecap="round"
              />
            )}

            {/* Science Sites — projected from their real lat/lon */}
            {scienceSites.map((site) => {
              const sp = project(site.lat, site.lon);
              const isCompleted = site.status === 'completed';
              const isActiveSite = site.status === 'active';
              const isAtRisk = isRelayBFailure && site.id === 'site_echo';

              return (
                <g
                  key={site.id}
                  className="cursor-pointer"
                  onMouseEnter={() => { setHoveredLabel(`SITE ${site.code}`); setHoveredRelay(null); }}
                  onMouseLeave={() => setHoveredLabel(null)}
                >
                  <circle
                    cx={sp.x}
                    cy={sp.y}
                    r={isActiveSite ? 7 : 5}
                    fill={isCompleted ? '#00FF94' : isAtRisk ? '#FF4C4C' : '#aec6ff'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text x={sp.x + 10} y={sp.y + 4} fill="#dee2f6" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                    {site.code} {isCompleted ? '[COMPLETE]' : isAtRisk ? '[AT RISK]' : ''}
                  </text>
                </g>
              );
            })}

            {/* Relay Tower Nodes — projected from live lat/lon, DRAGGABLE */}
            {relays.map((relay) => {
              if (relay.isCandidate && !isMitigationActive) return null;
              const p = nodePos[relay.id];
              if (!p) return null;
              const isOffline = relay.status === 'offline';
              const isApex = relay.isCandidate === true;
              const color = isOffline ? '#FF4C4C' : isApex ? '#00FF94' : '#4C8DFF';
              const label = isOffline
                ? `${relay.code} [ERR: OFFLINE]`
                : isApex
                  ? 'R-APEX (ACTIVE)'
                  : `${relay.code}`;

              return (
                <g
                  key={relay.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className={onMoveRelay && !isApex ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => {
                    if (onMoveRelay && !isApex) {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      setDragId(relay.id);
                      setDragKind('relay');
                    }
                  }}
                  onClick={() => onSelectRelay && onSelectRelay(relay)}
                  onMouseEnter={() => { setHoveredLabel(label); setHoveredRelay(relay); }}
                  onMouseLeave={() => { setHoveredLabel(null); setHoveredRelay(null); }}
                >
                  {isOffline && <circle cx="0" cy="0" r="16" fill="none" stroke="#FF4C4C" strokeWidth="1.5" className="animate-ping" opacity="0.6" />}
                  {isApex && <circle cx="0" cy="0" r="16" fill="none" stroke="#00FF94" strokeWidth="2" className="animate-pulse" />}
                  {!isOffline && !isApex && (
                    <circle cx="0" cy="0" r="14" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                  )}
                  <circle cx="0" cy="0" r={isApex ? 7 : 5} fill={isOffline ? '#303444' : color} stroke={isOffline ? '#FF4C4C' : 'none'} strokeWidth={isOffline ? 2 : 0} />
                  <text x="12" y="4" fill={color} fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                    {label}
                  </text>
                  {dragId === relay.id && (
                    <text x="12" y="-10" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                      DRAGGING — coverage recomputes live
                    </text>
                  )}
                </g>
              );
            })}

            {/* Candidate ghost button when Apex not deployed (decorative position) */}
            {!isMitigationActive && (
              <g
                transform="translate(500, 400)"
                className="cursor-pointer group"
                onClick={onDeployMitigationRelay}
                onMouseEnter={() => setHoveredLabel('+ DEPLOY APEX RELAY')}
                onMouseLeave={() => setHoveredLabel(null)}
              >
                <circle cx="0" cy="0" r="12" fill="#0e1321" stroke="#5de6ff" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="0" cy="0" r="3" fill="#5de6ff" />
                <text x="14" y="2" fill="#5de6ff" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700">
                  + DEPLOY APEX RELAY
                </text>
                <text x="14" y="14" fill="#8c909f" fontSize="7" fontFamily="JetBrains Mono">
                  (CLOSES DEAD ZONE 2)
                </text>
              </g>
            )}

            {/* Base Alpha Habitat Marker (decorative) */}
            <g transform={`translate(${baseAlpha.x}, ${baseAlpha.y})`}>
              <rect x="-12" y="-12" width="24" height="24" fill="#0e1321" stroke="#4C8DFF" strokeWidth="2" rx="3" />
              <rect x="-6" y="-6" width="12" height="12" fill="#4C8DFF" rx="2" />
              <text x="18" y="4" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono" fontWeight="800">
                {baseAlpha.name}
              </text>
              <text x="18" y="16" fill="#8c909f" fontSize="8" fontFamily="JetBrains Mono">
                HABITAT SHELTER &amp; EPS
              </text>
            </g>

            {/* VIPER Rover Marker (decorative) */}
            <g transform={`translate(${roverPos.x}, ${roverPos.y})`}>
              <circle cx="0" cy="0" r="14" fill="none" stroke="#00FF94" strokeWidth="1.5" className="animate-pulse" />
              <circle cx="0" cy="0" r="6" fill="#00FF94" />
              <line x1="0" y1="0" x2="-18" y2="12" stroke="#00FF94" strokeWidth="2" />
              <text x="16" y="-2" fill="#00FF94" fontSize="11" fontFamily="JetBrains Mono" fontWeight="800">
                VIPER ROVER 01
              </text>
              <text x="16" y="10" fill="#8c909f" fontSize="8" fontFamily="JetBrains Mono">
                DISTANCE TO HAB: {roverPos.distKm.toFixed(2)} KM
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Floating Hover Context Card — REAL node data, not canned telemetry */}
      {(hoveredLabel || hoveredRelay) && (
        <div className="absolute bottom-16 right-4 z-40 bg-[#02040a]/90 border border-blue-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl max-w-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 border-b border-white/10 pb-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>NODE TELEMETRY INSPECTION</span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target:</span>
              <span className="font-bold text-white uppercase">{(hoveredLabel ?? '').replace('_', ' ')}</span>
            </div>
            {hoveredRelay ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevation:</span>
                  <span className="text-emerald-400 font-bold">+{hoveredRelay.elevKm.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RF Band:</span>
                  <span className="text-blue-300 text-right max-w-[160px]">{hoveredRelay.frequencyBand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage Radius:</span>
                  <span className="text-blue-300 font-bold">{hoveredRelay.coverageRadiusKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Position:</span>
                  <span className="text-slate-200">
                    {Math.abs(hoveredRelay.lat).toFixed(2)}°{hoveredRelay.lat <= 0 ? 'S' : 'N'} {Math.abs(hoveredRelay.lon).toFixed(2)}°{hoveredRelay.lon >= 0 ? 'E' : 'W'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold uppercase ${hoveredRelay.status === 'offline' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {hoveredRelay.status} ({hoveredRelay.healthPercent}%)
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-slate-200">Science waypoint</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
