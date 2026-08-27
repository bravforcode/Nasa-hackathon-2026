/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../test/setup';
import { describe, it, expect } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { generateRoutePlans } from '../utils/solver';
import { INITIAL_RELAYS, INITIAL_DEAD_ZONES, LUNAR_REGIONS } from '../data/lunarData';

const ctx = {
  region: LUNAR_REGIONS[0],
  relays: INITIAL_RELAYS,
  deadZones: INITIAL_DEAD_ZONES,
};

const plans = generateRoutePlans('nominal', 50, false, ctx);

describe('ExplainabilityPanel Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ExplainabilityPanel
        isOpen={false}
        onClose={() => {}}
        selectedPlan={plans[0]}
        allPlans={plans}
        onExecutePlan={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders radar chart with 5 axes and vector analysis when open', () => {
    const { getByRole, getByText } = render(
      <ExplainabilityPanel
        isOpen={true}
        onClose={() => {}}
        selectedPlan={plans[0]}
        allPlans={plans}
        onExecutePlan={() => {}}
      />
    );

    expect(getByText('Decision Matrix & Explainability')).toBeInTheDocument();
    expect(getByText('5-Axis Vector Analysis')).toBeInTheDocument();

    const radarSvg = getByRole('img', { name: /5-axis radar chart/i });
    expect(radarSvg).toBeInTheDocument();

    // Check that all 5 axis labels exist
    expect(getByText('Safety')).toBeInTheDocument();
    expect(getByText('Communication')).toBeInTheDocument();
    expect(getByText('Power')).toBeInTheDocument();
    expect(getByText('Resilience')).toBeInTheDocument();
    expect(getByText('Science')).toBeInTheDocument();
  });

  it('renders score breakdown table with all 5 metrics', () => {
    const { getByText } = render(
      <ExplainabilityPanel
        isOpen={true}
        onClose={() => {}}
        selectedPlan={plans[0]}
        allPlans={plans}
        onExecutePlan={() => {}}
      />
    );

    expect(getByText('Safety / Return Margin (S):')).toBeInTheDocument();
    expect(getByText('Comms Continuity (C):')).toBeInTheDocument();
    expect(getByText('Power Margin (P):')).toBeInTheDocument();
    expect(getByText('Science Completion (T):')).toBeInTheDocument();
    expect(getByText('Resilience Margin (R):')).toBeInTheDocument();
  });

  it('triggers onExecutePlan and onClose when execute button is clicked', () => {
    let executedPlanId = '';
    let closed = false;

    const { getByRole } = render(
      <ExplainabilityPanel
        isOpen={true}
        onClose={() => { closed = true; }}
        selectedPlan={plans[0]}
        allPlans={plans}
        onExecutePlan={(id) => { executedPlanId = id; }}
      />
    );

    const execBtn = getByRole('button', { name: new RegExp(`Execute ${plans[0].name}`, 'i') });
    fireEvent.click(execBtn);

    expect(executedPlanId).toBe(plans[0].id);
    expect(closed).toBe(true);
  });

  it('switches tabs to data sources and assumptions', () => {
    const { getByRole, getByText } = render(
      <ExplainabilityPanel
        isOpen={true}
        onClose={() => {}}
        selectedPlan={plans[0]}
        allPlans={plans}
        onExecutePlan={() => {}}
      />
    );

    const sourcesTab = getByRole('tab', { name: /Data Sources/i });
    fireEvent.click(sourcesTab);
    expect(getByText(/Every calculation links directly to NASA PDS/i)).toBeInTheDocument();

    const assumptionsTab = getByRole('tab', { name: /Assumptions/i });
    fireEvent.click(assumptionsTab);
    expect(getByText(/Flight Rules and operational constraints/i)).toBeInTheDocument();
  });
});
