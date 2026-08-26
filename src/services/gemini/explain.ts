/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mission explanation — FREE-FIRST AI.
 *
 * 1. LOCAL (default, $0, offline): rule-based explainer derived strictly from
 *    live computed metrics. Always available, no key, no network.
 * 2. GEMINI FREE TIER (optional): if VITE_GEMINI_API_KEY is set, the same
 *    prompt goes to Gemini's free tier via the official @google/genai
 *    browser-init pattern (AI Studio scaffold convention).
 *
 * KEY-HANDLING: browser-side keys are the documented AI Studio pattern; use a
 * restricted disposable key for demos and proxy through a backend before any
 * real deployment. No feature requires payment — the local path is complete.
 */

import { GoogleGenAI } from '@google/genai';

/** Model id verified against the installed @google/genai docs/examples. */
export const GEMINI_MODEL = 'gemini-2.5-flash';

export function resolveGeminiKey(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_GEMINI_API_KEY ?? '';
}

/** Live solver/app state handed to the explainer. All values are computed. */
export interface ExplanationState {
  regionName: string;
  illuminationPercent: number;
  scenario: string;
  planName: string;
  coveragePercent: number;
  batteryMarginPercent: number;
  viabilityPercent: number;
  minSignalDbm: number;
  relaysActive: number;
  relaysTotal: number;
  deadZonesCount: number;
}

/** Pure prompt builder (unit-testable). */
export function buildExplanationPrompt(s: ExplanationState): string {
  return [
    'You are a lunar mission-comms planner briefing an operations team.',
    'Explain in <=90 words why this route option fits the current failure scenario.',
    'Reference ONLY the numbers provided; do not invent new figures.',
    '',
    `Region: ${s.regionName} (avg solar illumination ${s.illuminationPercent}%)`,
    `Failure scenario: ${s.scenario}`,
    `Route under review: ${s.planName}`,
    `Computed constellation coverage: ${s.coveragePercent}%`,
    `Computed 24h battery margin: ${s.batteryMarginPercent}%`,
    `Computed route viability: ${s.viabilityPercent}%`,
    `Worst link budget on route: ${s.minSignalDbm} dBm`,
    `Relay fleet: ${s.relaysActive}/${s.relaysTotal} surface nodes active, ${s.deadZonesCount} comms dead zone(s)`,
  ].join('\n');
}

/**
 * Deterministic fallback explainer — derived strictly from live state so the
 * UI stays honest when no Gemini key is configured or the API fails.
 */
export function deterministicExplanation(s: ExplanationState): string {
  const parts: string[] = [];
  parts.push(
    `${s.planName} under "${s.scenario}" at ${s.regionName}: viability computes to ${s.viabilityPercent}%.`
  );
  parts.push(
    `Power model: ${s.illuminationPercent}% regional illumination yields a ${s.batteryMarginPercent}% 24h battery margin.`
  );
  parts.push(
    `Network geometry: ${s.relaysActive}/${s.relaysTotal} active surface relays cover ${s.coveragePercent}% of the analysis disk with ${s.deadZonesCount} dead zone(s); worst link ${s.minSignalDbm} dBm.`
  );
  return parts.join(' ');
}

export interface ExplanationResult {
  text: string;
  source: 'gemini' | 'local';
}

type GenerateFn = (prompt: string) => Promise<string>;

/** Default generator using the real SDK (browser-init pattern). */
const defaultGenerateFn: GenerateFn = async (prompt) => {
  const apiKey = resolveGeminiKey();
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not configured');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  const text = response.text;
  if (!text || !text.trim()) throw new Error('Gemini returned empty response');
  return text.trim();
};

/**
 * Try Gemini free tier; on ANY failure (or absent key) return the local
 * rule-based explanation so the demo never shows an error hole. `source`
 * tells the UI which path produced it.
 */
export async function fetchGeminiExplanation(
  state: ExplanationState,
  generateFn: GenerateFn = defaultGenerateFn
): Promise<ExplanationResult> {
  try {
    const text = await generateFn(buildExplanationPrompt(state));
    return { text, source: 'gemini' };
  } catch {
    return { text: deterministicExplanation(state), source: 'local' };
  }
}
