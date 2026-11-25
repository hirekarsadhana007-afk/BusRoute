import {
  ref,
  onValue,
  set,
  update,
  remove,
  push,
  serverTimestamp,
} from 'firebase/database';
import { db } from './firebase.js';

function assertDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Check your .env file or switch to Demo Mode.');
  }
}

export function subscribeBuses(onData, onError) {
  if (!db) {
    onData({});
    return () => {};
  }
  const busesRef = ref(db, 'buses');
  return onValue(
    busesRef,
    (snap) => onData(snap.val() || {}),
    (err) => onError?.(err)
  );
}

export function subscribeLocations(onData, onError) {
  if (!db) {
    onData({});
    return () => {};
  }
  const locRef = ref(db, 'locations');
  return onValue(
    locRef,
    (snap) => onData(snap.val() || {}),
    (err) => onError?.(err)
  );
}

export async function createBus(busData) {
  assertDb();
  const busesRef = ref(db, 'buses');
  const newRef = push(busesRef);
  await set(newRef, {
    number: busData.number.trim(),
    name: busData.name.trim(),
    routeId: busData.routeId,
    driverUid: (busData.driverUid || '').trim(),
    capacity: Number(busData.capacity) || 50,
    active: busData.active !== false,
  });
  return newRef.key;
}

export async function updateBus(busId, busData) {
  assertDb();
  const busRef = ref(db, `buses/${busId}`);
  await update(busRef, {
    number: busData.number.trim(),
    name: busData.name.trim(),
    routeId: busData.routeId,
    driverUid: (busData.driverUid || '').trim(),
    capacity: Number(busData.capacity) || 50,
    active: busData.active !== false,
  });
}

export async function deleteBus(busId) {
  assertDb();
  await remove(ref(db, `buses/${busId}`));
}

export async function updateBusLocation(busId, position) {
  assertDb();
  const locRef = ref(db, `locations/${busId}`);
  await set(locRef, {
    lat: position.lat,
    lng: position.lng,
    speed: position.speed ?? 0,
    accuracy: position.accuracy ?? 0,
    heading: position.heading ?? 0,
    timestamp: position.timestamp || Date.now(),
    serverTime: serverTimestamp(),
  });
}
