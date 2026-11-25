import { useEffect, useMemo, useRef, useState } from 'react';
import { useDemoMode } from '../context/DemoModeContext.jsx';
import { isFirebaseConfigured, subscribeConnectionState } from '../services/firebase.js';
import { subscribeBuses, subscribeLocations } from '../services/busService.js';
import {
  subscribeRoutes,
  subscribeSchedules,
  subscribeStops,
} from '../services/routeService.js';
import {
  precomputeStopProgress,
  projectPointOntoRoute,
} from '../utils/geo.js';
import {
  computeDelay,
  computeStopEta,
  smoothSpeed,
} from '../utils/eta.js';
import { getFreshnessState, FRESHNESS_STATES } from '../utils/freshness.js';

export function useBuses() {
  const {
    demoMode,
    demoData,
    freshnessThresholds,
    delayThresholdMin,
  } = useDemoMode();

  const [liveData, setLiveData] = useState({
    buses: {},
    routes: {},
    stops: {},
    schedules: {},
    locations: {},
  });
  const [loading, setLoading] = useState(!demoMode && isFirebaseConfigured);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // 1-second UI ticker so freshness transitions occur automatically without new GPS packets
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to Firebase Realtime Database when not in Demo Mode
  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      setError(null);
      setIsConnected(true);
      return undefined;
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      setIsConnected(false);
      setError('Firebase is not configured. Add credentials to .env or enable Demo Mode.');
      return undefined;
    }

    setLoading(true);
    setError(null);
    let loadedFlags = { buses: false, routes: false, stops: false };
    const markLoaded = (key) => {
      loadedFlags[key] = true;
      if (loadedFlags.buses && loadedFlags.routes && loadedFlags.stops) {
        setLoading(false);
      }
    };

    const handleErr = (err) => {
      setError(err?.message || 'Failed to read live database.');
      setLoading(false);
    };

    const unsubs = [
      subscribeConnectionState((connected) => setIsConnected(connected)),
      subscribeBuses((buses) => {
        setLiveData((prev) => ({ ...prev, buses }));
        markLoaded('buses');
      }, handleErr),
      subscribeRoutes((routes) => {
        setLiveData((prev) => ({ ...prev, routes }));
        markLoaded('routes');
      }, handleErr),
      subscribeStops((stops) => {
        setLiveData((prev) => ({ ...prev, stops }));
        markLoaded('stops');
      }, handleErr),
      subscribeSchedules((schedules) => {
        setLiveData((prev) => ({ ...prev, schedules }));
      }, handleErr),
      subscribeLocations((locations) => {
        setLiveData((prev) => ({ ...prev, locations }));
      }, handleErr),
    ];

    return () => unsubs.forEach((u) => u?.());
  }, [demoMode]);

  const raw = demoMode ? demoData : liveData;

  // Per-bus smoothed speed cache updated when timestamp changes
  const speedCacheRef = useRef({});
  useEffect(() => {
    Object.entries(raw.locations || {}).forEach(([busId, loc]) => {
      if (!loc) return;
      const entry = speedCacheRef.current[busId];
      if (!entry || entry.lastTimestamp !== loc.timestamp) {
        const nextSmoothed = smoothSpeed(
          entry ? entry.smoothed : null,
          loc.speed,
          loc.accuracy
        );
        speedCacheRef.current[busId] = {
          lastTimestamp: loc.timestamp,
          smoothed: nextSmoothed,
        };
      }
    });
  }, [raw.locations]);

  const enrichedBuses = useMemo(() => {
    const result = [];
    const busesObj = raw.buses || {};
    const routesObj = raw.routes || {};
    const stopsObj = raw.stops || {};
    const schedulesObj = raw.schedules || {};
    const locationsObj = raw.locations || {};

    Object.entries(busesObj).forEach(([busId, busData]) => {
      const bus = { id: busId, ...busData };
      const route = bus.routeId && routesObj[bus.routeId]
        ? { id: bus.routeId, ...routesObj[bus.routeId] }
        : null;

      const orderedStops = (route?.stopIds || [])
        .map((sid) => (stopsObj[sid] ? { id: sid, ...stopsObj[sid] } : null))
        .filter(Boolean);

      const location = locationsObj[busId] || null;
      const freshness = getFreshnessState(
        location?.timestamp,
        now,
        freshnessThresholds
      );

      const routePath = route?.path || [];
      const stopProgressMap = routePath.length
        ? precomputeStopProgress(orderedStops, routePath)
        : {};

      const projection =
        location && routePath.length
          ? projectPointOntoRoute(location, routePath)
          : {
              projected: location,
              progress: 0,
              distanceFromRoute: Infinity,
              offRoute: false,
            };

      const cachedSpeed = speedCacheRef.current[busId]?.smoothed ?? location?.speed ?? null;
      const routeSchedule = (route && schedulesObj[route.id]) || {};
      const isUnavailable = freshness.state === FRESHNESS_STATES.UNAVAILABLE;

      const stopEtas = {};
      let nextUpcomingStop = null;
      let upcomingCountAhead = 0;

      orderedStops.forEach((stop) => {
        const stopProgress = stopProgressMap[stop.id] ?? 0;
        const scheduled = routeSchedule[stop.id] || null;

        if (isUnavailable || !location) {
          stopEtas[stop.id] = {
            stop,
            stopProgress,
            scheduled,
            eta: {
              status: 'unknown',
              remainingDistance: null,
              etaMs: null,
              etaMinutes: null,
              offRoute: false,
            },
            delay: { delayMin: null, status: 'unknown', label: 'Unavailable' },
          };
          return;
        }

        const isDeparted = !projection.offRoute && stopProgress - projection.progress < 0;
        const stopsBetween = isDeparted ? 0 : upcomingCountAhead;
        if (!isDeparted) {
          upcomingCountAhead += 1;
        }

        const eta = computeStopEta({
          busPosition: location,
          busProgress: projection.progress,
          offRoute: projection.offRoute,
          stop,
          stopProgress,
          stopsBetween,
          smoothedSpeed: cachedSpeed,
          now,
        });

        const delay =
          eta.status === 'ok'
            ? computeDelay(eta.etaMs, scheduled, now, delayThresholdMin)
            : { delayMin: null, status: eta.status, label: eta.status === 'departed' ? 'Departed' : 'Unknown' };

        const entry = { stop, stopProgress, scheduled, eta, delay };
        stopEtas[stop.id] = entry;

        if (!nextUpcomingStop && eta.status === 'ok') {
          nextUpcomingStop = entry;
        }
      });

      result.push({
        ...bus,
        route,
        orderedStops,
        location,
        freshness,
        projection,
        smoothedSpeed: cachedSpeed,
        stopEtas,
        nextUpcomingStop,
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [raw, now, freshnessThresholds, delayThresholdMin]);

  return {
    buses: enrichedBuses,
    raw,
    loading,
    error,
    isConnected,
    now,
    demoMode,
  };
}
