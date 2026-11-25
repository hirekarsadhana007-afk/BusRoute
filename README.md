# RouteTrack – Real-Time College Bus Tracking & Arrival Prediction

RouteTrack helps students see where their college bus is, when it will reach their stop, and whether it is running late, so they spend less time waiting.

> Third-year CSE mini-project. Stack: React, Firebase Realtime Database, Leaflet + OpenStreetMap, browser Geolocation API.

## Features

| # | Feature | Summary |
|---|---------|---------|
| 1 | Live bus tracking | Buses move on a Leaflet map along their route, with bus number, route name and last-updated time |
| 2 | ETA estimation | Per-stop ETA from remaining distance and smoothed speed, recalculated on every location update |
| 3 | Delay alerts | Compares predicted arrival with the schedule and shows a warning plus delay duration |
| 4 | Stop notifications | Student picks a stop; gets "approaching" and "significant delay" alerts, de-duplicated |
| 5 | Outdated-location warning | GPS older than a threshold is never shown as live; clearly labelled Live / Delayed / Unavailable |
| 6 | Admin panel | Manage buses, routes, stops, schedules; monitor positions and delays |
| 7 | Demo mode | Simulated buses, delays, notifications and signal loss, always labelled as demonstration data |

## Quick start

```bash
npm install
cp .env.example .env      # fill in Firebase values (see docs/SETUP.md)
npm run dev               # http://localhost:5173
```

No Firebase yet? Open the app and switch on **Demo Mode**. It runs entirely in the browser with no backend.

## Documentation

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) – functional requirements and acceptance criteria
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – structure, components, data flow
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) – Firebase schema and security rules
- [docs/ALGORITHMS.md](docs/ALGORITHMS.md) – ETA, delay, freshness and notification logic
- [docs/SETUP.md](docs/SETUP.md) – Firebase, environment and deployment
- [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) – demonstration script for viva/presentation
- [docs/TESTING.md](docs/TESTING.md) – test plan and checklist

## Project structure

```
routetrack/
├── public/
├── src/
│   ├── components/      # MapView, BusMarker, EtaCard, DelayBanner, FreshnessBadge, StopSelector ...
│   ├── pages/           # StudentDashboard, DriverTracker, Admin/*, Login
│   ├── hooks/           # useBuses, useSelectedStop, useNotifications, useGeolocation
│   ├── services/        # firebase.js, busService.js, routeService.js, notificationService.js
│   ├── simulation/      # simulator.js, demoData.js
│   ├── utils/           # geo.js, eta.js, freshness.js, validation.js
│   ├── context/         # AuthContext, DemoModeContext
│   └── styles/
├── docs/
├── .env.example
└── package.json
```

## Roles

- **Student**: no login needed. Chooses bus and stop; preference stored in `localStorage`.
- **Driver**: signs in, shares phone GPS via the Geolocation API.
- **Admin**: signs in with Firebase Auth, manages data.

## Data honesty rule

Simulated positions are never written to the live `locations` path and always carry a visible **DEMO DATA** badge. Stale GPS is never rendered as a live position.

## Colour theme

Blue `#1D4ED8` primary, white `#FFFFFF` surfaces, light grey `#F3F4F6` background. Status colours: green (live), amber (delayed signal), red/grey (unavailable).
