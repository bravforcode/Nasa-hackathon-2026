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
  CheckCircle,
  Compass,
  Activity,
  Maximize2,
  Info,
  Lock,
  Plus,
  Minus,
  RotateCcw,
  Wifi,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Card,
  Modal,
  StatusPill,
  MetricLabel,
  NavItem,
  Tabs,
  Tooltip,
  AnimatedCounter,
  type CardVariant,
  type CardPadding,
  type ButtonSize,
  type InputSize,
} from './ui';
import { HorizonProfile3D } from './HorizonProfile3D';

export const ComponentLibraryView: React.FC = () => {
  // Live interactive demo states
  const [thrusterOutput, setThrusterOutput] = useState<number>(72);
  const [coordsInput, setCoordsInput] = useState<string>('89.123, -45.678');
  const [powerInput, setPowerInput] = useState<string>('50.0 W');
  const [errorInput, setErrorInput] = useState<string>('MALFORMED_ORBIT_VECTOR_404');
  const [activeInputSize, setActiveInputSize] = useState<InputSize>('md');
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [activeBtnSize, setActiveBtnSize] = useState<ButtonSize>('sm');
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    coverage: true,
    links: false,
    contour: true,
    telemetry: true,
  });
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [demoActiveTab, setDemoActiveTab] = useState<string>('summary');
  const [demoCounterVal, setDemoCounterVal] = useState<number>(87);
  const [demoSignalVal, setDemoSignalVal] = useState<number>(-74.2);
  const [demoNavActive, setDemoNavActive] = useState<string>('nav-1');
  const [previewCardVariant, setPreviewCardVariant] = useState<CardVariant>('default');
  const [previewCardPadding, setPreviewCardPadding] = useState<CardPadding>('md');

  const simulateLoading = (btnType: string) => {
    setLoadingBtn(btnType);
    setTimeout(() => setLoadingBtn(null), 1800);
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full font-mono text-[var(--color-text)]">
      {/* Title & System Status Banner */}
      <div className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusPill tone="accent" pulse isLive>
                LIVING DESIGN SYSTEM
              </StatusPill>
              <StatusPill tone="success">
                WCAG 2.2 AA VERIFIED
              </StatusPill>
            </div>
            <h1 className="font-headline font-bold text-2xl md:text-3xl text-[var(--color-text)]">
              Component & Token Matrix
            </h1>
            <p className="text-3xs text-[var(--color-text-muted)] mt-1 tracking-wide">
              LUNAR RELAY OS — WCAG AA DESIGN TOKEN & UI PRIMITIVE CATALOG (V1.0-STABLE)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />}
              onClick={() => setIsDemoModalOpen(true)}
            >
              Launch Modal Shell
            </Button>
          </div>
        </div>

        {/* Token Badges & Quick Guide */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3 text-3xs text-[var(--color-text-muted)]">
          <span className="font-bold text-[var(--color-accent-subtle)]">DESIGN PILLARS:</span>
          <span className="inline-flex items-center gap-1 bg-[var(--glass-bg-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
            <CheckCircle className="w-3 h-3 text-[var(--color-success-subtle)]" /> 4.5:1 / 7:1 Contrast
          </span>
          <span className="inline-flex items-center gap-1 bg-[var(--glass-bg-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
            <CheckCircle className="w-3 h-3 text-[var(--color-success-subtle)]" /> 44px Touch Targets
          </span>
          <span className="inline-flex items-center gap-1 bg-[var(--glass-bg-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
            <CheckCircle className="w-3 h-3 text-[var(--color-success-subtle)]" /> Roving Tabindex & Focus Trap
          </span>
          <span className="inline-flex items-center gap-1 bg-[var(--glass-bg-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
            <CheckCircle className="w-3 h-3 text-[var(--color-success-subtle)]" /> prefers-reduced-motion
          </span>
        </div>
      </div>

      {/* Primitive 1: Buttons Matrix */}
      <Card variant="default" padding="md" className="space-y-4">
        <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />
            BUTTON_PRIMITIVES_MATRIX (&lt;Button /&gt;)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xs text-[var(--color-text-muted)] font-normal hidden sm:inline">
              Size preview:
            </span>
            {(['sm', 'md', 'lg'] as ButtonSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveBtnSize(s)}
                className={`text-3xs px-2 py-0.5 rounded border font-mono transition-colors ${
                  activeBtnSize === s
                    ? 'bg-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-accent-subtle)]'
                    : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--glass-bg-strong)]'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-3xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-2.5 font-bold uppercase">Variant</th>
                <th className="py-2.5 font-normal">Interactive Trigger</th>
                <th className="py-2.5 font-normal">With Left/Right Icon</th>
                <th className="py-2.5 font-normal">Disabled State</th>
                <th className="py-2.5 font-normal">Loading State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/50 text-xs">
              {/* Primary */}
              <tr>
                <td className="py-3.5 text-[var(--color-text)]">
                  <div className="font-bold">Primary</div>
                  <span className="text-[var(--color-accent-subtle)] text-3xs">Ion Blue Accent</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="primary"
                    size={activeBtnSize}
                    loading={loadingBtn === 'primary'}
                    onClick={() => simulateLoading('primary')}
                  >
                    Deploy Route
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="primary"
                    size={activeBtnSize}
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                  >
                    Engage
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="primary" size={activeBtnSize} disabled>
                    Deploy Route
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="primary" size={activeBtnSize} loading>
                    Deploy Route
                  </Button>
                </td>
              </tr>

              {/* Secondary */}
              <tr>
                <td className="py-3.5 text-[var(--color-text)]">
                  <div className="font-bold">Secondary</div>
                  <span className="text-[var(--color-text-muted)] text-3xs">Frosted Outlined</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="secondary"
                    size={activeBtnSize}
                    loading={loadingBtn === 'secondary'}
                    onClick={() => simulateLoading('secondary')}
                  >
                    Calibrate
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="secondary"
                    size={activeBtnSize}
                    leftIcon={<Sliders className="w-3.5 h-3.5" />}
                  >
                    Configure
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="secondary" size={activeBtnSize} disabled>
                    Calibrate
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="secondary" size={activeBtnSize} loading>
                    Calibrate
                  </Button>
                </td>
              </tr>

              {/* Tertiary */}
              <tr>
                <td className="py-3.5 text-[var(--color-text)]">
                  <div className="font-bold">Tertiary</div>
                  <span className="text-[var(--color-text-muted)] text-3xs">Text Ghost</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="tertiary"
                    size={activeBtnSize}
                    loading={loadingBtn === 'tertiary'}
                    onClick={() => simulateLoading('tertiary')}
                  >
                    Cancel
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="tertiary"
                    size={activeBtnSize}
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Details
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="tertiary" size={activeBtnSize} disabled>
                    Cancel
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="tertiary" size={activeBtnSize} loading>
                    Cancel
                  </Button>
                </td>
              </tr>

              {/* Destructive */}
              <tr>
                <td className="py-3.5 text-[var(--color-text)]">
                  <div className="font-bold">Destructive</div>
                  <span className="text-[var(--color-destructive-subtle)] text-3xs">Flare Red Alert</span>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="destructive"
                    size={activeBtnSize}
                    loading={loadingBtn === 'destructive'}
                    onClick={() => simulateLoading('destructive')}
                  >
                    Abort Mission
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button
                    variant="destructive"
                    size={activeBtnSize}
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                  >
                    Purge
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="destructive" size={activeBtnSize} disabled>
                    Abort Mission
                  </Button>
                </td>
                <td className="py-3.5">
                  <Button variant="destructive" size={activeBtnSize} loading>
                    Abort Mission
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Full width button preview */}
        <div className="pt-2 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center gap-3">
          <span className="text-3xs text-[var(--color-text-muted)] font-mono whitespace-nowrap">
            Full-Width Layout Modifier:
          </span>
          <Button variant="secondary" size="sm" fullWidth leftIcon={<Maximize2 className="w-3.5 h-3.5" />}>
            Full-Width Secondary Action Bar
          </Button>
        </div>
      </Card>

      {/* Primitive 2: Icon Buttons & Action Toggles */}
      <Card variant="default" padding="md" className="space-y-4">
        <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />
            ICON_BUTTON_PRIMITIVES (&lt;IconButton /&gt;)
          </span>
          <span className="text-3xs text-[var(--color-text-muted)] font-normal">
            Enforced aria-label &bull; aria-pressed toggle states &bull; 44px WCAG Target
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Map Layer Toolbar */}
          <div className="bg-[var(--color-surface)]/80 p-3.5 rounded-xl border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between text-3xs text-[var(--color-text-muted)]">
              <span className="font-bold text-[var(--color-text)]">Interactive Map Layer Toggles:</span>
              <span>aria-pressed active</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Tooltip content="Toggle Coverage Heatmap layer" side="top">
                <IconButton
                  icon={<Shield className="w-4 h-4" />}
                  aria-label="Coverage Heatmap"
                  active={activeLayers.coverage}
                  onClick={() => toggleLayer('coverage')}
                />
              </Tooltip>
              <Tooltip content="Toggle RF Line of Sight rays" side="top">
                <IconButton
                  icon={<Radio className="w-4 h-4" />}
                  aria-label="RF Line of Sight"
                  active={activeLayers.links}
                  onClick={() => toggleLayer('links')}
                />
              </Tooltip>
              <Tooltip content="Toggle DEM Elevation Contours" side="top">
                <IconButton
                  icon={<Layers className="w-4 h-4" />}
                  aria-label="DEM Elevation Contours"
                  active={activeLayers.contour}
                  onClick={() => toggleLayer('contour')}
                />
              </Tooltip>
              <Tooltip content="Toggle Real-Time Telemetry" side="top">
                <IconButton
                  icon={<Activity className="w-4 h-4" />}
                  aria-label="Real-Time Telemetry"
                  active={activeLayers.telemetry}
                  onClick={() => toggleLayer('telemetry')}
                />
              </Tooltip>
            </div>
          </div>

          {/* Variants & Sizes */}
          <div className="bg-[var(--color-surface)]/80 p-3.5 rounded-xl border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between text-3xs text-[var(--color-text-muted)]">
              <span className="font-bold text-[var(--color-text)]">Variants & Sizes:</span>
              <span>Ghost vs Solid</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <IconButton
                variant="solid"
                size="sm"
                icon={<Zap className="w-4 h-4" />}
                aria-label="Solid small power trigger"
                title="Solid Small"
              />
              <IconButton
                variant="solid"
                size="md"
                icon={<Zap className="w-4 h-4" />}
                aria-label="Solid medium power trigger"
                title="Solid Medium"
              />
              <IconButton
                variant="solid"
                size="lg"
                icon={<Zap className="w-5 h-5" />}
                aria-label="Solid large power trigger"
                title="Solid Large"
              />
              <IconButton
                variant="ghost"
                size="md"
                icon={<Search className="w-4 h-4" />}
                aria-label="Search telemetry data"
                title="Ghost Search"
              />
              <IconButton
                disabled
                size="md"
                icon={<Lock className="w-4 h-4" />}
                aria-label="Locked feature (disabled)"
                title="Disabled Locked"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Primitive 3 & Diagnostics Radar: Inputs & Telemetry Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Accessible Input Components */}
        <Card variant="default" padding="md" className="space-y-4">
          <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
            <span>INPUT_PRIMITIVES_MATRIX (&lt;Input /&gt;)</span>
            <div className="flex items-center gap-1.5">
              {(['sm', 'md', 'lg'] as InputSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActiveInputSize(size)}
                  className={`text-3xs px-2 py-0.5 rounded border font-mono transition-colors ${
                    activeInputSize === size
                      ? 'bg-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-accent-subtle)]'
                      : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--glass-bg-strong)]'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          {/* Alert Banner with CSS tokens */}
          <div className="bg-[var(--color-destructive)]/10 border-l-4 border-[var(--color-destructive)] border border-[var(--color-destructive)]/20 p-3.5 rounded-2xl flex items-start gap-3 backdrop-blur-xl">
            <AlertTriangle className="w-4 h-4 text-[var(--color-destructive-subtle)] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[var(--color-destructive-subtle)] uppercase tracking-wider">
                OXYGEN_RESERVES_LOW
              </div>
              <p className="text-3xs text-[var(--color-text)] mt-0.5 leading-relaxed">
                Estimated reserve time below 45 minutes. Recommend immediate recharge cycle.
              </p>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] uppercase tracking-wider text-3xs font-bold">
                Thruster Output
              </span>
              <span className="text-[var(--color-accent-subtle)] font-bold text-xs">{thrusterOutput}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={thrusterOutput}
              onChange={(e) => setThrusterOutput(Number(e.target.value))}
              aria-label="Thruster Output percentage"
              className="w-full accent-[var(--color-accent-subtle)] h-2 bg-[var(--glass-bg-strong)] rounded-lg cursor-pointer border border-[var(--color-border)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            />
            <div className="flex justify-between text-3xs text-[var(--color-text-muted)] font-mono">
              <span>0% (IDLE)</span>
              <span>50% (NOMINAL)</span>
              <span>100% (MAX THRUST)</span>
            </div>
          </div>

          {/* Input 1: Standard with Left Icon and Hint */}
          <Input
            label="TARGET COORDINATES (LAT / LONG)"
            value={coordsInput}
            onChange={(e) => setCoordsInput(e.target.value)}
            inputSize={activeInputSize}
            hint="Format: [-90.0, +90.0] signed lunar degrees"
            leftIcon={<Search className="w-4 h-4" />}
          />

          {/* Input 2: Small with Right Icon */}
          <Input
            label="RELAY TRANSMITTER POWER"
            value={powerInput}
            onChange={(e) => setPowerInput(e.target.value)}
            inputSize={activeInputSize}
            hint="Nominal S-band EIRP link budget floor"
            rightIcon={<Wifi className="w-4 h-4" />}
          />

          {/* Input 3: Error State with ARIA alert */}
          <Input
            label="ORBIT EPHEMERIS VECTOR (ERROR STATE)"
            value={errorInput}
            onChange={(e) => setErrorInput(e.target.value)}
            inputSize={activeInputSize}
            error="Vector checksum mismatch: Keplerian element outside allowed orbital envelope."
            leftIcon={<AlertTriangle className="w-4 h-4" />}
          />

          {/* Input 4: Disabled State */}
          <Input
            label="RESTRICTED HARDWARE OVERRIDE"
            defaultValue="ENCRYPTED_TELEMETRY_KEY_LOCKED"
            inputSize={activeInputSize}
            disabled
            hint="Hardware key locked by Flight Rule 14.2"
            leftIcon={<Lock className="w-4 h-4" />}
          />
        </Card>

        {/* Panel 2: System Diagnostics Radar */}
        <Card variant="default" padding="md" className="space-y-4 flex flex-col justify-between">
          <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />
              SYS_DIAGNOSTICS_RADAR
            </span>
            <span className="text-3xs text-[var(--color-text-muted)] font-normal">
              CSS Token Color Driven
            </span>
          </header>

          <div className="flex-1 flex items-center justify-center p-2">
            <svg
              className="w-full max-w-[280px] aspect-square select-none"
              viewBox="0 0 200 200"
              role="img"
              aria-label="Five-axis radar chart showing power, communication, life support, structure, and navigation telemetry"
            >
              {/* Pentagonal grid */}
              <polygon
                points="100,20 176,75 147,165 53,165 24,75"
                fill="none"
                stroke="var(--color-border, rgba(255,255,255,0.15))"
                strokeWidth="1"
              />
              <polygon
                points="100,40 157,81 135,148 65,148 43,81"
                fill="none"
                stroke="var(--color-border, rgba(255,255,255,0.10))"
                strokeWidth="1"
              />
              <polygon
                points="100,60 138,87 123,132 77,132 62,87"
                fill="none"
                stroke="var(--color-border, rgba(255,255,255,0.08))"
                strokeWidth="1"
              />
              <polygon
                points="100,80 119,94 111,116 89,116 81,94"
                fill="none"
                stroke="var(--color-border, rgba(255,255,255,0.05))"
                strokeWidth="1"
              />

              {/* Axis lines */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="var(--color-border, rgba(255,255,255,0.15))" strokeWidth="1" />
              <line x1="100" y1="100" x2="176" y2="75" stroke="var(--color-border, rgba(255,255,255,0.15))" strokeWidth="1" />
              <line x1="100" y1="100" x2="147" y2="165" stroke="var(--color-border, rgba(255,255,255,0.15))" strokeWidth="1" />
              <line x1="100" y1="100" x2="53" y2="165" stroke="var(--color-border, rgba(255,255,255,0.15))" strokeWidth="1" />
              <line x1="100" y1="100" x2="24" y2="75" stroke="var(--color-border, rgba(255,255,255,0.15))" strokeWidth="1" />

              {/* Data Shape 1 (Primary / Nominal) */}
              <polygon
                points="100,30 160,80 130,150 70,120 40,60"
                fill="var(--color-accent, rgba(96, 165, 250, 0.25))"
                fillOpacity="0.25"
                stroke="var(--color-accent-subtle, #60a5fa)"
                strokeWidth="2"
              />

              {/* Data Shape 2 (Secondary / Degraded) */}
              <polygon
                points="100,50 140,70 110,140 80,160 50,90"
                fill="var(--color-destructive, rgba(248, 113, 113, 0.15))"
                fillOpacity="0.15"
                stroke="var(--color-destructive-subtle, #f87171)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />

              {/* Labels - using 11px font size to satisfy minimum legible type standards */}
              <text x="100" y="14" fill="var(--color-text-muted, #94a3b8)" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="monospace">POWER</text>
              <text x="184" y="79" fill="var(--color-text-muted, #94a3b8)" fontSize="11" textAnchor="start" fontWeight="bold" fontFamily="monospace">COM</text>
              <text x="150" y="180" fill="var(--color-text-muted, #94a3b8)" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="monospace">LIFE</text>
              <text x="45" y="180" fill="var(--color-text-muted, #94a3b8)" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="monospace">STRUCT</text>
              <text x="16" y="79" fill="var(--color-text-muted, #94a3b8)" fontSize="11" textAnchor="end" fontWeight="bold" fontFamily="monospace">NAV</text>
            </svg>
          </div>

          <div className="flex justify-between items-center text-3xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-accent-subtle)] shadow-sm" />
              Nominal Telemetry
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm border border-[var(--color-destructive-subtle)] bg-[var(--color-destructive)]/20" />
              Stress Condition
            </span>
          </div>
        </Card>
      </div>

      {/* Primitive 4 & 5: StatusPill & MetricLabel Grid */}
      <div className="space-y-6">
        <div className="border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)] font-headline">
              Status & Telemetry Primitives
            </h2>
            <p className="text-3xs text-[var(--color-text-muted)]">
              Accessible, semantic status indicators and telemetry descriptors with ARIA live region support.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* StatusPill Matrix */}
          <Card variant="default" padding="md" className="space-y-4">
            <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              <span>STATUS_PILL_VARIANTS (&lt;StatusPill /&gt;)</span>
              <span className="text-3xs text-[var(--color-text-muted)] font-normal">All 5 tones + pulse</span>
            </header>

            <div className="space-y-3">
              <div className="text-3xs text-[var(--color-text-muted)] font-bold uppercase">
                Static & Live Tones:
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                <StatusPill tone="accent">ACCENT</StatusPill>
                <StatusPill tone="success" icon={<CheckCircle className="w-3 h-3" />}>
                  SUCCESS
                </StatusPill>
                <StatusPill tone="warning" icon={<AlertTriangle className="w-3 h-3" />}>
                  WARNING
                </StatusPill>
                <StatusPill tone="destructive" icon={<AlertTriangle className="w-3 h-3" />}>
                  DESTRUCTIVE
                </StatusPill>
                <StatusPill tone="neutral" icon={<Info className="w-3 h-3" />}>
                  NEUTRAL
                </StatusPill>
              </div>

              <div className="text-3xs text-[var(--color-text-muted)] font-bold uppercase pt-2">
                Pulsing Status Dots (Live State):
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                <StatusPill tone="accent" pulse isLive>
                  ACCENT / PULSE
                </StatusPill>
                <StatusPill tone="success" pulse isLive>
                  SUCCESS / PULSE
                </StatusPill>
                <StatusPill tone="warning" pulse isLive>
                  WARNING / PULSE
                </StatusPill>
                <StatusPill tone="destructive" pulse isLive>
                  DESTRUCTIVE / PULSE
                </StatusPill>
                <StatusPill tone="neutral" pulse>
                  NEUTRAL / PULSE
                </StatusPill>
              </div>
            </div>
          </Card>

          {/* MetricLabel Matrix */}
          <Card variant="default" padding="md" className="space-y-4">
            <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              <span>METRIC_LABEL_SEMANTICS (&lt;MetricLabel /&gt;)</span>
              <span className="text-3xs text-[var(--color-text-muted)] font-normal">&lt;dl&gt; / &lt;dt&gt; / &lt;dd&gt;</span>
            </header>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricLabel label="Solar Window" value="14:22:09 LST" valueTone="accent" />
                <MetricLabel label="Fleet Health" value="98.5% NOM" valueTone="success" />
                <MetricLabel label="Comm Attenuation" value="+3.2 dB" valueTone="warning" />
                <MetricLabel label="Dead Zone Delta" value="2 ZONES" valueTone="destructive" />
                <MetricLabel label="Orbit Epoch" value="2026.239" valueTone="neutral" />
                <MetricLabel label="Link Margin" value="+18.4 dB" valueTone="accent" />
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                <MetricLabel label="Left Aligned" value="POLAR_NORTH" align="left" valueTone="accent" />
                <MetricLabel label="Right Aligned" value="45.129 DEG_W" align="right" valueTone="success" />
              </div>
            </div>
          </Card>
        </div>

        {/* Primitive 6, 7, 8, 9, 10: NavItem, AnimatedCounter, Tooltip, Card Surfaces, Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NavItem interactive */}
          <Card variant="default" padding="md" className="space-y-3">
            <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              <span>NAV_ITEM_PRIMITIVES</span>
              <span className="text-3xs text-[var(--color-text-muted)]">44px Touch</span>
            </header>
            <div className="flex flex-col gap-1.5">
              <NavItem
                icon={<Compass className="w-4 h-4" />}
                label="Polar Surface Map"
                active={demoNavActive === 'nav-1'}
                onClick={() => setDemoNavActive('nav-1')}
              />
              <NavItem
                icon={<Radio className="w-4 h-4" />}
                label="Relay Constellation"
                badge={{ text: '95%', tone: 'success' }}
                active={demoNavActive === 'nav-2'}
                onClick={() => setDemoNavActive('nav-2')}
              />
              <NavItem
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Failure Analysis"
                badge={{ text: 'ALERT', tone: 'destructive' }}
                active={demoNavActive === 'nav-3'}
                onClick={() => setDemoNavActive('nav-3')}
              />
              <NavItem
                icon={<Lock className="w-4 h-4" />}
                label="Classified Orbit"
                badge={{ text: 'LOCKED', tone: 'neutral' }}
                disabled
                onClick={() => {}}
              />
            </div>
          </Card>

          {/* AnimatedCounter interactive */}
          <Card variant="default" padding="md" className="space-y-4">
            <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              <span>ANIMATED_COUNTER</span>
              <span className="text-3xs text-[var(--color-text-muted)]">GSAP Motion</span>
            </header>
            <div className="flex flex-col items-center justify-center p-2 space-y-3">
              <div className="flex flex-col items-center">
                <div className="font-mono text-3xl font-bold text-[var(--color-accent-subtle)]">
                  <AnimatedCounter value={demoCounterVal} suffix="%" />
                </div>
                <span className="text-3xs text-[var(--color-text-muted)]">Constellation Availability</span>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Minus className="w-3 h-3" />}
                  aria-label="Decrease"
                  onClick={() => setDemoCounterVal((v) => Math.max(0, v - 15))}
                >
                  -15%
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3 h-3" />}
                  onClick={() => setDemoCounterVal((v) => Math.min(100, v + 15))}
                >
                  +15%
                </Button>
              </div>

              {/* Decimals counter */}
              <div className="w-full pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-3xs text-[var(--color-text-muted)]">Signal Margin:</span>
                <span className="text-xs font-bold text-[var(--color-success-subtle)]">
                  <AnimatedCounter value={demoSignalVal} suffix=" dBm" decimals={1} />
                </span>
                <IconButton
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  aria-label="Reset signal counter"
                  onClick={() => setDemoSignalVal((v) => (v < -60 ? -85.5 : -52.4))}
                />
              </div>
            </div>
          </Card>

          {/* Tooltip interactive */}
          <Card variant="default" padding="md" className="space-y-4">
            <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              <span>TOOLTIP_PRIMITIVES</span>
              <span className="text-3xs text-[var(--color-text-muted)]">WCAG 1.4.13</span>
            </header>
            <div className="grid grid-cols-2 gap-3 p-1">
              <Tooltip content="Tooltip positioned on TOP side" side="top">
                <Button variant="secondary" size="sm" className="w-full">
                  Top Tooltip
                </Button>
              </Tooltip>
              <Tooltip content="Tooltip positioned on BOTTOM side" side="bottom">
                <Button variant="secondary" size="sm" className="w-full">
                  Bottom Tooltip
                </Button>
              </Tooltip>
              <Tooltip content="Tooltip positioned on LEFT side" side="left">
                <Button variant="secondary" size="sm" className="w-full">
                  Left Tooltip
                </Button>
              </Tooltip>
              <Tooltip content="Tooltip positioned on RIGHT side" side="right">
                <Button variant="secondary" size="sm" className="w-full">
                  Right Tooltip
                </Button>
              </Tooltip>
            </div>
            <p className="text-3xs text-[var(--color-text-muted)] leading-relaxed">
              Supports keyboard focus & hover triggers, dismisses on <code className="text-[var(--color-accent-subtle)]">Escape</code>, and never obscures underlying content.
            </p>
          </Card>
        </div>

        {/* Primitive: Card Surfaces Showcase */}
        <Card variant="default" padding="md" className="space-y-4">
          <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />
              CARD_SURFACE_PRIMITIVES (&lt;Card /&gt;)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xs text-[var(--color-text-muted)]">Variant:</span>
              {(['default', 'subtle', 'modal'] as CardVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPreviewCardVariant(v)}
                  className={`text-3xs px-2 py-0.5 rounded border font-mono transition-colors ${
                    previewCardVariant === v
                      ? 'bg-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-accent-subtle)]'
                      : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--glass-bg-strong)]'
                  }`}
                >
                  {v}
                </button>
              ))}
              <span className="text-3xs text-[var(--color-text-muted)] ml-2">Padding:</span>
              {(['none', 'sm', 'md', 'lg'] as CardPadding[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreviewCardPadding(p)}
                  className={`text-3xs px-2 py-0.5 rounded border font-mono transition-colors ${
                    previewCardPadding === p
                      ? 'bg-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-accent-subtle)]'
                      : 'text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--glass-bg-strong)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default" padding={previewCardPadding} className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--color-text)]">Default Glass Panel</div>
                <div className="text-3xs text-[var(--color-accent-subtle)] mt-0.5">variant="default"</div>
                <p className="text-3xs text-[var(--color-text-muted)] mt-2">
                  Glassmorphic backdrop blur with standard surface border.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-3xs text-[var(--color-text-muted)]">
                Class: <code className="text-[var(--color-accent-subtle)]">.glass-panel</code>
              </div>
            </Card>

            <Card variant="subtle" padding={previewCardPadding} className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--color-text)]">Subtle Inset Panel</div>
                <div className="text-3xs text-[var(--color-success-subtle)] mt-0.5">variant="subtle"</div>
                <p className="text-3xs text-[var(--color-text-muted)] mt-2">
                  Subtle translucency for nested telemetry cards and secondary containers.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-3xs text-[var(--color-text-muted)]">
                Class: <code className="text-[var(--color-success-subtle)]">.glass-panel-subtle</code>
              </div>
            </Card>

            <Card variant="modal" padding={previewCardPadding} className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--color-text)]">Elevated Modal Shell</div>
                <div className="text-3xs text-[var(--color-warning-subtle)] mt-0.5">variant="modal"</div>
                <p className="text-3xs text-[var(--color-text-muted)] mt-2">
                  High-elevation deep backdrop blur for overlays and critical alert dialogs.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-3xs text-[var(--color-text-muted)]">
                Class: <code className="text-[var(--color-warning-subtle)]">.glass-modal</code>
              </div>
            </Card>
          </div>
        </Card>

        {/* Primitive: Compound Tabs Interactive */}
        <Card variant="default" padding="md" className="space-y-4">
          <header className="text-xs font-bold text-[var(--color-accent-subtle)] border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent-subtle)]" />
              COMPOUND_TABS (&lt;Tabs /&gt;)
            </span>
            <span className="text-3xs text-[var(--color-text-muted)] font-normal">
              Roving tabindex: ArrowLeft, ArrowRight, Home, End
            </span>
          </header>
          <Tabs value={demoActiveTab} onValueChange={setDemoActiveTab} className="w-full">
            <Tabs.List aria-label="Component Demo Tabs">
              <Tabs.Trigger value="summary">Mission Summary</Tabs.Trigger>
              <Tabs.Trigger value="telemetry">Live Telemetry</Tabs.Trigger>
              <Tabs.Trigger value="provenance">Data Lineage</Tabs.Trigger>
              <Tabs.Trigger value="architecture">Design Tokens</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="summary" className="p-4 bg-[var(--glass-bg-subtle)] rounded-b-xl text-xs text-[var(--color-text)] space-y-2">
              <p>
                Primary mission parameters active: Polar coverage exceeds 90% floor with 2 redundant relay paths.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <StatusPill tone="success">NOMINAL_ORBIT</StatusPill>
                <StatusPill tone="accent">EIRP_45_DBW</StatusPill>
              </div>
            </Tabs.Content>
            <Tabs.Content value="telemetry" className="p-4 bg-[var(--glass-bg-subtle)] rounded-b-xl text-xs text-[var(--color-text)] space-y-2">
              <p>
                Live link SNR +14.2 dB, rover battery buffer 32% (Flight Rule 14.2 nominal).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <MetricLabel label="Carrier Frequency" value="2.245 GHz" valueTone="accent" />
                <MetricLabel label="Doppler Shift" value="-120 Hz" valueTone="success" />
                <MetricLabel label="Packet Error Rate" value="0.001%" valueTone="success" />
                <MetricLabel label="Bitrate" value="100 Mbps" valueTone="accent" />
              </div>
            </Tabs.Content>
            <Tabs.Content value="provenance" className="p-4 bg-[var(--glass-bg-subtle)] rounded-b-xl text-xs text-[var(--color-text)] space-y-2">
              <p>
                Sourced from NASA LOLA DEM 128ppd elevation tiles and DONKI space-weather real-time stream.
              </p>
              <div className="text-3xs text-[var(--color-text-muted)] font-mono">
                Dataset ID: NASA-LOLA-DEM-SOUTH-POLE-2026 / DONKI-CME-STREAM-V2
              </div>
            </Tabs.Content>
            <Tabs.Content value="architecture" className="p-4 bg-[var(--glass-bg-subtle)] rounded-b-xl text-xs text-[var(--color-text)] space-y-2">
              <p>
                Tokens driven by Tailwind v4 <code className="text-[var(--color-accent-subtle)]">@theme</code> and runtime <code className="text-[var(--color-accent-subtle)]">[data-theme]</code> custom variables.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-3xs font-mono">
                <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                  --color-accent
                </div>
                <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                  --color-surface
                </div>
                <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                  --color-destructive
                </div>
                <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                  --color-success
                </div>
              </div>
            </Tabs.Content>
          </Tabs>
        </Card>

        {/* 3D Lunar Horizon & LOS Mesh Interactive Component Showcase */}
        <HorizonProfile3D
          siteName="Shackleton Peak Station Alpha"
          latDeg={-89.9}
          lonDeg={0.0}
          sunElevationDeg={1.4}
          sunAzimuthDeg={135}
        />
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
        <div className="space-y-4 text-xs text-[var(--color-text)] leading-relaxed font-sans">
          <p>
            This modal is rendered using the centralized <code className="font-mono text-[var(--color-accent-subtle)]">&lt;Modal /&gt;</code> primitive from <code className="font-mono text-[var(--color-text-muted)]">src/components/ui/Modal.tsx</code>.
          </p>
          <div className="p-3.5 bg-[var(--color-surface)]/80 rounded-xl border border-[var(--color-border)] space-y-2 font-mono">
            <div className="text-[var(--color-accent-subtle)] font-bold text-3xs">
              WCAG 2.2 AA VERIFICATION CHECKLIST:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[var(--color-text-muted)] text-3xs">
              <li>Keyboard trap active (Tab cycles within modal only)</li>
              <li>Escape key automatically triggers dismissal</li>
              <li>Clicking the backdrop dismisses dialog</li>
              <li>Focus is restored to the opener button upon closing</li>
              <li>Labels linked with aria-labelledby and aria-describedby</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
