import { MapView } from '../MapView.jsx';
import { FreshnessBadge } from '../FreshnessBadge.jsx';
import { FRESHNESS_STATES } from '../../utils/freshness.js';

export function Monitor({ buses = [], now }) {
  const liveCount = buses.filter((b) => b.freshness?.state === FRESHNESS_STATES.LIVE).length;
  const delayedSignalCount = buses.filter(
    (b) => b.freshness?.state === FRESHNESS_STATES.DELAYED
  ).length;
  const unavailableCount = buses.filter(
    (b) => b.freshness?.state === FRESHNESS_STATES.UNAVAILABLE
  ).length;

  return (
    <div className="main-stack">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Fleet</div>
          <div className="kpi-value tabular">{buses.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Live GPS</div>
          <div className="kpi-value tabular" style={{ color: 'var(--color-live)' }}>
            {liveCount}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Signal Delayed</div>
          <div className="kpi-value tabular" style={{ color: 'var(--color-delayed)' }}>
            {delayedSignalCount}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unavailable</div>
          <div className="kpi-value tabular" style={{ color: 'var(--color-unavailable)' }}>
            {unavailableCount}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Live Fleet Map</h3>
        </div>
        <MapView buses={buses} height={340} autoFitKey="admin-monitor" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Live Fleet Status</h3>
          <span className="badge badge-primary">{buses.length} buses</span>
        </div>
        {buses.length === 0 ? (
          <div className="empty-state">No buses to monitor.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bus</th>
                  <th>Route</th>
                  <th>GPS Freshness</th>
                  <th>Speed</th>
                  <th>Next Stop &amp; Schedule</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => {
                  const isUnavailable = bus.freshness?.state === FRESHNESS_STATES.UNAVAILABLE;
                  const speedKmh =
                    !isUnavailable && bus.location?.speed != null
                      ? `${(bus.location.speed * 3.6).toFixed(1)} km/h`
                      : '--';
                  const next = bus.nextUpcomingStop;
                  return (
                    <tr key={bus.id}>
                      <td>
                        <strong>{bus.name}</strong>
                        <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                          {bus.number}
                        </div>
                      </td>
                      <td>{bus.route?.name || 'Unassigned'}</td>
                      <td>
                        <FreshnessBadge
                          freshness={bus.freshness}
                          timestamp={bus.location?.timestamp}
                          now={now}
                        />
                      </td>
                      <td className="tabular">{speedKmh}</td>
                      <td>
                        {isUnavailable ? (
                          <span style={{ color: 'var(--color-text-muted)' }}>Location outdated</span>
                        ) : next ? (
                          <div>
                            <strong>{next.stop.name}</strong> ({next.eta.etaMinutes} min)
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              {next.delay.label}
                            </div>
                          </div>
                        ) : (
                          <span>Completed route</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
