import { DEM_GRID } from '../src/data/demGrid.generated';
import { GriddedDemTerrain } from '../src/utils/lolaTerrain';
import { SyntheticPolarTerrain } from '../src/utils/terrain';

console.log('meta:', JSON.stringify(DEM_GRID.meta));
const g = new GriddedDemTerrain(DEM_GRID.meta, DEM_GRID.dnBase64);
const s = new SyntheticPolarTerrain();
for (const [lat, lon] of [[-89.42, 14.12], [-89.15, 21.84], [-89.78, -4.5], [-89.88, 8.45]] as const) {
  console.log(`(${lat},${lon})  LOLA=${g.elevationAt(lat, lon).toFixed(1)}m   SYN=${s.elevationAt(lat, lon).toFixed(1)}m`);
}
