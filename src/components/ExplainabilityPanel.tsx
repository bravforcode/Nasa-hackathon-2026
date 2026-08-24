/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Database, 
  Sliders, 
  HelpCircle, 
  Layers, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { RoutePlan } from '../types';
import { NASA_DATA_SOURCES, RECOVERY_ASSUMPTIONS } from '../data/lunarData';

interface ExplainabilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: RoutePlan;
  allPlans: RoutePlan[];
  onExecutePlan: (planId: string) => void;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  allPlans,
  onExecutePlan,
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'sources' | 'assumptions' | 'sensitivity'>('score');

  if (!isOpen) return null;

  const comparisonPlan = allPlans.find(p => p.id !== selectedPlan.id) || allPlans[0];

  // Compute 5-axis Radar chart polygon points
  // 5 axes: Top (Safety), Right (Communication), Bottom-Right (Power), Bottom-Left (Resilience), Left (Science)
  // Center is (200, 200), radius 120
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
    const score = selectedPlan.radarScores[a.key];
    const pt = getCoordinates(score, a.angle);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const planBPoints = axes.map(a => {
    const score = comparisonPlan.radarScores[a.key];
    const pt = getCoordinates(score, a.angle);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[540px] bg-[#02040a]/85 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-base text-white">
              Decision Matrix & Explainability
            </h2>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              Transparent Scoring & NASA Data Lineage
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Decision Summary Banner */}
      <div className="p-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <p className="font-body text-xs md:text-sm text-slate-200 leading-relaxed">
          <strong className="text-blue-400 font-semibold">{selectedPlan.name}</strong> is recommended because it provides{' '}
          <strong className="text-emerald-400">{selectedPlan.coveragePercent}% coverage</strong> while maintaining a{' '}
          <strong className="text-blue-300">{selectedPlan.batteryMarginPercent}% battery reserve</strong> (Flight Rule-14.2 requires ≥20%).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-3 bg-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('score')}
          className={`px-3.5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'score'
              ? 'border-b-2 border-blue-400 text-blue-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Score Breakdown
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3.5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sources'
              ? 'border-b-2 border-blue-400 text-blue-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Data Sources ({NASA_DATA_SOURCES.length})
        </button>

        <button
          onClick={() => setActiveTab('assumptions')}
          className={`px-3.5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'assumptions'
              ? 'border-b-2 border-blue-400 text-blue-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Assumptions
        </button>

        <button
          onClick={() => setActiveTab('sensitivity')}
          className={`px-3.5 py-3 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sensitivity'
              ? 'border-b-2 border-blue-400 text-blue-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sensitivity
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {/* Tab 1: Vector Analysis Radar Chart & Metrics */}
        {activeTab === 'score' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                5-Axis Vector Analysis
              </span>

              <div className="flex items-center gap-3 font-mono text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                  <span className="text-slate-200">{selectedPlan.name.split(' ')[0]} (Active)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 border border-slate-500 rounded-sm" />
                  <span className="text-slate-400">{comparisonPlan.name.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            {/* SVG Radar Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center backdrop-blur-xl shadow-xl">
              <svg className="w-full max-w-[320px] aspect-square overflow-visible" viewBox="0 0 400 400">
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
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="0.75"
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
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="0.75"
                    />
                  );
                })}

                {/* Comparison Plan Polygon (Dashed outline) */}
                <polygon
                  points={planBPoints}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Selected Plan Polygon (Filled Ion Blue) */}
                <polygon
                  points={planAPoints}
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))' }}
                />

                {/* Data Points */}
                {axes.map((a) => {
                  const pt = getCoordinates(selectedPlan.radarScores[a.key], a.angle);
                  return (
                    <circle
                      key={a.key}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#60a5fa"
                      stroke="#ffffff"
                      strokeWidth="1.5"
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
                      fill="#f1f5f9"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight="700"
                    >
                      {a.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Score Decomposition Table */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-slate-400">Safety / Return Margin (S):</span>
                <span className="font-bold text-emerald-400">{selectedPlan.radarScores.safety} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-slate-400">Comms Continuity (C):</span>
                <span className="font-bold text-blue-400">{selectedPlan.radarScores.communication} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-slate-400">Power Margin (P):</span>
                <span className="font-bold text-emerald-400">{selectedPlan.radarScores.power} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-slate-400">Science Completion (T):</span>
                <span className="font-bold text-blue-300">{selectedPlan.radarScores.science} / 10.0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                <span className="text-slate-400">Resilience Margin (R):</span>
                <span className="font-bold text-purple-300">{selectedPlan.radarScores.resilience} / 10.0</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: NASA Data Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-3 font-mono">
            <p className="text-xs text-slate-400">
              Every calculation links directly to NASA PDS, LOLA, and DONKI space-weather data records.
            </p>

            {NASA_DATA_SOURCES.map((src, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-blue-300">
                    {src.dataset}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    {src.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-200">
                  {src.purpose}
                </div>
                <div className="text-[10px] text-slate-400 italic font-sans">
                  Citation: {src.citation}
                </div>
                <div className="flex justify-between items-center pt-1 text-[10px] text-blue-400 border-t border-white/5">
                  <span>Updated: {src.lastUpdated}</span>
                  <a 
                    href={src.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:underline text-blue-300"
                  >
                    <span>NASA Access</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Assumptions & Constraints */}
        {activeTab === 'assumptions' && (
          <div className="space-y-3 font-mono text-xs">
            <p className="text-slate-400">
              Flight Rules and operational constraints enforced by the re-planning algorithm:
            </p>

            {RECOVERY_ASSUMPTIONS.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
                <div className="flex justify-between items-center text-blue-300 font-bold">
                  <span>{item.category}: {item.parameter}</span>
                </div>
                <div className="text-emerald-400 text-[11px]">
                  Nominal: {item.nominalValue}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {item.rule}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Sensitivity Analysis */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-3 font-mono text-xs">
            <p className="text-slate-400">
              Perturbation test responses for environmental and vehicle drift:
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <div className="text-blue-300 font-bold">Scenario: Rover Speed Drops 20% (Wheel Slip)</div>
              <div className="text-slate-300 text-[11px]">
                Travel time increases by +48 min. Route B maintains 24% battery margin (still above Rule-14.2 threshold of 20%).
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <div className="text-blue-300 font-bold">Scenario: Solar Active Region Flaring (M-Class)</div>
              <div className="text-slate-300 text-[11px]">
                High-frequency noise raises required SNR by 3 dB. Route B switches to S-band mesh to prevent link dropout.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <div className="text-blue-300 font-bold">Scenario: Immediate Return vs Continued Exploration</div>
              <div className="text-slate-300 text-[11px]">
                Recommends balanced route unless battery margin projection drops below 22.5%.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
        <button
          onClick={onClose}
          className="font-mono text-xs text-slate-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
        >
          Close Matrix
        </button>

        <button
          onClick={() => {
            onExecutePlan(selectedPlan.id);
            onClose();
          }}
          className="bg-blue-600/90 hover:bg-blue-500 text-white font-mono font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          Execute {selectedPlan.name}
        </button>
      </div>
    </aside>
  );
};
