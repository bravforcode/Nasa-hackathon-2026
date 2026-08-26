/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const ComponentLibraryView: React.FC = () => {
  const [thrusterOutput, setThrusterOutput] = useState<number>(72);
  const [coordsInput, setCoordsInput] = useState<string>('89.123, -45.678');
  const [, setLoadingButton] = useState<string | null>(null);

  const simulateLoading = (btnType: string) => {
    setLoadingButton(btnType);
    setTimeout(() => setLoadingButton(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-mono">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="font-headline font-bold text-2xl md:text-3xl text-white">
          Component Library
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          LUNAR RELAY OS — FROSTED GLASS DESIGN SYSTEM & TELEMETRY MATRIX (V0.48-STABLE)
        </p>
      </div>

      {/* Buttons Matrix */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl backdrop-blur-2xl">
        <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-3 flex items-center justify-between">
          <span>BUTTONS_MATRIX</span>
          <span className="text-[10px] text-slate-400 font-normal">Standard / Hover / Active / Disabled / Loading</span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-white/10">
                <th className="py-2.5 font-bold uppercase">Type / State</th>
                <th className="py-2.5 font-normal">Default</th>
                <th className="py-2.5 font-normal">Hover State</th>
                <th className="py-2.5 font-normal">Active State</th>
                <th className="py-2.5 font-normal">Disabled</th>
                <th className="py-2.5 font-normal">Loading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {/* Primary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Primary</div>
                  <span className="text-slate-400 text-[10px]">Ion Blue</span>
                </td>
                <td className="py-3.5">
                  <button 
                    onClick={() => simulateLoading('primary')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Deploy
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/30">
                    Deploy
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs ring-2 ring-blue-300">
                    Deploy
                  </button>
                </td>
                <td className="py-3.5">
                  <button disabled className="bg-blue-600/30 text-white/40 font-bold px-4 py-2 rounded-xl text-xs cursor-not-allowed border border-white/5">
                    Deploy
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploy</span>
                  </button>
                </td>
              </tr>

              {/* Secondary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Secondary</div>
                  <span className="text-slate-400 text-[10px]">Frosted Outlined</span>
                </td>
                <td className="py-3.5">
                  <button 
                    onClick={() => simulateLoading('secondary')}
                    className="border border-white/10 bg-white/5 text-slate-200 px-4 py-2 rounded-xl text-xs hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-md"
                  >
                    Calibrate
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="border border-white/25 bg-white/10 text-white px-4 py-2 rounded-xl text-xs backdrop-blur-md">
                    Calibrate
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="border border-blue-400 bg-blue-500/20 text-white px-4 py-2 rounded-xl text-xs ring-1 ring-blue-400">
                    Calibrate
                  </button>
                </td>
                <td className="py-3.5">
                  <button disabled className="border border-white/5 bg-white/[0.02] text-slate-600 px-4 py-2 rounded-xl text-xs cursor-not-allowed">
                    Calibrate
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="border border-white/10 bg-white/5 text-slate-200 px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
                    <span>Calibrate</span>
                  </button>
                </td>
              </tr>

              {/* Tertiary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Tertiary</div>
                  <span className="text-slate-400 text-[10px]">Text Only</span>
                </td>
                <td className="py-3.5">
                  <button className="text-blue-300 hover:text-white px-3 py-1.5 rounded-xl text-xs hover:bg-white/5 transition-all cursor-pointer">
                    Cancel
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="text-white bg-white/10 px-3 py-1.5 rounded-xl text-xs">
                    Cancel
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="text-blue-400 px-3 py-1.5 rounded-xl text-xs underline font-bold">
                    Cancel
                  </button>
                </td>
                <td className="py-3.5">
                  <button disabled className="text-slate-600 px-3 py-1.5 rounded-xl text-xs cursor-not-allowed">
                    Cancel
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="text-blue-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cancel</span>
                  </button>
                </td>
              </tr>

              {/* Destructive */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Destructive</div>
                  <span className="text-red-400 text-[10px]">Flare Red</span>
                </td>
                <td className="py-3.5">
                  <button 
                    onClick={() => simulateLoading('abort')}
                    className="bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer backdrop-blur-md"
                  >
                    Abort
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-red-500/35 border border-red-500/60 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-red-500/20">
                    Abort
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-red-500/40 text-white font-bold px-4 py-2 rounded-xl text-xs ring-2 ring-red-400">
                    Abort
                  </button>
                </td>
                <td className="py-3.5">
                  <button disabled className="bg-red-500/10 border border-red-500/20 text-red-400/40 font-bold px-4 py-2 rounded-xl text-xs cursor-not-allowed">
                    Abort
                  </button>
                </td>
                <td className="py-3.5">
                  <button className="bg-red-500/20 border border-red-500/40 text-red-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Abort</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid: Inputs & Alerts + Diagnostics Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Input & Alerts */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl backdrop-blur-2xl">
          <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-2">
            INPUT_&_ALERTS
          </header>

          {/* Alert Banner Component */}
          <div className="bg-red-500/10 border-l-4 border-red-500 border border-red-500/20 p-3.5 rounded-2xl flex items-start gap-3 backdrop-blur-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                OXYGEN_RESERVES_LOW
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Estimated reserve time below 45 minutes. Recommend immediate recharge cycle.
              </p>
            </div>
          </div>

          {/* Slider Component */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 uppercase tracking-wider">Thruster Output</span>
              <span className="text-blue-300 font-bold">{thrusterOutput}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={thrusterOutput}
              onChange={(e) => setThrusterOutput(Number(e.target.value))}
              className="w-full accent-blue-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Input Component */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Coordinates (LAT / LONG)
            </label>
            <input
              type="text"
              value={coordsInput}
              onChange={(e) => setCoordsInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400 backdrop-blur-md"
            />
          </div>
        </section>

        {/* Panel 2: System Diagnostics Radar */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl flex flex-col justify-between backdrop-blur-2xl">
          <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-2">
            SYS_DIAGNOSTICS_RADAR
          </header>

          <div className="flex-1 flex items-center justify-center p-2">
            <svg className="w-full max-w-[260px] aspect-square" viewBox="0 0 200 200">
              {/* Pentagonal grid */}
              <polygon points="100,20 176,75 147,165 53,165 24,75" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <polygon points="100,40 157,81 135,148 65,148 43,81" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <polygon points="100,60 138,87 123,132 77,132 62,87" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <polygon points="100,80 119,94 111,116 89,116 81,94" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Axis lines */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="100" y1="100" x2="176" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="100" y1="100" x2="147" y2="165" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="100" y1="100" x2="53" y2="165" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="100" y1="100" x2="24" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

              {/* Data Shape 1 (Primary / Nominal) */}
              <polygon
                points="100,30 160,80 130,150 70,120 40,60"
                fill="rgba(96, 165, 250, 0.25)"
                stroke="#60a5fa"
                strokeWidth="2"
              />

              {/* Data Shape 2 (Secondary / Degraded) */}
              <polygon
                points="100,50 140,70 110,140 80,160 50,90"
                fill="rgba(248, 113, 113, 0.15)"
                stroke="#f87171"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />

              {/* Labels */}
              <text x="100" y="15" fill="#cbd5e1" fontSize="8" textAnchor="middle" fontWeight="bold">POWER</text>
              <text x="182" y="78" fill="#cbd5e1" fontSize="8" textAnchor="start" fontWeight="bold">COM</text>
              <text x="150" y="176" fill="#cbd5e1" fontSize="8" textAnchor="middle" fontWeight="bold">LIFE_SUPP</text>
              <text x="45" y="176" fill="#cbd5e1" fontSize="8" textAnchor="middle" fontWeight="bold">STRUCT</text>
              <text x="18" y="78" fill="#cbd5e1" fontSize="8" textAnchor="end" fontWeight="bold">NAV</text>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/10 pt-3">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 shadow-sm" /> Nominal System Telemetry
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm border border-red-400 bg-red-400/20" /> Stress Condition
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
