/**
 * Sanity script: prints REAL solver outputs per region/fleet state.
 * Run: bun run scripts/sanity.ts
 */
import { calculateConstellationCoverage, generateRoutePlans, computeRouteViability } from '../src/utils/solver';
import { LUNAR_REGIONS, INITIAL_RELAYS, INITIAL_DEAD_ZONES, MITIGATION_RELAY_CANDIDATE } from '../src/data/lunarData';

// Replicates App.tsx currentRelays: apex appended when mitigated, bravo offline on relay_failure
const mitigatedFleet = [...INITIAL_RELAYS, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
const relayFailureFleet = INITIAL_RELAYS.map(r =>
  r.id === 'relay_bravo' ? { ...r, status: 'offline' as const } : r
);

console.log('--- Region sensitivity (relay_failure, balanced plan) ---');
for (const region of LUNAR_REGIONS) {
  const plans = generateRoutePlans('relay_failure', 50, false, {
    region,
    relays: INITIAL_RELAYS,
    deadZones: INITIAL_DEAD_ZONES,
  });
  const cov = calculateConstellationCoverage(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region);
  const balanced = plans[1];
  console.log(
    `${region.id.padEnd(12)} illum=${String(region.illuminationAvg).padStart(3)}%  ` +
      `coverage=${cov.toFixed(1)}%  balanced: battery=${balanced.batteryMarginPercent}% viability=${balanced.viabilityPercent}%`
  );
}

const nominalCov = calculateConstellationCoverage(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, LUNAR_REGIONS[0]);
const mitigatedCov = calculateConstellationCoverage(mitigatedFleet, INITIAL_DEAD_ZONES, true, LUNAR_REGIONS[0]);
const relayFailCov = calculateConstellationCoverage(relayFailureFleet, INITIAL_DEAD_ZONES, false, LUNAR_REGIONS[0]);
console.log(`\nShackleton coverage — nominal: ${nominalCov}% | +Apex: ${mitigatedCov}% | relay_failure: ${relayFailCov}%`);

// Drag simulation: move Relay Alpha ~15 km north (0.5 deg lat) and re-check.
const draggedFleet = INITIAL_RELAYS.map(r =>
  r.id === 'relay_alpha' ? { ...r, lat: r.lat + 0.5 } : r
);
const draggedCov = calculateConstellationCoverage(draggedFleet, INITIAL_DEAD_ZONES, false, LUNAR_REGIONS[0]);
console.log(`Drag sim — alpha moved 0.5° north (~15 km): coverage ${nominalCov}% -> ${draggedCov}%`);

// Computed viability sample (space_weather severe)
const sw = generateRoutePlans('space_weather', 50, false, {
  region: LUNAR_REGIONS[0],
  relays: INITIAL_RELAYS,
  deadZones: INITIAL_DEAD_ZONES,
  spaceWeatherMultiplier: 1.6, // severe (X-class)
});
console.log(`space_weather severe viability (balanced): ${sw[1].viabilityPercent}%`);
console.log(`computeRouteViability(b=32,c=91,s=-92) = ${computeRouteViability({ batteryMarginPercent: 32, coveragePercent: 91, minSignalDbm: -92 })}`);
const radarBalanced = generateRoutePlans('nominal', 50, false, {
  region: LUNAR_REGIONS[0],
  relays: INITIAL_RELAYS,
  deadZones: INITIAL_DEAD_ZONES,
})[1];
console.log('radar(balanced, nominal):', JSON.stringify(radarBalanced.radarScores));
