import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Undo2 } from 'lucide-react';
import { validateRoute } from '../../utils/validation.js';
import { createRoute, updateRoute, deleteRoute } from '../../services/routeService.js';
import { useDemoMode } from '../../context/DemoModeContext.jsx';
import { MapView } from '../MapView.jsx';

export function RouteManager({ raw }) {
  const { demoMode, demoCreateRoute, demoUpdateRoute, demoDeleteRoute } = useDemoMode();
  const routes = raw?.routes || {};
  const stops = raw?.stops || {};

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [path, setPath] = useState([]);
  const [stopIds, setStopIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  function resetForm() {
    setEditingId(null);
    setName('');
    setPath([]);
    setStopIds([]);
    setErrors({});
  }

  function startEdit(routeId, route) {
    setEditingId(routeId);
    setName(route.name || '');
    setPath(Array.isArray(route.path) ? route.path : []);
    setStopIds(Array.isArray(route.stopIds) ? route.stopIds : []);
    setErrors({});
    setStatusMsg('');
  }

  function handleMapClick(pt) {
    setPath((prev) => [...prev, { lat: Number(pt.lat.toFixed(6)), lng: Number(pt.lng.toFixed(6)) }]);
  }

  function toggleStopOnRoute(stopId) {
    setStopIds((prev) =>
      prev.includes(stopId) ? prev.filter((id) => id !== stopId) : [...prev, stopId]
    );
  }

  function useStopsAsPath() {
    const pts = stopIds
      .map((id) => stops[id])
      .filter(Boolean)
      .map((s) => ({ lat: s.lat, lng: s.lng }));
    if (pts.length >= 2) {
      setPath(pts);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg('');
    const payload = { name, path, stopIds };
    const check = validateRoute(payload);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    try {
      if (demoMode) {
        if (editingId) {
          demoUpdateRoute(editingId, payload);
          setStatusMsg('Route updated in Demo Mode.');
        } else {
          demoCreateRoute(payload);
          setStatusMsg('Route created in Demo Mode.');
        }
      } else if (editingId) {
        await updateRoute(editingId, payload);
        setStatusMsg('Route updated.');
      } else {
        await createRoute(payload);
        setStatusMsg('Route created.');
      }
      resetForm();
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to save route.' });
    }
  }

  async function handleDelete(routeId) {
    try {
      if (demoMode) demoDeleteRoute(routeId);
      else await deleteRoute(routeId);
      if (editingId === routeId) resetForm();
      setStatusMsg('Route deleted.');
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to delete route.' });
    }
  }

  const previewStops = stopIds
    .map((id) => (stops[id] ? { id, ...stops[id] } : null))
    .filter(Boolean);

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{editingId ? 'Edit Route' : 'Create Route'}</h3>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && <div className="banner banner-danger">{errors.general}</div>}
          {statusMsg && <div className="banner banner-info">{statusMsg}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="route-name">Route Name (3–60 chars)</label>
            <input
              id="route-name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Campus – Railway Station"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Polyline Waypoints ({path.length} points) — click map to add
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPath((prev) => prev.slice(0, -1))}
                disabled={path.length === 0}
              >
                <Undo2 size={14} />
                <span>Undo Point</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPath([])}
                disabled={path.length === 0}
              >
                Clear Path
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={useStopsAsPath}
                disabled={stopIds.length < 2}
              >
                Trace from Stops
              </button>
            </div>
            {errors.path && <span className="form-error">{errors.path}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Assign Stops ({stopIds.length} selected)</label>
            <div style={{ maxHeight: '170px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem' }}>
              {Object.entries(stops).map(([id, s]) => (
                <label
                  key={id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={stopIds.includes(id)}
                    onChange={() => toggleStopOnRoute(id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              <span>{editingId ? 'Save Route' : 'Create Route'}</span>
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

      <div className="main-stack">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Route Map Editor (click map to append waypoints)</h3>
          </div>
          <MapView
            height={300}
            routesToDraw={[{ id: 'draft', path, highlighted: true }]}
            stopsToDraw={previewStops}
            onMapClick={handleMapClick}
            autoFitKey={editingId || 'new-route'}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Existing Routes ({Object.keys(routes).length})</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stops</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(routes).map(([id, r]) => (
                  <tr key={id}>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.stopIds?.length || 0}</td>
                    <td>{r.path?.length || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(id, r)}>
                          <Pencil size={14} />
                          <span>Edit</span>
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(id)}>
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
