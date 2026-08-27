# Next-Gen Lunar Relay OS Features: Implementation Plan (Tracks A, B, C, D)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Lunar Relay OS to competition-ready tier with Automated GitHub Actions CI/CD Deployment (Track A), True 3D WebGL Surface & Shadow Casting with Three.js (Track B), NASA CAPCOM Mission Control Voice Audio Synthesis (Track C), and Client-Side NASA Flight Operations PDF Generator (Track D).

**Architecture:**
- **Track A (CI/CD)**: GitHub Actions workflow building and deploying static distribution with zero-config routing.
- **Track B (3D WebGL)**: Lightweight Three.js canvas utilizing calibrated heightmap geometry, low-angle lunar solar illumination shaders, orbit controls, and rover path visualizer.
- **Track C (CAPCOM Voice)**: Web Audio API + SpeechSynthesis engine with authentic band-pass radio acoustics, telemetry anomaly triggers, and synchronized closed captions.
- **Track D (PDF Engine)**: `jspdf` + `jspdf-autotable` generator exporting official NASA Flight Operations Briefing with provenance SHA-256 signatures, compliance matrices, and trajectory charts.

**Tech Stack:** React 19, TypeScript, Three.js, jsPDF, Web Audio API, Web Speech API, Bun, Vite, GitHub Actions.

---

## Global Constraints
- **Test Runner:** `bun test` (all tests must pass with 100% exit code 0).
- **Type Checking:** `bun run lint` (`tsc --noEmit` must produce 0 errors).
- **Accessibility:** Zero WCAG 2.1 AA/AAA contrast regressions (35/35 token checks).
- **Performance:** Keep main bundle chunked and lightweight with Rollup `manualChunks`.
- **Hermeticity:** All tests must mock browser media/audio/canvas APIs without leaking or throwing in test environments.

---

## Component & File Breakdown

```
.github/
└── workflows/
    └── deploy.yml                               [NEW] GitHub Pages / Actions CI/CD pipeline
src/
├── components/
│   ├── LunarSurface3D.tsx                      [NEW] True 3D WebGL Lunar Mesh surface component
│   ├── LunarSurface3D.test.tsx                 [NEW] Unit tests for 3D canvas lifecycle
│   ├── MissionBriefingModal.tsx                 [MODIFY] Wire PDF Export button & CAPCOM voice
│   ├── TopAppBar.tsx                           [MODIFY] Add CAPCOM voice toggle button & status
│   └── ComponentLibraryView.tsx                [MODIFY] Showcase 3D Surface & Audio Callout widgets
├── services/
│   ├── audio/
│   │   ├── capcom.ts                           [NEW] Web Audio radio filter & voice synthesizer
│   │   └── capcom.test.ts                      [NEW] Hermetic audio & speech synthesis tests
│   └── mission/
│       ├── pdfExport.ts                        [NEW] jsPDF NASA Flight Rules document generator
│       └── pdfExport.test.ts                   [NEW] Hermetic PDF data & formatting tests
└── vite.config.ts                              [MODIFY] Add manualChunks for 'vendor-three' & 'vendor-pdf'
```

---

## Implementation Tasks

### Task 1: Track A — Live Deployment CI/CD Workflow (`.github/workflows/deploy.yml`)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`
- Test: Local build & dry-run

**Interfaces:**
- Produces: Automated GitHub Pages deployment pipeline on push to `main` with quality gate verification (`bun test`, `bun run lint`, `check-contrast`, `bun run build`).

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**
```yaml
name: Deploy Lunar Relay OS to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run automated test suite
        run: bun test

      - name: Verify TypeScript types
        run: bun run lint

      - name: Verify WCAG contrast tokens
        run: bun run scripts/check-contrast.ts

      - name: Build production bundle
        run: bun run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build-and-verify
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Update `vite.config.ts` for flexible base path**
Ensure `base: process.env.GITHUB_PAGES ? '/Nasa-hackathon-2026/' : './'` so assets resolve on both local dev and GitHub Pages URL.

- [ ] **Step 3: Run local build and verify zero regressions**
Run: `bun test && bun run build`  
Expected: Exit code 0.

---

### Task 2: Track B — True 3D WebGL Lunar Surface with Three.js

**Files:**
- Install: `bun add three @types/three`
- Create: `src/components/LunarSurface3D.tsx`
- Create: `src/components/LunarSurface3D.test.tsx`
- Modify: `vite.config.ts` (add `'vendor-three'` to `manualChunks`)
- Modify: `src/components/ComponentLibraryView.tsx`

**Interfaces:**
- Consumes: `SyntheticPolarTerrain` from `src/utils/terrain.ts`, theme tokens.
- Produces: `<LunarSurface3D />` interactive WebGL component with orbit rotation, sun shadow casting, observer mast markers, and trajectory ribbon.

- [ ] **Step 1: Install Three.js dependencies**
Run: `bun add three && bun add -d @types/three`

- [ ] **Step 2: Write failing unit test for `LunarSurface3D.test.tsx`**
```tsx
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { LunarSurface3D } from './LunarSurface3D';

describe('LunarSurface3D WebGL Component', () => {
  it('renders 3D canvas container with accessible fallbacks', () => {
    const { getByRole, getByText } = render(
      <LunarSurface3D
        siteName="Shackleton Peak Beta"
        latDeg={-89.9}
        lonDeg={0.0}
        sunElevationDeg={1.5}
        sunAzimuthDeg={135}
      />
    );

    expect(getByText(/Interactive 3D WebGL Lunar Surface/i)).toBeInTheDocument();
    expect(getByRole('region', { name: /3D WebGL Lunar Terrain/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Implement `LunarSurface3D.tsx`**
Build standard Three.js canvas with:
- `PlaneGeometry(100, 100, 48, 48)` displaced by polar relief equation.
- `DirectionalLight` positioned according to `sunAzimuthDeg` and `sunElevationDeg` with lunar soft shadows.
- Pointer drag orbit controls for 360° inspection.
- Viewpoint presets: Top-Down Radar, Oblique Ridge View, Mast Observer Camera.
- Clean unmount teardown (`renderer.dispose()`, `geometry.dispose()`, `material.dispose()`).

- [ ] **Step 4: Add `vendor-three` to `vite.config.ts` manualChunks**
Isolate `three` into its own chunk to prevent inflating the initial app bundle.

- [ ] **Step 5: Run tests and typecheck**
Run: `bun test src/components/LunarSurface3D.test.tsx && bun run lint`  
Expected: 100% PASS.

---

### Task 3: Track C — NASA Mission Control Voice & CAPCOM Radio Callouts

**Files:**
- Create: `src/services/audio/capcom.ts`
- Create: `src/services/audio/capcom.test.ts`
- Modify: `src/components/TopAppBar.tsx`
- Modify: `src/components/MissionBriefingModal.tsx`

**Interfaces:**
- Produces: `speakCapcomCallout(message: string, options?: CapcomOptions)` & `globalCapcomAudio` with Web Audio bandpass EQ filter (300Hz-3kHz radio quindar effect) and Web Speech API.

- [ ] **Step 1: Write failing test in `src/services/audio/capcom.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { CapcomAudioService } from './capcom';

describe('CapcomAudioService', () => {
  let capcom: CapcomAudioService;

  beforeEach(() => {
    capcom = new CapcomAudioService({ enabled: true, volume: 0.8 });
  });

  it('formats callouts with standard NASA mission prefix', () => {
    const formatted = capcom.formatMessage('Solar flare Class M detected.');
    expect(formatted).toContain('CAPCOM to Flight');
    expect(formatted).toContain('Solar flare Class M detected.');
  });

  it('toggles mute and enabled state safely', () => {
    expect(capcom.isEnabled()).toBe(true);
    capcom.setEnabled(false);
    expect(capcom.isEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `src/services/audio/capcom.ts`**
- Web Audio API `AudioContext` with BiquadFilter (high-pass 400Hz + low-pass 3200Hz + slight distortion) simulating NASA comms radio tone.
- Quindar beep generator (short 2524 Hz intro blip).
- `window.speechSynthesis` dispatch with selected English voice.
- Safety: Check for `window` & `speechSynthesis` availability, gracefully fallback to visual toast if disabled or unsupported.

- [ ] **Step 3: Wire into `TopAppBar.tsx` and `MissionBriefingModal.tsx`**
- Add Audio Callout toggle button in `TopAppBar.tsx` (`Volume2` / `VolumeX`).
- Trigger vocal callout when switching to emergency failure scenarios (e.g. Space Weather SPE alert, Relay Loss).

- [ ] **Step 4: Run tests**
Run: `bun test src/services/audio/`  
Expected: PASS.

---

### Task 4: Track D — Client-Side PDF Mission Briefing Document Generator

**Files:**
- Install: `bun add jspdf jspdf-autotable && bun add -d @types/jspdf-autotable`
- Create: `src/services/mission/pdfExport.ts`
- Create: `src/services/mission/pdfExport.test.ts`
- Modify: `src/components/MissionBriefingModal.tsx`
- Modify: `vite.config.ts` (add `'vendor-pdf'` to `manualChunks`)

**Interfaces:**
- Consumes: `MissionExportData` from `src/services/mission/export.ts`.
- Produces: `generateMissionPdf(data: MissionExportData): Promise<Blob>` & download trigger.

- [ ] **Step 1: Install jsPDF dependencies**
Run: `bun add jspdf jspdf-autotable`

- [ ] **Step 2: Write failing unit test in `src/services/mission/pdfExport.test.ts`**
```ts
import { describe, it, expect } from 'bun:test';
import { generateMissionPdfDocDefinition } from './pdfExport';
import { buildFlightRulesMatrix } from './export';

describe('PDF Export Service', () => {
  it('builds structured document layout with NASA compliance tables', () => {
    const mockMission = {
      missionId: 'NASA-VIPER-SECTOR4-2026',
      timestampUtc: '2026-08-28T00:00:00Z',
      siteName: 'Shackleton Crater',
      strategyName: 'Balanced Viability',
      overallScore: 88,
      commLinkCoveragePct: 85.0,
      batteryReservePct: 40.0,
      etaHours: 3.5,
      spaceWeatherRisk: 'Class M1.2',
      relayCount: 3,
      flightRules: buildFlightRulesMatrix(85.0, 40.0, 'Class M1.2', 11.4),
    };

    const docDef = generateMissionPdfDocDefinition(mockMission);
    expect(docDef.title).toContain('NASA ARTEMIS MISSION OPERATIONS BRIEFING');
    expect(docDef.flightRulesTable.rows.length).toBe(4);
    expect(docDef.provenanceHash).toContain('LUNAR-SHA256-');
  });
});
```

- [ ] **Step 3: Implement `src/services/mission/pdfExport.ts`**
- Professional NASA Technical Memorandum styling:
  - Header: NASA Meatball/Patch geometry, Document ID, Classification (UNCLASSIFIED // FLIGHT OPERATIONS DIRECTIVE).
  - Metadata block: Mission ID, Provenance SHA-256 hash, Timestamp UTC.
  - KPI Executive Grid: Comms Margin %, Battery SoC %, Viability %, Max Slope.
  - Formatted `autoTable` containing the 4 NASA Flight Rules with status colors (Green/Amber/Red).
- Download trigger: `downloadMissionPdf(data)` producing `.pdf` file.

- [ ] **Step 4: Wire "Export PDF" button in `MissionBriefingModal.tsx`**
Add `<Button leftIcon={<FileDown className="w-3.5 h-3.5" />} onClick={handleExportPdf}>Export PDF</Button>`.

- [ ] **Step 5: Run tests and verify build**
Run: `bun test src/services/mission/ && bun run build`  
Expected: Clean build, 0 chunk size warnings.

---

## Verification Plan

### Automated Regression Testing
```bash
# 1. Run all unit & integration tests
bun test

# 2. Strict TypeScript typechecking
bun run lint

# 3. Automated WCAG 2.1 contrast check
bun run scripts/check-contrast.ts

# 4. Production build verification
bun run build
```

### Manual Acceptance Testing
1. **Track A:** Push to GitHub and verify GitHub Actions page deploy is live and operational.
2. **Track B:** Open 3D Lunar Surface component in `ComponentLibraryView.tsx`, orbit camera around ridge, scrub sun azimuth, and observe ridge shadow behavior.
3. **Track C:** Toggle audio on in TopAppBar, trigger "Space Weather" scenario, verify audio callout speaks authentic radio alert with closed caption.
4. **Track D:** Open Mission Briefing Modal, click "Export PDF", open the downloaded `.pdf`, and verify NASA tables, provenance hash, and styling.
