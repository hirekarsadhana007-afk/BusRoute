import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  projectPointOntoRoute,
  precomputeStopProgress,
  interpolateAlongPath,
  OFF_ROUTE_THRESHOLD_METERS,
} from '../src/utils/geo.js';

describe('geo.js', () => {
  const path = [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9816, lng: 77.5946 }, // ~1.112 km north
    { lat: 12.9816, lng: 77.6046 }, // ~1.084 km east
  ];

  it('computes Haversine distance accurately for ~1 degree latitude', () => {
    const d = haversineDistance(
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9816, lng: 77.5946 }
    );
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });

  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(path[0], path[0])).toBe(0);
  });

  it('projects a point onto the nearest polyline segment and computes progress', () => {
    const midPoint = { lat: 12.9766, lng: 77.5950 }; // slightly east of segment 0
    const res = projectPointOntoRoute(midPoint, path);
    expect(res.segmentIndex).toBe(0);
    expect(res.progress).toBeGreaterThan(500);
    expect(res.progress).toBeLessThan(600);
    expect(res.offRoute).toBe(false);
  });

  it('clamps projection beyond route ends', () => {
    const beforeStart = { lat: 12.9616, lng: 77.5946 };
    const resStart = projectPointOntoRoute(beforeStart, path);
    expect(resStart.progress).toBe(0);
    expect(resStart.offRoute).toBe(true);

    const afterEnd = { lat: 12.9816, lng: 77.6200 };
    const resEnd = projectPointOntoRoute(afterEnd, path);
    expect(resEnd.progress).toBeCloseTo(resEnd.totalLength, 1);
    expect(resEnd.distanceFromRoute).toBeGreaterThan(OFF_ROUTE_THRESHOLD_METERS);
    expect(resEnd.offRoute).toBe(true);
  });

  it('precomputes stop progress in increasing order along route', () => {
    const stops = [
      { id: 's1', lat: 12.9716, lng: 77.5946 },
      { id: 's2', lat: 12.9786, lng: 77.5946 },
      { id: 's3', lat: 12.9816, lng: 77.6046 },
    ];
    const progressMap = precomputeStopProgress(stops, path);
    expect(progressMap.s1).toBe(0);
    expect(progressMap.s2).toBeGreaterThan(progressMap.s1);
    expect(progressMap.s3).toBeGreaterThan(progressMap.s2);
  });

  it('interpolates along path smoothly', () => {
    const pt = interpolateAlongPath(path, 556);
    expect(pt.lat).toBeGreaterThan(12.975);
    expect(pt.lat).toBeLessThan(12.978);
    expect(pt.heading).toBeGreaterThanOrEqual(0);
    expect(pt.heading).toBeLessThan(360);
  });
});
