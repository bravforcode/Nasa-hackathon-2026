/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ShieldCheck, Scale, FlaskConical, Sliders } from 'lucide-react';
import { PlanOption, RoutePlan } from '../types';
import { Button, StatusPill, MetricLabel, AnimatedCounter } from './ui';

interface RecoveryCardsProps {
  plans: RoutePlan[];
  activePlan: PlanOption;
  onSelectPlan: (planId: PlanOption) => void;
  onOpenExplainability: () => void;
  sliderValue: number;
  onSliderChange: (val: number) => void;
}

export const RecoveryCards: React.FC<RecoveryCardsProps> = ({
  plans,
  activePlan,
  onSelectPlan,
  onOpenExplainability,
  sliderValue,
  onSliderChange,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Objective Function Slider: Science ↔ Safety Balance */}
      <div className="px-5 py-2 rounded-full bg-slate-950/70 backdrop-blur-2xl border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <div className="p-1 rounded bg-blue-500/15 text-blue-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold uppercase tracking-wider text-slate-200">Optimization Weight Matrix:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <span className={`font-mono text-3xs uppercase font-semibold transition-colors ${
            sliderValue < 40 ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}>
            Science Focus
          </span>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            aria-label="Optimization Weight: Science to Safety Focus"
            className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />

          <span className={`font-mono text-3xs uppercase font-semibold transition-colors ${
            sliderValue > 60 ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}>
            Safety Focus
          </span>

          <span className="font-mono text-xs font-bold text-blue-300 min-w-[32px] text-right">
            {sliderValue}%
          </span>
        </div>
      </div>

      {/* 3 Strategy Plan Cards — Luxury Double-Bezel Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {plans.map((plan) => {
          const isSelected = activePlan === plan.id;
          const isRecommended = plan.id === 'balanced';

          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${plan.name}`}
              aria-pressed={isSelected}
              onClick={() => onSelectPlan(plan.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlan(plan.id);
                }
              }}
              className={`rounded-2xl p-1 flex flex-col justify-between transition-all duration-300 cursor-pointer relative overflow-hidden backdrop-blur-xl shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                isSelected
                  ? 'ring-2 ring-blue-500/80 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                  : 'ring-1 ring-white/10 bg-white/[0.02] hover:ring-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="p-3.5 bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl border border-white/[0.06] flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                {isRecommended && (
                  <div className="absolute top-3 right-3">
                    <StatusPill tone="accent" className="py-0.5 px-2 text-3xs font-bold tracking-wider rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                      RECOMMENDED
                    </StatusPill>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                      {plan.id === 'safety' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                      {plan.id === 'balanced' && <Scale className="w-4 h-4 text-blue-400" />}
                      {plan.id === 'science' && <FlaskConical className="w-4 h-4 text-amber-400" />}
                    </div>
                    
                    <h3 className="font-headline font-bold text-sm text-white">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Viability Gauge with AnimatedCounter */}
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className={`font-mono text-2xl font-extrabold ${
                      plan.viabilityPercent >= 85
                        ? 'text-emerald-400'
                        : plan.viabilityPercent >= 60
                        ? 'text-blue-400'
                        : 'text-red-400'
                    }`}>
                      <AnimatedCounter value={plan.viabilityPercent} suffix="%" />
                    </span>
                    <span className="font-mono text-3xs text-slate-400 uppercase tracking-wider">
                      VIABILITY (J = {plan.scoreBreakdown.compositeJ})
                    </span>
                  </div>

                  {/* Metric Summary Rows wired with MetricLabel */}
                  <div className="grid grid-cols-3 gap-2 font-mono mb-2.5 bg-white/[0.03] border border-white/[0.06] p-2 rounded-xl">
                    <MetricLabel
                      label="Coverage"
                      value={`${plan.coveragePercent}%`}
                      valueTone="neutral"
                    />
                    <MetricLabel
                      label="Power"
                      value={`${plan.batteryMarginPercent}%`}
                      valueTone={plan.batteryMarginPercent >= 20 ? 'success' : 'destructive'}
                    />
                    <MetricLabel
                      label="Recovery"
                      value={`${plan.travelTimeHours}h`}
                      valueTone="neutral"
                      align="right"
                    />
                  </div>
                </div>

                {/* Bottom Action / Why This Score */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlan(plan.id);
                      onOpenExplainability();
                    }}
                    rightIcon={<ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />}
                    className="font-mono text-3xs font-bold text-blue-300 hover:text-white !p-0 !min-h-0"
                  >
                    WHY THIS SCORE?
                  </Button>

                  <span className="font-mono text-3xs text-slate-400 font-semibold">
                    {plan.completedSitesCount}/{plan.totalSitesCount} Sites
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
