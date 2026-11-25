# Requirements

## 1. Scope
A responsive web app for students to track college buses, with an admin area and a demonstration mode.

## 2. Functional requirements

### FR-A Live tracking
- FR-A1 Show bus positions on a Leaflet/OSM map.
- FR-A2 Show bus movement along the assigned route polyline.
- FR-A3 Show bus number and route name on marker/popup.
- FR-A4 Refresh positions periodically (real-time listener; simulator ticks every 2 s in demo).
- FR-A5 Show "last updated" for every bus.

### FR-B ETA
- FR-B1 Compute ETA for every upcoming stop.
- FR-B2 Show remaining time (e.g. "7 min") and clock time (e.g. "8:42 AM").
- FR-B3 Recompute on every location change.
- FR-B4 Use remaining route distance and estimated speed.
- FR-B5 Highlight the student's selected stop.

### FR-C Delay alerts
- FR-C1 Detect a bus running behind schedule (threshold configurable, default 5 min).
- FR-C2 Show a warning banner with delay minutes.
- FR-C3 ETA reflects the delay.

### FR-D Stop notifications
- FR-D1 Student selects a preferred stop (and bus/route).
- FR-D2 Notify when bus is approaching (default: ETA ≤ 5 min or ≤ 1 km).
- FR-D3 Notify on significant delay (default ≥ 10 min).
- FR-D4 No repeated duplicate notifications (see ALGORITHMS.md).
- FR-D5 Use browser Notifications API, with in-app toast fallback if permission denied.

### FR-E Outdated location
- FR-E1 Track timestamp of the last GPS update per bus.
- FR-E2 When older than the threshold, show "Location data is outdated" and the last update time.
- FR-E3 Never present stale data as current live location.
- FR-E4 Three data states: **Live**, **Delayed**, **Unavailable**.

## 3. User interface
Student dashboard, live map, bus selector, route/stop list, ETA cards, delay banner, freshness badge, selected-stop panel. Blue/white/light-grey theme. Breakpoints: mobile < 640 px, tablet 640–1024 px, desktop > 1024 px.

## 4. Admin
- Add/edit/delete buses
- Create/edit routes and stops (click on map to place stops, drag to reorder)
- Set expected schedule per stop
- Monitor live locations and delay status in a table and map

## 5. Non-functional
- All buttons and links work; no placeholder screens.
- Input validation on every form.
- Handle geolocation permission denied, unavailable, timeout; handle Firebase offline/errors.
- Loading and error states on every data view.
- No fabricated data presented as real GPS.

## 6. Demo mode
- Sample buses and routes bundled in `src/simulation/demoData.js`
- Simulated movement, ETA updates, delay injection, notifications, signal loss
- Persistent "DEMO DATA" badge

## 7. Acceptance criteria (summary)
| Feature | Passes when |
|---------|-------------|
| Live tracking | Marker moves along route and last-updated time changes |
| ETA | ETA decreases as the bus approaches; recalculates after position change |
| Delay | Injecting a delay shows banner with minutes and ETA shifts |
| Notifications | Exactly one "approaching" alert per bus per trip for the selected stop |
| Outdated | Pausing updates for longer than the threshold flips state to Unavailable and removes the live marker styling |
