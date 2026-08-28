/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BatteryCharging,
  PowerOff,
  WifiOff,
  SunMedium,
  CheckCircle2
} from 'lucide-react';
import { FailureScenarioType } from '../types';
import { Modal, Button, StatusPill } from './ui';
import { globalCapcomAudio } from '../services/audio/capcom';

interface FailureScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: FailureScenarioType;
  onSelectScenario: (scenario: FailureScenarioType) => void;
}

export const FailureScenarioModal: React.FC<FailureScenarioModalProps> = ({
  isOpen,
  onClose,
  activeScenario,
  onSelectScenario,
}) => {
  const triggerScenario = (scenario: FailureScenarioType) => {
    onSelectScenario(scenario);
    if (scenario === 'relay_failure') {
      globalCapcomAudio.speak('Relay failure detected on secondary node. Comms dead zone warning active.', 'ALERT');
    } else if (scenario === 'power_loss') {
      globalCapcomAudio.speak('Base EPS power degradation detected. Excursion energy limits engaged.', 'ALERT');
    } else if (scenario === 'comms_blackout') {
      globalCapcomAudio.speak('Loss of direct Earth DSN link. Switching to autonomous lunar surface mesh.', 'ALERT');
    } else if (scenario === 'space_weather') {
      globalCapcomAudio.speak('High-energy solar particle event detected. Ka-band orbital crosslinks degraded.', 'ALERT');
    } else if (scenario === 'nominal') {
      globalCapcomAudio.speak('All systems restored to nominal baseline. Constellation coverage at 91 percent.', 'STATUS');
    }
  };
  const scenarios: {
    id: FailureScenarioType;
    title: string;
    description: string;
    icon: React.ReactNode;
    severity: 'critical' | 'warning' | 'nominal';
  }[] = [
    {
      id: 'relay_failure',
      title: 'Relay Failure',
      description: 'Node Relay-B dropout in active constellation. Creates critical comms dead zone along current trajectory.',
      icon: <BatteryCharging className="w-5 h-5 text-[var(--color-destructive-subtle)]" />,
      severity: 'critical',
    },
    {
      id: 'power_loss',
      title: 'Power Loss',
      description: 'Critical electrical power system (EPS) failure at base camp. Restricts rover excursion energy budget.',
      icon: <PowerOff className="w-5 h-5 text-[var(--color-warning-subtle)]" />,
      severity: 'warning',
    },
    {
      id: 'comms_blackout',
      title: 'Comms Blackout',
      description: 'Complete loss of Earth DSN direct-to-Earth uplink. Forces autonomous surface mesh routing.',
      icon: <WifiOff className="w-5 h-5 text-[var(--color-warning-subtle)]" />,
      severity: 'warning',
    },
    {
      id: 'space_weather',
      title: 'Space Weather (SEP Event)',
      description: 'High-energy solar particle event detected by SDO & DONKI. Degrades Ka-band orbital crosslinks.',
      icon: <SunMedium className="w-5 h-5 text-[var(--color-destructive-subtle)]" />,
      severity: 'critical',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Failure Scenarios & Stress Testing"
      description="Select a mission stress test to simulate systemic impact on lunar operations."
      size="lg"
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nominal baseline restores all relay nodes & 91% coverage.</span>
          </div>

          <Button
            variant={activeScenario === 'nominal' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              triggerScenario('nominal');
              onClose();
            }}
          >
            Reset Nominal Ops
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <div
              key={sc.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => {
                triggerScenario(sc.id);
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerScenario(sc.id);
                  onClose();
                }
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                isSelected
                  ? 'bg-red-500/15 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-400/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-destructive-subtle)]" />
              )}
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  {sc.icon}
                </div>
                {isSelected && (
                  <StatusPill tone="destructive" pulse className="py-0.5 px-2">
                    ACTIVE
                  </StatusPill>
                )}
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-white">
                  {sc.title}
                </h3>
                <p className="font-mono text-3xs text-slate-400 mt-1 leading-snug">
                  {sc.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
