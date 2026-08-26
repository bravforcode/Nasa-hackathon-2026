/**
 * Build-time pipeline: real LOLA DEM -> embedded visibility-ready grid.
 *
 * Input : scripts/cache/LDEM_80S_80M.IMG  (LOLA GDR V1.0, polar stereographic,
 *         7600x7600, LSB int16, 80 m/post, height_m = DN * 0.5)
 * Output: src/data/demGrid.generated.ts   (~521x521 int16 @ 480 m posting,
 *         base64-encoded, imported lazily by utils/lolaTerrain.ts)
 *
 * Run: bun run scripts/build-dem-grid.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const IMG = 'scripts/cache/LDEM_80S_80M.IMG';
const OUT = 'src/data/demGrid.generated.ts';

// --- LBL constants (parsed/verified from LDEM_80S_80M.LBL, 2026-08-26) ------
const SRC_LINES = 7600;
const SRC_SAMPLES = 7600;
const SRC_POST_M = 80;
const SCALE = 0.5;              // height_m = DN * SCALING_FACTOR
const PROJ_OFFSET_PX = 3799.5;  // LINE_/SAMPLE_PROJECTION_OFFSET

if (!existsSync(IMG)) {
  console.error(`Missing ${IMG}. Run scripts/fetch-dem.ps1 first.`);
  process.exit(1);
}

const buf = readFileSync(IMG);
if (buf.length !== SRC_LINES * SRC_SAMPLES * 2) {
  console.error(`Unexpected size ${buf.length}; expected ${SRC_LINES * SRC_SAMPLES * 2}`);
  process.exit(1);
}
const dn = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1);

// Polar-stereographic inverse (sphere, center lat -90 / lon 0):
//   rho_m = 2*R*tan(colatitude/2);  x=rho*sin(lon), y=rho*cos(lon)
//   col = PROJ_OFFSET + x/post ; row = PROJ_OFFSET - y/post
function worldToSrcPx(xM: number, yM: number): { col: number; row: number } {
  return {
    col: PROJ_OFFSET_PX + xM / SRC_POST_M,
    row: PROJ_OFFSET_PX - yM / SRC_POST_M,
  };
}

// --- Output grid ------------------------------------------------------------
const POST_M = 480;
const HALF_KM = 125;
const N = Math.floor((HALF_KM * 2000) / POST_M) + 1; // 521 posts across 250 km
const ORIGIN_M = -((N - 1) / 2) * POST_M;            // y/x at index 0

const out = new Int16Array(N * N);
let minH = Infinity;
let maxH = -Infinity;

const POOL = Math.round(POST_M / SRC_POST_M); // 6x6 average pooling
const half = POOL / 2;

for (let j = 0; j < N; j++) {
  const yM = ORIGIN_M + j * POST_M;
  for (let i = 0; i < N; i++) {
    const xM = ORIGIN_M + i * POST_M;
    const { col, row } = worldToSrcPx(xM, yM);
    let sum = 0;
    let count = 0;
    for (let dj = -half; dj < half; dj++) {
      const r = Math.round(row) + dj;
      if (r < 0 || r >= SRC_LINES) continue;
      for (let di = -half; di < half; di++) {
        const c = Math.round(col) + di;
        if (c < 0 || c >= SRC_SAMPLES) continue;
        sum += dn[r * SRC_SAMPLES + c];
        count++;
      }
    }
    const meanDn = count > 0 ? sum / count : 0;
    const hM = meanDn * SCALE;
    if (hM < minH) minH = hM;
    if (hM > maxH) maxH = hM;
    out[j * N + i] = Math.max(-32768, Math.min(32767, Math.round(meanDn)));
  }
}

// --- Emit TS module ----------------------------------------------------------
const bytes = new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
// Encode the WHOLE buffer in one pass — per-chunk encoding inserts '='
// padding at boundaries whenever the chunk size isn't a multiple of 3.
const b64 = Buffer.from(bytes).toString('base64');

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * scripts/build-dem-grid.ts @ ${new Date().toISOString()}
 *
 * Source: LOLA GDR V1.0 "LDEM_80S_80M" (NASA LRO_LOLA_4_GDR; mirror imbrium.mit.edu)
 *   polar stereographic, center lat -90 / lon 0, 80 m/post, LSB int16,
 *   height_m = DN * 0.5 (LBL SCALING_FACTOR), DERIVED range [-14592, 14052] m.
 * Downsampled to ${POST_M} m posting over a ${(N - 1) * POST_M / 1000} km square
 * around the south pole (${N}x${N} int16, row 0 = southern edge).
 * Elevation range in this window: ${minH.toFixed(0)} .. ${maxH.toFixed(0)} m.
 */
`;

const body = `export const DEM_GRID = {
  meta: {
    n: ${N},
    postM: ${POST_M},
    originM: ${ORIGIN_M},
    scale: ${SCALE},
    minH: ${minH.toFixed(1)},
    maxH: ${maxH.toFixed(1)},
    srcLabel: 'LOLA GDR V1.0 LDEM_80S_80M (240->480 m avg-pooled)',
  },
  dnBase64:
    '${b64}',
} as const;
`;

writeFileSync(OUT, header + body);
console.log(`Wrote ${OUT}`);
console.log(`grid ${N}x${N} @ ${POST_M} m | height ${minH.toFixed(0)}..${maxH.toFixed(0)} m | b64 ${(b64.length / 1024).toFixed(0)} KiB`);
