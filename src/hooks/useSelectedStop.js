import { useEffect, useState } from 'react';

const BUS_KEY = 'routetrack_selected_bus_v1';
const STOP_KEY = 'routetrack_selected_stop_v1';

export function useSelectedStop(buses = []) {
  const [selectedBusId, setSelectedBusId] = useState(() => {
    try {
      return localStorage.getItem(BUS_KEY) || '';
    } catch {
      return '';
    }
  });

  const [selectedStopId, setSelectedStopId] = useState(() => {
    try {
      return localStorage.getItem(STOP_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      if (selectedBusId) localStorage.setItem(BUS_KEY, selectedBusId);
    } catch {
      // ignore
    }
  }, [selectedBusId]);

  useEffect(() => {
    try {
      if (selectedStopId) localStorage.setItem(STOP_KEY, selectedStopId);
      else localStorage.removeItem(STOP_KEY);
    } catch {
      // ignore
    }
  }, [selectedStopId]);

  // Ensure a valid bus is selected when buses load
  useEffect(() => {
    if (!buses.length) return;
    const exists = buses.some((b) => b.id === selectedBusId);
    if (!exists) {
      setSelectedBusId(buses[0].id);
    }
  }, [buses, selectedBusId]);

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0] || null;

  // Ensure selectedStopId belongs to the selected bus's route
  useEffect(() => {
    if (!selectedBus) return;
    const stops = selectedBus.orderedStops || [];
    if (!stops.length) {
      if (selectedStopId) setSelectedStopId('');
      return;
    }
    const valid = stops.some((s) => s.id === selectedStopId);
    if (!valid) {
      // Pick KLS VDIT, Haliyal if present, else middle/first stop
      const preferred =
        stops.find((s) => s.name === 'KLS VDIT, Haliyal') ||
        stops[Math.min(1, stops.length - 1)] ||
        stops[0];
      setSelectedStopId(preferred.id);
    }
  }, [selectedBus, selectedStopId]);

  const selectedStop =
    selectedBus?.orderedStops?.find((s) => s.id === selectedStopId) || null;

  return {
    selectedBusId: selectedBus?.id || '',
    setSelectedBusId,
    selectedStopId: selectedStop?.id || '',
    setSelectedStopId,
    selectedBus,
    selectedStop,
  };
}
