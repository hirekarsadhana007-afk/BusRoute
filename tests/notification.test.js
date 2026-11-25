import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateNotificationRules,
  clearAllNotificationKeys,
} from '../src/services/notificationService.js';
import { FRESHNESS_STATES } from '../src/utils/freshness.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('notificationService.js dedupe', () => {
  let storage;
  const bus = { id: 'bus_01', name: 'Bus 1', number: 'KA-01-F-1234' };
  const stop = { id: 'stop_2', name: 'Library Junction' };
  const now = new Date('2026-11-25T08:00:00').getTime();

  beforeEach(() => {
    storage = createMemoryStorage();
    clearAllNotificationKeys(storage);
  });

  it('fires approaching alert once per trip for selected bus and stop', () => {
    const params = {
      bus,
      stop,
      etaResult: { status: 'ok', etaMinutes: 4, remainingDistance: 800 },
      delayResult: { delayMin: 0, status: 'on_time' },
      freshness: { state: FRESHNESS_STATES.LIVE },
      now,
      storage,
    };

    const first = evaluateNotificationRules(params);
    expect(first).toHaveLength(1);
    expect(first[0].type).toBe('approaching');

    // Second evaluation with same key does not fire again
    const second = evaluateNotificationRules(params);
    expect(second).toHaveLength(0);
  });

  it('re-fires delay alert only when delay enters a new 5-minute bucket', () => {
    const base = {
      bus,
      stop,
      etaResult: { status: 'ok', etaMinutes: 12, remainingDistance: 3500 },
      freshness: { state: FRESHNESS_STATES.LIVE },
      now,
      storage,
    };

    const d10 = evaluateNotificationRules({ ...base, delayResult: { delayMin: 10 } });
    expect(d10).toHaveLength(1);
    expect(d10[0].type).toBe('delay');

    const d13 = evaluateNotificationRules({ ...base, delayResult: { delayMin: 13 } });
    expect(d13).toHaveLength(0);

    const d15 = evaluateNotificationRules({ ...base, delayResult: { delayMin: 15 } });
    expect(d15).toHaveLength(1);
  });

  it('resets approaching key after bus passes the stop', () => {
    const approaching = {
      bus,
      stop,
      etaResult: { status: 'ok', etaMinutes: 3, remainingDistance: 500 },
      delayResult: { delayMin: 0 },
      freshness: { state: FRESHNESS_STATES.LIVE },
      now,
      storage,
    };

    expect(evaluateNotificationRules(approaching)).toHaveLength(1);
    expect(evaluateNotificationRules(approaching)).toHaveLength(0);

    // Bus passes stop
    evaluateNotificationRules({
      ...approaching,
      etaResult: { status: 'departed' },
    });

    // Next trip / reset can fire approaching alert again
    expect(evaluateNotificationRules(approaching)).toHaveLength(1);
  });
});
