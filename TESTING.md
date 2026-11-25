# Test Plan

## Unit tests (Vitest/Jest)
| Module | Cases |
|--------|-------|
| `geo.js` | Haversine known distances; projection onto polyline; point beyond route ends |
| `eta.js` | Normal speed; zero speed falls back to default; bus already passed stop; off-route |
| `freshness.js` | Boundaries at 30 s and 120 s; missing timestamp → Unavailable |
| Delay | On time, +5 min threshold, ahead of schedule |
| Notification dedupe | Same key fires once; delay bucket change fires again; reset after trip |
| `validation.js` | Bad lat/lng, duplicate bus number, malformed `HH:mm`, non-increasing schedule |

## Manual test checklist

### Live tracking
- [ ] Map loads with OSM tiles
- [ ] Marker moves along the route
- [ ] Bus number and route shown
- [ ] Last-updated time is visible and changes

### ETA
- [ ] ETA shown for each stop
- [ ] Selected stop is highlighted
- [ ] ETA recalculates on each update

### Delay
- [ ] Banner appears after injecting delay
- [ ] Delay minutes shown and ETA updated
- [ ] Banner clears when the delay ends

### Notifications
- [ ] Permission prompt shown
- [ ] Approaching alert fires once
- [ ] Significant delay alert fires, no spam
- [ ] Works with permission denied (toast fallback)

### Outdated location
- [ ] Live → Delayed → Unavailable transitions occur on time
- [ ] Stale position never styled as live
- [ ] "Location data is outdated" and last update time displayed
- [ ] Recovers when updates resume

### Admin
- [ ] Login works; non-admin blocked
- [ ] Add/edit/delete bus, route, stop
- [ ] Schedule validation errors shown
- [ ] Monitor table matches dashboard

### Errors and resilience
- [ ] GPS permission denied message and retry
- [ ] Firebase offline banner
- [ ] Loading and empty states on all lists

### Responsive
- [ ] 360 px phone, 768 px tablet, 1280 px desktop
- [ ] No horizontal scroll; tap targets ≥ 44 px

### Demo mode
- [ ] Badge always visible
- [ ] Nothing written to Firebase

## Bug log template
| ID | Description | Steps | Expected | Actual | Status |
|----|-------------|-------|----------|--------|--------|
