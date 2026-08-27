/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RoutePlan } from '../types';
import { NASA_DATA_SOURCES, RECOVERY_ASSUMPTIONS } from '../data/lunarData';
import { fetchGeminiExplanation, type ExplanationResult, type ExplanationState } from '../services/gemini/explain';
import { Tabs } from './ui';
import { prefersReducedMotion, MOTION_DURATIONS, createGsapContext } from '../utils/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type ExplainTab = 'score' | 'sources' | 'assumptions' | 'sensitivity';

interface ExplainabilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: RoutePlan;
  allPlans: RoutePlan[];
  /** Live DONKI fetch status from App ('idle' | 'loading' | 'ok' | 'error'). */
  donkiStatus?: string;
  /** Live CMR collection query result from App. */
  cmrInfo?: { count: number; titles: string[]; fetchedAt: string } | { error: true } | null;
  /** Live computed state for the AI/deterministic explainer. */
  explanationInput?: ExplanationState;
  /** Restore the default relay/dead-zone layout. */
  onResetLayout?: () => void;
  onExecutePlan: (planId: string) => void;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  allPlans,
  donkiStatus,
  cmrInfo,
  explanationInput,
  onResetLayout,
  onExecutePlan,
}) => {
  const [activeTab, setActiveTab] = useState<ExplainTab>('score');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<ExplanationResult | null>(null);

  // Radar scores animated state
  const [animatedScores, setAnimatedScores] = useState({ ...selectedPlan.radarScores });
  const prevScoresRef = useRef({ ...selectedPlan.radarScores });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // GSAP state-driven tween for 5-axis Radar Chart point morphing
  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimatedScores({ ...selectedPlan.radarScores });
      prevScoresRef.current = { ...selectedPlan.radarScores };
      return;
    }

    const proxy = { ...prevScoresRef.current };
    const tween = gsap.to(proxy, {
      ...selectedPlan.radarScores,
      duration: MOTION_DURATIONS.slow,
      ease: 'power2.out',
      onUpdate: () => {
        setAnimatedScores({
          safety: proxy.safety,
          communication: proxy.communication,
          power: proxy.power,
          resilience: proxy.resilience,
          science: proxy.science,
        });
      },
      onComplete: () => {
        setAnimatedScores({ ...selectedPlan.radarScores });
        prevScoresRef.current = { ...selectedPlan.radarScores };
      },
    });

    return () => {
      tween.kill();
    };
  }, [selectedPlan]);

  // GSAP ScrollTrigger scroller attachment for matrix cards inside the scroll container
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!isOpen || prefersReducedMotion() || !scroller) return;

    const cleanup = createGsapContext(scroller, () => {
      const cards = scroller.querySelectorAll('.matrix-card-item');
      cards.forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            scroller: scroller,
            start: 'top 95%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          y: 12,
          duration: MOTION_DURATIONS.fast,
          ease: 'power1.out',
        });
      });
    });

    // Refresh ScrollTrigger calculations after tab switch layout change
    ScrollTrigger.refresh();

    return cleanup;
  }, [isOpen, activeTab]);

  const handleExplain = async () => {
    if (!explanationInput || aiLoading) return;
    setAiLoading(true);
    try {
      const r = await fetchGeminiExplanation(explanationInput);
      setAiResult(r);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = () => {
    const report = {
      tool: 'LUNAR RELAY OS',
      schema: 'lunar-relay-plan/v1',
      generatedAt: new Date().toISOString(),
      region: explanationInput ?? null,
      selectedPlan,
      allPlans,
      liveData: { donkiStatus, cmrInfo },
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunar-relay-plan-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const comparisonPlan = allPlans.find(p => p.id !== selectedPlan.id) || allPlans[0];

  const center = { x: 200, y: 200 };
  const maxR = 120;
  
  const getCoordinates = (value: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const r = (value / 10) * maxR;
    return {
      x: center.x + r * Math.cos(angleRad),
      y: center.y + r * Math.sin(angleRad),
    };
  };

  const axes = [
    { label: 'Safety', angle: 0, key: 'safety' as const },
    { label: 'Communication', angle: 72, key: 'communication' as const },
    { label: 'Power', angle: 144, key: 'power' as const },
    { label: 'Resilience', angle: 216, key: 'resilience' as const },
    { label: 'Science', angle: 288, key: 'science' as const },
  ];

  const planAPoints = axes.map(a => {
    const score = animatedScores[a.key];
    const pt = getCoordinates(score, a.angle);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const planBPoints = axes.map(a => {
    const score = comparisonPlan.radarScores[a.key];
    const pt = getCoordinates(score, a.angle);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const activePlanColor =
    selectedPlan.id === 'safety'
      ? 'var(--color-map-safety, #00ff94)'
      : selectedPlan.id === 'science'
      ? 'var(--color-map-science, #ffb800)'
      : 'var(--color-map-balanced, var(--color-accent, #4c8dff))';

  const activePolygonStroke =
    selectedPlan.id === 'safety'
      ? 'var(--color-map-safety, #00ff94)'
      : selectedPlan.id === 'science'
      ? 'var(--color-map-science, #ffb800)'
      : 'var(--color-viz-radar-stroke, var(--color-accent-subtle, #60a5fa))';

  const activePolygonFill =
    selectedPlan.id === 'safety'
      ? 'var(--color-viz-radar-safety-fill, rgba(0, 255, 148, 0.22))'
      : selectedPlan.id === 'science'
      ? 'var(--color-viz-radar-science-fill, rgba(255, 184, 0, 0.22))'
      : 'var(--color-viz-radar-fill, rgba(59, 130, 246, 0.25))';

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[540px] bg-[var(--color-bg,#05060a)]/90 backdrop-blur-2xl border-l border-[var(--color-border,rgba(255,255,255,0.1))] shadow-2xl z-[var(--z-panel,55)] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[var(--color-border,rgba(255,255,255,0.1))] flex justify-between items-center bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[var(--color-accent-subtle,#60a5fa)] backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-base text-[var(--color-text,#f1f5f9)]">
              Decision Matrix & Explainability
            </h2>
            <p className="font-mono text-3xs text-[var(--color-text-muted,#94a3b8)] uppercase tracking-widest">
              Transparent Scoring & NASA Data Lineage
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onClose}
          aria-label="Close Decision Matrix"
          className="text-[var(--color-text-muted,#94a3b8)] hover:text-[var(--color-text,#ffffff)] p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--color-border,rgba(255,255,255,0.1))] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Decision Summary Banner */}
      <div className="p-4 bg-white/5 border-b border-[var(--color-border,rgba(255,255,255,0.1))] backdrop-blur-md">
        <p className="font-body text-xs md:text-sm text-slate-200 leading-relaxed">
          <strong className="text-[var(--color-accent-subtle,#60a5fa)] font-semibold">{selectedPlan.name}</strong> is recommended because it provides{' '}
          <strong className="text-[var(--color-map-safety,#00ff94)]">{selectedPlan.coveragePercent}% coverage</strong> while maintaining a{' '}
          <strong className="text-[var(--color-accent-subtle,#60a5fa)]">{selectedPlan.batteryMarginPercent}% battery reserve</strong> (Flight Rule-14.2 requires ≥20%).
        </p>
      </div>

      {/* Generic Compound Tabs with compile-time type safety and keyboard roving navigation */}
      <Tabs<ExplainTab> value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <Tabs.List aria-label="Decision Matrix Navigation">
          <Tabs.Trigger<ExplainTab> value="score">Score Breakdown</Tabs.Trigger>
          <Tabs.Trigger<ExplainTab> value="sources">Data Sources ({NASA_DATA_SOURCES.length})</Tabs.Trigger>
          <Tabs.Trigger<ExplainTab> value="assumptions">Assumptions</Tabs.Trigger>
          <Tabs.Trigger<ExplainTab> value="sensitivity">Sensitivity</Tabs.Trigger>
        </Tabs.List>

        {/* Tab Content Body with ScrollTrigger Scroller */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {/* Tab 1: Vector Analysis Radar Chart & Metrics */}
          <Tabs.Content<ExplainTab> value="score" className="space-y-4">
            <div className="flex justify-between items-center matrix-card-item">
              <span className="font-mono text-xs text-[var(--color-text-muted,#94a3b8)] uppercase tracking-wider font-bold">
                5-Axis Vector Analysis
              </span>

              <div className="flex items-center gap-3 font-mono text-3xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: activePlanColor }}
                  />
                  <span className="text-slate-200">{selectedPlan.name.split(' ')[0]} (Active)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm border"
                    style={{
                      borderColor: 'var(--color-viz-radar-compare, #94a3b8)',
                      backgroundColor: 'var(--color-viz-radar-compare-fill, rgba(148, 163, 184, 0.08))',
                    }}
                  />
                  <span className="text-[var(--color-text-muted,#94a3b8)]">{comparisonPlan.name.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            {/* SVG Radar Chart */}
            <div className="bg-white/5 border border-[var(--color-border,rgba(255,255,255,0.1))] rounded-2xl p-4 flex items-center justify-center backdrop-blur-xl shadow-xl matrix-card-item">
              <svg className="w-full max-w-[320px] aspect-square overflow-visible" viewBox="0 0 400 400" role="img" aria-label="5-axis radar chart displaying Safety, Communication, Power, Resilience, and Science metrics">
                {/* Concentric pentagons */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
                  const pts = axes.map(a => {
                    const pt = getCoordinates(level * 10, a.angle);
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke={level === 1.0 ? 'var(--color-viz-grid, rgba(255, 255, 255, 0.12))' : 'var(--color-viz-grid-subtle, rgba(255, 255, 255, 0.06))'}
                      strokeWidth={level === 1.0 ? '1.25' : '0.75'}
                      strokeDasharray={level === 1.0 ? 'none' : '2 2'}
                    />
                  );
                })}

                {/* Axis lines */}
                {axes.map((a) => {
                  const outerPt = getCoordinates(10, a.angle);
                  return (
                    <line
                      key={a.label}
                      x1={center.x}
                      y1={center.y}
                      x2={outerPt.x}
                      y2={outerPt.y}
                      stroke="var(--color-viz-grid, rgba(255, 255, 255, 0.12))"
                      strokeWidth="0.75"
                    />
                  );
                })}

                {/* Comparison Plan Polygon (Dashed outline) */}
                <polygon
                  points={planBPoints}
                  fill="var(--color-viz-radar-compare-fill, rgba(148, 163, 184, 0.08))"
                  stroke="var(--color-viz-radar-compare, #94a3b8)"
                  strokeWidth="1.75"
                  strokeDasharray="4 3"
                  strokeLinejoin="round"
                />

                {/* Selected Plan Polygon (Crisp High-Contrast Stroke with Glow Filter) */}
                <polygon
                  points={planAPoints}
                  fill={activePolygonFill}
                  stroke={activePolygonStroke}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 12px var(--color-viz-radar-glow, rgba(59, 130, 246, 0.5)))' }}
                />

                {/* Data Points */}
                {axes.map((a) => {
                  const pt = getCoordinates(animatedScores[a.key], a.angle);
                  return (
                    <circle
                      key={a.key}
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={activePolygonStroke}
                      stroke="var(--color-viz-radar-point-stroke, #ffffff)"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Axis Text Labels */}
                {axes.map((a) => {
                  const labelPt = getCoordinates(12.2, a.angle);
                  return (
                    <text
                      key={`lbl-${a.label}`}
                      x={labelPt.x}
                      y={labelPt.y + 4}
                      textAnchor="middle"
                      fill="var(--color-viz-label, var(--color-text, #f1f5f9))"
                      fontSize="10"
                      fontFamily="var(--font-mono, 'Fira Code', 'JetBrains Mono', monospace)"
                      fontWeight="700"
                    >
                      {a.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Score Decomposition Table */}
            <div className="space-y-2 font-mono text-xs matrix-card-item">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-[var(--color-text-muted,#94a3b8)]">Safety / Return Margin (S):</span>
                <span className="font-bold text-[var(--color-map-safety,#00ff94)]">{selectedPlan.radarScores.safety} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-[var(--color-text-muted,#94a3b8)]">Comms Continuity (C):</span>
                <span className="font-bold text-[var(--color-map-balanced,#4c8dff)]">{selectedPlan.radarScores.communication} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-[var(--color-text-muted,#94a3b8)]">Power Margin (P):</span>
                <span className="font-bold text-[var(--color-map-safety,#00ff94)]">{selectedPlan.radarScores.power} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-[var(--color-text-muted,#94a3b8)]">Science Completion (T):</span>
                <span className="font-bold text-[var(--color-map-science,#ffb800)]">{selectedPlan.radarScores.science} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-[var(--color-text-muted,#94a3b8)]">Resilience Margin (R):</span>
                <span className="font-bold text-[var(--color-accent-subtle,#60a5fa)]">{selectedPlan.radarScores.resilience} / 10.0</span>
              </div>
            </div>

            {/* AI / deterministic explainer */}
            {explanationInput && (
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/30 backdrop-blur-md space-y-2 matrix-card-item">
                <div className="flex justify-between items-center">
                  <span className="text-3xs uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> AI Explainability
                  </span>
                  <button
                    type="button"
                    onClick={handleExplain}
                    disabled={aiLoading}
                    className="text-3xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 hover:bg-purple-500/30 transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  >
                    {aiLoading ? 'THINKING…' : 'EXPLAIN THIS ROUTE'}
                  </button>
                </div>
                {aiResult && (
                  <>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-sans">{aiResult.text}</p>
                    <div className={`text-3xs font-bold uppercase ${aiResult.source === 'gemini' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {aiResult.source === 'gemini'
                        ? `Source: Gemini free tier (${explanationInput.scenario} state)`
                        : 'Source: local rule-based model — free, no API key (add VITE_GEMINI_API_KEY for Gemini free tier)'}
                    </div>
                  </>
                )}
              </div>
            )}
          </Tabs.Content>

          {/* Tab 2: NASA Data Sources */}
          <Tabs.Content<ExplainTab> value="sources" className="space-y-3 font-mono">
            <p className="text-xs text-slate-400">
              Every calculation links directly to NASA PDS, LOLA, and DONKI space-weather data records.
            </p>

            {/* LIVE integration status */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/30 backdrop-blur-md space-y-2 matrix-card-item">
              <div className="text-3xs uppercase tracking-wider font-bold text-blue-300">
                Live Integration Status (this session)
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">DONKI solar-flare feed</span>
                <span className={`font-bold ${
                  donkiStatus === 'ok' ? 'text-emerald-400'
                  : donkiStatus === 'loading' ? 'text-amber-400'
                  : donkiStatus === 'error' ? 'text-red-400'
                  : 'text-slate-400'
                }`}>
                  {donkiStatus === 'ok' ? 'LIVE — fetched'
                    : donkiStatus === 'loading' ? 'FETCHING…'
                    : donkiStatus === 'error' ? 'UNAVAILABLE (fallback model)'
                    : 'IDLE (fetches on Space Weather scenario)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Earthdata CMR metadata</span>
                {!cmrInfo ? (
                  <span className="text-slate-400 font-bold">FETCHING…</span>
                ) : 'error' in cmrInfo ? (
                  <span className="text-red-400 font-bold">UNAVAILABLE</span>
                ) : (
                  <span className="text-emerald-400 font-bold">{cmrInfo.count} collections @ {cmrInfo.fetchedAt.slice(11, 19)}Z</span>
                )}
              </div>
              {cmrInfo && !('error' in cmrInfo) && cmrInfo.titles.length > 0 && (
                <ul className="text-3xs text-slate-400 list-disc list-inside space-y-0.5">
                  {cmrInfo.titles.map((t) => (
                    <li key={t} className="truncate">{t}</li>
                  ))}
                </ul>
              )}
            </div>

            {NASA_DATA_SOURCES.map((src, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2 matrix-card-item">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-blue-300">
                    {src.dataset}
                  </span>
                  <span className="text-3xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    {src.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-200">
                  {src.purpose}
                </div>
                <div className="text-3xs text-slate-400 italic font-sans">
                  Citation: {src.citation}
                </div>
                <div className="flex justify-between items-center pt-1 text-3xs text-blue-400 border-t border-white/5">
                  <span>Updated: {src.lastUpdated}</span>
                  <a 
                    href={src.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:underline text-blue-300 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded"
                  >
                    <span>NASA Access</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </Tabs.Content>

          {/* Tab 3: Assumptions & Constraints */}
          <Tabs.Content<ExplainTab> value="assumptions" className="space-y-3 font-mono text-xs">
            <p className="text-slate-400">
              Flight Rules and operational constraints enforced by the re-planning algorithm:
            </p>

            {RECOVERY_ASSUMPTIONS.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 matrix-card-item">
                <div className="flex justify-between items-center text-blue-300 font-bold">
                  <span>{item.category}: {item.parameter}</span>
                </div>
                <div className="text-emerald-400 text-[11px]">
                  Nominal: {item.nominalValue}
                </div>
                <div className="text-slate-400 text-3xs">
                  {item.rule}
                </div>
              </div>
            ))}
          </Tabs.Content>

          {/* Tab 4: Sensitivity Analysis */}
          <Tabs.Content<ExplainTab> value="sensitivity" className="space-y-3 font-mono text-xs">
            <p className="text-slate-400">
              Perturbation test responses for environmental and vehicle drift:
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 matrix-card-item">
              <div className="text-blue-300 font-bold">Scenario: Rover Speed Drops 20% (Wheel Slip)</div>
              <div className="text-slate-300 text-[11px]">
                Travel time increases by +48 min. Route B maintains 24% battery margin (still above Rule-14.2 threshold of 20%).
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 matrix-card-item">
              <div className="text-blue-300 font-bold">Scenario: Solar Active Region Flaring (M-Class)</div>
              <div className="text-slate-300 text-[11px]">
                High-frequency noise raises required SNR by 3 dB. Route B switches to S-band mesh to prevent link dropout.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 matrix-card-item">
              <div className="text-blue-300 font-bold">Scenario: Immediate Return vs Continued Exploration</div>
              <div className="text-slate-300 text-[11px]">
                Recommends balanced route unless battery margin projection drops below 22.5%.
              </div>
            </div>
          </Tabs.Content>
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="font-mono text-xs text-blue-300 hover:text-white px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            title="Download the full live mission state as JSON"
          >
            Export Plan (JSON)
          </button>
          {onResetLayout && (
            <button
              type="button"
              onClick={onResetLayout}
              className="font-mono text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              title="Restore default relay/dead-zone layout"
            >
              Reset Layout
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs text-slate-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
        >
          Close Matrix
        </button>

        <button
          type="button"
          onClick={() => {
            onExecutePlan(selectedPlan.id);
            onClose();
          }}
          className="bg-blue-600/90 hover:bg-blue-500 text-white font-mono font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30 backdrop-blur-md transition-all active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          Execute {selectedPlan.name}
        </button>
      </div>
    </aside>
  );
};
