# Algorithms

## 1. Distance
Haversine between two lat/lng points (metres).

## 2. Position on route
1. Project the bus position onto the nearest route polyline segment.
2. `progress` = distance along the path from the start to the projected point.
3. Each stop has a fixed `stopProgress` (precomputed). Remaining distance = `stopProgress − progress`.
4. If the bus is > 200 m from the route, flag **off-route** and fall back to straight-line distance.

## 2.1 ETA
```
speed = smoothed speed (m/s)
if speed < MIN_SPEED then speed = DEFAULT_SPEED     // e.g. 25 km/h ≈ 6.9 m/s
travelTime = remainingDistance / speed
dwell      = (stopsBetween) × DWELL_SECONDS         // e.g. 20 s
ETA        = now + travelTime + dwell
```
- Speed smoothing: exponential moving average `v = 0.3·new + 0.7·old`, ignoring readings with accuracy > 50 m.
- If the bus has already passed the stop (`remainingDistance < 0`), show "Departed".
- Recompute on every position update.

## 3. Delay detection
```
scheduled = today's date + schedule[stop]
delayMin  = round((ETA − scheduled) / 60000)
if delayMin ≥ DELAY_THRESHOLD (5)  → status = "Delayed by N min"
else if delayMin ≤ −2              → "Ahead of schedule"
else                               → "On time"
```
Delay is based on predicted arrival versus schedule, so it updates as the bus moves.

## 4. Location freshness
`age = now − location.timestamp`

| State | Condition | UI |
|-------|-----------|----|
| **Live** | age ≤ 30 s | Green badge, normal marker |
| **Delayed** | 30 s < age ≤ 120 s | Amber badge, "Signal delayed", marker faded |
| **Unavailable** | age > 120 s or no data | Grey badge, "Location data is outdated", last update time, ETA marked unreliable |

Rules
- Unavailable buses show the last known position as a hollow grey marker labelled "Last known", never as live.
- ETA for Unavailable buses is hidden or shown as "Unknown".
- Thresholds are constants in `utils/freshness.js` and can be edited in admin settings.
- A 1-second UI ticker re-evaluates freshness even when no new data arrives (so stale state appears without a refresh).

> Do not confuse "Delayed" (data freshness) with "Delayed by N min" (bus running late).

## 5. Notification rules
For the student's selected bus and stop:

| Alert | Trigger | Dedupe key |
|-------|---------|-----------|
| Approaching | ETA ≤ 5 min **or** distance ≤ 1 km | `approach:{busId}:{stopId}:{tripDate}` |
| Significant delay | delayMin ≥ 10 | `delay:{busId}:{stopId}:{tripDate}:{bucket}` where bucket = floor(delayMin/5)×5 |
| Signal lost | state becomes Unavailable | `stale:{busId}:{tripDate}` |

- Fired keys stored in `sessionStorage`/`localStorage` so refreshes do not re-notify.
- The delay alert re-fires only when the delay grows into a new 5-minute bucket.
- The approaching alert is reset after the bus passes the stop.
- Channels: `Notification` API if permitted, in-app toast always.

## 6. Simulation
- Each demo bus has a route polyline and speed (e.g. 8–12 m/s).
- Tick every 2 s: move along the polyline, add small jitter to speed.
- Demo controls: **Inject delay** (slows bus), **Pause GPS** (stops timestamps updating), **Resume**, **Reset**.
