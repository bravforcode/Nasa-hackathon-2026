/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ShieldCheck, Scale, FlaskConical, Sliders } from 'lucide-react';
import { PlanOption, RoutePlan } from '../types';
import { Button, Card } from './ui';

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
    <div className="flex flex-col gap-2.5 w-full">
      {/* Objective Function Slider: Science ↔ Safety Balance */}
      <Card variant="default" padding="sm" className="px-5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold uppercase tracking-wider">Optimization Weight Matrix:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <span className={`font-mono text-[10px] uppercase font-semibold transition-colors ${
            sliderValue < 40 ? 'text-amber-400 font-bold' : 'text-slate-500'
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
            className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <span className={`font-mono text-[10px] uppercase font-semibold transition-colors ${
            sliderValue > 60 ? 'text-emerald-400 font-bold' : 'text-slate-500'
          }`}>
            Safety Focus
          </span>

          <span className="font-mono text-xs font-bold text-blue-300 min-w-[32px] text-right">
            {sliderValue}%
          </span>
        </div>
      </Card>

      {/* 3 Strategy Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const isSelected = activePlan === plan.id;
          const isRecommended = plan.id === 'balanced';

          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelectPlan(plan.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlan(plan.id);
                }
              }}
              className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden backdrop-blur-xl shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isSelected
                  ? 'bg-blue-500/10 border-2 border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.2)] ring-1 ring-blue-400/30'
                  : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              {isRecommended && (
                <div className="absolute top-3 right-3 bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                  RECOMMENDED
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {plan.id === 'safety' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {plan.id === 'balanced' && <Scale className="w-4 h-4 text-blue-400" />}
                  {plan.id === 'science' && <FlaskConical className="w-4 h-4 text-amber-400" />}
                  
                  <h3 className="font-headline font-bold text-sm text-white">
                    {plan.name}
                  </h3>
                </div>

                {/* Viability Gauge */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`font-mono text-2xl font-bold ${
                    plan.viabilityPercent >= 85
                      ? 'text-emerald-400'
                      : plan.viabilityPercent >= 60
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {plan.viabilityPercent}%
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                    VIABILITY (J = {plan.scoreBreakdown.compositeJ})
                  </span>
                </div>

                {/* Metric Summary Rows */}
                <div className="space-y-1.5 font-mono text-xs mb-3">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase">COVERAGE</span>
                    <span className="font-bold text-slate-200">{plan.coveragePercent}%</span>
                  </div>

                  <div className="flex justify-between items-center bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase">POWER MARGIN</span>
                    <span className={`font-bold ${plan.batteryMarginPercent >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {plan.batteryMarginPercent}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase">RECOVERY TIME</span>
                    <span className="font-bold text-slate-200">{plan.travelTimeHours}h (est.)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action / Why This Score */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                    onOpenExplainability();
                  }}
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                  className="font-mono text-[10px] font-bold text-blue-300 hover:text-white !p-0 !min-h-0"
                >
                  WHY THIS SCORE?
                </Button>

                <span className="font-mono text-[9px] text-slate-400">
                  {plan.completedSitesCount}/{plan.totalSitesCount} Sites
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
