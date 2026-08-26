/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_RELAYS,
  SCIENCE_SITES,
  INITIAL_DEAD_ZONES,
  LUNAR_REGIONS,
  MITIGATION_RELAY_CANDIDATE
} from './data/lunarData';
import {
  RelayNode,
  ScienceSite,
  DeadZone,
  LunarRegion,
  NavigationTab,
  FailureScenarioType,
  PlanOption
} from './types';
import { calculateRoutePlans, calculateConstellationCoverage, type SolverContext } from './utils/solver';
import { fetchRecentSpaceWeather } from './services/nasa/donki';
import { fetchCmrCollections } from './services/nasa/cmr';
import type { ExplanationState } from './services/gemini/explain';
import { sepSeverityFromFlares, type SepSeverityLevel } from './utils/powerModel';

// Components
import { TopAppBar } from './components/TopAppBar';
import { SideNavBar } from './components/SideNavBar';
import { LunarMap } from './components/LunarMap';
import { TelemetryCards } from './components/TelemetryCards';
import { RecoveryCards } from './components/RecoveryCards';
import { ExplainabilityPanel } from './components/ExplainabilityPanel';
import { FailureScenarioModal } from './components/FailureScenarioModal';
import { DesignAssistModal } from './components/DesignAssistModal';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { RegionSelectModal } from './components/RegionSelectModal';
import { HabitatModal } from './components/HabitatModal';
import { ScienceGoalsModal } from './components/ScienceGoalsModal';
import { ConstraintsModal } from './components/ConstraintsModal';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { IlluminationTimeline } from './components/IlluminationTimeline';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('region');

  // Saved session (localStorage) — read once before any state that restores it
  const loadSaved = (): Partial<{
    relays: RelayNode[];
    deadZones: DeadZone[];
    regionId: string;
    scenario: FailureScenarioType;
  }> | null => {
    try {
      const raw = localStorage.getItem('lunar-relay-os-v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const saved = useMemo(loadSaved, []);

  // Core State
  const [activeScenario, setActiveScenario] = useState<FailureScenarioType>(saved?.scenario ?? 'relay_failure'); // Defaults to the 72h relay failure demo
  const [selectedPlanId, setSelectedPlanId] = useState<PlanOption>('balanced');
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [isMitigationActive, setIsMitigationActive] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<LunarRegion>(
    LUNAR_REGIONS.find(r => r.id === saved?.regionId) ?? LUNAR_REGIONS[0]
  );

  // Network & Site data (restored from localStorage when available)
  const [relays, setRelays] = useState<RelayNode[]>(saved?.relays ?? INITIAL_RELAYS);
  const [scienceSites, setScienceSites] = useState<ScienceSite[]>(SCIENCE_SITES);
  const [deadZones, setDeadZones] = useState<DeadZone[]>(saved?.deadZones ?? INITIAL_DEAD_ZONES);

  // Persist layout + scenario whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lunar-relay-os-v1', JSON.stringify({
        relays,
        deadZones,
        regionId: selectedRegion.id,
        scenario: activeScenario,
      }));
    } catch {
      /* storage unavailable — session-only mode */
    }
  }, [relays, deadZones, selectedRegion, activeScenario]);

  const handleResetLayout = () => {
    setRelays(INITIAL_RELAYS);
    setDeadZones(INITIAL_DEAD_ZONES);
    setSelectedRegion(LUNAR_REGIONS[0]);
    setActiveScenario('relay_failure');
    try { localStorage.removeItem('lunar-relay-os-v1'); } catch { /* noop */ }
  };

  // Live DONKI space weather (fetched only for the space_weather scenario)
  type SepSeverity = { level: SepSeverityLevel; multiplier: number };
  const [sepSeverity, setSepSeverity] = useState<SepSeverity>({ level: 'low', multiplier: 1.0 });
  const [sepStatus, setSepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  // Live CMR collection metadata (provenance panel) — fetched once on mount
  type CmrInfo = { count: number; titles: string[]; fetchedAt: string } | { error: true };
  const [cmrInfo, setCmrInfo] = useState<CmrInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCmrCollections('LOLA', 5)
      .then((r) => {
        if (cancelled) return;
        setCmrInfo({ count: r.hits, titles: r.titles.slice(0, 3), fetchedAt: new Date().toISOString() });
      })
      .catch(() => {
        if (!cancelled) setCmrInfo({ error: true });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeScenario !== 'space_weather') return;
    let cancelled = false;
    setSepStatus('loading');
    fetchRecentSpaceWeather(14)
      .then(({ flares }) => {
        if (cancelled) return;
        setSepSeverity(sepSeverityFromFlares(flares));
        setSepStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setSepStatus('error'); // solver keeps multiplier 1.0 on failure
      });
    return () => { cancelled = true; };
  }, [activeScenario]);

  // Modals & Panels
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);
  const [isDesignAssistOpen, setIsDesignAssistOpen] = useState<boolean>(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);
  const [isHabitatModalOpen, setIsHabitatModalOpen] = useState<boolean>(false);
  const [isScienceModalOpen, setIsScienceModalOpen] = useState<boolean>(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState<boolean>(false);

  // Synchronize Relays based on scenario and mitigation.
  // NOTE: the Apex candidate node is appended here when deployed — it is NOT
  // part of INITIAL_RELAYS, so the coverage geometry actually gains a relay.
  const currentRelays = useMemo(() => {
    const fleet: RelayNode[] = isMitigationActive
      ? [...relays, { ...MITIGATION_RELAY_CANDIDATE }]
      : relays;
    return fleet.map(r => {
      if (r.id === 'relay_bravo') {
        return {
          ...r,
          status: activeScenario === 'relay_failure' ? 'offline' : 'active',
          healthPercent: activeScenario === 'relay_failure' ? 0 : 94,
        } as RelayNode;
      }
      if (r.id === 'relay_shackleton_apex') {
        return {
          ...r,
          status: isMitigationActive ? 'active' : 'candidate',
          healthPercent: isMitigationActive ? 100 : 0,
        } as RelayNode;
      }
      return r;
    });
  }, [relays, activeScenario, isMitigationActive]);

  // Calculate dynamic Route Plans using solver (region + fleet + live DONKI aware)
  const solverCtx = useMemo<SolverContext>(() => ({
    region: selectedRegion,
    relays: currentRelays,
    deadZones,
    spaceWeatherMultiplier: sepSeverity.multiplier,
  }), [selectedRegion, currentRelays, deadZones, sepSeverity]);

  const routePlans = useMemo(() => {
    return calculateRoutePlans(activeScenario, sliderValue, isMitigationActive, solverCtx);
  }, [activeScenario, sliderValue, isMitigationActive, solverCtx]);

  const activePlan = useMemo(() => {
    return routePlans.find(p => p.id === selectedPlanId) || routePlans[1];
  }, [routePlans, selectedPlanId]);

  // Live constellation coverage — computed for both mitigation states so the
  // Design Assist panel can show the REAL delta, not a hardcoded one.
  const coverageWithoutMitigation = useMemo(() => {
    return calculateConstellationCoverage(currentRelays, deadZones, false, selectedRegion);
  }, [currentRelays, deadZones, selectedRegion]);

  const coverageWithMitigation = useMemo(() => {
    return calculateConstellationCoverage(currentRelays, deadZones, true, selectedRegion);
  }, [currentRelays, deadZones, selectedRegion]);

  const coveragePercent = isMitigationActive ? coverageWithMitigation : coverageWithoutMitigation;

  const deadZonesCount = isMitigationActive ? 0 : activeScenario === 'relay_failure' ? 2 : 1;

  // Average relay health
  const relayHealthAvg = useMemo(() => {
    const activeNodes = currentRelays.filter(r => r.status === 'active' || r.status === 'offline');
    if (activeNodes.length === 0) return 0;
    const total = activeNodes.reduce((acc, curr) => acc + curr.healthPercent, 0);
    return Math.round(total / activeNodes.length);
  }, [currentRelays]);

  // Live state snapshot for the AI/deterministic explainer
  const explanationInput = useMemo<ExplanationState>(() => ({
    regionName: selectedRegion.name,
    illuminationPercent: selectedRegion.illuminationAvg,
    scenario: activeScenario,
    planName: activePlan?.name ?? '',
    coveragePercent,
    batteryMarginPercent: activePlan?.batteryMarginPercent ?? 0,
    viabilityPercent: activePlan?.viabilityPercent ?? 0,
    minSignalDbm: activePlan?.minSignalDbm ?? 0,
    relaysActive: currentRelays.filter(r => r.status === 'active').length,
    relaysTotal: currentRelays.filter(r => r.type !== 'orbital_lunanet').length,
    deadZonesCount,
  }), [selectedRegion, activeScenario, activePlan, coveragePercent, currentRelays, deadZonesCount]);

  // Handle Tab Selection
  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (tab === 'region') setIsRegionModalOpen(true);
    if (tab === 'habitat') setIsHabitatModalOpen(true);
    if (tab === 'relay') setIsDesignAssistOpen(true);
    if (tab === 'science') setIsScienceModalOpen(true);
    if (tab === 'constraints') setIsConstraintsModalOpen(true);
  };

  const handleToggleScienceSite = (siteId: string) => {
    setScienceSites(prev => prev.map(s => {
      if (s.id === siteId) {
        return {
          ...s,
          status: s.status === 'completed' ? 'active' : 'completed',
        };
      }
      return s;
    }));
  };

  // Drag a relay on the map → update its real lat/lon; every memo downstream
  // (coverage, route plans) recomputes automatically.
  const handleMoveRelay = (relayId: string, lat: number, lon: number) => {
    setRelays(prev => prev.map(r => (r.id === relayId ? { ...r, lat, lon } : r)));
  };

  // Drag a dead zone → update map percentages; coverage geometry follows.
  const handleMoveDeadZone = (zoneId: string, xPercent: number, yPercent: number) => {
    setDeadZones(prev => prev.map(d => (d.id === zoneId ? { ...d, xPercent, yPercent } : d)));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#02040a] text-slate-100 antialiased relative selection:bg-blue-500/30 selection:text-white">
      {/* Ambient Lighting Orbs for Frosted Glass Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-blue-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-orange-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-indigo-900/20 rounded-full blur-[140px]"></div>
      </div>

      {/* Top Application Bar */}
      <div className="relative z-40">
        <TopAppBar
          coveragePercent={coveragePercent}
          deadZonesCount={deadZonesCount}
          activeScenario={activeScenario}
          onOpenDesignAssist={() => setIsDesignAssistOpen(true)}
          onOpenBriefing={() => setIsBriefingOpen(true)}
          onOpenProvenance={() => setIsExplainabilityOpen(true)}
          onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        />
      </div>

      {/* Main Body Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Navigation Rail */}
        <SideNavBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          roverBatteryPercent={activePlan.batteryMarginPercent}
          relayHealthAvg={relayHealthAvg}
        />

        {/* Center Workspace / Router */}
        {activeTab === 'components' ? (
          <ComponentLibraryView />
        ) : (
          <main className="flex-1 flex flex-col overflow-hidden relative p-2 md:p-3 gap-2">
            {/* Top Workspace Area: 3 Golden KPIs */}
            <div className="z-20 shrink-0">
              <TelemetryCards
                coveragePercent={coveragePercent}
                batteryPercent={activePlan.batteryMarginPercent}
                isReplanning={activeScenario !== 'nominal'}
                distanceKm={activePlan.distanceKm}
                relays={currentRelays}
                onForceRecalc={() => {
                  // Trigger small visual recalculation
                  setSliderValue(v => (v === 50 ? 55 : 50));
                }}
              />
            </div>

            {/* Central Area: Lunar Topographic Map */}
            <div className="flex-1 relative min-h-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/60 backdrop-blur-xl">
              <LunarMap
                relays={currentRelays}
                scienceSites={scienceSites}
                deadZones={deadZones}
                activePlan={selectedPlanId}
                activeScenario={activeScenario}
                isMitigationActive={isMitigationActive}
                region={selectedRegion}
                onMoveRelay={handleMoveRelay}
                onMoveDeadZone={handleMoveDeadZone}
                onDeployMitigationRelay={() => setIsMitigationActive(true)}
                onSelectRelay={() => setIsDesignAssistOpen(true)}
              />
            </div>

            {/* Bottom Decision & Recovery Cards */}
            <div className="z-20 shrink-0">
              <RecoveryCards
                plans={routePlans}
                activePlan={selectedPlanId}
                onSelectPlan={(id) => setSelectedPlanId(id)}
                onOpenExplainability={() => setIsExplainabilityOpen(true)}
                sliderValue={sliderValue}
                onSliderChange={setSliderValue}
              />
            </div>
          </main>
        )}

        {/* Explainability & Decision Matrix Slide-out Panel */}
        <ExplainabilityPanel
          isOpen={isExplainabilityOpen}
          onClose={() => setIsExplainabilityOpen(false)}
          selectedPlan={activePlan}
          allPlans={routePlans}
          donkiStatus={sepStatus}
          cmrInfo={cmrInfo}
          explanationInput={explanationInput}
          onResetLayout={handleResetLayout}
          onExecutePlan={(planId) => {
            setSelectedPlanId(planId as PlanOption);
            setIsBriefingOpen(true);
          }}
        />
      </div>

      {/* Bottom Solar Illumination Timeline Bar */}
      <div className="relative z-30">
        <IlluminationTimeline />
      </div>

      {/* Modals & Dialogs */}

      <FailureScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        activeScenario={activeScenario}
        onSelectScenario={(sc) => setActiveScenario(sc)}
      />

      <DesignAssistModal
        isOpen={isDesignAssistOpen}
        onClose={() => setIsDesignAssistOpen(false)}
        isMitigationActive={isMitigationActive}
        onDeployMitigation={() => setIsMitigationActive(!isMitigationActive)}
        coverageBefore={coverageWithoutMitigation}
        coverageAfter={coverageWithMitigation}
        deadZonesBefore={deadZonesCount}
        deadZonesAfter={0}
      />

      <MissionBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        activePlan={activePlan}
        activeScenario={activeScenario}
        coveragePercent={coveragePercent}
        isMitigationActive={isMitigationActive}
      />

      <RegionSelectModal
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />

      <HabitatModal
        isOpen={isHabitatModalOpen}
        onClose={() => setIsHabitatModalOpen(false)}
      />

      <ScienceGoalsModal
        isOpen={isScienceModalOpen}
        onClose={() => setIsScienceModalOpen(false)}
        scienceSites={scienceSites}
        onToggleSiteStatus={handleToggleScienceSite}
      />

      <ConstraintsModal
        isOpen={isConstraintsModalOpen}
        onClose={() => setIsConstraintsModalOpen(false)}
      />
    </div>
  );
}

export default App;
