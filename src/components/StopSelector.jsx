import { MapPin } from 'lucide-react';

export function StopSelector({ stops = [], selectedStopId, onSelectStop }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <MapPin size={18} color="#1D4ED8" />
          <span>Your Stop</span>
        </h2>
      </div>

      {stops.length === 0 ? (
        <div className="empty-state" style={{ padding: '1rem' }}>
          No stops configured on this route.
        </div>
      ) : (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="student-stop-select">
            Pick your boarding stop (saved automatically)
          </label>
          <select
            id="student-stop-select"
            className="form-control"
            value={selectedStopId}
            onChange={(e) => onSelectStop(e.target.value)}
          >
            {stops.map((stop, idx) => (
              <option key={stop.id} value={stop.id}>
                {idx + 1}. {stop.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
