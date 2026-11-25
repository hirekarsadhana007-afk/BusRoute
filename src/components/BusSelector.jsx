import { useState } from 'react';
import { Bus, Search, Gauge } from 'lucide-react';
import { FreshnessBadge } from './FreshnessBadge.jsx';
import { FRESHNESS_STATES } from '../utils/freshness.js';

export function BusSelector({ buses = [], selectedBusId, onSelectBus, loading }) {
  const [query, setQuery] = useState('');

  const filtered = buses.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.number.toLowerCase().includes(q) ||
      (b.route?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Bus size={18} color="#1D4ED8" />
          <span>Select Bus</span>
        </h2>
        <span className="badge badge-primary">{buses.length} active</span>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.8rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Filter by bus or route..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter buses"
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading buses...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No buses match your search.</div>
      ) : (
        <div className="bus-list">
          {filtered.map((bus) => {
            const isSelected = bus.id === selectedBusId;
            const isLive = bus.freshness?.state !== FRESHNESS_STATES.UNAVAILABLE;
            const speedKmh =
              isLive && bus.location?.speed != null
                ? `${Math.round(bus.location.speed * 3.6)} km/h`
                : null;
            return (
              <button
                key={bus.id}
                type="button"
                className={`bus-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectBus(bus.id)}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>{bus.name}</span>
                    <span className="mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {bus.number}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {bus.route?.name || 'No route assigned'}
                  </div>
                  {speedKmh && (
                    <div
                      className="tabular"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.74rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '3px',
                      }}
                    >
                      <Gauge size={12} />
                      <span>{speedKmh}</span>
                    </div>
                  )}
                </div>
                <FreshnessBadge freshness={bus.freshness} showLastUpdated={false} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
