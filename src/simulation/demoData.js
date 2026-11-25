import { getTotalPathLength, interpolateAlongPath } from '../utils/geo.js';

export const DEMO_BUS_CONFIGS = {
  bus_01: { startDistance: 1200, baseSpeedMps: 11.0 },
  bus_02: { startDistance: 600, baseSpeedMps: 10.5 },
  bus_03: { startDistance: 700, baseSpeedMps: 10.0 },
  bus_04: { startDistance: 800, baseSpeedMps: 10.2 },
  bus_05: { startDistance: 900, baseSpeedMps: 10.0 },
  bus_06: { startDistance: 650, baseSpeedMps: 10.4 },
  bus_07: { startDistance: 850, baseSpeedMps: 10.6 },
  bus_08: { startDistance: 950, baseSpeedMps: 9.8 },
  bus_09: { startDistance: 1500, baseSpeedMps: 11.5 },
};

export function createInitialDemoData(now = Date.now()) {
  const stops = {
    // Common College Destination
    stop_vdit: { name: 'KLS VDIT, Haliyal', lat: 15.3278, lng: 74.7536 },

    // Route A: Hubli
    stop_a1: { name: 'Manjunath Nagar Cross', lat: 15.3465, lng: 75.1195 },
    stop_a2: { name: 'Akshay Park', lat: 15.3532, lng: 75.1112 },
    stop_a3: { name: 'Old Bus Stand', lat: 15.3489, lng: 75.1419 },
    stop_a4: { name: 'Hosur', lat: 15.3578, lng: 75.1342 },
    stop_a5: { name: 'BVBCET', lat: 15.3692, lng: 75.1217 },
    stop_a6: { name: 'Navnagar', lat: 15.3988, lng: 75.0752 },
    stop_shrinagar: { name: 'Shrinagar (Dharwad)', lat: 15.4485, lng: 75.0128 },

    // Route B: Dharwad
    stop_b1: { name: 'Gandhi Nagar', lat: 15.453, lng: 75.002 },
    stop_b2: { name: 'Bagalkot Petrol Pump', lat: 15.4585, lng: 75.0065 },
    stop_b3: { name: 'Emmikeri', lat: 15.4555, lng: 75.014 },
    stop_b4: { name: 'Michigan Compound', lat: 15.4525, lng: 75.0165 },
    stop_b5: { name: 'Jayanagar', lat: 15.446, lng: 75.0185 },

    // Route C: Dharwad
    stop_c1: { name: 'Tejaswi Nagar', lat: 15.468, lng: 75.001 },
    stop_c2: { name: 'Toll Naka', lat: 15.432, lng: 75.026 },
    stop_c3: { name: 'NTTF', lat: 15.4435, lng: 75.0145 },
    stop_c4: { name: 'Court Circle', lat: 15.457, lng: 75.0075 },
    stop_c5: { name: 'Jubilee Circle', lat: 15.4589, lng: 75.0078 },

    // Route D: Dharwad
    stop_d1: { name: 'Murgamath', lat: 15.464, lng: 74.996 },
    stop_d2: { name: 'Depot Circle', lat: 15.461, lng: 75.0015 },
    stop_d3: { name: 'Shivaji Circle', lat: 15.459, lng: 75.0045 },
    stop_d4: { name: 'Maratha Colony', lat: 15.4545, lng: 75.0055 },
    stop_d5: { name: 'Old DSP Office', lat: 15.4565, lng: 75.0095 },
    stop_dasankoppa: { name: 'Dasankoppa', lat: 15.4395, lng: 74.978 },

    // Route E: Dharwad
    stop_e1: { name: 'New Bus Stand', lat: 15.4628, lng: 75.0038 },
    stop_e2: { name: 'MG Bank', lat: 15.4578, lng: 75.0088 },
    stop_e3: { name: 'Police Headquarters', lat: 15.4542, lng: 75.011 },
    stop_e4: { name: 'Sadhankeri', lat: 15.451, lng: 74.9945 },
    stop_e5: { name: 'Sainagar', lat: 15.4475, lng: 74.989 },

    // Route F: Dharwad
    stop_f1: { name: 'Galgali Hospital', lat: 15.4535, lng: 75.009 },
    stop_f2: { name: 'Shivgiri', lat: 15.449, lng: 75.004 },
    stop_f3: { name: 'Kalyan Nagar', lat: 15.4445, lng: 75.0065 },
    stop_f4: { name: 'Karnataka University Circle', lat: 15.4415, lng: 74.9865 },

    // Route G: Navnagar – Dharwad
    stop_g2: { name: 'SDM Medical', lat: 15.4235, lng: 75.0395 },
    stop_g3: { name: 'Dental Cross', lat: 15.4285, lng: 75.0335 },
    stop_g4: { name: 'Navalur', lat: 15.417, lng: 75.0485 },

    // Route H: Dandeli
    stop_h1: { name: 'Dandeli Bus Stand', lat: 15.2495, lng: 74.6175 },
    stop_h2: { name: 'Somani Circle', lat: 15.2525, lng: 74.6215 },
    stop_h3: { name: 'Bhat Hospital', lat: 15.2565, lng: 74.6265 },
    stop_h4: { name: 'Maruti Nagar Cross', lat: 15.264, lng: 74.636 },
    stop_h5: { name: 'Kulkarni Hospital', lat: 15.272, lng: 74.648 },
    stop_h6: { name: 'VTU Centre', lat: 15.285, lng: 74.668 },
    stop_h7: { name: 'Bamboo Gate', lat: 15.296, lng: 74.688 },
    stop_h8: { name: 'KC Circle', lat: 15.308, lng: 74.71 },
    stop_h9: { name: 'Third Gate', lat: 15.318, lng: 74.732 },

    // Route I: Belgaum
    stop_i1: { name: 'KLS Society', lat: 15.845, lng: 74.497 },
    stop_i2: { name: 'Third Gate (Belgaum)', lat: 15.839, lng: 74.502 },
    stop_i3: { name: 'Khanapur', lat: 15.6375, lng: 74.5065 },
    stop_i4: { name: 'Beedi', lat: 15.534, lng: 74.564 },
    stop_i5: { name: 'Kakkeri', lat: 15.468, lng: 74.645 },
    stop_i6: { name: 'Alnavar', lat: 15.4325, lng: 74.7385 },
  };

  function buildPathFromStopIds(stopIds) {
    return stopIds.map((id) => ({ lat: stops[id].lat, lng: stops[id].lng }));
  }

  const routeDefs = {
    route_a: {
      name: 'Route A – Hubli',
      stopIds: [
        'stop_a1',
        'stop_a2',
        'stop_a3',
        'stop_a4',
        'stop_a5',
        'stop_a6',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_b: {
      name: 'Route B – Dharwad',
      stopIds: [
        'stop_b1',
        'stop_b2',
        'stop_b3',
        'stop_b4',
        'stop_b5',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_c: {
      name: 'Route C – Dharwad',
      stopIds: [
        'stop_c1',
        'stop_c2',
        'stop_c3',
        'stop_c4',
        'stop_c5',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_d: {
      name: 'Route D – Dharwad',
      stopIds: [
        'stop_d1',
        'stop_d2',
        'stop_d3',
        'stop_d4',
        'stop_d5',
        'stop_dasankoppa',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_e: {
      name: 'Route E – Dharwad',
      stopIds: [
        'stop_e1',
        'stop_e2',
        'stop_e3',
        'stop_e4',
        'stop_e5',
        'stop_dasankoppa',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_f: {
      name: 'Route F – Dharwad',
      stopIds: [
        'stop_f1',
        'stop_f2',
        'stop_f3',
        'stop_f4',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_g: {
      name: 'Route G – Navnagar / Dharwad',
      stopIds: [
        'stop_a6',
        'stop_g2',
        'stop_g3',
        'stop_g4',
        'stop_b1',
        'stop_shrinagar',
        'stop_vdit',
      ],
    },
    route_h: {
      name: 'Route H – Dandeli',
      stopIds: [
        'stop_h1',
        'stop_h2',
        'stop_h3',
        'stop_h4',
        'stop_h5',
        'stop_h6',
        'stop_h7',
        'stop_h8',
        'stop_h9',
        'stop_vdit',
      ],
    },
    route_i: {
      name: 'Route I – Belgaum',
      stopIds: [
        'stop_i1',
        'stop_i2',
        'stop_i3',
        'stop_i4',
        'stop_i5',
        'stop_i6',
        'stop_vdit',
      ],
    },
  };

  const routes = {};
  Object.entries(routeDefs).forEach(([id, def]) => {
    routes[id] = {
      name: def.name,
      stopIds: def.stopIds,
      path: buildPathFromStopIds(def.stopIds),
    };
  });

  // College morning timings: exact intervals from the KLS VDIT timetable shifted
  // so every route reaches KLS VDIT, Haliyal at 08:45 AM.
  const schedules = {
    route_a: {
      stop_a1: '07:05',
      stop_a2: '07:10',
      stop_a3: '07:25',
      stop_a4: '07:30',
      stop_a5: '07:35',
      stop_a6: '07:40',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_b: {
      stop_b1: '07:40',
      stop_b2: '07:50',
      stop_b3: '07:54',
      stop_b4: '07:56',
      stop_b5: '07:58',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_c: {
      stop_c1: '07:35',
      stop_c2: '07:40',
      stop_c3: '07:45',
      stop_c4: '07:50',
      stop_c5: '07:55',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_d: {
      stop_d1: '07:25',
      stop_d2: '07:30',
      stop_d3: '07:40',
      stop_d4: '07:45',
      stop_d5: '07:50',
      stop_dasankoppa: '07:57',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_e: {
      stop_e1: '07:20',
      stop_e2: '07:30',
      stop_e3: '07:40',
      stop_e4: '07:45',
      stop_e5: '07:50',
      stop_dasankoppa: '07:55',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_f: {
      stop_f1: '07:40',
      stop_f2: '07:45',
      stop_f3: '07:50',
      stop_f4: '07:55',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_g: {
      stop_a6: '07:25',
      stop_g2: '07:40',
      stop_g3: '07:45',
      stop_g4: '07:50',
      stop_b1: '07:55',
      stop_shrinagar: '08:00',
      stop_vdit: '08:45',
    },
    route_h: {
      stop_h1: '07:50',
      stop_h2: '07:53',
      stop_h3: '07:55',
      stop_h4: '08:00',
      stop_h5: '08:03',
      stop_h6: '08:05',
      stop_h7: '08:07',
      stop_h8: '08:10',
      stop_h9: '08:15',
      stop_vdit: '08:45',
    },
    route_i: {
      stop_i1: '06:45',
      stop_i2: '06:50',
      stop_i3: '07:30',
      stop_i4: '07:50',
      stop_i5: '08:10',
      stop_i6: '08:15',
      stop_vdit: '08:45',
    },
  };

  const buses = {
    bus_01: {
      number: 'KA-25-F-1001',
      name: 'Bus 1',
      routeId: 'route_a',
      driverUid: 'demo_driver_1',
      capacity: 55,
      active: true,
    },
    bus_02: {
      number: 'KA-25-F-1002',
      name: 'Bus 2',
      routeId: 'route_b',
      driverUid: 'demo_driver_2',
      capacity: 50,
      active: true,
    },
    bus_03: {
      number: 'KA-25-F-1003',
      name: 'Bus 3',
      routeId: 'route_c',
      driverUid: 'demo_driver_3',
      capacity: 50,
      active: true,
    },
    bus_04: {
      number: 'KA-25-F-1004',
      name: 'Bus 4',
      routeId: 'route_d',
      driverUid: 'demo_driver_4',
      capacity: 50,
      active: true,
    },
    bus_05: {
      number: 'KA-25-F-1005',
      name: 'Bus 5',
      routeId: 'route_e',
      driverUid: 'demo_driver_5',
      capacity: 50,
      active: true,
    },
    bus_06: {
      number: 'KA-25-F-1006',
      name: 'Bus 6',
      routeId: 'route_f',
      driverUid: 'demo_driver_6',
      capacity: 45,
      active: true,
    },
    bus_07: {
      number: 'KA-25-F-1007',
      name: 'Bus 7',
      routeId: 'route_g',
      driverUid: 'demo_driver_7',
      capacity: 50,
      active: true,
    },
    bus_08: {
      number: 'KA-65-F-1008',
      name: 'Bus 8',
      routeId: 'route_h',
      driverUid: 'demo_driver_8',
      capacity: 55,
      active: true,
    },
    bus_09: {
      number: 'KA-22-F-1009',
      name: 'Bus 9',
      routeId: 'route_i',
      driverUid: 'demo_driver_9',
      capacity: 55,
      active: true,
    },
  };

  const locations = {};
  Object.entries(buses).forEach(([busId, bus]) => {
    const route = routes[bus.routeId];
    const cfg = DEMO_BUS_CONFIGS[busId] || { startDistance: 500, baseSpeedMps: 10.0 };
    const totalLen = getTotalPathLength(route.path);
    const startDist = Math.min(cfg.startDistance, totalLen * 0.25);
    const pos = interpolateAlongPath(route.path, startDist);
    locations[busId] = {
      lat: pos.lat,
      lng: pos.lng,
      speed: cfg.baseSpeedMps,
      accuracy: 8,
      heading: pos.heading,
      timestamp: now,
      simulated: true,
    };
  });

  return { buses, routes, stops, schedules, locations };
}
