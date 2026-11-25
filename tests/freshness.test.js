import { describe, it, expect } from 'vitest';
import {
  getFreshnessState,
  FRESHNESS_STATES,
  DEFAULT_FRESHNESS_THRESHOLDS,
} from '../src/utils/freshness.js';

describe('freshness.js', () => {
  const now = 1_700_000_000_000;

  it('returns Live at <= 30s', () => {
    expect(getFreshnessState(now, now, DEFAULT_FRESHNESS_THRESHOLDS).state).toBe(
      FRESHNESS_STATES.LIVE
    );
    expect(getFreshnessState(now - 30_000, now, DEFAULT_FRESHNESS_THRESHOLDS).state).toBe(
      FRESHNESS_STATES.LIVE
    );
  });

  it('returns Delayed between 30s and 120s', () => {
    expect(getFreshnessState(now - 31_000, now, DEFAULT_FRESHNESS_THRESHOLDS).state).toBe(
      FRESHNESS_STATES.DELAYED
    );
    expect(getFreshnessState(now - 120_000, now, DEFAULT_FRESHNESS_THRESHOLDS).state).toBe(
      FRESHNESS_STATES.DELAYED
    );
  });

  it('returns Unavailable above 120s or when timestamp is missing', () => {
    const stale = getFreshnessState(now - 121_000, now, DEFAULT_FRESHNESS_THRESHOLDS);
    expect(stale.state).toBe(FRESHNESS_STATES.UNAVAILABLE);
    expect(stale.message).toBe('Location data is outdated');

    expect(getFreshnessState(null, now).state).toBe(FRESHNESS_STATES.UNAVAILABLE);
    expect(getFreshnessState(undefined, now).state).toBe(FRESHNESS_STATES.UNAVAILABLE);
  });
});
