/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../test/setup';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import App from '../App';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { prefersReducedMotion } from '../utils/motion';
import { StatusPill, Tabs } from './ui';

// Helper component to test theme context directly
function ThemeConsumerTestComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('hc')} data-testid="set-hc">Set HC</button>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle Theme</button>
      <ThemeToggle />
    </div>
  );
}

// Controlled Tabs Container for A11y & Keyboard Navigation testing
function ControlledTabsTestContainer() {
  const [activeTab, setActiveTab] = useState('tab1');
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List aria-label="A11y Test Tabs">
        <Tabs.Trigger value="tab1">First</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Second</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Third</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">Panel 1</Tabs.Content>
      <Tabs.Content value="tab2">Panel 2</Tabs.Content>
      <Tabs.Content value="tab3">Panel 3</Tabs.Content>
    </Tabs>
  );
}

const TEST_TIMEOUT = 15000;

describe('App Integration & Cross-Surface Interaction Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('1. Full Application Render & Surface Interactions', () => {
    it('renders the complete application structure without crashing', () => {
      const { getByRole, getByText, getAllByText } = render(<App />);

      // TopAppBar Brand
      expect(getByText('LUNAR RELAY OS')).toBeInTheDocument();
      expect(getByText('SOUTH POLE MISSION CONTINUITY INTEL')).toBeInTheDocument();

      // SideNavBar Navigation landmark
      const nav = getByRole('navigation', { name: 'Mission Configuration' });
      expect(nav).toBeInTheDocument();

      // Main content area
      const main = getByRole('main');
      expect(main).toBeInTheDocument();

      // 3 Golden KPIs in TelemetryCards
      expect(getAllByText(/Communication Link/i).length).toBeGreaterThan(0);
      expect(getAllByText(/Rover Battery SoC/i).length).toBeGreaterThan(0);
      expect(getAllByText(/Route Status/i).length).toBeGreaterThan(0);

      // RecoveryCards Section
      expect(getByText(/Optimization Weight Matrix:/i)).toBeInTheDocument();
      expect(getAllByText(/Route|Plan/i).length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('displays active scenario status and opens FailureScenarioModal from TopAppBar', () => {
      const { getByRole, getByText, queryByRole } = render(<App />);

      // Initial default scenario is relay_failure => SCENARIO ACTIVE pill is visible
      const scenarioPill = getByText('SCENARIO ACTIVE');
      expect(scenarioPill).toBeInTheDocument();

      // Click Stress Test button in TopAppBar
      const stressTestBtn = getByRole('button', { name: /Stress Test/i });
      fireEvent.click(stressTestBtn);

      // FailureScenarioModal should now be open
      const dialog = getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(getByText(/Failure Scenarios & Stress Testing/i)).toBeInTheDocument();

      // Click Reset Nominal Ops button in modal
      const nominalBtn = getByRole('button', { name: /Reset Nominal Ops/i });
      fireEvent.click(nominalBtn);

      // Modal closes
      expect(queryByRole('dialog')).toBeNull();
    }, TEST_TIMEOUT);

    it('opens DesignAssistModal from TopAppBar and allows deploying mitigation relay', () => {
      const { getByRole, getByText, queryByRole } = render(<App />);

      const designAssistBtn = getByRole('button', { name: /Design Assist/i });
      fireEvent.click(designAssistBtn);

      // Dialog opens
      const dialog = getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(getByText(/Design Assist · Constellation Optimizer/i)).toBeInTheDocument();

      // Find deploy button in modal
      const deployBtn = getByRole('button', { name: /Deploy Shackleton Apex Relay/i });
      expect(deployBtn).toBeInTheDocument();
      fireEvent.click(deployBtn);

      // Modal closes on deploy
      expect(queryByRole('dialog')).toBeNull();
    }, TEST_TIMEOUT);

    it('opens MissionBriefingModal when clicking briefing button in TopAppBar', () => {
      const { getByRole, getByText, queryByRole } = render(<App />);

      const briefingBtn = getByRole('button', { name: /Export NASA Flight Rule Briefing/i });
      fireEvent.click(briefingBtn);

      const dialog = getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(getByText(/NASA Flight Rule Operational Briefing/i)).toBeInTheDocument();

      const acknowledgeBtn = getByRole('button', { name: /Acknowledge/i });
      fireEvent.click(acknowledgeBtn);
      expect(queryByRole('dialog')).toBeNull();
    }, TEST_TIMEOUT);

    it('opens modals from SideNavBar tabs (Region, Habitat, Science, Constraints)', () => {
      const { getByRole, getByText, queryByRole } = render(<App />);

      // 1. Region Select
      const regionNav = getByText('Region Select');
      fireEvent.click(regionNav);
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(getByText(/Lunar South Pole Region Select/i)).toBeInTheDocument();
      fireEvent.click(getByRole('button', { name: /Close Dialog/i }));
      expect(queryByRole('dialog')).toBeNull();

      // 2. Habitat Config
      const habitatNav = getByText('Habitat Config');
      fireEvent.click(habitatNav);
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(getByText(/Habitat & Base Camp Configuration/i)).toBeInTheDocument();
      fireEvent.click(getByRole('button', { name: /Close Dialog/i }));
      expect(queryByRole('dialog')).toBeNull();

      // 3. Science Goals
      const scienceNav = getByText('Science Goals');
      fireEvent.click(scienceNav);
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(getByText(/Science Mission Objectives & Payload Tasks/i)).toBeInTheDocument();
      fireEvent.click(getByRole('button', { name: /Close Dialog/i }));
      expect(queryByRole('dialog')).toBeNull();

      // 4. Constraints
      const constraintsNav = getByText('Constraints');
      fireEvent.click(constraintsNav);
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(getByText(/NASA Operational Flight Rules & Constraints/i)).toBeInTheDocument();
      fireEvent.click(getByRole('button', { name: /Close Dialog/i }));
      expect(queryByRole('dialog')).toBeNull();
    }, TEST_TIMEOUT);

    it('switches to ComponentLibraryView when clicking Component Library nav item', () => {
      const { getByText, queryByRole } = render(<App />);

      const compLibNav = getByText('Component Library');
      fireEvent.click(compLibNav);

      // Main map should no longer be present, Component library header should appear
      expect(queryByRole('main')).toBeNull();
      expect(getByText(/Component & Token Matrix/i)).toBeInTheDocument();
    }, TEST_TIMEOUT);
  });

  describe('2. RecoveryCards & ExplainabilityPanel Integration', () => {
    it('switches active plan when selecting plan cards and reflects in viability scores', () => {
      const { getAllByRole } = render(<App />);

      const planCards = getAllByRole('button', { name: /^Select /i });
      expect(planCards.length).toBe(3);

      const safetyCard = planCards[0];
      const balancedCard = planCards[1];
      const scienceCard = planCards[2];

      // Initial state: balanced is selected
      expect(balancedCard).toHaveAttribute('aria-pressed', 'true');
      expect(safetyCard).toHaveAttribute('aria-pressed', 'false');

      // Click Safety plan
      fireEvent.click(safetyCard);
      expect(safetyCard).toHaveAttribute('aria-pressed', 'true');
      expect(balancedCard).toHaveAttribute('aria-pressed', 'false');

      // Click Science plan
      fireEvent.click(scienceCard);
      expect(scienceCard).toHaveAttribute('aria-pressed', 'true');
      expect(safetyCard).toHaveAttribute('aria-pressed', 'false');
    }, TEST_TIMEOUT);

    it('supports keyboard selection of plan cards with Enter and Space keys', () => {
      const { getAllByRole } = render(<App />);

      const planCards = getAllByRole('button', { name: /^Select /i });
      expect(planCards.length).toBe(3);

      const safetyCard = planCards[0];
      const balancedCard = planCards[1];

      // Press Enter on safety card
      fireEvent.keyDown(safetyCard, { key: 'Enter' });
      expect(safetyCard).toHaveAttribute('aria-pressed', 'true');
      expect(balancedCard).toHaveAttribute('aria-pressed', 'false');

      // Press Space on balanced card
      fireEvent.keyDown(balancedCard, { key: ' ' });
      expect(balancedCard).toHaveAttribute('aria-pressed', 'true');
      expect(safetyCard).toHaveAttribute('aria-pressed', 'false');
    }, TEST_TIMEOUT);

    it('updates optimization weight slider and recalculates route metrics', () => {
      const { getByLabelText, getByText } = render(<App />);

      const slider = getByLabelText('Optimization Weight: Science to Safety Focus') as HTMLInputElement;
      expect(slider).toBeInTheDocument();
      expect(slider.value).toBe('50');

      // Change slider value to 80 (Safety Focus)
      fireEvent.change(slider, { target: { value: '80' } });
      expect(slider.value).toBe('80');
      expect(getByText('80%')).toBeInTheDocument();
    }, TEST_TIMEOUT);

    it('opens ExplainabilityPanel on "WHY THIS SCORE?" click and supports full tab navigation', () => {
      const { getAllByText, getByText, getByRole, queryByRole } = render(<App />);

      // Find "WHY THIS SCORE?" button on first plan card and click
      const whyScoreSpans = getAllByText(/Why This Score\?/i);
      expect(whyScoreSpans.length).toBeGreaterThan(0);
      const whyScoreBtn = whyScoreSpans[0].closest('button')!;
      fireEvent.click(whyScoreBtn);

      // ExplainabilityPanel is an aside
      expect(getByText(/Decision Matrix & Explainability/i)).toBeInTheDocument();
      expect(getByText(/Transparent Scoring & NASA Data Lineage/i)).toBeInTheDocument();

      // Verify all 4 tabs in tablist
      const tablist = getByRole('tablist', { name: 'Decision Matrix Navigation' });
      expect(tablist).toBeInTheDocument();

      const tabs = getByRole('tablist', { name: 'Decision Matrix Navigation' }).querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(4);
      expect(tabs[0].textContent).toContain('Score Breakdown');
      expect(tabs[1].textContent).toContain('Data Sources');
      expect(tabs[2].textContent).toContain('Assumptions');
      expect(tabs[3].textContent).toContain('Sensitivity');

      // Tab 1: Score breakdown contains 5-Axis Vector Analysis
      expect(getByText(/5-Axis Vector Analysis/i)).toBeInTheDocument();

      // Click Tab 2: Data Sources
      fireEvent.click(tabs[1]);
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
      expect(getByText(/Every calculation links directly to NASA PDS/i)).toBeInTheDocument();

      // Click Tab 3: Assumptions
      fireEvent.click(tabs[2]);
      expect(tabs[2].getAttribute('aria-selected')).toBe('true');
      expect(getByText(/Flight Rules and operational constraints/i)).toBeInTheDocument();

      // Click Tab 4: Sensitivity
      fireEvent.click(tabs[3]);
      expect(tabs[3].getAttribute('aria-selected')).toBe('true');
      expect(getByText(/Perturbation test responses/i)).toBeInTheDocument();

      // Close panel
      const closeBtn = getByRole('button', { name: 'Close Decision Matrix' });
      fireEvent.click(closeBtn);
      expect(queryByRole('tablist', { name: 'Decision Matrix Navigation' })).toBeNull();
    }, TEST_TIMEOUT);

    it('handles plan execution and export triggers in ExplainabilityPanel', () => {
      const { getAllByText, getByRole, getByText } = render(<App />);

      // Open ExplainabilityPanel via WHY THIS SCORE? button
      const whyScoreSpans = getAllByText('WHY THIS SCORE?');
      expect(whyScoreSpans.length).toBeGreaterThan(0);
      const whyScoreBtn = whyScoreSpans[0].closest('button')!;
      fireEvent.click(whyScoreBtn);

      // Verify panel opened
      expect(getByText(/Decision Matrix & Explainability/i)).toBeInTheDocument();

      // Export Plan (JSON) button
      const exportBtn = getByText('Export Plan (JSON)');
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);

      // Execute Plan button
      const executeBtn = getByText(/Execute /i);
      expect(executeBtn).toBeInTheDocument();
      fireEvent.click(executeBtn);

      // Executes plan and opens briefing modal
      expect(getByRole('dialog')).toBeInTheDocument();
    }, TEST_TIMEOUT);
  });

  describe('3. TelemetryCards & Constellation Diagnostics Drawer', () => {
    it('toggles constellation diagnostics drawer and displays live relay telemetry', () => {
      const { getByRole, getByText, queryByText } = render(<App />);

      const drawerToggle = getByRole('button', { name: /Constellation Diagnostics & Space Weather/i });
      expect(drawerToggle).toBeInTheDocument();

      // Initially drawer is closed
      expect(queryByText(/Current Relay Links/i)).toBeNull();

      // Open drawer
      fireEvent.click(drawerToggle);
      expect(getByText(/Current Relay Links/i)).toBeInTheDocument();
      expect(getByText(/Space Weather \[DONKI\]/i)).toBeInTheDocument();
      expect(getByText(/Excursion Telemetry/i)).toBeInTheDocument();

      // Re-calculate button inside drawer
      const recalcBtn = getByRole('button', { name: /RE-CALCULATE TELEMETRY/i });
      expect(recalcBtn).toBeInTheDocument();
      fireEvent.click(recalcBtn);

      // Close drawer
      const hideToggle = getByRole('button', { name: /Hide Diagnostics/i });
      fireEvent.click(hideToggle);
      expect(queryByText(/Current Relay Links/i)).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('4. LunarMap Layer Controls & Interactions', () => {
    it('renders map layer controls with tooltips and zoom buttons', () => {
      const { getByRole, getByText } = render(<App />);

      // Layer buttons
      const rfCoverageBtn = getByRole('button', { name: 'Toggle RF Coverage Radii' });
      const meshLinksBtn = getByRole('button', { name: 'Toggle Line-of-Sight Mesh Links' });
      const contoursBtn = getByRole('button', { name: 'Toggle Topographic Slope Contours' });
      const solarShadowBtn = getByRole('button', { name: 'Toggle Solar Shadow and Peak Exposure' });

      expect(rfCoverageBtn).toBeInTheDocument();
      expect(meshLinksBtn).toBeInTheDocument();
      expect(contoursBtn).toBeInTheDocument();
      expect(solarShadowBtn).toBeInTheDocument();

      // Toggle layer buttons
      fireEvent.click(rfCoverageBtn);
      fireEvent.click(meshLinksBtn);
      fireEvent.click(contoursBtn);
      fireEvent.click(solarShadowBtn);

      // Zoom controls
      const zoomInBtn = getByRole('button', { name: 'Zoom in' });
      const zoomOutBtn = getByRole('button', { name: 'Zoom out' });
      const resetZoomBtn = getByRole('button', { name: 'Reset' });

      expect(zoomInBtn).toBeInTheDocument();
      expect(zoomOutBtn).toBeInTheDocument();
      expect(resetZoomBtn).toBeInTheDocument();

      fireEvent.click(zoomInBtn);
      expect(getByText('120%')).toBeInTheDocument();

      fireEvent.click(zoomOutBtn);
      expect(getByText('100%')).toBeInTheDocument();

      fireEvent.click(zoomInBtn);
      fireEvent.click(resetZoomBtn);
      expect(getByText('100%')).toBeInTheDocument();
    }, TEST_TIMEOUT);
  });

  describe('5. Theme Switching (dark, light, hc)', () => {
    it('sets and transitions theme between dark, light, and hc modes', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumerTestComponent />
        </ThemeProvider>
      );

      // Default is dark
      expect(getByTestId('current-theme').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Switch to Light
      fireEvent.click(getByTestId('set-light'));
      expect(getByTestId('current-theme').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('lunar_relay_theme')).toBe('light');

      // Switch to High Contrast (hc)
      fireEvent.click(getByTestId('set-hc'));
      expect(getByTestId('current-theme').textContent).toBe('hc');
      expect(document.documentElement.getAttribute('data-theme')).toBe('hc');
      expect(localStorage.getItem('lunar_relay_theme')).toBe('hc');

      // Switch to Dark
      fireEvent.click(getByTestId('set-dark'));
      expect(getByTestId('current-theme').textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('lunar_relay_theme')).toBe('dark');
    }, TEST_TIMEOUT);

    it('ThemeToggle cycles themes with correct accessible labels and pressed state', () => {
      const { getByRole, getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumerTestComponent />
        </ThemeProvider>
      );

      // Initially dark mode
      const toggleButton = getByRole('button', { name: /Switch to Light Theme/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton.getAttribute('aria-pressed')).toBe('false');

      // Click to toggle to Light
      fireEvent.click(toggleButton);
      expect(getByTestId('current-theme').textContent).toBe('light');
      expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
      expect(toggleButton.getAttribute('aria-label')).toBe('Switch to High Contrast Theme');

      // Click to toggle to HC
      fireEvent.click(toggleButton);
      expect(getByTestId('current-theme').textContent).toBe('hc');
      expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
      expect(toggleButton.getAttribute('aria-label')).toBe('Switch to Standard Dark Theme');

      // Click to toggle back to Dark
      fireEvent.click(toggleButton);
      expect(getByTestId('current-theme').textContent).toBe('dark');
      expect(toggleButton.getAttribute('aria-pressed')).toBe('false');
      expect(toggleButton.getAttribute('aria-label')).toBe('Switch to Light Theme');
    }, TEST_TIMEOUT);

    it('persists and restores stored theme from localStorage on initial render', () => {
      localStorage.setItem('lunar_relay_theme', 'hc');

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumerTestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('current-theme').textContent).toBe('hc');
      expect(document.documentElement.getAttribute('data-theme')).toBe('hc');
    }, TEST_TIMEOUT);
  });

  describe('6. ARIA Attributes & Semantic Roles Across Rendered Surfaces', () => {
    it('verifies landmark roles (header, nav, main)', () => {
      const { getByRole } = render(<App />);

      expect(getByRole('banner')).toBeInTheDocument(); // <header>
      expect(getByRole('navigation', { name: 'Mission Configuration' })).toBeInTheDocument();
      expect(getByRole('main')).toBeInTheDocument();
    }, TEST_TIMEOUT);

    it('verifies StatusPill renders role="status" when live', () => {
      const { getByRole, getByText } = render(
        <div>
          <StatusPill tone="destructive" isLive={true} pulse={true}>
            SCENARIO ACTIVE
          </StatusPill>
          <StatusPill tone="success" isLive={false}>
            STATIC STATUS
          </StatusPill>
        </div>
      );

      const livePill = getByRole('status');
      expect(livePill).toBeInTheDocument();
      expect(livePill.textContent).toContain('SCENARIO ACTIVE');

      const staticPill = getByText('STATIC STATUS');
      expect(staticPill.getAttribute('role')).toBeNull();
    }, TEST_TIMEOUT);

    it('verifies roving tabindex and keyboard navigation on Tabs', () => {
      const { getAllByRole, getByRole } = render(<ControlledTabsTestContainer />);

      const tablist = getByRole('tablist', { name: 'A11y Test Tabs' });
      expect(tablist).toBeInTheDocument();

      const tabs = getAllByRole('tab');
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[2].getAttribute('aria-selected')).toBe('false');

      tabs[0].focus();
      // ArrowRight -> tab 2
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
      expect(getByRole('tabpanel').textContent).toBe('Panel 2');

      // End -> tab 3
      fireEvent.keyDown(tabs[1], { key: 'End' });
      expect(getByRole('tabpanel').textContent).toBe('Panel 3');

      // Home -> tab 1
      fireEvent.keyDown(tabs[2], { key: 'Home' });
      expect(getByRole('tabpanel').textContent).toBe('Panel 1');
    }, TEST_TIMEOUT);

    it('verifies Modal accessibility: dialog role, aria-modal, title, description, and Escape key dismissal', () => {
      const { getByRole, getByText, queryByRole } = render(<App />);

      // Open Constraints modal
      fireEvent.click(getByText('Constraints'));
      const dialog = getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
      expect(dialog.getAttribute('aria-describedby')).toBeTruthy();

      // Press Escape to dismiss
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(queryByRole('dialog')).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('7. Reduced-Motion Fallbacks & Motion Safety', () => {
    it('respects prefers-reduced-motion media query for animation suppression', () => {
      const originalMatchMedia = window.matchMedia;

      // Mock reduced motion = true
      window.matchMedia = (query: string): MediaQueryList => {
        return {
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        } as unknown as MediaQueryList;
      };

      expect(prefersReducedMotion()).toBe(true);

      // Render full app under reduced motion
      const { getByText, getByRole } = render(<App />);
      expect(getByText('LUNAR RELAY OS')).toBeInTheDocument();
      expect(getByRole('main')).toBeInTheDocument();

      // Restore matchMedia
      window.matchMedia = originalMatchMedia;
    }, TEST_TIMEOUT);

    it('renders immediately with proper values when prefers-reduced-motion is false', () => {
      const originalMatchMedia = window.matchMedia;

      // Mock reduced motion = false
      window.matchMedia = (query: string): MediaQueryList => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        } as unknown as MediaQueryList;
      };

      expect(prefersReducedMotion()).toBe(false);

      const { getByText } = render(<App />);
      expect(getByText('LUNAR RELAY OS')).toBeInTheDocument();

      window.matchMedia = originalMatchMedia;
    }, TEST_TIMEOUT);
  });
});
