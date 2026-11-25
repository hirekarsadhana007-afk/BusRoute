import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createBusIcon, createBusPopupHtml, createStopIcon } from './BusMarker.jsx';

const DEFAULT_CENTER = [15.42, 74.88];

export function MapView({
  buses = [],
  selectedBusId = '',
  selectedStopId = '',
  routesToDraw = null,
  stopsToDraw = null,
  height = 440,
  onSelectBus,
  onSelectStop,
  onMapClick,
  draggableStops = false,
  onStopDragEnd,
  autoFitKey = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    routes: null,
    stops: null,
    buses: null,
  });
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layersRef.current.routes = L.layerGroup().addTo(map);
    layersRef.current.stops = L.layerGroup().addTo(map);
    layersRef.current.buses = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      if (onMapClickRef.current) {
        onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw routes & stops
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const routeLayer = layersRef.current.routes;
    const stopLayer = layersRef.current.stops;
    routeLayer.clearLayers();
    stopLayer.clearLayers();

    const selectedBus = buses.find((b) => b.id === selectedBusId);

    if (routesToDraw) {
      routesToDraw.forEach((r) => {
        if (Array.isArray(r.path) && r.path.length >= 2) {
          L.polyline(
            r.path.map((p) => [p.lat, p.lng]),
            {
              color: r.highlighted ? '#1D4ED8' : '#94A3B8',
              weight: r.highlighted ? 5 : 3,
              opacity: r.highlighted ? 0.9 : 0.55,
            }
          ).addTo(routeLayer);
        }
      });
    } else {
      // Draw all bus routes softly, and selected bus route prominently
      const drawnRoutes = new Set();
      buses.forEach((b) => {
        const r = b.route;
        if (!r || drawnRoutes.has(r.id) || !Array.isArray(r.path) || r.path.length < 2) return;
        drawnRoutes.add(r.id);
        const isSelected = selectedBus?.route?.id === r.id;
        L.polyline(
          r.path.map((p) => [p.lat, p.lng]),
          {
            color: isSelected ? '#1D4ED8' : '#94A3B8',
            weight: isSelected ? 5 : 3,
            opacity: isSelected ? 0.88 : 0.45,
          }
        ).addTo(routeLayer);
      });
    }

    const activeStops = stopsToDraw || selectedBus?.orderedStops || [];
    activeStops.forEach((stop, idx) => {
      if (typeof stop.lat !== 'number' || typeof stop.lng !== 'number') return;
      const isSelected = stop.id === selectedStopId;
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopIcon(idx, isSelected),
        draggable: Boolean(draggableStops),
      });
      marker.bindTooltip(`${idx + 1}. ${stop.name}`, {
        direction: 'top',
        offset: [0, -10],
      });
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });
      if (draggableStops && onStopDragEnd) {
        marker.on('dragend', (ev) => {
          const ll = ev.target.getLatLng();
          onStopDragEnd(stop.id, { lat: ll.lat, lng: ll.lng });
        });
      }
      marker.addTo(stopLayer);
    });
  }, [
    buses,
    selectedBusId,
    selectedStopId,
    routesToDraw,
    stopsToDraw,
    draggableStops,
    onSelectStop,
    onStopDragEnd,
  ]);

  // Draw buses
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const busLayer = layersRef.current.buses;
    busLayer.clearLayers();

    buses.forEach((bus) => {
      if (!bus.location || typeof bus.location.lat !== 'number' || typeof bus.location.lng !== 'number') {
        return;
      }
      const marker = L.marker([bus.location.lat, bus.location.lng], {
        icon: createBusIcon(bus),
        zIndexOffset: bus.id === selectedBusId ? 600 : 300,
      });
      marker.bindPopup(createBusPopupHtml(bus));
      marker.on('click', () => {
        if (onSelectBus) onSelectBus(bus.id);
      });
      marker.addTo(busLayer);
    });
  }, [buses, selectedBusId, onSelectBus]);

  // Auto-fit bounds when route/selection changes explicitly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = [];
    const selectedBus = buses.find((b) => b.id === selectedBusId);
    if (selectedBus?.route?.path?.length) {
      selectedBus.route.path.forEach((p) => points.push([p.lat, p.lng]));
    } else if (routesToDraw?.length) {
      routesToDraw.forEach((r) => r.path?.forEach((p) => points.push([p.lat, p.lng])));
    } else {
      buses.forEach((b) => {
        if (b.location) points.push([b.location.lat, b.location.lng]);
      });
    }

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFitKey]);

  return (
    <div
      ref={containerRef}
      className="map-container"
      style={{ height: `${height}px` }}
      aria-label="Live bus map"
    />
  );
}
