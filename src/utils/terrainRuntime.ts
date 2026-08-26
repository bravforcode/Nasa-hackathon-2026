/**
 * Central holder for the app-wide shared TerrainProvider + LOS cache.
 * Lives outside solver.ts so multiple modules can share one provider and
 * one memoized LOS table instead of each ray-marching independently.
 */
import { SyntheticPolarTerrain, horizonProfile, losFactor, type TerrainProvider } from './terrain';

let current: TerrainProvider = new SyntheticPolarTerrain();

const LOS_CACHE_CAP = 5000;
const cache = new WeakMap<TerrainProvider, Map<string, number>>();

export function getSharedTerrain(): TerrainProvider {
  return current;
}

export function setSharedTerrain(t: TerrainProvider): void {
  current = t;
  cache.delete(current);
}

/** Ray-marched LOS factor in [0.55,1], cached per (provider, relayId, position). */
export function relayLosFactorCached(relayId: string, lat: number, lon: number): number {
  let byPos = cache.get(current);
  if (!byPos) {
    byPos = new Map();
    cache.set(current, byPos);
  }
  const key = `${relayId}:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  let f = byPos.get(key);
  if (f === undefined) {
    f = losFactor(horizonProfile(current, lat, lon));
    if (byPos.size >= LOS_CACHE_CAP) byPos.clear();
    byPos.set(key, f);
  }
  return f;
}

/**
 * Async upgrade to the REAL LOLA DEM grid (dynamic import keeps the ~700 KiB
 * payload out of the main bundle). Safe to call multiple times.
 */
export async function loadDemTerrain(): Promise<void> {
  const [{ DEM_GRID }, { GriddedDemTerrain }] = await Promise.all([
    import('../data/demGrid.generated'),
    import('./lolaTerrain'),
  ]);
  setSharedTerrain(new GriddedDemTerrain(DEM_GRID.meta, DEM_GRID.dnBase64));
}
