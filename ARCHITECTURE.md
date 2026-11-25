# Architecture

## Overview
```
 Driver phone (Geolocation API)
        │  writes position
        ▼
 Firebase Realtime Database  ◄────── Admin panel (CRUD)
        │  real-time listeners
        ▼
 React app (Student dashboard)
   ├─ utils/eta.js, freshness.js (computed client-side)
   ├─ Leaflet map
   └─ Notifications (Web Notifications API)

 Demo Mode: simulator.js ──► same React state, bypassing Firebase
```

All derived values (ETA, delay, freshness) are computed client-side from raw position + route + schedule. This keeps the backend simple (storage and sync only).

## Key components

| Component | Responsibility |
|-----------|----------------|
| `MapView` | Leaflet map, route polylines, stop markers, bus markers |
| `BusMarker` | Marker styled by freshness state; popup with number, route, last update |
| `BusSelector` | List/filter buses and routes |
| `StopSelector` | Choose and persist preferred stop |
| `EtaCard` | Remaining time and clock time for a stop |
| `DelayBanner` | Delay warning with minutes |
| `FreshnessBadge` | Live / Delayed / Unavailable with last update time |
| `NotificationManager` | Permission request, dedupe, toasts |
| `DemoControls` | Start/stop simulation, inject delay, pause GPS |
| `Admin/*` | BusManager, RouteManager, StopManager, ScheduleEditor, Monitor |
| `DriverTracker` | Starts `watchPosition`, writes to Firebase |

## Hooks and services
- `useGeolocation` wraps `navigator.geolocation.watchPosition` with error mapping (denied, unavailable, timeout).
- `useBuses` subscribes to `buses`, `routes`, `stops`, `locations`; exposes loading and error state.
- `useNotifications` evaluates alert rules on each update.
- `services/*` isolate all Firebase calls so components stay testable.

## Data flow (live mode)
1. Driver opens DriverTracker, grants GPS permission.
2. `watchPosition` yields `{lat, lng, speed, accuracy, timestamp}`; throttled to one write per 3–5 s.
3. Position written to `/locations/{busId}`.
4. Student clients receive the update, then compute: snap to route → remaining distance → ETA → delay → freshness.
5. UI renders; the notification hook checks rules.

## Data flow (demo mode)
`simulator.js` advances each demo bus along its polyline on a timer and produces position objects of the same shape, flagged `simulated: true`. They flow into the same pipeline but are never written to Firebase.

## Error handling
- Geolocation errors map to human-readable messages with retry button.
- Firebase connection state via `.info/connected`; offline banner shown.
- Every async view has loading / error / empty state.

## Security
- Students: read-only access to buses, routes, stops, locations.
- Drivers: write only their assigned bus location.
- Admins: full write (custom claim or `/admins/{uid}`).
- Rules in DATA_MODEL.md.
