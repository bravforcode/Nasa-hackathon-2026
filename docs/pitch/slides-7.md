# 7-Slide Deck Kit — LUNAR RELAY OS

> **HARD RULE:** ≤7 slides INCLUDING title slide. English text on slides.
> Exceeding = ineligible for Global Judging (official Project Submission Guide).
> ⚠️ Re-map slide 2 to the actual challenge statement after it releases Oct 28, 2026.

Every number below is reproducible via `bun run scripts/sanity.ts` — cite that
if a judge asks where figures come from.

---

## Slide 1 — TITLE
**LUNAR RELAY OS**
Mission-continuity planning for rover/relay comms at the lunar south pole
Team [NAME] · NASA Space Apps Challenge 2026 · Challenge: *[fill after Oct 28]*
*Visual: map screenshot with Trek LOLA basemap + coverage ellipses*

## Slide 2 — THE PROBLEM
**Comms continuity is the #1 operational risk at the poles**
- Terrain blocks line-of-sight; relay loss = instant dead zones
- Solar illumination swings 12%→94% between candidate sites — power plans made for one site fail at another
- Space weather (SEP events) degrades links with hours of warning
*Visual: dead-zone overlay screenshot*

## Slide 3 — WHAT WE BUILT
**A planner where every KPI is computed, not asserted**
- Coverage: Monte Carlo over real relay footprints − dead zones (local tangent plane)
- Power: `P = S₀·illumination·cos(tilt)·area·eff` over a 24h energy balance
- Viability: weighted composite of live battery/coverage/link outputs
*Visual: formula card + architecture mini-diagram*

## Slide 4 — LIVE DEMO MOMENTS
**Change an input → watch the physics respond**
- Drag Relay Alpha ~15 km → coverage 49.8% → 47.9%
- Deploy Apex mast → coverage 49.8% → **76.9%**, Dead Zone 2 center covered
- Switch region to Faustini (12% sun) → battery margin collapses to 0%
*Visual: 3-panel before/after screenshots*

## Slide 5 — REAL NASA DATA (verified live)
| Source | Use | Proof |
|---|---|---|
| DONKI (api.nasa.gov) | Solar-flare feed → space-weather severity | Live fetch, DEMO_KEY verified |
| Trek WMTS | LOLA shaded-relief basemap tiles | Tile HTTP 200 (maxNativeZoom 5) |
| Earthdata CMR | Dataset metadata provenance panel | Live collection query |

## Slide 6 — HONEST ENGINEERING
**What computes vs. what's authored — disclosed in-repo**
- ✅ Computed: coverage, battery margin, link budget (FSPL), distance/time, viability, severity
- ⚠️ Authored heuristics: radar scores (documented in README)
- 83 unit tests; deterministic PRNG → judges can reproduce every figure
*Why: Validity criterion rewards grounded solutions over demos*

## Slide 7 — ROADMAP & ASK
**Next:** DEM ray-casting for true horizon masks · orbital node scheduling · multi-rover ops
**Ask:** feedback from lunar-comms SMEs on model parameters
Repo: github.com/bravforcode/Nasa-hackathon-2026
*Visual: roadmap timeline*

---

### Build notes
- One idea per slide; ≤25 words visible per slide besides tables
- Export PDF ≤7 pages and CHECK page count before upload
- Keep speaker notes separate — they don't count as slides only if not exported
