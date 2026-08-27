# Lunar Relay OS — Core Surface Redesign (Phase 1) — Design Spec

**วันที่:** 2026-08-27
**Worktree:** `website-redesign-wcag-ux-af59fe`
**สถานะ:** รอ user review

## 1. ภาพรวมและเป้าหมาย

โปรเจกต์ Lunar Relay OS (React 19 + Vite 6 + Tailwind v4, mission-continuity planner สำหรับ NASA Space Apps) มี foundation ของ redesign รอบก่อนอยู่แล้ว: `src/styles/tokens.css`, ชุด primitive ใน `src/components/ui/` (Button, Card, IconButton, Input, Modal — ทุกตัวมี test คู่), theme dark/high-contrast ผ่าน `[data-theme]`, ฟอนต์ Fira Sans/Fira Code, และ dependency `lucide-react` + `motion` (Motion.dev) ติดตั้งไว้แล้ว **ไม่มี GSAP**

งานรอบนี้คือ **Phase 1** ของ redesign รอบใหญ่: ยกระดับ 4 surface หลักที่ผู้ใช้เห็นตลอดเวลา — `TopAppBar`, `SideNavBar`, `LunarMap` (chrome/controls), `ExplainabilityPanel` — ให้ผ่าน WCAG AA จริง (มีหลักฐานการวัด ไม่ใช่การเดา), สอดคล้อง design-token system, และมี motion layer ที่เหมาะกับเครื่องมือ mission-critical (แนวทาง Umami/Plausible: สงบ ชัดเจน อ่านข้อมูลไว ไม่ใช่ marketing-motion หวือหวา)

**Non-goals ของ Phase 1** (เก็บไว้ backlog): `BottomNavBar`, `TelemetryCards`, `RecoveryCards`, `ComponentLibraryView`, modal อีก ~10 ตัว (`ConstraintsModal`, `DesignAssistModal`, `FailureScenarioModal`, `HabitatModal`, `MissionBriefingModal`, `RegionSelectModal`, `ScienceGoalsModal`, `IlluminationTimeline`, `TopAppBarOverflowMenu`), light theme (มีการพูดถึงในแผนก่อนหน้าแต่โค้ดปัจจุบันมีแค่ `dark`/`hc` เท่านั้น — ยังไม่ implement)

**แนวทางที่เลือก (อนุมัติแล้ว):** Token → Primitives → Surfaces → Motion (4 ชั้นเรียงลำดับ, ทำทีละชั้นให้เสร็จก่อนไปชั้นถัดไป)

---

## 2. หลักฐานปัญหาที่พบจริง (ก่อนออกแบบ)

ตรวจโค้ดจริงด้วย Grep/Read ก่อนเขียนแผน (ไม่ใช้ memory เก่าที่คลาดเคลื่อน — memory ก่อนหน้าอ้างว่า repo ว่างเปล่า ซึ่งไม่ตรงกับสถานะจริงที่มี 15+ commit ของ feature จริง):

| หลักฐาน | รายละเอียด |
|---|---|
| **Contrast fail (WCAG 1.4.3)** | `text-slate-500` (#64748b) บน `--color-bg` (#05060a) = **4.26:1** คำนวณด้วยสูตร WCAG relative-luminance — ต่ำกว่าเกณฑ์ 4.5:1 สำหรับ normal text พบ 7 จุดใน 4 ไฟล์: `ExplainabilityPanel.tsx`, `RecoveryCards.tsx`, `TopAppBar.tsx`, `ui/Input.tsx` |
| **Contrast pass (baseline อ้างอิง)** | `text-slate-400` (#94a3b8) = 7.9:1, `text-blue-400`(#60a5fa)=7.96:1, `text-emerald-400`=10.5:1, `text-amber-400`=12.1:1, `text-red-400`=7.32:1 — ทั้งหมดผ่าน AA/AAA ใช้เป็นค่าตั้งต้นของ token subtle variants ได้เลย |
| **Sub-11px text ไม่มี type scale** | `text-[9px]`/`text-[8px]`/`text-[7px]` แบบ arbitrary พบ 14 จุดใน 9 ไฟล์ (ในสโคป Phase 1: `TopAppBar.tsx`×2, `LunarMap.tsx`×1, `ExplainabilityPanel.tsx`×2) |
| **Hardcoded status color แทน token** | `text-red-400/emerald-400/amber-400/blue-400` เขียนตรงในหลายไฟล์ ทั้งที่ `tokens.css` มี `--color-destructive/success/warning/accent` อยู่แล้วแต่ไม่มี "subtle" variant ให้ตรงกับสีที่ใช้จริงบนพื้นเข้ม |
| **Focus ring ไม่ใช่ token** | `focus-visible:ring-2 ring-blue-400 ring-offset-[#05060A]` hardcode ซ้ำในทุก interactive element (`Button.tsx`, `SideNavBar.tsx` ฯลฯ) |
| **Z-index ไม่มีระบบ** | `TopAppBar` ใช้ `z-40`, `ExplainabilityPanel` ใช้ `z-50` ลอย ๆ ไม่มี scale กำหนดไว้ที่เดียว เสี่ยง stacking bug เมื่อเพิ่ม motion/tooltip/dropdown |
| **LunarMap ใช้ raw hex แยกจาก token ทั้งระบบ** | สี data-viz ในแผนที่ (`#00FF94`, `#4C8DFF`, `#FFB800`, `#FF4C4C`, `#5de6ff`, `#424753`) เป็น SVG hardcode ทั้งหมด ไม่ผูกกับ `[data-theme]` เลย — ถ้าสลับเป็น `hc` theme สีแผนที่จะไม่เปลี่ยนตาม (เป็นช่องโหว่ theming ที่มีอยู่จริง) |
| **ExplainabilityPanel มี scroll container จริง** | `overflow-y-auto` ที่ tab-content wrapper (บรรทัด 203) → เป็น surface เดียวใน Phase 1 ที่ GSAP ScrollTrigger ใช้งานได้ตรงความหมายเดิม |
| **Radar chart เป็น hand-rolled SVG polygon** | ไม่ใช้ chart library คำนวณ point เองจาก `radarScores` 5 แกน — เหมาะมากสำหรับ GSAP state-driven morph animation (พล็อตจุดใหม่แบบ tween แทนการ snap) |
| **44px touch target floor มีอยู่แล้ว** | `Button.tsx` (`sizeStyles.md: min-h-11`) ทำ WCAG 2.5.5/2.5.8 ไว้ถูกต้องแล้ว — คงรูปแบบนี้ในทุก primitive ใหม่ |

---

## 3. ชั้น 1 — Token System (`src/styles/tokens.css`)

เพิ่ม (ไม่ลบของเดิม, ไม่เปลี่ยนภาพที่เห็นในจุดที่ผ่าน contrast แล้ว):

```css
@theme {
  /* ...ของเดิมทั้งหมดคงไว้... */

  /* Status "subtle" variants — สีเดิมที่ใช้จริงบนพื้นเข้ม (วัด contrast แล้วผ่าน AA) */
  --color-destructive-subtle: #f87171; /* 7.32:1 บน --color-bg */
  --color-success-subtle: #34d399;     /* 10.5:1 */
  --color-warning-subtle: #fbbf24;     /* 12.1:1 */
  /* --color-accent-subtle มีอยู่แล้ว: #60a5fa, 7.96:1 */

  /* Text-on-dark ที่ผ่าน contrast อย่างเป็นทางการ */
  --color-text-faint: #94a3b8; /* = slate-400 เดิม, 7.9:1 — ใช้แทน text-slate-500 (4.26:1, FAIL) ทุกจุด */

  /* Type scale — floor 11px สำหรับ text ที่มีความหมาย (WCAG 1.4.4 legibility) */
  --text-3xs: 0.6875rem; /* 11px */
  --text-2xs: 0.75rem;   /* 12px */

  /* Motion easing — ใช้ค่าเดียวกันทั้ง Motion และ GSAP */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
  /* --duration-fast/base/slow มีอยู่แล้ว: 150/200/300ms */

  /* Z-index scale */
  --z-nav: 30;
  --z-header: 40;
  --z-dropdown: 50;
  --z-panel: 55;   /* ExplainabilityPanel (เดิม z-50 ชนกับ dropdown ในอนาคต) */
  --z-modal: 60;
  --z-toast: 70;

  /* Data-viz palette — แยกจาก UI-chrome semantic แต่ผูกกับ [data-theme] ได้ */
  --color-map-safety: #00ff94;
  --color-map-balanced: #4c8dff;
  --color-map-science: #ffb800;
  --color-map-danger: #ff4c4c;
  --color-map-cursor: #5de6ff;
  --color-map-terrain-line: #424753;
}

:root, [data-theme="dark"] {
  /* ...ของเดิมคงไว้... */
  --color-focus-ring: var(--color-accent-subtle); /* แทน ring-blue-400 hardcode */
}

[data-theme="hc"] {
  /* ...ของเดิมคงไว้... */
  --color-focus-ring: #66aaff;
  /* Data-viz ต้องคุม contrast แยกสำหรับ hc — ยกระดับความสว่าง/ความอิ่มตัวให้ชัดขึ้นบนพื้นดำสนิท */
  --color-map-safety: #33ffb0;
  --color-map-balanced: #7aaeff;
  --color-map-science: #ffcc33;
  --color-map-danger: #ff7a7a;
}
```

**กติกาบังคับใช้ (enforce ตอนแก้ surface ในชั้น 3):**
- ห้าม text-color ใหม่ hardcode เป็น Tailwind palette class (`text-red-400` ฯลฯ) — ใช้ token-derived class (`text-destructive-subtle` ฯลฯ) เท่านั้น
- ห้ามข้อความ (ไม่ใช่ decorative) เล็กกว่า `text-3xs` (11px)
- ห้าม `ring-blue-400`/`ring-offset-[#05060A]` hardcode ใหม่ — ใช้ `--color-focus-ring`
- z-index ใหม่ทุกจุดต้องมาจาก scale นี้เท่านั้น

---

## 4. ชั้น 2 — Shared Primitives ใหม่ (`src/components/ui/`)

ทุกตัวตาม convention เดิมของโปรเจกต์: `forwardRef`, `variant`/`size` เป็น `Record<T, string>`, discriminated union บังคับ `aria-label` เมื่อไม่มี children, มี `.test.tsx` คู่กัน (bun:test + @testing-library/react ตามที่มีอยู่แล้ว), export ผ่าน `index.ts`

### 4.1 `StatusPill`
```ts
type StatusPillTone = 'accent' | 'success' | 'warning' | 'destructive' | 'neutral';
interface StatusPillProps {
  tone?: StatusPillTone;
  icon?: ReactNode;
  pulse?: boolean;       // จุดกระพริบ (แทน pattern "SCENARIO ACTIVE" เดิม)
  children: ReactNode;
}
```
แทน pattern ที่เขียนซ้ำ: coverage pill ใน `TopAppBar`, "SCENARIO ACTIVE" badge, relay-health badge ใน `SideNavBar`

### 4.2 `MetricLabel`
```ts
interface MetricLabelProps {
  label: string;        // เช่น "Operational Window"
  value: ReactNode;      // เช่น "14:22:09 LST"
  valueTone?: StatusPillTone;
  align?: 'left' | 'right';
}
```
แทน pattern label(`text-3xs` + `text-text-faint`) + value (`font-mono` + สี status) ที่เขียนมือทุกจุดใน `TopAppBar`

### 4.3 `NavItem`
```ts
interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: { text: string; tone: StatusPillTone };
  onClick: () => void;
}
```
ดึง JSX ~30 บรรทัดใน `SideNavBar.navItems.map(...)` ออกมาเป็น component เดี่ยว ทดสอบ keyboard/aria-current ได้อิสระจาก parent

### 4.4 `Tabs` (compound component)
```ts
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <Tabs.List aria-label="Decision Matrix sections">
    <Tabs.Trigger value="score">Score Breakdown</Tabs.Trigger>
    ...
  </Tabs.List>
  <Tabs.Content value="score">...</Tabs.Content>
</Tabs>
```
Roving-tabindex ครบ (Home/End/Arrow keys), `role="tablist"`/`role="tab"`/`aria-selected` — ของเดิมใน `ExplainabilityPanel` เป็น `<button>` ธรรมดา ไม่มี keyboard nav ระหว่าง tab เลย (WCAG 2.1.1/4.1.2 gap ที่พบเพิ่มระหว่างออกแบบ primitive นี้)

### 4.5 `Tooltip`
```ts
interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement; // ต้อง forward ref ได้
}
```
ตอนนี้ปุ่ม icon-only (`IconButton` ใน `TopAppBar`) มีแค่ `aria-label` ไม่มี visible tooltip ให้ mouse/sighted user เห็นความหมาย — เป็น gap ของ WCAG 1.4.13 (content on hover/focus ที่ dismissible) เมื่อเพิ่ม tooltip ในอนาคต ต้องรองรับ Esc-to-dismiss และไม่บัง focus ring

### 4.6 `AnimatedCounter`
```ts
interface AnimatedCounterProps {
  value: number;
  suffix?: string; // เช่น "%"
  duration?: number; // default = --duration-slow (300ms)
}
```
ใช้ GSAP (`gsap.to` กับ proxy object แล้ว `requestAnimationFrame` update text) แทนเลข coverage%/battery% ที่ตอนนี้ snap ทันที ผูก `prefers-reduced-motion`: ถ้า reduce → set ค่าตรงทันทีไม่ tween

**Export**: เพิ่มทั้ง 6 ตัวใน `src/components/ui/index.ts` ตาม pattern เดิม

---

## 5. ชั้น 3 — การปรับแต่ละ Surface

### 5.1 `TopAppBar.tsx`
- แทน coverage pill + "SCENARIO ACTIVE" ด้วย `StatusPill`
- แทน "Operational Window"/"Data Provenance" block ด้วย `MetricLabel` ×2
- ห่อ `IconButton` (Database/FileText/Settings) ด้วย `Tooltip` ("NASA Data Provenance", "Export Flight Rule Briefing", "System Settings")
- Coverage % ใช้ `AnimatedCounter` แทนเลข static
- แก้ `text-slate-500`→`text-text-faint`, arbitrary `text-[9px]/[10px]`→`text-3xs`
- `z-40`→`z-header` (token)

### 5.2 `SideNavBar.tsx`
- `navItems.map` เดิม → ใช้ `NavItem` component, ลบ JSX ซ้ำ ~30 บรรทัด
- relay-health badge → `StatusPill` (`tone` ผูกกับ `relayHealthAvg >= 90 ? 'success' : 'destructive'`)
- battery bar: เก็บ progress bar เดิมไว้ (เป็น pattern ที่ดีอยู่แล้ว, WCAG 1.4.1 ไม่พึ่งสีอย่างเดียวเพราะมี % ตัวเลขกำกับ) แต่เปลี่ยน fill animation จาก `transition-all duration-300` เป็น GSAP tween ผูกกับ `roverBatteryPercent` เปลี่ยนแปลง (state-driven, ไม่ใช่ scroll)
- `focus-visible:ring-blue-400` → `focus-visible:ring-[var(--color-focus-ring)]`

### 5.3 `LunarMap.tsx` (เฉพาะ chrome/controls — ไม่แตะ core rendering/physics logic)
- ปุ่ม toggle (Coverage/Links/Contours/Illumination) + zoom in/out: ห่อด้วย `Tooltip`, ปรับ active-state ให้ผ่าน `--color-focus-ring`
- SVG hex สี (`#00FF94` ฯลฯ) → ใช้ CSS custom property ผ่าน `var(--color-map-safety)` เป็นต้น เพื่อให้สลับ `hc` theme แล้วสีแผนที่เปลี่ยนตามจริง (แก้ theming gap ที่พบในหลักฐานข้อ 2)
- Relay marker offline/apex indicator (`animate-ping`/`animate-pulse` CSS ปัจจุบัน): ย้ายเป็น GSAP timeline เพื่อควบคุม `prefers-reduced-motion` ได้ละเอียดกว่า CSS animation (ตอนนี้ไม่มี reduced-motion guard เลยสำหรับ `animate-ping`/`animate-dash-slow`)
- **ไม่แตะ**: `svgRef`, drag handler, haversine/coordinate logic, terrain/DEM rendering — คงเดิมทั้งหมด

### 5.4 `ExplainabilityPanel.tsx`
- Tab bar (button ธรรมดา 4 ปุ่ม) → แทนด้วย `Tabs` primitive (แก้ keyboard-nav gap ที่พบ)
- Radar chart (5-axis SVG polygon): GSAP `morphSVG`-style point tween เมื่อ `selectedPlan` เปลี่ยน (animate จากจุดเดิมไปจุดใหม่แทนการ re-render แบบ snap) — นี่คือ **state-driven GSAP use case หลัก** ตามที่ตกลงไว้
- Content wrapper `overflow-y-auto` (บรรทัด 203): ใช้ GSAP `ScrollTrigger` (scoped ด้วย `scrollerProxy`/`ScrollTrigger.create({ scroller: containerRef })`) ทำ stagger fade-in ให้ card/section ที่เลื่อนเข้า viewport ของ panel — นี่คือ **ScrollTrigger use case เดียวใน Phase 1** ที่มี scroll container จริงรองรับ
- `text-slate-400` ใน header subtitle → คงไว้ (ผ่าน contrast อยู่แล้ว) ตรวจ/แก้เฉพาะจุดที่เป็น `text-slate-500`
- `z-50` → `z-panel` token

---

## 6. ชั้น 4 — Motion & GSAP Integration Layer

**Dependency:** เพิ่ม `gsap` ผ่าน `bun add gsap` — ตรวจสอบแล้ว (WebSearch, 2026-08-27): Webflow เข้าซื้อ GreenSock ปลายปี 2024 และประกาศให้ **GSAP core + ทุก plugin ที่เคยเป็น Club GreenSock (รวม `ScrollTrigger`, `MorphSVGPlugin`, `SplitText`, `DrawSVGPlugin`) ฟรี 100% รวมใช้เชิงพาณิชย์** มีผลตั้งแต่ 30 เม.ย. 2025 — ไม่ต้องซื้อ license เพิ่ม (ไม่ open-source แต่ free-to-use; ห้าม decompile/ทำ product แข่งจาก source) แหล่งอ้างอิง: [Webflow makes GSAP 100% free](https://webflow.com/updates/gsap-becomes-free)

**การแบ่งงานระหว่าง `motion` (มีอยู่แล้ว) กับ `gsap` (ใหม่):**

| Layer | เครื่องมือ | เหตุผล |
|---|---|---|
| Enter/exit ของ React component (Modal, Tooltip, dropdown) | `motion` (`AnimatePresence`) | เข้ากับ React lifecycle โดยตรง อยู่แล้วในโปรเจกต์ |
| Micro-interaction (hover/press scale, focus transition) | `motion` หรือ CSS transition เดิม | เบา ไม่ต้อง imperative control |
| Radar chart point morph, `AnimatedCounter` tween | `gsap.to()` กับ proxy object | ต้อง interpolate ตัวเลข/SVG coordinate แบบ imperative, GSAP ทำได้ลื่นกว่าและควบคุม easing ตรงตาม token ได้ |
| `ScrollTrigger` ใน `ExplainabilityPanel` scroll container | `gsap/ScrollTrigger` | เป็น use case เดียวที่มี real scroll container ตามที่ตกลงไว้ |
| Relay marker pulse/ping บนแผนที่ | `gsap.timeline()` | แทน CSS `animate-ping`/`animate-pulse` เพื่อผูก reduced-motion ได้ |

**Reduced-motion policy (บังคับทุก animation ใหม่):**
```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
- ถ้า `true`: `gsap.globalTimeline.timeScale(100)` (จบทันที) หรือ set state ปลายทางตรง ๆ ไม่ tween, `motion` ใช้ `MotionConfig reducedMotion="user"` ที่ root
- ทุก primitive/surface ใหม่ต้องมี unit test ยืนยันว่าเมื่อ mock `matchMedia` เป็น reduce แล้วไม่มี animation frame เกิดขึ้น (เทียบ end-state ตรงทันที)

**ไฟล์ใหม่ที่ต้องมี:** `src/utils/motion.ts` — export `prefersReducedMotion()`, ease token constants (อ่านจาก CSS var ผ่าน `getComputedStyle`), GSAP context wrapper (`gsap.context()`) สำหรับ cleanup ใน `useEffect` (กัน memory leak เวลา component unmount ระหว่าง animation)

---

## 7. WCAG AA Checklist (Phase 1 — ต้องผ่านทุกข้อก่อนปิดงาน)

- [ ] **1.4.3 Contrast (Minimum)**: ทุก `text-slate-500` ในสโคป Phase 1 (7 จุด, 4 ไฟล์) แก้เป็น `text-text-faint` แล้ว — รัน contrast script ยืนยันซ้ำ (ดูข้อ 8)
- [ ] **1.4.4 Resize Text**: ไม่มีข้อความในสโคปเล็กกว่า `--text-3xs` (11px) ยกเว้น decorative/redundant-cue element
- [ ] **1.4.1 Use of Color**: relay marker offline/apex ต้องมี shape/icon แยกจากสี ไม่ใช่สีอย่างเดียว (ของเดิมมี `isOffline`/`isApex` ใช้ stroke-dash ต่างกันอยู่แล้ว — ตรวจสอบคงไว้)
- [ ] **2.1.1 Keyboard**: `Tabs` primitive ต้อง Arrow/Home/End ทำงาน, ทุกปุ่มใหม่ต้อง Tab/Enter/Space ได้โดยไม่ใช้ mouse
- [ ] **2.4.7 Focus Visible**: ทุก interactive element ใหม่ใช้ `--color-focus-ring` เห็นชัดในทั้ง `dark` และ `hc` theme
- [ ] **2.5.5 / 2.5.8 Target Size**: ปุ่มใหม่ทั้งหมด (รวม `NavItem`, `Tooltip` trigger) ≥44×44px ตาม pattern ที่ `Button.tsx` วางไว้แล้ว
- [ ] **1.4.13 Content on Hover/Focus**: `Tooltip` ต้อง dismissible ด้วย Esc, hoverable, ไม่หายเองก่อน user เลื่อนเมาส์ออก
- [ ] **2.3.3 Animation from Interactions** (AAA แต่ยึดเป็นแนวปฏิบัติ): ทุก GSAP/motion animation เคารพ `prefers-reduced-motion`
- [ ] **4.1.2 Name, Role, Value**: `Tabs`/`Tooltip`/`StatusPill` ใหม่มี ARIA role/attribute ถูกต้อง (`role="tablist"`, `aria-selected`, `role="status"` สำหรับ pill ที่สื่อสถานะ)
- [ ] **1.3.1 Info and Relationships**: `MetricLabel` ใช้ `<dt>/<dd>` หรือ `aria-label` คู่ label-value ชัดเจน ไม่ใช่แค่ CSS วางใกล้กัน

---

## 8. Testing Strategy

**Unit tests** (bun:test + @testing-library/react, ตาม pattern `Button.test.tsx` ที่มีอยู่แล้ว):
- Primitive ใหม่ทั้ง 6 ตัว: render, prop variant ครบ, keyboard interaction (`Tabs`), aria attribute ถูกต้อง
- Reduced-motion: mock `matchMedia`, ยืนยัน end-state ทันทีไม่มี intermediate frame

**Contrast validation script** (ใหม่ — `scripts/check-contrast.ts`, รันผ่าน `bun run`):
- อ่านค่าจาก `tokens.css` โดยตรง (parse `@theme`/`:root` block), คำนวณ WCAG contrast ratio ของทุกคู่ text/bg ที่ประกาศไว้เป็น token, fail exit code ถ้าคู่ไหนต่ำกว่า 4.5:1 (หรือ 3:1 สำหรับที่ tag ว่าเป็น large-text/UI-component)
- รันใน CI/pre-commit เพื่อกัน regression (ตอนนี้ยังไม่มี CI script ลักษณะนี้เลยในโปรเจกต์)

**Visual/manual QA:**
- เพิ่ม 4 surface ใหม่เข้า `ComponentLibraryView.tsx` (มีอยู่แล้วเป็น living catalog) เพื่อ preview ทุก variant/theme (`dark`/`hc`) ในที่เดียว
- ทดสอบ `prefers-reduced-motion` จริงผ่าน browser devtools emulation
- ทดสอบ keyboard-only navigation ทั้ง 4 surface (Tab/Shift+Tab/Arrow/Esc)

**Regression guard:** รัน `bun test` เต็มชุดที่มีอยู่แล้ว (Button/Card/IconButton/Input/Modal test) ก่อน/หลังทุก phase ย่อยเพื่อยืนยันไม่กระทบของเดิม

---

## 9. Risks & Rollback

| ความเสี่ยง | Mitigation |
|---|---|
| GSAP เพิ่ม bundle size (~50-70KB gzip สำหรับ core+ScrollTrigger) | โหลดแบบ dynamic import เฉพาะ surface ที่ใช้จริง (`ExplainabilityPanel`, `LunarMap`) ไม่ import ที่ root/App level |
| แก้ `LunarMap.tsx` chrome กระทบ core rendering logic โดยไม่ตั้งใจ | จำกัดการแก้เฉพาะ JSX/className ของปุ่ม/tooltip เท่านั้น ไม่แตะ `svgRef`, drag handler, coordinate calculation — มี `bun test` คุมด้วย (ถ้ามี test คลุมส่วนนี้) |
| Token ใหม่ชนกับค่าที่ TopAppBarOverflowMenu/modal อื่นใช้ (นอกสโคป Phase 1) | Token เป็น additive เท่านั้น (ไม่ลบ/เปลี่ยนชื่อของเดิม) ไฟล์นอกสโคปยังใช้ hardcoded class เดิมได้ต่อไปจนกว่าจะถึง Phase 2 |
| `Tabs` primitive ใหม่เปลี่ยน markup จน CSS/test เดิมของ `ExplainabilityPanel` พัง | เขียน `ExplainabilityPanel` ใหม่เฉพาะส่วน tab bar, คง tab-content logic (`activeTab === 'score' && ...`) เดิมไว้ทั้งหมด |
| **Rollback point:** ทุกชั้น (token/primitive/surface/motion) เป็น commit แยกกัน — revert รายชั้นได้โดยไม่กระทบชั้นอื่นถ้าจำเป็น |

---

## 10. Backlog — Phase 2+ (นอกสโคปรอบนี้ ระบุไว้เพื่อความชัดเจน ไม่ implement ตอนนี้)

- `BottomNavBar`, `TelemetryCards`, `RecoveryCards`, `ComponentLibraryView` (ตัวมันเอง), modal ที่เหลือ ~10 ตัว
- Light theme (`[data-theme="light"]`) — ถูกพูดถึงในแผนก่อนหน้าแต่ยังไม่ implement จริง ต้องตัดสินใจอีกครั้งว่าจะทำหรือไม่
- Data-viz token เต็มระบบ (ตอนนี้ Phase 1 ทำแค่ 4 surface หลัก ยังมีสี hardcode อื่นในไฟล์นอกสโคป)
- Umami/Plausible-style dashboard card layout ใน `TelemetryCards`
- shadcn/ui-style `Select`/`Dropdown`/`Toast` primitive เพิ่มเติม
