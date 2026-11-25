# Setup Guide

## Prerequisites
- Node.js 18+ and npm
- A Google account for Firebase
- Modern browser (Chrome/Edge/Firefox). Geolocation needs HTTPS or `localhost`.

## 1. Install
```bash
git clone <repo-url> routetrack
cd routetrack
npm install
```

## 2. Create Firebase project
1. Go to the Firebase console → **Add project**.
2. **Build → Realtime Database** → Create database (start in locked mode).
3. **Build → Authentication** → enable **Email/Password**.
4. **Project settings → Your apps → Web app** → copy the config.
5. Paste the rules from `docs/DATA_MODEL.md` into Realtime Database → Rules → Publish.

## 3. Environment variables
Create `.env` (never commit it):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
Also commit `.env.example` with empty values.

## 4. Create the first admin
1. Register a user in Firebase Authentication.
2. Copy their UID.
3. In Realtime Database add `admins/<UID>: true`.

## 5. Run
```bash
npm run dev       # development
npm run build     # production build
npm run preview   # preview build
```

## 6. Deploy (Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public dir: dist, single-page app: yes
npm run build
firebase deploy
```

## Troubleshooting
| Problem | Fix |
|---------|-----|
| Map is blank/grey | Import `leaflet/dist/leaflet.css`; give the map container a fixed height |
| Marker icons missing | Set Leaflet default icon URLs explicitly when using a bundler |
| GPS permission denied | Allow location in the browser site settings; use HTTPS |
| `PERMISSION_DENIED` from Firebase | Check rules and that the user is an admin/driver |
| Notifications not showing | Allow notifications in the browser; in-app toasts still work |
| Nothing updates | Open Demo Mode to confirm the UI pipeline, then check the Firebase config |
