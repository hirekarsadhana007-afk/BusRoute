import { describe, it, expect } from 'vitest';
import {
  validateBus,
  validateRoute,
  validateStop,
  validateSchedule,
} from '../src/utils/validation.js';

describe('validation.js', () => {
  it('validates bus number uniqueness and length', () => {
    const existing = { bus_01: { number: 'KA-01-F-1234', name: 'Bus 1', routeId: 'r1' } };
    expect(
      validateBus({ number: 'KA-01-F-1234', name: 'Bus 2', routeId: 'r1' }, existing).valid
    ).toBe(false);
    expect(
      validateBus({ number: '12', name: 'Bus 2', routeId: 'r1' }, existing).valid
    ).toBe(false);
    expect(
      validateBus({ number: 'KA-01-F-9999', name: 'Bus 2', routeId: 'r1', capacity: 45 }, existing).valid
    ).toBe(true);
  });

  it('validates route path has at least 2 valid points', () => {
    expect(validateRoute({ name: 'Route A', path: [{ lat: 12.9, lng: 77.5 }] }).valid).toBe(false);
    expect(
      validateRoute({
        name: 'Route A',
        path: [
          { lat: 12.9, lng: 77.5 },
          { lat: 12.95, lng: 77.6 },
        ],
      }).valid
    ).toBe(true);
  });

  it('validates stop lat/lng bounds', () => {
    expect(validateStop({ name: 'Gate', lat: 95, lng: 77 }).valid).toBe(false);
    expect(validateStop({ name: 'Gate', lat: 12.97, lng: 200 }).valid).toBe(false);
    expect(validateStop({ name: 'Gate', lat: 12.97, lng: 77.59 }).valid).toBe(true);
  });

  it('validates schedule HH:mm and strictly increasing times', () => {
    expect(
      validateSchedule(['s1', 's2', 's3'], { s1: '07:30', s2: '07:45', s3: '08:05' }).valid
    ).toBe(true);
    expect(
      validateSchedule(['s1', 's2'], { s1: '07:30', s2: '07:30' }).valid
    ).toBe(false);
    expect(
      validateSchedule(['s1', 's2'], { s1: '07:30', s2: 'bad' }).valid
    ).toBe(false);
  });
});
