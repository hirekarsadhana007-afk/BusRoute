import { FRESHNESS_STATES } from '../utils/freshness.js';

const STORAGE_KEY = 'routetrack_fired_notifications_v1';

export const APPROACH_ETA_MINUTES = 5;
export const APPROACH_DISTANCE_METERS = 1000;
export const SIGNIFICANT_DELAY_MINUTES = 10;

export function getTripDateKey(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildApproachKey(busId, stopId, tripDate) {
  return `approach:${busId}:${stopId}:${tripDate}`;
}

export function buildDelayKey(busId, stopId, tripDate, delayMin) {
  const bucket = Math.floor(delayMin / 5) * 5;
  return `delay:${busId}:${stopId}:${tripDate}:${bucket}`;
}

export function buildStaleKey(busId, tripDate) {
  return `stale:${busId}:${tripDate}`;
}

function readFiredSet(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeFiredSet(set, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore storage quota errors
  }
}

export function hasFiredKey(key, storage) {
  return readFiredSet(storage).has(key);
}

export function markKeyFired(key, storage) {
  const set = readFiredSet(storage);
  set.add(key);
  writeFiredSet(set, storage);
}

export function clearApproachingKey(busId, stopId, tripDate, storage) {
  const key = buildApproachKey(busId, stopId, tripDate);
  const set = readFiredSet(storage);
  if (set.delete(key)) {
    writeFiredSet(set, storage);
  }
}

export function clearAllNotificationKeys(storage) {
  const set = new Set();
  writeFiredSet(set, storage);
}

export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendBrowserNotification(title, body, tag) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {
      body,
      tag,
      icon: '/bus-icon.svg',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Evaluates notification triggers for the selected bus & stop with deduplication.
 * Returns an array of new alert objects { key, type, title, message, severity }.
 */
export function evaluateNotificationRules({
  bus,
  stop,
  etaResult,
  delayResult,
  freshness,
  now = Date.now(),
  storage,
}) {
  if (!bus || !stop) return [];

  const tripDate = getTripDateKey(now);
  const alerts = [];

  // Rule 1: Signal lost -> Unavailable
  if (freshness?.state === FRESHNESS_STATES.UNAVAILABLE) {
    const staleKey = buildStaleKey(bus.id, tripDate);
    if (!hasFiredKey(staleKey, storage)) {
      markKeyFired(staleKey, storage);
      alerts.push({
        key: staleKey,
        type: 'stale',
        severity: 'warning',
        title: `${bus.name} GPS Unavailable`,
        message: `${bus.name} (${bus.number}) signal is lost. Location data is outdated.`,
      });
    }
    return alerts;
  }

  // If bus has passed the stop, reset approaching key so a future trip/reset can re-alert
  if (etaResult?.status === 'departed') {
    clearApproachingKey(bus.id, stop.id, tripDate, storage);
    return alerts;
  }

  // Rule 2: Approaching (ETA <= 5 min OR distance <= 1 km)
  if (
    etaResult?.status === 'ok' &&
    ((etaResult.etaMinutes != null && etaResult.etaMinutes <= APPROACH_ETA_MINUTES) ||
      (etaResult.remainingDistance != null && etaResult.remainingDistance <= APPROACH_DISTANCE_METERS))
  ) {
    const approachKey = buildApproachKey(bus.id, stop.id, tripDate);
    if (!hasFiredKey(approachKey, storage)) {
      markKeyFired(approachKey, storage);
      alerts.push({
        key: approachKey,
        type: 'approaching',
        severity: 'info',
        title: `${bus.name} Approaching`,
        message: `${bus.name} is approaching ${stop.name} (ETA ${etaResult.etaMinutes} min).`,
      });
    }
  }

  // Rule 3: Significant delay (delayMin >= 10), bucketed by 5 minutes
  if (delayResult?.delayMin != null && delayResult.delayMin >= SIGNIFICANT_DELAY_MINUTES) {
    const delayKey = buildDelayKey(bus.id, stop.id, tripDate, delayResult.delayMin);
    if (!hasFiredKey(delayKey, storage)) {
      markKeyFired(delayKey, storage);
      alerts.push({
        key: delayKey,
        type: 'delay',
        severity: 'danger',
        title: `${bus.name} Significantly Delayed`,
        message: `${bus.name} is running ${delayResult.delayMin} min behind schedule for ${stop.name}.`,
      });
    }
  }

  return alerts;
}
