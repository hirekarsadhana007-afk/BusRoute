import { WifiOff, MapPin, Navigation, Gauge, Check } from 'lucide-react';
import { useBuses } from '../hooks/useBuses.js';
import { useSelectedStop } from '../hooks/useSelectedStop.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { BusSelector } from '../components/BusSelector.jsx';
import { StopSelector } from '../components/StopSelector.jsx';
import { MapView } from '../components/MapView.jsx';
import { EtaCard } from '../components/EtaCard.jsx';
import { DelayBanner } from '../components/DelayBanner.jsx';
import { FreshnessBadge } from '../components/FreshnessBadge.jsx';
import { NotificationManager } from '../components/NotificationManager.jsx';
import { DemoControls } from '../components/DemoControls.jsx';
import { formatClockTime, formatDistance, formatEtaMinutes } from '../utils/eta.js';
import { FRESHNESS_STATES } from '../utils/freshness.js';

export function StudentDashboard() {
  const { buses, loading, error, isConnected, now, demoMode } = useBuses();
  const {
    selectedBusId,
    setSelectedBusId,
    selectedStopId,
    setSelectedStopId,
    selectedBus,
    selectedStop,
  } = useSelectedStop(buses);

  const { permission, requestPermission, toasts, dismissToast } = useNotifications({
    selectedBus,
    selectedStop,
    now,
  });

  const selectedStopEntry =
    selectedBus && selectedStop ? selectedBus.stopEtas?.[selectedStop.id] : null;
  const isUnavailable =
    selectedBus?.freshness?.state === FRESHNESS_STATES.UNAVAILABLE;

  const speedKmh =
    selectedBus && !isUnavailable && selectedBus.location?.speed != null
      ? `${Math.round(selectedBus.location.speed * 3.6)} km/h`
      : null;

  return (
    <div className="main-stack">
      {!demoMode && !isConnected && (
        <div className="banner banner-danger" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <WifiOff size={18} />
            <span>
              Offline or disconnected from Firebase Realtime Database. Live updates will resume when reconnected.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="banner banner-warning" role="alert">
          <span>{error}</span>
        </div>
      )}

      <NotificationManager
        permission={permission}
        onRequestPermission={requestPermission}
        toasts={toasts}
        onDismissToast={dismissToast}
      />

      <DemoControls selectedBus={selectedBus} />

      {selectedBus && (
        <div className="selected-stop-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span className="hero-chip">
                <Navigation size={13} />
                <span>
                  {selectedBus.name} ({selectedBus.number})
                </span>
              </span>
              <span className="hero-chip">{selectedBus.route?.name || 'No route'}</span>
              {speedKmh && (
                <span className="hero-chip tabular">
                  <Gauge size={13} />
                  <span>{speedKmh}</span>
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <MapPin size={21} />
              <span>{selectedStop ? selectedStop.name : 'Select a stop'}</span>
            </div>
          </div>

          <div className="hero-eta-box tabular">
            {selectedStopEntry ? (
              isUnavailable ? (
                <div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>Unknown</div>
                  <div className="muted">Location data is outdated</div>
                </div>
              ) : selectedStopEntry.eta.status === 'departed' ? (
                <div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>Departed</div>
                  <div className="muted">Bus has already passed this stop</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#BFDBFE', fontWeight: 700 }}>
                    Estimated Arrival
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.15, marginTop: '2px' }}>
                    {formatEtaMinutes(selectedStopEntry.eta.etaMinutes)}{' '}
                    <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#DBEAFE' }}>
                      ({formatClockTime(selectedStopEntry.eta.etaMs)})
                    </span>
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    {formatDistance(selectedStopEntry.eta.remainingDistance)} away • Sched{' '}
                    {selectedStopEntry.scheduled || '--:--'}
                  </div>
                </div>
              )
            ) : (
              <div className="muted">No stop selected</div>
            )}
          </div>
        </div>
      )}

      <DelayBanner bus={selectedBus} stopEntry={selectedStopEntry} now={now} />

      <div className="dashboard-grid">
        <div className="sidebar-stack">
          <BusSelector
            buses={buses}
            selectedBusId={selectedBusId}
            onSelectBus={setSelectedBusId}
            loading={loading}
          />
          <StopSelector
            stops={selectedBus?.orderedStops || []}
            selectedStopId={selectedStopId}
            onSelectStop={setSelectedStopId}
          />
        </div>

        <div className="main-stack">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Live Route Map {selectedBus ? `– ${selectedBus.name}` : ''}
              </h2>
              {selectedBus && (
                <FreshnessBadge
                  freshness={selectedBus.freshness}
                  timestamp={selectedBus.location?.timestamp}
                  now={now}
                />
              )}
            </div>
            <div className="map-wrapper">
              <MapView
                buses={buses}
                selectedBusId={selectedBusId}
                selectedStopId={selectedStopId}
                onSelectBus={setSelectedBusId}
                onSelectStop={setSelectedStopId}
                autoFitKey={selectedBusId}
              />
            </div>
            <div className="map-legend">
              <span className="legend-item">
                <span className="dot dot-live" />
                <span>Live GPS</span>
              </span>
              <span className="legend-item">
                <span className="dot dot-delayed" />
                <span>Signal Delayed</span>
              </span>
              <span className="legend-item">
                <span className="dot dot-unavailable" />
                <span>Last Known (Unavailable)</span>
              </span>
              <span className="legend-item">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#1D4ED8',
                    display: 'inline-block',
                  }}
                />
                <span>Selected Stop</span>
              </span>
            </div>
          </div>

          {selectedBus && selectedBus.orderedStops.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: '0.55rem' }}>
                <h2 className="card-title">Route Progress</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {selectedBus.orderedStops.length} stops
                </span>
              </div>
              <div className="route-stepper" role="list" aria-label="Route progress stops">
                {selectedBus.orderedStops.map((stop, idx) => {
                  const entry = selectedBus.stopEtas[stop.id];
                  const isDeparted = !isUnavailable && entry?.eta?.status === 'departed';
                  const isSelected = stop.id === selectedStopId;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      className={`step-node ${isDeparted ? 'departed' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedStopId(stop.id)}
                    >
                      <div className="step-track">
                        <span className={`step-line ${isDeparted ? 'passed' : ''}`} />
                        <span className="step-dot">
                          {isDeparted ? <Check size={12} /> : idx + 1}
                        </span>
                      </div>
                      <span className="step-label">{stop.name}</span>
                      <span className="step-sub tabular">
                        {isUnavailable
                          ? entry?.scheduled || '--:--'
                          : isDeparted
                          ? 'Departed'
                          : entry?.eta?.status === 'ok'
                          ? formatEtaMinutes(entry.eta.etaMinutes)
                          : '--'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upcoming Stop ETAs</h2>
              {selectedBus && (
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Click any stop card to set it as your boarding stop
                </span>
              )}
            </div>

            {loading ? (
              <div className="empty-state">Loading ETAs...</div>
            ) : !selectedBus ? (
              <div className="empty-state">Select a bus to view stop ETAs.</div>
            ) : selectedBus.orderedStops.length === 0 ? (
              <div className="empty-state">No stops configured for this route.</div>
            ) : (
              <div className="eta-grid">
                {selectedBus.orderedStops.map((stop, idx) => {
                  const entry = selectedBus.stopEtas[stop.id];
                  if (!entry) return null;
                  return (
                    <EtaCard
                      key={stop.id}
                      stopEntry={entry}
                      index={idx}
                      isSelected={stop.id === selectedStopId}
                      freshnessState={selectedBus.freshness.state}
                      onSelect={() => setSelectedStopId(stop.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
