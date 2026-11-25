import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useBuses } from '../hooks/useBuses.js';
import { useSelectedStop } from '../hooks/useSelectedStop.js';
import { MapView } from '../components/MapView.jsx';
import { FreshnessBadge } from '../components/FreshnessBadge.jsx';

export function LiveTrackPage() {
  const { buses, now } = useBuses();
  const { selectedBusId, setSelectedBusId } = useSelectedStop(buses);
  const [filterBusId, setFilterBusId] = useState('all');
  const navigate = useNavigate();

  const visibleBuses =
    filterBusId === 'all' ? buses : buses.filter((b) => b.id === filterBusId);
  const activeMapBusId = filterBusId === 'all' ? selectedBusId : filterBusId;

  function handleTrackBus(busId) {
    setSelectedBusId(busId);
    navigate('/');
  }

  return (
    <div className="main-stack">
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ fontSize: '1.2rem' }}>
              <Compass size={20} color="#1D4ED8" />
              <span>Live Fleet Tracker &amp; KLS VDIT Timetable</span>
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
              All 9 morning routes arriving at KLS VDIT, Haliyal by 08:45 AM
            </p>
          </div>
          <span className="badge badge-primary">{buses.length} active buses</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            marginBottom: '0.9rem',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${filterBusId === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterBusId('all')}
          >
            All Routes ({buses.length})
          </button>
          {buses.map((bus) => (
            <button
              key={bus.id}
              type="button"
              className={`btn btn-sm ${filterBusId === bus.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setFilterBusId(bus.id);
                setSelectedBusId(bus.id);
              }}
            >
              {bus.route?.name?.split('–')[0]?.trim() || bus.name}
            </button>
          ))}
        </div>

        <MapView
          buses={visibleBuses}
          selectedBusId={activeMapBusId}
          height={430}
          onSelectBus={(id) => {
            setSelectedBusId(id);
            setFilterBusId(id);
          }}
          autoFitKey={`track-${filterBusId}`}
        />
      </div>

      <div className="eta-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {buses.map((bus) => (
          <div key={bus.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                  {bus.route?.name || bus.name}
                </div>
                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {bus.name} • {bus.number}
                </div>
              </div>
              <FreshnessBadge
                freshness={bus.freshness}
                timestamp={bus.location?.timestamp}
                now={now}
                showLastUpdated={false}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                fontSize: '0.82rem',
                background: 'var(--color-surface-alt)',
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              {bus.orderedStops.map((stop) => {
                const entry = bus.stopEtas[stop.id];
                const isVdit = stop.name === 'KLS VDIT, Haliyal';
                return (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: isVdit ? 700 : 500,
                      color: isVdit ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={12} />
                      <span>{stop.name}</span>
                    </span>
                    <span className="tabular" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={11} />
                      <span>{entry?.scheduled || '--:--'}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'auto' }}
              onClick={() => handleTrackBus(bus.id)}
            >
              <span>Track {bus.name} Live</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
