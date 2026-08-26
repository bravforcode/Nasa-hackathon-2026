# LUNAR RELAY OS

Mission-continuity planner for rover/relay communications at the lunar south pole
(Shackleton, Malapert, de Gerlache, Faustini). Pick a failure scenario
(relay loss / power loss / comms blackout / space weather), and the tool computes
3 route options with a transparent explainability panel.

Built for the [NASA Space Apps Challenge](https://www.spaceappschallenge.org/) —
2026 event: **November 14–15, 2026**.

---

## Honest status: what is computed vs. what is an authored heuristic

This project started as a UI mockup where every number was hardcoded.
It is being converted into a real tool. Current state, verified by unit tests:

| Metric | Status | How it is produced |
|---|---|---|
| Constellation coverage % | ✅ **Computed** | Deterministic Monte Carlo over real relay lat/lon footprints (`coverageRadiusKm`) minus dead zones, in a local tangent plane around the selected region (`src/utils/powerModel.ts → coveragePercentPlanar`). Deploying the Apex relay measurably raises it (≈49.8% → 62.5% for Shackleton); dragging a relay recomputes it live. |
| Map imagery | ✅ **Real NASA tiles** | Leaflet EPSG:4326 layer over NASA Trek WMTS `LRO_LOLA_ClrShade_Global_128ppd_v04` (maxNativeZoom 5, verified serving). All map nodes (relays, science sites, dead zones) are projected from their actual lat/lon with the same km scale the solver uses — what you see matches what is computed. Relay nodes are **draggable**. |
| Battery margin % | ✅ **Computed** | Energy balance `P = S₀ · illumination · cos(tilt) · area · eff` over a 24 h window vs. rover load (`batteryMarginPercent`). Selecting Faustini (12% illumination) collapses margins to 0%; Malapert (94%) raises them. |
| Route viability % | ✅ **Computed** | Weighted composite of live battery/coverage/signal outputs (`computeRouteViability`: 40% power + 35% network + 25% link), penalized by live DONKI space-weather severity. |
| Space-weather severity | ✅ **Live data** | Real DONKI API fetch (last 14 days of solar flares) mapped to a severity multiplier (`sepSeverityFromFlares`). Status shown live in the provenance panel. |
| CMR metadata panel | ✅ **Live data** | Earthdata CMR collection search fetched on load and displayed in the Explainability ▸ Data Sources tab. |
| Radar scores / distances / signal dBm | ⚠️ **Authored heuristics** | Expert-authored per scenario/plan; disclosed, not yet physics-derived. Base habitat / rover markers and trajectory art remain illustrative overlays. |

**Known modeling consequences (intentional, documented):**
- Coverage is computed for the *selected* region. The relay fleet is deployed
  around Shackleton, so selecting Malapert/de Gerlache/Faustini legitimately
  yields ~0% surface-mesh coverage — that is a real planning insight ("a deploy
  to Faustini needs new relay infrastructure"), not a bug.
- Relay Bravo going offline does not change coverage at the default 25 km
  analysis radius because Alpha+Charlie footprints dominate its area. Widen
  `REGION_ANALYSIS_RADIUS_KM` or retune `coverageRadiusKm` values to make it bite.
- Orbital LunaNet nodes are excluded from surface-mesh coverage (they model
  backhaul/DTE, not surface line-of-sight).

## Model assumptions (tunable parameters — see `src/utils/solver.ts`)

| Parameter | Value | Note |
|---|---|---|
| Rover load | 135 W | housekeeping + traverse |
| Battery | 500 Wh | main pack |
| Panel area × efficiency | 0.5 m² × 28% | effective illuminated array |
| Panel incidence | 25° | assumed tilt vs. sun |
| Energy window | 24 h | |
| Analysis disk | 25 km radius | around region anchor |
| Map extent | ±30 km | maps DeadZone xPercent/yPercent → km |

These are demonstration parameters, not measured mission values. The formulas
they feed are standard physics/geometry; every constant is exported and tested.

## Real NASA data integration

| Source | Use | Verified |
|---|---|---|
| [DONKI](https://api.nasa.gov/) (`/DONKI/FLR`, `/DONKI/CME`) | Live solar-flare list → space-weather severity for the `space_weather` scenario | ✅ live-tested with `DEMO_KEY` (30 req/hr, 50/day limits) |
| [NASA Trek Moon WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon) | Planned basemap tiles (LOLA-derived). Working layer: `LRO_LOLA_ClrShade_Global_128ppd_v04`, tile pattern `/tiles/Moon/EQ/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.png`. Note: GIBS is Earth-only and cannot be used for lunar maps. | ✅ tile HTTP 200 verified |
| [Earthdata CMR](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html) | Planned dataset metadata provenance panel (public, CORS-enabled) | docs verified |

Set your key in `.env`: `VITE_NASA_API_KEY=...` (falls back to `DEMO_KEY`).

## Run

```bash
bun install        # or npm install (adds leaflet for the Trek basemap)
bun run dev        # dev server on :3000
bun test           # 54 unit tests (powerModel, donki client, cmr client)
bun run lint       # tsc --noEmit
bun run build      # production build
bun run scripts/sanity.ts   # print real solver outputs per region/scenario + drag simulation
```

## Architecture

```
src/
├── types.ts                     # domain types
├── data/lunarData.ts            # regions, relays, dead zones, science sites
├── utils/
│   ├── powerModel.ts            # pure physics/geometry (tested)
│   └── solver.ts                # route generation + coverage + model params
├── services/nasa/donki.ts       # DONKI REST client (tested, no key required)
└── components/                  # React UI (glassmorphism dashboard)
```

## Roadmap

1. ~~Replace stylized SVG map background with Trek WMTS LOLA tiles~~ ✅ done (Leaflet, `maxNativeZoom: 5` — z6+ 404s on Trek)
2. ~~Make relay nodes draggable → recompute coverage live~~ ✅ done (drag updates lat/lon → coverage/battery/viability all recompute)
3. ~~Derive viability from computed metrics~~ ✅ done (`computeRouteViability`). Remaining: radar scores + distances still authored.
4. ~~Wire CMR metadata into the provenance panel; correct the fictional "LOLA ray-casting" claim~~ ✅ done (live CMR block + truthful assumption text)
5. Optional Gemini explainability via `@google/genai` (dependency present, unused — requires key-handling decision)
6. Project base habitat / rover markers and trajectory art onto the same projection (currently decorative)

## License

Apache-2.0 (inherited from scaffold headers).
