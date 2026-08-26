/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  INITIAL_RELAYS,
  SCIENCE_SITES,
  INITIAL_DEAD_ZONES,
  LUNAR_REGIONS,
  MITIGATION_RELAY_CANDIDATE,
  ROVER_START,
  BASE_ALPHA_POS,
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
import { calculateRoutePlans, calculateConstellationCoverage, countUncoveredDeadZones, type SolverContext } from './utils/solver';
import { fetchRecentSpaceWeather } from './services/nasa/donki';
import { fetchCmrCollections } from './services/nasa/cmr';
import type { ExplanationState } from './services/gemini/explain';
import { sepSeverityFromFlares, type SepSeverityLevel } from './utils/powerModel';
import { loadSavedState, saveState, clearSavedState } from './utils/persist';
import { loadDemTerrain } from './utils/terrainRuntime';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import { TopAppBar } from './components/TopAppBar';
import { SideNavBar } from './components/SideNavBar';
import { BottomNavBar } from './components/BottomNavBar';
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

export type SepSeverity = { level: SepSeverityLevel; multiplier: number };
export type CmrInfo = { count: number; titles: string[]; fetchedAt: string } | { error: true };

function AppContent() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('region');

  // Saved session (validated by utils/persist — malformed payloads are discarded)
  const saved = useMemo(loadSavedState, []);

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

  // Persist layout + scenario — debounced 300 ms so drag frames don't hammer
  // localStorage (review I4).
  const persistTimer = useRef<number | null>(null);
  useEffect(() => {
    if (persistTimer.current !== null) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      saveState({
        version: 1,
        relays,
        deadZones,
        regionId: selectedRegion.id,
        scenario: activeScenario,
      });
    }, 300);
    return () => {
      if (persistTimer.current !== null) window.clearTimeout(persistTimer.current);
    };
  }, [relays, deadZones, selectedRegion, activeScenario]);

  const handleResetLayout = () => {
    setRelays(INITIAL_RELAYS);
    setDeadZones(INITIAL_DEAD_ZONES);
    setSelectedRegion(LUNAR_REGIONS[0]);
    setActiveScenario('relay_failure');
    clearSavedState();
  };

  // Live DONKI space weather (fetched only for the space_weather scenario)
  const [sepSeverity, setSepSeverity] = useState<SepSeverity>({ level: 'low', multiplier: 1.0 });
  const [sepStatus, setSepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  useEffect(() => {
    if (activeScenario !== 'space_weather') {
      setSepSeverity({ level: 'low', multiplier: 1.0 });
      setSepStatus('idle');
      return;
    }
    let cancelled = false;
    setSepStatus('loading');
    fetchRecentSpaceWeather()
      .then(({ flares }) => {
        if (cancelled) return;
        const severity = sepSeverityFromFlares(flares);
        setSepSeverity(severity);
        setSepStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        // Flight rule default under API outage: assume moderate risk
        setSepSeverity({ level: 'moderate', multiplier: 1.15 });
        setSepStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [activeScenario]);

  // Lazy DEM terrain upgrade — dynamic import keeps 1 MB grid out of main bundle
  const [demReady, setDemReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadDemTerrain()
      .then(() => {
        if (!cancelled) setDemReady(true);
      })
      .catch(() => {
        // Keep synthetic fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live NASA CMR data discovery (South Pole collections for active region)
  const [cmrInfo, setCmrInfo] = useState<CmrInfo | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchCmrCollections('LOLA south pole elevation')
      .then(res => {
        if (cancelled) return;
        setCmrInfo({
          count: res.hits,
          titles: res.titles.slice(0, 3),
          fetchedAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCmrInfo({ error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  // Modals state
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [isDesignAssistOpen, setIsDesignAssistOpen] = useState<boolean>(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState<boolean>(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);
  const [isHabitatModalOpen, setIsHabitatModalOpen] = useState<boolean>(false);
  const [isScienceModalOpen, setIsScienceModalOpen] = useState<boolean>(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState<boolean>(false);

  // Computed Relay Fleet based on scenario & mitigation
  const currentRelays = useMemo(() => {
    let list = relays.map(r => {
      if (activeScenario === 'relay_failure' && r.id === 'relay_bravo') {
        return { ...r, status: 'offline' as const };
      }
      return r;
    });

    if (isMitigationActive) {
      list = [...list, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
    }

    return list;
  }, [relays, activeScenario, isMitigationActive]);

  // Solver Context: pure bundle passed to calculateRoutePlans & calculateConstellationCoverage
  // demReady is a dependency so coverage/radar recompute after DEM lazy-load
  const solverContext: SolverContext = useMemo(
    () => ({
      region: selectedRegion,
      relays: currentRelays,
      deadZones,
      scienceSites,
      spaceWeatherMultiplier: sepSeverity.multiplier,
      roverPos: ROVER_START,
      basePos: BASE_ALPHA_POS,
      // demReady triggers memo invalidation after terrain upgrade (value unused, dependency only)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...(demReady ? {} : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRegion, currentRelays, deadZones, scienceSites, sepSeverity.multiplier, demReady]
  );

  // Live calculated route plans — science axis now computed from solverContext.scienceSites
  const routePlans = useMemo(() => {
    return calculateRoutePlans(
      activeScenario,
      sliderValue,
      isMitigationActive,
      solverContext
    );
  }, [activeScenario, sliderValue, isMitigationActive, sepSeverity, solverContext]);

  // Selected plan object
  const activePlan = useMemo(() => {
    return routePlans.find(p => p.id === selectedPlanId) ?? routePlans[0];
  }, [routePlans, selectedPlanId]);

  // Constellation Coverage metric — terrain-aware via getSharedTerrain()
  const coveragePercent = useMemo(() => {
    return calculateConstellationCoverage(currentRelays, deadZones, isMitigationActive, selectedRegion);
  }, [currentRelays, deadZones, isMitigationActive, selectedRegion, demReady]);

  // Live dead-zone count — honest lens-area containment
  const deadZonesCount = useMemo(() => {
    return countUncoveredDeadZones(currentRelays, deadZones, isMitigationActive, selectedRegion);
  }, [currentRelays, deadZones, isMitigationActive, selectedRegion, demReady]);

  // Constellation coverage before/after mitigation (for Design Assist modal)
  const coverageWithoutMitigation = useMemo(() => {
    const withoutMit = relays.map(r =>
      activeScenario === 'relay_failure' && r.id === 'relay_bravo' ? { ...r, status: 'offline' as const } : r
    );
    return calculateConstellationCoverage(withoutMit, deadZones, false, selectedRegion);
  }, [relays, activeScenario, deadZones, selectedRegion, demReady]);

  const coverageWithMitigation = useMemo(() => {
    const withMit = [
      ...relays.map(r =>
        activeScenario === 'relay_failure' && r.id === 'relay_bravo' ? { ...r, status: 'offline' as const } : r
      ),
      { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const },
    ];
    return calculateConstellationCoverage(withMit, deadZones, true, selectedRegion);
  }, [relays, activeScenario, deadZones, selectedRegion, demReady]);

  const deadZonesBefore = useMemo(() => {
    const withoutMit = relays.map(r =>
      activeScenario === 'relay_failure' && r.id === 'relay_bravo' ? { ...r, status: 'offline' as const } : r
    );
    return countUncoveredDeadZones(withoutMit, deadZones, false, selectedRegion);
  }, [relays, activeScenario, deadZones, selectedRegion, demReady]);

  const deadZonesAfter = useMemo(() => {
    const withMit = [
      ...relays.map(r =>
        activeScenario === 'relay_failure' && r.id === 'relay_bravo' ? { ...r, status: 'offline' as const } : r
      ),
      { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const },
    ];
    return countUncoveredDeadZones(withMit, deadZones, true, selectedRegion);
  }, [relays, activeScenario, deadZones, selectedRegion, demReady]);

  // Relay fleet health average
  const relayHealthAvg = useMemo(() => {
    const activeCount = currentRelays.filter(r => r.status === 'active').length;
    return Math.round((activeCount / currentRelays.length) * 100);
  }, [currentRelays]);

  // Explanation input for Gemini — must match services/gemini/explain.ts contract
  const explanationInput: ExplanationState = useMemo(
    () => ({
      regionName: selectedRegion.name,
      illuminationPercent: selectedRegion.illuminationAvg,
      scenario: activeScenario,
      planName: activePlan.name,
      coveragePercent,
      batteryMarginPercent: activePlan.batteryMarginPercent,
      viabilityPercent: activePlan.viabilityPercent,
      minSignalDbm: activePlan.minSignalDbm,
      relaysActive: currentRelays.filter(r => r.status === 'active').length,
      relaysTotal: currentRelays.filter(r => r.type !== 'orbital_lunanet').length,
      deadZonesCount,
    }),
    [selectedRegion, activeScenario, activePlan, coveragePercent, currentRelays, deadZonesCount]
  );

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (tab === 'region') setIsRegionModalOpen(true);
    if (tab === 'habitat') setIsHabitatModalOpen(true);
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

  const handleMoveRelay = (relayId: string, lat: number, lon: number) => {
    setRelays(prev => prev.map(r => (r.id === relayId ? { ...r, lat, lon } : r)));
  };

  const handleMoveDeadZone = (zoneId: string, xPercent: number, yPercent: number) => {
    setDeadZones(prev => prev.map(d => (d.id === zoneId ? { ...d, xPercent, yPercent } : d)));
  };

  return (
    <div className="flex flex-col min-h-dvh w-full overflow-x-hidden md:h-screen md:overflow-hidden bg-bg text-text antialiased relative selection:bg-accent/30 selection:text-white pb-14 md:pb-0">
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
          onOpenSettings={() => setIsConstraintsModalOpen(true)}
        />
      </div>

      {/* Main Body Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Navigation Rail (Desktop) */}
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
          <main className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden relative p-2 md:p-3 gap-2">
            {/* Top Workspace Area: 3 Golden KPIs */}
            <div className="z-20 shrink-0">
              <TelemetryCards
                coveragePercent={coveragePercent}
                batteryPercent={activePlan.batteryMarginPercent}
                isReplanning={activeScenario !== 'nominal'}
                distanceKm={activePlan.distanceKm}
                relays={currentRelays}
                onForceRecalc={() => {
                  setSliderValue(v => (v === 50 ? 55 : 50));
                }}
              />
            </div>

            {/* Central Area: Lunar Topographic Map */}
            <div className="flex-1 relative min-h-[320px] md:min-h-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950/60 backdrop-blur-xl">
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

      {/* Bottom Solar Illumination Timeline Bar (Desktop & Tablet) */}
      <div className="relative z-30 hidden md:block">
        <IlluminationTimeline />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        relayHealthAvg={relayHealthAvg}
      />

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
        deadZonesBefore={deadZonesBefore}
        deadZonesAfter={deadZonesAfter}
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

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
