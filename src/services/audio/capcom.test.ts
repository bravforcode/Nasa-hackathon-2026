/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CapcomAudioService, type CapcomCalloutType } from './capcom';

describe('CapcomAudioService', () => {
  let capcom: CapcomAudioService;

  beforeEach(() => {
    capcom = new CapcomAudioService({
      enabled: true,
      volume: 0.8,
      quindarBeep: false,
    });
  });

  it('formats callouts with standard NASA mission prefix', () => {
    const formatted = capcom.formatMessage('Solar flare Class M detected.', 'ALERT');
    expect(formatted).toContain('CAPCOM ALERT');
    expect(formatted).toContain('Solar flare Class M detected.');
  });

  it('formats nominal advisories correctly', () => {
    const formatted = capcom.formatMessage('Shackleton Apex relay online.', 'ADVISORY');
    expect(formatted).toContain('CAPCOM ADVISORY');
    expect(formatted).toContain('Shackleton Apex relay online.');
  });

  it('toggles mute and enabled state safely', () => {
    expect(capcom.isEnabled()).toBe(true);
    capcom.setEnabled(false);
    expect(capcom.isEnabled()).toBe(false);
    capcom.setEnabled(true);
    expect(capcom.isEnabled()).toBe(true);
  });

  it('subscribes and notifies listeners when speech callouts occur', () => {
    const log: Array<{ text: string; type: CapcomCalloutType }> = [];
    const unsubscribe = capcom.onCallout((entry) => {
      log.push(entry);
    });

    capcom.speak('Relay telemetry nominal.', 'ADVISORY');
    expect(log.length).toBe(1);
    expect(log[0].text).toContain('Relay telemetry nominal.');
    expect(log[0].type).toBe('ADVISORY');

    unsubscribe();
  });
});
