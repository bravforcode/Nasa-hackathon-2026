/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  Eye, 
  EyeOff, 
  Radio, 
  ShieldAlert, 
  Sun, 
  Navigation,
  Info,
  CheckCircle2
} from 'lucide-react';
import { RelayNode, ScienceSite, DeadZone, PlanOption, FailureScenarioType } from '../types';

interface LunarMapProps {
  relays: RelayNode[];
  scienceSites: ScienceSite[];
  deadZones: DeadZone[];
  activePlan: PlanOption;
  activeScenario: FailureScenarioType;
  isMitigationActive: boolean;
  onSelectRelay?: (relay: RelayNode) => void;
  onDeployMitigationRelay?: () => void;
  onCenterRover?: () => void;
  onToggleDeadZones?: () => void;
}

export const LunarMap: React.FC<LunarMapProps> = ({
  relays,
  scienceSites,
  deadZones,
  activePlan,
  activeScenario,
  isMitigationActive,
  onSelectRelay,
  onDeployMitigationRelay,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCoverage, setShowCoverage] = useState<boolean>(true);
  const [showLinks, setShowLinks] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showIllumination, setShowIllumination] = useState<boolean>(true);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  const relayB = relays.find(r => r.id === 'relay_bravo');
  const isRelayBFailure = relayB?.status === 'offline';

  // Base Alpha Coordinates on canvas (scaled 0..1000)
  const baseAlpha = { x: 220, y: 760, name: 'LUNAR BASE ALPHA', code: 'BASE-01' };
  // Rover Coordinates
  const roverPos = { x: 740, y: 280, name: 'VIPER ROVER 01', distKm: 6.0 };

  return (
    <div className="relative w-full h-full bg-[#030611] overflow-hidden flex flex-col select-none">
      {/* Top Map Overlays: Coordinates & Mode indicator */}
      <div className="absolute top-3.5 left-3.5 z-30 flex flex-wrap gap-2.5 pointer-events-none">
        <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 backdrop-blur-xl shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="font-mono text-[10px] text-slate-400 font-bold tracking-wider uppercase">COORD:</span>
          <span className="font-mono text-xs font-semibold text-white">89.12°S 17.54°E</span>
          <span className="text-[10px] text-slate-400 font-mono">| LOLA 5m DEM</span>
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

      {/* Main Interactive Canvas / SVG Layer */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <div 
          className="relative w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Stark Realistic Lunar Crater Topography Texture */}
          <div 
            className="absolute inset-0 bg-cover bg-center grayscale opacity-70 mix-blend-screen pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 45% 45%, rgba(14, 19, 33, 0.2) 0%, #05060A 80%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOCJjOM07iFzDdWly9-9QRbV1XNsZg-Z6ecWRDQ3H21QiLy4TYaUNaIJKPc12uPyW5f0hka_e--kit61IqH04rf5sm1tDHD3aQHJHPlQ-H97cq8wI6JcvQJjKCeHf9HtijHeMXRDnFTE1xHwoE5kOczBZZPjT2RnDSnd6MuHcqJDo1R-fs6URZDO0H1rOvMK13d_UDevI5iE1PGLElpk52ClMZg7JoYlsUpSNKXXHxB6JWYqwugmHq')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* SVG Map Graphics Layer */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              {/* Radial Gradients for Signal Footprints */}
              <radialGradient id="grad-relay-nominal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4C8DFF" stopOpacity="0.32" />
                <stop offset="70%" stopColor="#4C8DFF" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#4C8DFF" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-relay-mitigated" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00FF94" stopOpacity="0.38" />
                <stop offset="65%" stopColor="#00FF94" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#00FF94" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-deadzone" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF4C4C" stopOpacity="0.18" />
                <stop offset="80%" stopColor="#FF4C4C" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#FF4C4C" stopOpacity="0" />
              </radialGradient>

              {/* Shadow Overlay Gradient */}
              <linearGradient id="sun-shadow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Topographic Contours (LOLA Altimetry Simulation) */}
            {showContours && (
              <g className="stroke-[#424753]/40 stroke-[0.75] fill-none" opacity="0.6">
                {/* Concentric crater rings */}
                <ellipse cx="500" cy="420" rx="340" ry="240" />
                <ellipse cx="500" cy="420" rx="270" ry="190" strokeDasharray="3 3" />
                <ellipse cx="500" cy="420" rx="190" ry="130" />
                <ellipse cx="500" cy="420" rx="110" ry="75" />
                
                {/* Secondary crater (Faustini Trench) */}
                <ellipse cx="250" cy="620" rx="130" ry="110" />
                <ellipse cx="250" cy="620" rx="80" ry="60" />

                {/* Connecting Ridge Contours */}
                <path d="M 120,700 Q 300,500 500,450 T 880,240" stroke="#424753" strokeWidth="1" />
                <path d="M 160,740 Q 340,540 540,490 T 920,280" stroke="#424753" strokeWidth="0.5" strokeDasharray="2 4" />
              </g>
            )}

            {/* Permanent Shadow Region (PSR) Cones */}
            {showIllumination && (
              <g opacity="0.5">
                <path d="M 440,380 Q 500,340 560,390 L 590,470 Q 500,520 410,460 Z" fill="url(#sun-shadow-grad)" />
                <text x="470" y="440" fill="#8c909f" fontSize="9" fontFamily="JetBrains Mono" opacity="0.6">
                  PSR VOLATILES COLD TRAP (38 K)
                </text>
              </g>
            )}

            {/* Dead Zones (D-ZONE 1 & 2) */}
            {deadZones.map((dz) => {
              const cx = (dz.xPercent / 100) * 1000;
              const cy = (dz.yPercent / 100) * 800;
              const r = dz.radiusKm * 18;
              const isMitigated = isMitigationActive && dz.id === 'dzone_2';

              return (
                <g key={dz.id} className="transition-opacity duration-300">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={isMitigated ? 'none' : 'url(#grad-deadzone)'}
                    stroke={isMitigated ? '#00FF94' : '#FF4C4C'}
                    strokeWidth={isMitigated ? '1' : '1.5'}
                    strokeDasharray={isMitigated ? '4 4' : '6 4'}
                    opacity={isMitigated ? 0.3 : 0.9}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    fill={isMitigated ? '#00FF94' : '#FF4C4C'}
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    className="select-none"
                  >
                    {dz.code} {isMitigated ? '[CLOSED]' : '[DEAD ZONE]'}
                  </text>
                  <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    fill="#8c909f"
                    fontSize="8"
                    fontFamily="JetBrains Mono"
                  >
                    {isMitigated ? 'COVERED BY R-APEX' : 'NO RF LINE-OF-SIGHT'}
                  </text>
                </g>
              );
            })}

            {/* RF Coverage Footprints (Radials) */}
            {showCoverage && relays.map((relay) => {
              let cx = 0;
              let cy = 0;
              if (relay.id === 'relay_alpha') { cx = 410; cy = 290; }
              else if (relay.id === 'relay_bravo') { cx = 680; cy = 520; }
              else if (relay.id === 'relay_charlie') { cx = 820; cy = 220; }
              else if (relay.id === 'relay_shackleton_apex') { cx = 580; cy = 460; }
              else return null;

              const isOffline = relay.status === 'offline';
              const isCandidate = relay.isCandidate;
              const radius = relay.coverageRadiusKm * 15;

              if (isOffline) return null;
              if (isCandidate && !isMitigationActive) return null;

              return (
                <circle
                  key={`cov-${relay.id}`}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={isCandidate ? 'url(#grad-relay-mitigated)' : 'url(#grad-relay-nominal)'}
                  stroke={isCandidate ? '#00FF94' : '#4C8DFF'}
                  strokeWidth="0.75"
                  opacity={0.7}
                />
              );
            })}

            {/* Line-of-Sight Mesh Links between nodes */}
            {showLinks && (
              <g strokeWidth="1.2">
                {/* Base Alpha to Relay Alpha */}
                <line 
                  x1={baseAlpha.x} y1={baseAlpha.y} 
                  x2="410" y2="290" 
                  stroke="#4C8DFF" 
                  strokeDasharray="4 4" 
                  opacity="0.8" 
                />

                {/* Relay Alpha to Relay Bravo (broken on failure) */}
                {isRelayBFailure ? (
                  <line 
                    x1="410" y1="290" 
                    x2="680" y2="520" 
                    stroke="#FF4C4C" 
                    strokeDasharray="3 3" 
                    strokeWidth="1.5"
                    className="broken-link"
                    opacity="0.7" 
                  />
                ) : (
                  <line 
                    x1="410" y1="290" 
                    x2="680" y2="520" 
                    stroke="#4C8DFF" 
                    strokeDasharray="4 4" 
                    opacity="0.6" 
                  />
                )}

                {/* Relay Alpha to Relay Charlie */}
                <line 
                  x1="410" y1="290" 
                  x2="820" y2="220" 
                  stroke="#4C8DFF" 
                  strokeDasharray="4 4" 
                  opacity="0.5" 
                />

                {/* Mitigated Link: R-Apex to Relay Alpha & Base */}
                {isMitigationActive && (
                  <>
                    <line 
                      x1="580" y1="460" 
                      x2="410" y2="290" 
                      stroke="#00FF94" 
                      strokeWidth="1.8" 
                      opacity="0.9" 
                    />
                    <line 
                      x1="580" y1="460" 
                      x2={baseAlpha.x} y2={baseAlpha.y} 
                      stroke="#00FF94" 
                      strokeWidth="1.5" 
                      strokeDasharray="2 2"
                      opacity="0.8" 
                    />
                  </>
                )}
              </g>
            )}

            {/* Planned Trajectory Paths */}
            {/* Route A: Safety-First (Direct Base Line) */}
            {activePlan === 'safety' && (
              <path
                d={`M ${roverPos.x},${roverPos.y} Q 540,420 ${baseAlpha.x},${baseAlpha.y}`}
                fill="none"
                stroke="#00FF94"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="animate-dash-slow"
              />
            )}

            {/* Route B: Balanced / Recommended */}
            {activePlan === 'balanced' && (
              <g>
                <path
                  d={`M ${roverPos.x},${roverPos.y} Q 620,240 450,290 T 320,540 T ${baseAlpha.x},${baseAlpha.y}`}
                  fill="none"
                  stroke="#4C8DFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-dash-slow"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(76,141,255,0.7))' }}
                />
                {/* Elevation waypoint markers */}
                <circle cx="450" cy="290" r="3" fill="#ffffff" />
                <circle cx="320" cy="540" r="3" fill="#ffffff" />
              </g>
            )}

            {/* Route C: Science-First (Winding Deep Crater Detour) */}
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

            {/* Science Sites (Waypoints) */}
            {scienceSites.map((site) => {
              let sx = 440;
              let sy = 330;
              if (site.id === 'site_beta') { sx = 620; sy = 300; }
              if (site.id === 'site_echo') { sx = 850; sy = 360; }

              const isCompleted = site.status === 'completed';
              const isActiveSite = site.status === 'active';
              const isAtRisk = isRelayBFailure && site.id === 'site_echo';

              return (
                <g 
                  key={site.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredEntity(`site-${site.id}`)}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  <circle 
                    cx={sx} 
                    cy={sy} 
                    r={isActiveSite ? 7 : 5} 
                    fill={isCompleted ? '#00FF94' : isAtRisk ? '#FF4C4C' : '#aec6ff'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                  />
                  <text 
                    x={sx + 10} 
                    y={sy + 4} 
                    fill="#dee2f6" 
                    fontSize="9" 
                    fontFamily="JetBrains Mono" 
                    fontWeight="600"
                  >
                    {site.code} {isCompleted ? '[COMPLETE]' : isAtRisk ? '[AT RISK]' : ''}
                  </text>
                </g>
              );
            })}

            {/* Relay Tower Nodes */}
            {/* Relay Alpha */}
            <g 
              transform="translate(410, 290)"
              className="cursor-pointer"
              onClick={() => onSelectRelay && onSelectRelay(relays[0])}
              onMouseEnter={() => setHoveredEntity('relay_alpha')}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              <circle cx="0" cy="0" r="14" fill="none" stroke="#4C8DFF" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
              <circle cx="0" cy="0" r="5" fill="#4C8DFF" />
              <text x="12" y="4" fill="#aec6ff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                R-ALPHA (R-01)
              </text>
            </g>

            {/* Relay Bravo (Can fail) */}
            <g 
              transform="translate(680, 520)"
              className="cursor-pointer"
              onClick={() => onSelectRelay && onSelectRelay(relays[1])}
              onMouseEnter={() => setHoveredEntity('relay_bravo')}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              {isRelayBFailure ? (
                <>
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#FF4C4C" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
                  <circle cx="0" cy="0" r="6" fill="#303444" stroke="#FF4C4C" strokeWidth="2" />
                  <text x="12" y="4" fill="#FF4C4C" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                    R-BETA [ERR: OFFLINE]
                  </text>
                </>
              ) : (
                <>
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#4C8DFF" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                  <circle cx="0" cy="0" r="5" fill="#4C8DFF" />
                  <text x="12" y="4" fill="#aec6ff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                    R-BETA (R-02)
                  </text>
                </>
              )}
            </g>

            {/* Relay Charlie */}
            <g 
              transform="translate(820, 220)"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredEntity('relay_charlie')}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              <circle cx="0" cy="0" r="5" fill="#4C8DFF" />
              <text x="10" y="4" fill="#aec6ff" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                R-GAMMA (R-03)
              </text>
            </g>

            {/* Mitigated Relay Candidate: R-APEX */}
            {isMitigationActive ? (
              <g 
                transform="translate(580, 460)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredEntity('relay_apex')}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                <circle cx="0" cy="0" r="16" fill="none" stroke="#00FF94" strokeWidth="2" className="animate-pulse" />
                <circle cx="0" cy="0" r="7" fill="#00FF94" />
                <text x="12" y="4" fill="#00FF94" fontSize="10" fontFamily="JetBrains Mono" fontWeight="800">
                  R-APEX (ACTIVE)
                </text>
                <text x="12" y="16" fill="#8c909f" fontSize="8" fontFamily="JetBrains Mono">
                  SHACKLETON RIM +4.3km
                </text>
              </g>
            ) : (
              /* Candidate Ghost Button when not deployed */
              <g 
                transform="translate(580, 460)"
                className="cursor-pointer group"
                onClick={onDeployMitigationRelay}
                onMouseEnter={() => setHoveredEntity('relay_candidate')}
                onMouseLeave={() => setHoveredEntity(null)}
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

            {/* Base Alpha Habitat Marker */}
            <g transform={`translate(${baseAlpha.x}, ${baseAlpha.y})`}>
              <rect x="-12" y="-12" width="24" height="24" fill="#0e1321" stroke="#4C8DFF" strokeWidth="2" rx="3" />
              <rect x="-6" y="-6" width="12" height="12" fill="#4C8DFF" rx="2" />
              <text x="18" y="4" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono" fontWeight="800">
                {baseAlpha.name}
              </text>
              <text x="18" y="16" fill="#8c909f" fontSize="8" fontFamily="JetBrains Mono">
                HABITAT SHELTER & EPS
              </text>
            </g>

            {/* VIPER Rover Marker */}
            <g transform={`translate(${roverPos.x}, ${roverPos.y})`}>
              <circle cx="0" cy="0" r="14" fill="none" stroke="#00FF94" strokeWidth="1.5" className="animate-pulse" />
              <circle cx="0" cy="0" r="6" fill="#00FF94" />
              {/* Heading ray */}
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

      {/* Floating Hover Context Card (If Hovering a Node) */}
      {hoveredEntity && (
        <div className="absolute bottom-16 right-4 z-40 bg-[#02040a]/90 border border-blue-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl max-w-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 border-b border-white/10 pb-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>NODE TELEMETRY INSPECTION</span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target:</span>
              <span className="font-bold text-white uppercase">{hoveredEntity.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elevation:</span>
              <span className="text-emerald-400 font-bold">+3,840 m (Rim Ridge)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RF Band:</span>
              <span className="text-blue-300">Ka-Band (26.5 GHz)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">LOS Availability:</span>
              <span className="text-emerald-400 font-bold">99.4% (T-24h Orbit)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
