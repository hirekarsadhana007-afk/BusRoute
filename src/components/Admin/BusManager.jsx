import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { validateBus } from '../../utils/validation.js';
import { createBus, updateBus, deleteBus } from '../../services/busService.js';
import { useDemoMode } from '../../context/DemoModeContext.jsx';

export function BusManager({ raw }) {
  const { demoMode, demoCreateBus, demoUpdateBus, demoDeleteBus } = useDemoMode();
  const buses = raw?.buses || {};
  const routes = raw?.routes || {};

  const routeList = Object.entries(routes).map(([id, r]) => ({ id, ...r }));

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    number: '',
    name: '',
    routeId: routeList[0]?.id || '',
    driverUid: '',
    capacity: 50,
    active: true,
  });
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm({
      number: '',
      name: '',
      routeId: routeList[0]?.id || '',
      driverUid: '',
      capacity: 50,
      active: true,
    });
    setErrors({});
  }

  function startEdit(busId, bus) {
    setEditingId(busId);
    setForm({
      number: bus.number || '',
      name: bus.name || '',
      routeId: bus.routeId || '',
      driverUid: bus.driverUid || '',
      capacity: bus.capacity ?? 50,
      active: bus.active !== false,
    });
    setErrors({});
    setStatusMsg('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg('');
    const check = validateBus(form, buses, editingId);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    setSaving(true);
    try {
      if (demoMode) {
        if (editingId) {
          demoUpdateBus(editingId, form);
          setStatusMsg('Bus updated in Demo Mode.');
        } else {
          demoCreateBus(form);
          setStatusMsg('Bus added in Demo Mode.');
        }
      } else if (editingId) {
        await updateBus(editingId, form);
        setStatusMsg('Bus updated.');
      } else {
        await createBus(form);
        setStatusMsg('Bus added.');
      }
      resetForm();
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to save bus.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(busId) {
    setStatusMsg('');
    try {
      if (demoMode) demoDeleteBus(busId);
      else await deleteBus(busId);
      if (editingId === busId) resetForm();
      setStatusMsg('Bus deleted.');
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to delete bus.' });
    }
  }

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{editingId ? 'Edit Bus' : 'Add New Bus'}</h3>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && <div className="banner banner-danger">{errors.general}</div>}
          {statusMsg && <div className="banner banner-info">{statusMsg}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="bus-number">Registration Number</label>
            <input
              id="bus-number"
              className="form-control"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              placeholder="KA-01-F-1234"
            />
            {errors.number && <span className="form-error">{errors.number}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bus-name">Bus Name</label>
            <input
              id="bus-name"
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bus 4"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bus-route">Assigned Route</label>
            <select
              id="bus-route"
              className="form-control"
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
            >
              <option value="">-- Select route --</option>
              {routeList.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errors.routeId && <span className="form-error">{errors.routeId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bus-capacity">Capacity</label>
            <input
              id="bus-capacity"
              type="number"
              className="form-control"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              min={1}
              max={200}
            />
            {errors.capacity && <span className="form-error">{errors.capacity}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bus-driver">Driver UID (for Live Firebase Auth)</label>
            <input
              id="bus-driver"
              className="form-control"
              value={form.driverUid}
              onChange={(e) => setForm({ ...form, driverUid: e.target.value })}
              placeholder="Optional Firebase Auth UID"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', minHeight: '44px' }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>Active on schedule</span>
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              <span>{editingId ? 'Save Changes' : 'Add Bus'}</span>
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
          <h3 className="card-title">Fleet ({Object.keys(buses).length})</h3>
        </div>
        {Object.keys(buses).length === 0 ? (
          <div className="empty-state">No buses added yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Number</th>
                  <th>Route</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(buses).map(([id, b]) => (
                  <tr key={id}>
                    <td><strong>{b.name}</strong></td>
                    <td>{b.number}</td>
                    <td>{routes[b.routeId]?.name || 'Unassigned'}</td>
                    <td>{b.capacity || 50}</td>
                    <td>
                      <span className={`badge ${b.active !== false ? 'badge-live' : 'badge-unavailable'}`}>
                        {b.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(id, b)}>
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
        )}
      </div>
    </div>
  );
}
