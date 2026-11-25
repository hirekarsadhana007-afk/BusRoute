import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { validateStop } from '../../utils/validation.js';
import {
  createStop,
  updateStop,
  deleteStop,
  updateRoute,
} from '../../services/routeService.js';
import { useDemoMode } from '../../context/DemoModeContext.jsx';
import { MapView } from '../MapView.jsx';

export function StopManager({ raw }) {
  const {
    demoMode,
    demoCreateStop,
    demoUpdateStop,
    demoDeleteStop,
    demoUpdateRoute,
  } = useDemoMode();

  const stops = raw?.stops || {};
  const routes = raw?.routes || {};
  const routeEntries = Object.entries(routes);

  const [selectedRouteId, setSelectedRouteId] = useState(routeEntries[0]?.[0] || '');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', lat: '15.3278', lng: '74.7536' });
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  const selectedRoute = selectedRouteId ? routes[selectedRouteId] : null;
  const routeStopIds = selectedRoute?.stopIds || [];

  function handleMapClick(pt) {
    setForm((prev) => ({
      ...prev,
      lat: pt.lat.toFixed(6),
      lng: pt.lng.toFixed(6),
    }));
  }

  async function handleStopDragEnd(stopId, coords) {
    const existing = stops[stopId];
    if (!existing) return;
    const payload = {
      name: existing.name,
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6)),
    };
    if (demoMode) demoUpdateStop(stopId, payload);
    else await updateStop(stopId, payload);
    setStatusMsg(`Moved stop "${existing.name}" to ${payload.lat}, ${payload.lng}.`);
  }

  function startEdit(stopId, stop) {
    setEditingId(stopId);
    setForm({
      name: stop.name || '',
      lat: String(stop.lat ?? ''),
      lng: String(stop.lng ?? ''),
    });
    setErrors({});
    setStatusMsg('');
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: '', lat: '15.3278', lng: '74.7536' });
    setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg('');
    const payload = {
      name: form.name,
      lat: Number(form.lat),
      lng: Number(form.lng),
    };
    const check = validateStop(payload);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    try {
      if (editingId) {
        if (demoMode) demoUpdateStop(editingId, payload);
        else await updateStop(editingId, payload);
        setStatusMsg('Stop updated.');
      } else {
        const newId = demoMode
          ? demoCreateStop(payload)
          : await createStop(payload);

        // Automatically append new stop to selected route if one is chosen
        if (selectedRouteId && selectedRoute) {
          const updatedRoute = {
            ...selectedRoute,
            stopIds: [...routeStopIds, newId],
          };
          if (demoMode) demoUpdateRoute(selectedRouteId, updatedRoute);
          else await updateRoute(selectedRouteId, updatedRoute);
        }
        setStatusMsg('Stop added.');
      }
      resetForm();
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to save stop.' });
    }
  }

  async function handleDelete(stopId) {
    try {
      if (demoMode) demoDeleteStop(stopId);
      else await deleteStop(stopId);
      if (editingId === stopId) resetForm();
      setStatusMsg('Stop deleted.');
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to delete stop.' });
    }
  }

  async function reorderStop(fromIdx, toIdx) {
    if (!selectedRouteId || !selectedRoute) return;
    if (toIdx < 0 || toIdx >= routeStopIds.length || fromIdx === toIdx) return;

    const nextIds = [...routeStopIds];
    const [moved] = nextIds.splice(fromIdx, 1);
    nextIds.splice(toIdx, 0, moved);

    const updatedRoute = { ...selectedRoute, stopIds: nextIds };
    if (demoMode) demoUpdateRoute(selectedRouteId, updatedRoute);
    else await updateRoute(selectedRouteId, updatedRoute);
    setStatusMsg('Stop order updated.');
  }

  const mapStops = Object.entries(stops).map(([id, s]) => ({ id, ...s }));
  const mapRoutes = selectedRoute
    ? [{ id: selectedRouteId, path: selectedRoute.path || [], highlighted: true }]
    : [];

  return (
    <div className="dashboard-grid">
      <div className="sidebar-stack">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{editingId ? 'Edit Stop' : 'Add Stop'}</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 0 }}>
            Click anywhere on the map to fill coordinates, or drag an existing stop marker to reposition it.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {errors.general && <div className="banner banner-danger">{errors.general}</div>}
            {statusMsg && <div className="banner banner-info">{statusMsg}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="stop-name">Stop Name</label>
              <input
                id="stop-name"
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Auditorium Gate"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="stop-lat">Latitude</label>
                <input
                  id="stop-lat"
                  className="form-control"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="stop-lng">Longitude</label>
                <input
                  id="stop-lng"
                  className="form-control"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                />
              </div>
            </div>
            {errors.coords && <div className="form-error" style={{ marginBottom: '0.6rem' }}>{errors.coords}</div>}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? <Check size={16} /> : <Plus size={16} />}
                <span>{editingId ? 'Save Stop' : 'Add Stop'}</span>
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Reorder Route Stops</h3>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stop-route-select">Route</label>
            <select
              id="stop-route-select"
              className="form-control"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
            >
              {routeEntries.map(([id, r]) => (
                <option key={id} value={id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {routeStopIds.map((sid, idx) => {
              const s = stops[sid];
              if (!s) return null;
              return (
                <div
                  key={sid}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) reorderStop(dragIndex, idx);
                    setDragIndex(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    background: 'var(--color-surface-alt)',
                    cursor: 'grab',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {idx + 1}. {s.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => reorderStop(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="Move stop up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => reorderStop(idx, idx + 1)}
                      disabled={idx === routeStopIds.length - 1}
                      aria-label="Move stop down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="main-stack">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Interactive Stop Map (click to place, drag to move)</h3>
          </div>
          <MapView
            height={340}
            routesToDraw={mapRoutes}
            stopsToDraw={mapStops}
            draggableStops
            onMapClick={handleMapClick}
            onStopDragEnd={handleStopDragEnd}
            autoFitKey={`stops-${selectedRouteId}`}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Stops ({mapStops.length})</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mapStops.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{Number(s.lat).toFixed(5)}</td>
                    <td>{Number(s.lng).toFixed(5)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(s.id, s)}>
                          <Pencil size={14} />
                          <span>Edit</span>
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
