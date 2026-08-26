import { SyntheticPolarTerrain, horizonProfile, losFactor } from '../src/utils/terrain';
import { calculateConstellationCoverage } from '../src/utils/solver';
import { INITIAL_RELAYS, INITIAL_DEAD_ZONES, MITIGATION_RELAY_CANDIDATE, LUNAR_REGIONS } from '../src/data/lunarData';

const t = new SyntheticPolarTerrain();
for (const r of [...INITIAL_RELAYS, MITIGATION_RELAY_CANDIDATE]) {
  const p = horizonProfile(t, r.lat, r.lon);
  console.log(r.id.padEnd(24), 'maxH=', p.maxHorizonDeg, 'blocked=', p.blockedFraction, 'los=', losFactor(p));
}
const region = LUNAR_REGIONS[0];
const fleet = [...INITIAL_RELAYS, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
const no = calculateConstellationCoverage(fleet, [], true, region, t);
const dz2only = calculateConstellationCoverage(fleet, INITIAL_DEAD_ZONES.filter(d => d.id === 'dzone_2'), true, region, t);
console.log('covNoHoles=', no, 'covDz2=', dz2only);
