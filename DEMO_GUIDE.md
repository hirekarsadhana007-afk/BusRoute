# Demonstration Guide

Demo mode needs no Firebase, no GPS and no login. All data is labelled **DEMO DATA**.

## Before you start
- `npm run dev`, open the app, toggle **Demo Mode** (top bar).
- Allow browser notifications for the best effect.

## Script (about 5 minutes)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Open the dashboard | Three sample buses and routes, the DEMO DATA badge |
| 2 | Pick **Bus 1** and the stop **Library Junction** | Route highlighted, selected stop panel |
| 3 | Watch the map | Bus moves along the route; "last updated" ticks; green **Live** badge |
| 4 | Look at the ETA cards | ETA falls as the bus approaches and recalculates each tick |
| 5 | Click **Inject delay** | Bus slows; amber banner "Delayed by N min"; ETA moves later |
| 6 | Wait for the alert | "Bus 1 is approaching Library Junction" fires once |
| 7 | Click **Pause GPS** | After 30 s badge turns amber (Delayed); after 120 s it turns grey **Unavailable** with "Location data is outdated" and the last update time |
| 8 | Click **Resume GPS** | Bus returns to Live; ETA resumes |
| 9 | Open **Admin** | Add a bus, add a stop, edit a schedule; see it appear on the dashboard |
| 10 | Resize the window | Show mobile, tablet and desktop layouts |

## Demo controls
- Start / stop simulation
- Speed multiplier (1×, 2×, 5×) for a faster demo
- Inject delay, clear delay
- Pause GPS, resume GPS
- Reset

> Tip: for the viva, use the speed multiplier and shorter freshness thresholds (see `utils/freshness.js`) so the stale-data demo does not take two minutes.

## Live-mode demo (optional)
1. Sign in as driver on a phone → **Start sharing location**.
2. Open the dashboard on a laptop → the bus appears with real GPS and the Live badge.
3. Turn off the phone's data to show the outdated-location warning with real data.
