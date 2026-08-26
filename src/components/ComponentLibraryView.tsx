/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button, IconButton, Input, Card, Modal } from './ui';

export const ComponentLibraryView: React.FC = () => {
  const [thrusterOutput, setThrusterOutput] = useState<number>(72);
  const [coordsInput, setCoordsInput] = useState<string>('89.123, -45.678');
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    coverage: true,
    links: false,
    contour: true,
  });
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  const simulateLoading = (btnType: string) => {
    setLoadingBtn(btnType);
    setTimeout(() => setLoadingBtn(null), 1800);
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full font-mono">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline font-bold text-2xl md:text-3xl text-white">
              Component Library
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              LUNAR RELAY OS — LIVING DESIGN TOKEN & PRIMITIVE MATRIX (V1.0-STABLE)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
            onClick={() => setIsDemoModalOpen(true)}
          >
            Launch Interactive Modal Demo
          </Button>
        </div>
      </div>

      {/* Primitives Section 1: Buttons Matrix */}
      <Card variant="default" padding="md" className="space-y-4">
        <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            BUTTON_PRIMITIVES_MATRIX
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Real &lt;Button&gt; Primitives with Live State
          </span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-white/10">
                <th className="py-2.5 font-bold uppercase">Variant</th>
                <th className="py-2.5 font-normal">Interactive Default</th>
                <th className="py-2.5 font-normal">With Icon</th>
                <th className="py-2.5 font-normal">Disabled State</th>
                <th className="py-2.5 font-normal">Loading State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {/* Primary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Primary</div>
                  <span className="text-blue-400 text-[10px]">Ion Blue</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={loadingBtn === 'primary'}
                    onClick={() => simulateLoading('primary')}
                  >
                    Deploy Route
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                  >
                    Engage
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="primary" size="sm" disabled>
                    Deploy Route
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="primary" size="sm" loading>
                    Deploy Route
                  </Button>
                </td>
              </tr>

              {/* Secondary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Secondary</div>
                  <span className="text-slate-400 text-[10px]">Frosted Outlined</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={loadingBtn === 'secondary'}
                    onClick={() => simulateLoading('secondary')}
                  >
                    Calibrate
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Sliders className="w-3.5 h-3.5" />}
                  >
                    Configure
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="secondary" size="sm" disabled>
                    Calibrate
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="secondary" size="sm" loading>
                    Calibrate
                  </Button>
                </td>
              </tr>

              {/* Tertiary */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Tertiary</div>
                  <span className="text-slate-400 text-[10px]">Text Only</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="tertiary"
                    size="sm"
                    loading={loadingBtn === 'tertiary'}
                    onClick={() => simulateLoading('tertiary')}
                  >
                    Cancel
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="tertiary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Details
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="tertiary" size="sm" disabled>
                    Cancel
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="tertiary" size="sm" loading>
                    Cancel
                  </Button>
                </td>
              </tr>

              {/* Destructive */}
              <tr>
                <td className="py-3.5 text-white">
                  <div className="font-bold">Destructive</div>
                  <span className="text-red-400 text-[10px]">Flare Red</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={loadingBtn === 'destructive'}
                    onClick={() => simulateLoading('destructive')}
                  >
                    Abort Mission
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                  >
                    Purge
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="destructive" size="sm" disabled>
                    Abort Mission
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="destructive" size="sm" loading>
                    Abort Mission
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Primitives Section 2: Icon Buttons & Toggles */}
      <Card variant="default" padding="md" className="space-y-4">
        <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            ICON_BUTTON_PRIMITIVES (44px WCAG Target & Toggle States)
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            aria-label enforced + aria-pressed states
          </span>
        </header>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400">Map Layer Toggles:</span>
            <IconButton
              icon={<Shield className="w-4 h-4" />}
              aria-label="Coverage Heatmap"
              active={activeLayers.coverage}
              onClick={() => toggleLayer('coverage')}
            />
            <IconButton
              icon={<Radio className="w-4 h-4" />}
              aria-label="RF Line of Sight"
              active={activeLayers.links}
              onClick={() => toggleLayer('links')}
            />
            <IconButton
              icon={<Layers className="w-4 h-4" />}
              aria-label="DEM Elevation Contours"
              active={activeLayers.contour}
              onClick={() => toggleLayer('contour')}
            />
          </div>

          <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
            <span className="text-xs text-slate-400">Solid / Ghost:</span>
            <IconButton
              variant="solid"
              icon={<Zap className="w-4 h-4" />}
              aria-label="Power boost trigger"
            />
            <IconButton
              variant="ghost"
              icon={<Search className="w-4 h-4" />}
              aria-label="Search telemetry"
            />
            <IconButton
              disabled
              icon={<Shield className="w-4 h-4" />}
              aria-label="Locked feature"
            />
          </div>
        </div>
      </Card>

      {/* Grid: Inputs & Diagnostics Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Accessible Input Components */}
        <Card variant="default" padding="md" className="space-y-4">
          <header className="text-xs font-bold text-blue-300 border-b border-white/10 pb-2">
            ACCESSIBLE_INPUT_PRIMITIVES
          </header>

          {/* Alert Banner */}
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

          {/* Slider */}
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
              aria-label="Thruster Output"
              className="w-full accent-blue-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Real Input Primitive */}
          <Input
            label="TARGET COORDINATES (LAT / LONG)"
            value={coordsInput}
            onChange={(e) => setCoordsInput(e.target.value)}
            hint="Format: [-90.0, +90.0] signed degrees"
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Input
            label="RELAY TRANSMITTER POWER"
            defaultValue="50.0 W"
            inputSize="sm"
            hint="Nominal S-band EIRP link margin"
          />
        </Card>

        {/* Panel 2: System Diagnostics Radar */}
        <Card variant="default" padding="md" className="space-y-4 flex flex-col justify-between">
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
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 shadow-sm" /> Nominal Telemetry
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm border border-red-400 bg-red-400/20" /> Stress Condition
            </span>
          </div>
        </Card>
      </div>

      {/* Interactive Modal Primitive Demo */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Interactive Modal Primitive Demo"
        description="Shared accessible Modal shell with backdrop blur, focus trap, and Escape dismissal"
        footer={
          <>
            <Button variant="tertiary" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Dismiss
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Confirm Telemetry Lock
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <p>
            This modal is rendered using the centralized <code className="font-mono text-blue-400">&lt;Modal /&gt;</code> primitive from <code className="font-mono text-slate-200">src/components/ui/Modal.tsx</code>.
          </p>
          <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2 font-mono">
            <div className="text-blue-300 font-bold text-[11px]">WCAG 2.2 AA VERIFICATION:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Keyboard trap active (Tab cycles within modal only)</li>
              <li>Escape key automatically triggers dismissal</li>
              <li>Clicking the backdrop dismisses dialog</li>
              <li>Focus is restored to the opener button upon closing</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
