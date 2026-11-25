import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from './firebase.js';

function assertDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Check your .env file or switch to Demo Mode.');
  }
}

export function subscribeRoutes(onData, onError) {
  if (!db) {
    onData({});
    return () => {};
  }
  return onValue(
    ref(db, 'routes'),
    (snap) => onData(snap.val() || {}),
    (err) => onError?.(err)
  );
}

export function subscribeStops(onData, onError) {
  if (!db) {
    onData({});
    return () => {};
  }
  return onValue(
    ref(db, 'stops'),
    (snap) => onData(snap.val() || {}),
    (err) => onError?.(err)
  );
}

export function subscribeSchedules(onData, onError) {
  if (!db) {
    onData({});
    return () => {};
  }
  return onValue(
    ref(db, 'schedules'),
    (snap) => onData(snap.val() || {}),
    (err) => onError?.(err)
  );
}

export async function createRoute(routeData) {
  assertDb();
  const newRef = push(ref(db, 'routes'));
  await set(newRef, {
    name: routeData.name.trim(),
    path: routeData.path || [],
    stopIds: routeData.stopIds || [],
  });
  return newRef.key;
}

export async function updateRoute(routeId, routeData) {
  assertDb();
  await update(ref(db, `routes/${routeId}`), {
    name: routeData.name.trim(),
    path: routeData.path || [],
    stopIds: routeData.stopIds || [],
  });
}

export async function deleteRoute(routeId) {
  assertDb();
  await remove(ref(db, `routes/${routeId}`));
  await remove(ref(db, `schedules/${routeId}`));
}

export async function createStop(stopData) {
  assertDb();
  const newRef = push(ref(db, 'stops'));
  await set(newRef, {
    name: stopData.name.trim(),
    lat: Number(stopData.lat),
    lng: Number(stopData.lng),
  });
  return newRef.key;
}

export async function updateStop(stopId, stopData) {
  assertDb();
  await update(ref(db, `stops/${stopId}`), {
    name: stopData.name.trim(),
    lat: Number(stopData.lat),
    lng: Number(stopData.lng),
  });
}

export async function deleteStop(stopId) {
  assertDb();
  await remove(ref(db, `stops/${stopId}`));
}

export async function saveRouteSchedule(routeId, scheduleMap) {
  assertDb();
  await set(ref(db, `schedules/${routeId}`), scheduleMap);
}
