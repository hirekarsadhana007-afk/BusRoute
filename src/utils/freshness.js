export const FRESHNESS_STATES = {
  LIVE: 'live',
  DELAYED: 'delayed',
  UNAVAILABLE: 'unavailable',
};

export const DEFAULT_FRESHNESS_THRESHOLDS = {
  liveMaxAgeSec: 30,
  delayedMaxAgeSec: 120,
};

export const VIVA_FAST_THRESHOLDS = {
  liveMaxAgeSec: 6,
  delayedMaxAgeSec: 16,
};

/**
 * Classifies GPS data freshness based on timestamp age.
 * Never classifies missing or stale (> delayedMaxAgeSec) timestamps as live.
 */
export function getFreshnessState(
  timestamp,
  now = Date.now(),
  thresholds = DEFAULT_FRESHNESS_THRESHOLDS
) {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
    return {
      state: FRESHNESS_STATES.UNAVAILABLE,
      ageSeconds: null,
      label: 'Unavailable',
      message: 'Location data is outdated',
    };
  }

  const liveLimit = thresholds?.liveMaxAgeSec ?? DEFAULT_FRESHNESS_THRESHOLDS.liveMaxAgeSec;
  const delayedLimit = thresholds?.delayedMaxAgeSec ?? DEFAULT_FRESHNESS_THRESHOLDS.delayedMaxAgeSec;
  const ageSeconds = Math.max(0, (now - timestamp) / 1000);

  if (ageSeconds <= liveLimit) {
    return {
      state: FRESHNESS_STATES.LIVE,
      ageSeconds,
      label: 'Live',
      message: 'Live GPS',
    };
  }

  if (ageSeconds <= delayedLimit) {
    return {
      state: FRESHNESS_STATES.DELAYED,
      ageSeconds,
      label: 'Delayed',
      message: 'Signal delayed',
    };
  }

  return {
    state: FRESHNESS_STATES.UNAVAILABLE,
    ageSeconds,
    label: 'Unavailable',
    message: 'Location data is outdated',
  };
}

export function formatLastUpdated(timestamp) {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
    return 'Never';
  }
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTimeAgo(timestamp, now = Date.now()) {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
    return 'No signal';
  }
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ${diffSec % 60}s ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}
