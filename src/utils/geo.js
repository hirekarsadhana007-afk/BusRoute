const EARTH_RADIUS_M = 6371000;
export const OFF_ROUTE_THRESHOLD_METERS = 200;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Computes the great-circle distance in metres between two { lat, lng } points.
 */
export function haversineDistance(a, b) {
  if (!a || !b) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

/**
 * Returns total polyline length in metres.
 */
export function getTotalPathLength(path = []) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += haversineDistance(path[i - 1], path[i]);
  }
  return total;
}

/**
 * Projects a point onto a single segment [segStart, segEnd] using local flat-earth scaling.
 */
export function projectPointOntoSegment(point, segStart, segEnd) {
  const segLen = haversineDistance(segStart, segEnd);
  if (segLen === 0) {
    return {
      projected: { lat: segStart.lat, lng: segStart.lng },
      t: 0,
      distanceToSegment: haversineDistance(point, segStart),
      distAlongSegment: 0,
    };
  }

  const refLatRad = toRad((segStart.lat + segEnd.lat) / 2);
  const cosLat = Math.cos(refLatRad) || 1;

  const ax = segStart.lng * cosLat;
  const ay = segStart.lat;
  const bx = segEnd.lng * cosLat;
  const by = segEnd.lat;
  const px = point.lng * cosLat;
  const py = point.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const denom = dx * dx + dy * dy;
  let t = denom === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / denom;
  t = Math.max(0, Math.min(1, t));

  const projected = {
    lat: segStart.lat + t * (segEnd.lat - segStart.lat),
    lng: segStart.lng + t * (segEnd.lng - segStart.lng),
  };

  return {
    projected,
    t,
    distanceToSegment: haversineDistance(point, projected),
    distAlongSegment: t * segLen,
  };
}

/**
 * Projects a GPS point onto the nearest segment of a route polyline.
 * Returns progress along the route (metres), distanceFromRoute (metres), and offRoute flag.
 */
export function projectPointOntoRoute(point, path = []) {
  if (!point || !Array.isArray(path) || path.length === 0) {
    return {
      projected: point || null,
      progress: 0,
      distanceFromRoute: Infinity,
      segmentIndex: -1,
      totalLength: 0,
      offRoute: true,
    };
  }

  if (path.length === 1) {
    const dist = haversineDistance(point, path[0]);
    return {
      projected: { lat: path[0].lat, lng: path[0].lng },
      progress: 0,
      distanceFromRoute: dist,
      segmentIndex: 0,
      totalLength: 0,
      offRoute: dist > OFF_ROUTE_THRESHOLD_METERS,
    };
  }

  let cumulative = 0;
  let best = {
    projected: { lat: path[0].lat, lng: path[0].lng },
    progress: 0,
    distanceFromRoute: Infinity,
    segmentIndex: 0,
  };

  for (let i = 0; i < path.length - 1; i += 1) {
    const segStart = path[i];
    const segEnd = path[i + 1];
    const segLen = haversineDistance(segStart, segEnd);
    const proj = projectPointOntoSegment(point, segStart, segEnd);

    if (proj.distanceToSegment < best.distanceFromRoute) {
      best = {
        projected: proj.projected,
        progress: cumulative + proj.distAlongSegment,
        distanceFromRoute: proj.distanceToSegment,
        segmentIndex: i,
      };
    }

    cumulative += segLen;
  }

  return {
    ...best,
    totalLength: cumulative,
    offRoute: best.distanceFromRoute > OFF_ROUTE_THRESHOLD_METERS,
  };
}

/**
 * Computes precomputed distance-along-route (metres) for each stop in orderedStops.
 */
export function precomputeStopProgress(orderedStops = [], path = []) {
  const result = {};
  for (const stop of orderedStops) {
    if (!stop || !stop.id) continue;
    const proj = projectPointOntoRoute(stop, path);
    result[stop.id] = proj.progress;
  }
  return result;
}

/**
 * Computes bearing in degrees (0 = North, 90 = East) from point a to b.
 */
export function computeBearing(a, b) {
  if (!a || !b) return 0;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Interpolates a position and heading along a route polyline at targetDistance (metres).
 */
export function interpolateAlongPath(path = [], targetDistance = 0) {
  if (!path.length) return { lat: 0, lng: 0, heading: 0, distance: 0 };
  if (path.length === 1) return { lat: path[0].lat, lng: path[0].lng, heading: 0, distance: 0 };

  const total = getTotalPathLength(path);
  const clamped = Math.max(0, Math.min(total, targetDistance));

  let covered = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i];
    const b = path[i + 1];
    const segLen = haversineDistance(a, b);
    if (covered + segLen >= clamped || i === path.length - 2) {
      const ratio = segLen === 0 ? 0 : Math.max(0, Math.min(1, (clamped - covered) / segLen));
      return {
        lat: a.lat + ratio * (b.lat - a.lat),
        lng: a.lng + ratio * (b.lng - a.lng),
        heading: Math.round(computeBearing(a, b)),
        distance: clamped,
      };
    }
    covered += segLen;
  }

  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  return {
    lat: last.lat,
    lng: last.lng,
    heading: Math.round(computeBearing(prev, last)),
    distance: total,
  };
}
