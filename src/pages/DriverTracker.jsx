import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Square, RefreshCw, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDemoMode } from '../context/DemoModeContext.jsx';
import { useBuses } from '../hooks/useBuses.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { updateBusLocation } from '../services/busService.js';

const WRITE_THROTTLE_MS = 4000;

export function DriverTracker() {
  const { user, isAdmin } = useAuth();
  const { demoMode } = useDemoMode();
  const { buses } = useBuses();
  const { position, error: geoError, watching, startWatching, stopWatching } = useGeolocation();

  const assignableBuses = demoMode
    ? buses
    : buses.filter((b) => isAdmin || !b.driverUid || b.driverUid === user?.uid);

  const [selectedBusId, setSelectedBusId] = useState('');
  const [lastWriteTime, setLastWriteTime] = useState(null);
  const [writeError, setWriteError] = useState('');
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!selectedBusId && assignableBuses.length > 0) {
      setSelectedBusId(assignableBuses[0].id);
    }
  }, [assignableBuses, selectedBusId]);

  useEffect(() => {
    if (demoMode || !watching || !position || !selectedBusId || !user) return;
    const now = Date.now();
    if (now - lastSentAtRef.current < WRITE_THROTTLE_MS) return;

    lastSentAtRef.current = now;
    setWriteError('');
    updateBusLocation(selectedBusId, position)
      .then(() => setLastWriteTime(Date.now()))
      .catch((err) => setWriteError(err?.message || 'Failed to publish GPS position to Firebase.'));
  }, [demoMode, watching, position, selectedBusId, user]);

  if (!demoMode && !user) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <h2 className="card-title" style={{ justifyContent: 'center', marginBottom: '0.6rem' }}>
          Driver Sign-In Required
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Sign in with your assigned driver Firebase account to broadcast live GPS updates.
        </p>
        <Link to="/login?next=/driver" className="btn btn-primary">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="main-stack" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {demoMode && (
        <div className="banner banner-warning">
          <span>
            <strong>Demo Mode is active:</strong> Real GPS positions are previewed locally only and
            never written to Firebase. Switch Demo Mode OFF in the top bar for live broadcasting.
          </span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Navigation size={18} color="#1D4ED8" />
            <span>Driver GPS Tracker</span>
          </h2>
          {watching ? (
            <span className="badge badge-live">
              <span className="dot dot-live" />
              <Radio size={13} />
              <span>Broadcasting GPS</span>
            </span>
          ) : (
            <span className="badge badge-unavailable">Standby</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="driver-bus-select">
            Assigned Bus
          </label>
          <select
            id="driver-bus-select"
            className="form-control"
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            disabled={watching}
          >
            {assignableBuses.length === 0 ? (
              <option value="">No buses assigned to your account</option>
            ) : (
              assignableBuses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.number}) – {b.route?.name || 'No route'}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {!watching ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startWatching}
              disabled={!selectedBusId}
            >
              <Navigation size={16} />
              <span>Start Sharing Location</span>
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={stopWatching}>
              <Square size={16} />
              <span>Stop Sharing</span>
            </button>
          )}
        </div>

        {geoError && (
          <div className="banner banner-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <AlertTriangle size={18} />
              <span>{geoError}</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={startWatching}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {writeError && (
          <div className="banner banner-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <span>{writeError}</span>
          </div>
        )}

        {position && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>Live Device Telemetry</span>
            </div>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Latitude</div>
                <div className="kpi-value mono" style={{ fontSize: '1.15rem' }}>
                  {position.lat.toFixed(6)}
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Longitude</div>
                <div className="kpi-value mono" style={{ fontSize: '1.15rem' }}>
                  {position.lng.toFixed(6)}
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Speed</div>
                <div className="kpi-value tabular" style={{ fontSize: '1.15rem' }}>
                  {((position.speed || 0) * 3.6).toFixed(1)} km/h
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Accuracy</div>
                <div className="kpi-value tabular" style={{ fontSize: '1.15rem' }}>
                  ±{Math.round(position.accuracy || 0)} m
                </div>
              </div>
            </div>
            {lastWriteTime && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Last pushed to Firebase: {new Date(lastWriteTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
