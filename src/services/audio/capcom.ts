/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CapcomCalloutType = 'ALERT' | 'ADVISORY' | 'REPLAN' | 'STATUS';

export interface CapcomCalloutEntry {
  id: string;
  timestamp: string;
  type: CapcomCalloutType;
  text: string;
}

export interface CapcomOptions {
  enabled?: boolean;
  volume?: number;
  quindarBeep?: boolean;
}

export class CapcomAudioService {
  private enabled: boolean;
  private volume: number;
  private quindarBeep: boolean;
  private listeners: Set<(entry: CapcomCalloutEntry) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor(options: CapcomOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.volume = Math.max(0, Math.min(1, options.volume ?? 0.8));
    this.quindarBeep = options.quindarBeep ?? true;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public formatMessage(message: string, type: CapcomCalloutType = 'ADVISORY'): string {
    return `CAPCOM ${type}: ${message}`;
  }

  public onCallout(listener: (entry: CapcomCalloutEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private playQuindarBeep(): void {
    if (!this.quindarBeep || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // NASA Quindar Intro Tone: 2524 Hz for 25ms
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2524, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch {
      // Audio context unavailable or blocked by autoplay policy
    }
  }

  public speak(message: string, type: CapcomCalloutType = 'ADVISORY'): void {
    const formatted = this.formatMessage(message, type);

    const entry: CapcomCalloutEntry = {
      id: `CAPCOM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      text: formatted,
    };

    // Notify listeners (for captions / UI indicators)
    this.listeners.forEach((cb) => cb(entry));

    if (!this.enabled) return;

    // Play radio blip
    this.playQuindarBeep();

    // Trigger Web Speech synthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = this.volume;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;

        // Prefer English voice
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                        voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis blocked or unavailable
      }
    }
  }
}

export const globalCapcomAudio = new CapcomAudioService();
