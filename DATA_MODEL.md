# Data Model (Firebase Realtime Database)

```json
{
  "buses": {
    "bus_01": { "number": "KA-01-F-1234", "name": "Bus 1", "routeId": "route_a", "driverUid": "uid123", "capacity": 50, "active": true }
  },
  "routes": {
    "route_a": {
      "name": "Campus – City Centre",
      "path": [ { "lat": 12.9716, "lng": 77.5946 } ],
      "stopIds": ["stop_1", "stop_2", "stop_3"]
    }
  },
  "stops": {
    "stop_1": { "name": "Main Gate", "lat": 12.9716, "lng": 77.5946 }
  },
  "schedules": {
    "route_a": {
      "stop_1": "07:30",
      "stop_2": "07:45",
      "stop_3": "08:05"
    }
  },
  "locations": {
    "bus_01": { "lat": 12.97, "lng": 77.59, "speed": 6.4, "accuracy": 12, "heading": 90, "timestamp": 1732500000000 }
  },
  "admins": { "uid_admin": true }
}
```

Notes
- `timestamp` is device time in ms; prefer `firebase.database.ServerValue.TIMESTAMP` in a companion `serverTime` field to avoid clock drift.
- `speed` is in m/s (Geolocation API unit).
- `schedules` times are local `HH:mm`.
- Demo data is **not** stored here.

## Security rules

```json
{
  "rules": {
    "buses":     { ".read": true, ".write": "root.child('admins').child(auth.uid).val() === true" },
    "routes":    { ".read": true, ".write": "root.child('admins').child(auth.uid).val() === true" },
    "stops":     { ".read": true, ".write": "root.child('admins').child(auth.uid).val() === true" },
    "schedules": { ".read": true, ".write": "root.child('admins').child(auth.uid).val() === true" },
    "admins":    { ".read": "auth != null && root.child('admins').child(auth.uid).val() === true", ".write": false },
    "locations": {
      ".read": true,
      "$busId": {
        ".write": "auth != null && (root.child('buses').child($busId).child('driverUid').val() === auth.uid || root.child('admins').child(auth.uid).val() === true)",
        ".validate": "newData.hasChildren(['lat','lng','timestamp']) && newData.child('lat').val() >= -90 && newData.child('lat').val() <= 90 && newData.child('lng').val() >= -180 && newData.child('lng').val() <= 180"
      }
    }
  }
}
```

## Validation (client-side)
| Field | Rule |
|-------|------|
| Bus number | required, 4–15 chars, unique |
| Route name | required, 3–60 chars |
| Route path | at least 2 points |
| Stop | name required, lat/lng in valid range |
| Schedule | `HH:mm`, strictly increasing along the route |
