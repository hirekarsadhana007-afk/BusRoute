import { haversineDistance } from './geo.js';

export const DEFAULT_SPEED_MPS = 6.94; // ~25 km/h
export const MIN_SPEED_MPS = 1.5;
export const DWELL_SECONDS = 20;
export const MAX_ACCURACY_METERS = 50;
export const EMA_ALPHA = 0.3;
export const DELAY_THRESHOLD_MIN = 5;
export const AHEAD_THRESHOLD_MIN = -2;

/**
 * Exponential moving average speed smoothing, ignoring inaccurate (> 50 m) readings.
 */
export function smoothSpeed(prevSmoothed, newSpeed, accuracy = 10) {
  const validNew =
    typeof newSpeed === 'number' &&
    Number.isFinite(newSpeed) &&
    newSpeed >= 0 &&
    (accuracy == null || accuracy <= MAX_ACCURACY_METERS);

  if (!validNew) {
    return typeof prevSmoothed === 'number' && Number.isFinite(prevSmoothed)
      ? prevSmoothed
      : null;
  }

  if (typeof prevSmoothed !== 'number' || !Number.isFinite(prevSmoothed)) {
    return newSpeed;
  }

  return EMA_ALPHA * newSpeed + (1 - EMA_ALPHA) * prevSmoothed;
}

/**
 * Computes ETA for a single stop given the bus's current projected progress or off-route position.
 */
export function computeStopEta({
  busPosition,
  busProgress = 0,
  offRoute = false,
  stop,
  stopProgress = 0,
  stopsBetween = 0,
  smoothedSpeed = null,
  now = Date.now(),
}) {
  if (!busPosition || !stop) {
    return {
      status: 'unknown',
      remainingDistance: null,
      etaMs: null,
      etaMinutes: null,
      effectiveSpeed: DEFAULT_SPEED_MPS,
      offRoute: false,
    };
  }

  const remainingDistance = offRoute
    ? haversineDistance(busPosition, stop)
    : stopProgress - busProgress;

  if (!offRoute && remainingDistance < 0) {
    return {
      status: 'departed',
      remainingDistance,
      etaMs: null,
      etaMinutes: null,
      effectiveSpeed: DEFAULT_SPEED_MPS,
      offRoute: false,
    };
  }

  const effectiveSpeed =
    typeof smoothedSpeed === 'number' &&
    Number.isFinite(smoothedSpeed) &&
    smoothedSpeed >= MIN_SPEED_MPS
      ? smoothedSpeed
      : DEFAULT_SPEED_MPS;

  const travelSeconds = Math.max(0, remainingDistance) / effectiveSpeed;
  const dwellSeconds = Math.max(0, stopsBetween) * DWELL_SECONDS;
  const totalSeconds = travelSeconds + dwellSeconds;
  const etaMs = now + totalSeconds * 1000;
  const etaMinutes = Math.max(0, Math.round(totalSeconds / 60));

  return {
    status: 'ok',
    remainingDistance,
    etaMs,
    etaMinutes,
    effectiveSpeed,
    offRoute: Boolean(offRoute),
  };
}

/**
 * Converts "HH:mm" to a timestamp (ms) on the same local calendar day as `nowMs`.
 */
export function parseScheduledTimeToday(hhmm, nowMs = Date.now()) {
  if (typeof hhmm !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const d = new Date(nowMs);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

/**
 * Compares predicted ETA (ms) against scheduled HH:mm string.
 */
export function computeDelay(
  etaMs,
  scheduledHHMM,
  nowMs = Date.now(),
  delayThresholdMin = DELAY_THRESHOLD_MIN,
  aheadThresholdMin = AHEAD_THRESHOLD_MIN
) {
  if (typeof etaMs !== 'number' || !Number.isFinite(etaMs)) {
    return { delayMin: null, status: 'unknown', label: 'Schedule unavailable' };
  }
  const scheduledMs = parseScheduledTimeToday(scheduledHHMM, nowMs);
  if (scheduledMs == null) {
    return { delayMin: null, status: 'unknown', label: 'No schedule' };
  }

  const delayMin = Math.round((etaMs - scheduledMs) / 60000);
  if (delayMin >= delayThresholdMin) {
    return {
      delayMin,
      status: 'delayed',
      label: `Delayed by ${delayMin} min`,
    };
  }
  if (delayMin <= aheadThresholdMin) {
    return {
      delayMin,
      status: 'ahead',
      label: 'Ahead of schedule',
    };
  }
  return {
    delayMin,
    status: 'on_time',
    label: 'On time',
  };
}

export function formatClockTime(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '--:--';
  return new Date(ms).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatEtaMinutes(minutes) {
  if (minutes == null) return 'Unknown';
  if (minutes <= 0) return 'Arriving now';
  return `${minutes} min`;
}

export function formatDistance(meters) {
  if (typeof meters !== 'number' || !Number.isFinite(meters)) return '--';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
