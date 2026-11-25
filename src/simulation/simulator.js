import { getTotalPathLength, interpolateAlongPath } from '../utils/geo.js';
import { DEMO_BUS_CONFIGS } from './demoData.js';

/**
 * Advances simulated bus positions along their route polylines.
 * Never writes to Firebase; every emitted location carries `simulated: true`.
 */
export class BusSimulator {
  constructor() {
    this.busStates = new Map();
  }

  initFromData(buses = {}, routes = {}) {
    this.busStates.clear();
    Object.entries(buses).forEach(([busId, bus]) => {
      const route = routes[bus.routeId];
      const totalLength = route ? getTotalPathLength(route.path) : 0;
      const cfg = DEMO_BUS_CONFIGS[busId] || { startDistance: 150, baseSpeedMps: 9.0 };
      this.busStates.set(busId, {
        distance: Math.min(cfg.startDistance, Math.max(0, totalLength - 50)),
        baseSpeed: cfg.baseSpeedMps,
        delayed: false,
        gpsPaused: false,
      });
    });
  }

  ensureBus(busId, route) {
    if (!this.busStates.has(busId)) {
      const totalLength = route ? getTotalPathLength(route.path) : 0;
      this.busStates.set(busId, {
        distance: Math.min(150, Math.max(0, totalLength * 0.1)),
        baseSpeed: 9.0,
        delayed: false,
        gpsPaused: false,
      });
    }
    return this.busStates.get(busId);
  }

  setDelay(busId, isDelayed) {
    const state = this.busStates.get(busId);
    if (state) state.delayed = Boolean(isDelayed);
  }

  setGpsPaused(busId, isPaused) {
    const state = this.busStates.get(busId);
    if (state) state.gpsPaused = Boolean(isPaused);
  }

  getBusControlState(busId) {
    return (
      this.busStates.get(busId) || {
        distance: 0,
        baseSpeed: 9.0,
        delayed: false,
        gpsPaused: false,
      }
    );
  }

  /**
   * Advances simulation by `elapsedSec` real seconds * `speedMultiplier`.
   * Returns updated locations map (preserving paused buses' old timestamps!).
   */
  tick({
    buses = {},
    routes = {},
    prevLocations = {},
    elapsedSec = 2,
    speedMultiplier = 1,
    now = Date.now(),
  }) {
    const nextLocations = { ...prevLocations };

    Object.entries(buses).forEach(([busId, bus]) => {
      if (!bus?.active) return;
      const route = routes[bus.routeId];
      if (!route || !Array.isArray(route.path) || route.path.length < 2) return;

      const state = this.ensureBus(busId, route);
      if (state.gpsPaused) {
        // Keep previous position and timestamp untouched to simulate signal loss
        return;
      }

      const totalLength = getTotalPathLength(route.path);
      if (totalLength <= 0) return;

      const jitter = (Math.random() - 0.5) * 0.8;
      // When delay is injected, bus crawls in heavy traffic (~1.8 m/s) so ETA pushes back significantly
      const currentSpeed = state.delayed
        ? Math.max(1.5, 2.0 + jitter * 0.3)
        : Math.max(4.5, state.baseSpeed + jitter);

      const stepDistance = currentSpeed * elapsedSec * speedMultiplier;
      state.distance += stepDistance;
      if (state.distance >= totalLength) {
        // Wrap back near start for continuous demo loop
        state.distance = 80;
      }

      const pt = interpolateAlongPath(route.path, state.distance);
      nextLocations[busId] = {
        lat: pt.lat,
        lng: pt.lng,
        speed: Number(currentSpeed.toFixed(2)),
        accuracy: 8,
        heading: pt.heading,
        timestamp: now,
        simulated: true,
      };
    });

    return nextLocations;
  }
}
