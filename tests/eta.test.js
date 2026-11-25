import { describe, it, expect } from 'vitest';
import {
  smoothSpeed,
  computeStopEta,
  computeDelay,
  DEFAULT_SPEED_MPS,
  DWELL_SECONDS,
} from '../src/utils/eta.js';

describe('eta.js', () => {
  const stop = { id: 's2', name: 'Library Junction', lat: 12.9816, lng: 77.5946 };

  it('smooths speed with EMA and ignores readings with accuracy > 50m', () => {
    expect(smoothSpeed(null, 10, 12)).toBe(10);
    expect(smoothSpeed(10, 20, 10)).toBeCloseTo(13, 5);
    // Inaccurate reading ignored
    expect(smoothSpeed(13, 30, 80)).toBe(13);
  });

  it('computes ETA using normal speed and dwell time', () => {
    const now = 1_700_000_000_000;
    const res = computeStopEta({
      busPosition: { lat: 12.9716, lng: 77.5946 },
      busProgress: 0,
      offRoute: false,
      stop,
      stopProgress: 1000,
      stopsBetween: 2,
      smoothedSpeed: 10,
      now,
    });

    // 1000 / 10 = 100s + 2 * 20s = 140s (~2 min)
    expect(res.status).toBe('ok');
    expect(res.etaMs).toBe(now + (100 + 2 * DWELL_SECONDS) * 1000);
    expect(res.etaMinutes).toBe(2);
  });

  it('falls back to DEFAULT_SPEED_MPS when speed is zero or below MIN_SPEED', () => {
    const now = 1_700_000_000_000;
    const res = computeStopEta({
      busPosition: { lat: 12.9716, lng: 77.5946 },
      busProgress: 0,
      offRoute: false,
      stop,
      stopProgress: 694,
      stopsBetween: 0,
      smoothedSpeed: 0,
      now,
    });
    expect(res.effectiveSpeed).toBe(DEFAULT_SPEED_MPS);
    expect(res.etaMinutes).toBe(2); // ~100s -> 2 min
  });

  it('marks stop as departed when bus has passed it', () => {
    const res = computeStopEta({
      busPosition: { lat: 12.985, lng: 77.5946 },
      busProgress: 1500,
      offRoute: false,
      stop,
      stopProgress: 1000,
      stopsBetween: 0,
      smoothedSpeed: 10,
    });
    expect(res.status).toBe('departed');
  });

  it('falls back to straight-line Haversine distance when off-route', () => {
    const res = computeStopEta({
      busPosition: { lat: 12.9716, lng: 77.5946 },
      busProgress: 5000,
      offRoute: true,
      stop,
      stopProgress: 1000,
      stopsBetween: 0,
      smoothedSpeed: 10,
    });
    expect(res.status).toBe('ok');
    expect(res.offRoute).toBe(true);
    expect(res.remainingDistance).toBeGreaterThan(1000);
    expect(res.remainingDistance).toBeLessThan(1200);
  });

  it('computes delay status for on time, +5 min threshold, and ahead of schedule', () => {
    const base = new Date();
    base.setHours(8, 0, 0, 0);
    const now = base.getTime();

    const onTime = computeDelay(now + 2 * 60000, '08:00', now);
    expect(onTime.status).toBe('on_time');
    expect(onTime.label).toBe('On time');

    const delayed = computeDelay(now + 5 * 60000, '08:00', now);
    expect(delayed.status).toBe('delayed');
    expect(delayed.delayMin).toBe(5);
    expect(delayed.label).toBe('Delayed by 5 min');

    const ahead = computeDelay(now - 3 * 60000, '08:00', now);
    expect(ahead.status).toBe('ahead');
    expect(ahead.label).toBe('Ahead of schedule');
  });
});
