import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createInitialDemoData } from '../simulation/demoData.js';
import { BusSimulator } from '../simulation/simulator.js';
import { isFirebaseConfigured } from '../services/firebase.js';
import { DEFAULT_FRESHNESS_THRESHOLDS } from '../utils/freshness.js';
import { DELAY_THRESHOLD_MIN } from '../utils/eta.js';
import { clearAllNotificationKeys } from '../services/notificationService.js';

const DemoModeContext = createContext(null);

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);
  const [isRunning, setIsRunning] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [freshnessThresholds, setFreshnessThresholds] = useState(DEFAULT_FRESHNESS_THRESHOLDS);
  const [delayThresholdMin, setDelayThresholdMin] = useState(DELAY_THRESHOLD_MIN);

  const [demoData, setDemoData] = useState(() => createInitialDemoData());
  const [controlTick, setControlTick] = useState(0);

  const simulatorRef = useRef(null);
  if (!simulatorRef.current) {
    simulatorRef.current = new BusSimulator();
    simulatorRef.current.initFromData(demoData.buses, demoData.routes);
  }

  const demoDataRef = useRef(demoData);
  demoDataRef.current = demoData;

  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  useEffect(() => {
    if (!demoMode || !isRunning) return undefined;

    const timer = setInterval(() => {
      const curr = demoDataRef.current;
      const nextLocations = simulatorRef.current.tick({
        buses: curr.buses,
        routes: curr.routes,
        prevLocations: curr.locations,
        elapsedSec: 2,
        speedMultiplier: speedRef.current,
        now: Date.now(),
      });
      setDemoData((prev) => ({
        ...prev,
        locations: nextLocations,
      }));
    }, 2000);

    return () => clearInterval(timer);
  }, [demoMode, isRunning]);

  const toggleDemoMode = useCallback((forcedValue) => {
    setDemoMode((prev) => (typeof forcedValue === 'boolean' ? forcedValue : !prev));
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const injectDelay = useCallback((busId) => {
    simulatorRef.current.setDelay(busId, true);
    setControlTick((t) => t + 1);
  }, []);

  const clearDelay = useCallback((busId) => {
    simulatorRef.current.setDelay(busId, false);
    setControlTick((t) => t + 1);
  }, []);

  const pauseGps = useCallback((busId) => {
    simulatorRef.current.setGpsPaused(busId, true);
    setControlTick((t) => t + 1);
  }, []);

  const resumeGps = useCallback((busId) => {
    simulatorRef.current.setGpsPaused(busId, false);
    setDemoData((prev) => {
      const existing = prev.locations[busId];
      if (!existing) return prev;
      return {
        ...prev,
        locations: {
          ...prev.locations,
          [busId]: { ...existing, timestamp: Date.now(), simulated: true },
        },
      };
    });
    setControlTick((t) => t + 1);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createInitialDemoData(Date.now());
    simulatorRef.current.initFromData(fresh.buses, fresh.routes);
    clearAllNotificationKeys();
    setDemoData(fresh);
    setIsRunning(true);
    setControlTick((t) => t + 1);
  }, []);

  const getBusControlState = useCallback(
    (busId) => {
      void controlTick;
      return simulatorRef.current.getBusControlState(busId);
    },
    [controlTick]
  );

  // In-memory Admin CRUD actions for Demo Mode (never touches Firebase)
  const demoCreateBus = useCallback((busInput) => {
    const id = `bus_${Date.now()}`;
    setDemoData((prev) => {
      const route = prev.routes[busInput.routeId];
      const startPt = route?.path?.[0] || { lat: 15.3278, lng: 74.7536 };
      return {
        ...prev,
        buses: {
          ...prev.buses,
          [id]: {
            number: busInput.number.trim(),
            name: busInput.name.trim(),
            routeId: busInput.routeId,
            driverUid: (busInput.driverUid || '').trim(),
            capacity: Number(busInput.capacity) || 50,
            active: busInput.active !== false,
          },
        },
        locations: {
          ...prev.locations,
          [id]: {
            lat: startPt.lat,
            lng: startPt.lng,
            speed: 8.5,
            accuracy: 8,
            heading: 0,
            timestamp: Date.now(),
            simulated: true,
          },
        },
      };
    });
    return id;
  }, []);

  const demoUpdateBus = useCallback((busId, busInput) => {
    setDemoData((prev) => ({
      ...prev,
      buses: {
        ...prev.buses,
        [busId]: {
          ...prev.buses[busId],
          number: busInput.number.trim(),
          name: busInput.name.trim(),
          routeId: busInput.routeId,
          driverUid: (busInput.driverUid || '').trim(),
          capacity: Number(busInput.capacity) || 50,
          active: busInput.active !== false,
        },
      },
    }));
  }, []);

  const demoDeleteBus = useCallback((busId) => {
    setDemoData((prev) => {
      const nextBuses = { ...prev.buses };
      const nextLocations = { ...prev.locations };
      delete nextBuses[busId];
      delete nextLocations[busId];
      return { ...prev, buses: nextBuses, locations: nextLocations };
    });
  }, []);

  const demoCreateRoute = useCallback((routeInput) => {
    const id = `route_${Date.now()}`;
    setDemoData((prev) => ({
      ...prev,
      routes: {
        ...prev.routes,
        [id]: {
          name: routeInput.name.trim(),
          path: routeInput.path || [],
          stopIds: routeInput.stopIds || [],
        },
      },
    }));
    return id;
  }, []);

  const demoUpdateRoute = useCallback((routeId, routeInput) => {
    setDemoData((prev) => ({
      ...prev,
      routes: {
        ...prev.routes,
        [routeId]: {
          name: routeInput.name.trim(),
          path: routeInput.path || [],
          stopIds: routeInput.stopIds || [],
        },
      },
    }));
  }, []);

  const demoDeleteRoute = useCallback((routeId) => {
    setDemoData((prev) => {
      const nextRoutes = { ...prev.routes };
      const nextSchedules = { ...prev.schedules };
      delete nextRoutes[routeId];
      delete nextSchedules[routeId];
      return { ...prev, routes: nextRoutes, schedules: nextSchedules };
    });
  }, []);

  const demoCreateStop = useCallback((stopInput) => {
    const id = `stop_${Date.now()}`;
    setDemoData((prev) => ({
      ...prev,
      stops: {
        ...prev.stops,
        [id]: {
          name: stopInput.name.trim(),
          lat: Number(stopInput.lat),
          lng: Number(stopInput.lng),
        },
      },
    }));
    return id;
  }, []);

  const demoUpdateStop = useCallback((stopId, stopInput) => {
    setDemoData((prev) => ({
      ...prev,
      stops: {
        ...prev.stops,
        [stopId]: {
          name: stopInput.name.trim(),
          lat: Number(stopInput.lat),
          lng: Number(stopInput.lng),
        },
      },
    }));
  }, []);

  const demoDeleteStop = useCallback((stopId) => {
    setDemoData((prev) => {
      const nextStops = { ...prev.stops };
      delete nextStops[stopId];
      const nextRoutes = {};
      Object.entries(prev.routes).forEach(([rId, route]) => {
        nextRoutes[rId] = {
          ...route,
          stopIds: (route.stopIds || []).filter((id) => id !== stopId),
        };
      });
      return { ...prev, stops: nextStops, routes: nextRoutes };
    });
  }, []);

  const demoSaveSchedule = useCallback((routeId, scheduleMap) => {
    setDemoData((prev) => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [routeId]: scheduleMap,
      },
    }));
  }, []);

  return (
    <DemoModeContext.Provider
      value={{
        demoMode,
        setDemoMode,
        toggleDemoMode,
        isRunning,
        toggleRunning,
        speedMultiplier,
        setSpeedMultiplier,
        freshnessThresholds,
        setFreshnessThresholds,
        delayThresholdMin,
        setDelayThresholdMin,
        demoData,
        injectDelay,
        clearDelay,
        pauseGps,
        resumeGps,
        resetDemo,
        getBusControlState,
        demoCreateBus,
        demoUpdateBus,
        demoDeleteBus,
        demoCreateRoute,
        demoUpdateRoute,
        demoDeleteRoute,
        demoCreateStop,
        demoUpdateStop,
        demoDeleteStop,
        demoSaveSchedule,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used inside DemoModeProvider');
  return ctx;
}
