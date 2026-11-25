import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { validateSchedule } from '../../utils/validation.js';
import { saveRouteSchedule } from '../../services/routeService.js';
import { useDemoMode } from '../../context/DemoModeContext.jsx';

export function ScheduleEditor({ raw }) {
  const { demoMode, demoSaveSchedule } = useDemoMode();
  const routes = raw?.routes || {};
  const stops = raw?.stops || {};
  const schedules = raw?.schedules || {};

  const routeEntries = Object.entries(routes);
  const [selectedRouteId, setSelectedRouteId] = useState(routeEntries[0]?.[0] || '');
  const [draft, setDraft] = useState({});
  const [errors, setErrors] = useState({});
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (!selectedRouteId) return;
    setDraft(schedules[selectedRouteId] ? { ...schedules[selectedRouteId] } : {});
    setErrors({});
    setSavedMsg('');
  }, [selectedRouteId, schedules]);

  const route = selectedRouteId ? routes[selectedRouteId] : null;
  const stopIds = route?.stopIds || [];

  async function handleSave(e) {
    e.preventDefault();
    setSavedMsg('');
    const check = validateSchedule(stopIds, draft);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    setErrors({});
    try {
      if (demoMode) {
        demoSaveSchedule(selectedRouteId, draft);
        setSavedMsg('Schedule saved in Demo Mode.');
      } else {
        await saveRouteSchedule(selectedRouteId, draft);
        setSavedMsg('Schedule saved.');
      }
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to save schedule.' });
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Route Schedule Editor (24-hour HH:mm)</h3>
      </div>

      <div className="form-group" style={{ maxWidth: '400px' }}>
        <label className="form-label" htmlFor="sched-route">Select Route</label>
        <select
          id="sched-route"
          className="form-control"
          value={selectedRouteId}
          onChange={(e) => setSelectedRouteId(e.target.value)}
        >
          {routeEntries.map(([id, r]) => (
            <option key={id} value={id}>{r.name}</option>
          ))}
        </select>
      </div>

      {errors.general && <div className="banner banner-danger">{errors.general}</div>}
      {savedMsg && <div className="banner banner-info">{savedMsg}</div>}

      {stopIds.length === 0 ? (
        <div className="empty-state">This route has no stops assigned.</div>
      ) : (
        <form onSubmit={handleSave} noValidate>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stop Name</th>
                  <th>Expected Time (HH:mm)</th>
                </tr>
              </thead>
              <tbody>
                {stopIds.map((sid, idx) => {
                  const stop = stops[sid];
                  return (
                    <tr key={sid}>
                      <td>{idx + 1}</td>
                      <td><strong>{stop?.name || sid}</strong></td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          style={{ maxWidth: '150px' }}
                          aria-label={`Schedule time for ${stop?.name || sid}`}
                          value={draft[sid] || ''}
                          onChange={(e) => setDraft({ ...draft, [sid]: e.target.value })}
                          placeholder="08:15"
                        />
                        {errors[sid] && <div className="form-error">{errors[sid]}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
