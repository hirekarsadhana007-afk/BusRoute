import { useState } from 'react';
import { Activity, Bus, Route, MapPin, Clock, SlidersHorizontal } from 'lucide-react';
import { Monitor } from './Monitor.jsx';
import { BusManager } from './BusManager.jsx';
import { RouteManager } from './RouteManager.jsx';
import { StopManager } from './StopManager.jsx';
import { ScheduleEditor } from './ScheduleEditor.jsx';
import { useDemoMode } from '../../context/DemoModeContext.jsx';
import { DEFAULT_FRESHNESS_THRESHOLDS, VIVA_FAST_THRESHOLDS } from '../../utils/freshness.js';

const TABS = [
  { id: 'monitor', label: 'Monitor', Icon: Activity },
  { id: 'buses', label: 'Buses', Icon: Bus },
  { id: 'routes', label: 'Routes', Icon: Route },
  { id: 'stops', label: 'Stops', Icon: MapPin },
  { id: 'schedules', label: 'Schedules', Icon: Clock },
  { id: 'settings', label: 'Thresholds', Icon: SlidersHorizontal },
];

export function AdminLayout({ buses, raw, now }) {
  const [tab, setTab] = useState('monitor');
  const {
    freshnessThresholds,
    setFreshnessThresholds,
    delayThresholdMin,
    setDelayThresholdMin,
  } = useDemoMode();

  return (
    <div>
      <div className="tab-bar" role="tablist" aria-label="Admin sections">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'monitor' && <Monitor buses={buses} now={now} />}
      {tab === 'buses' && <BusManager raw={raw} />}
      {tab === 'routes' && <RouteManager raw={raw} />}
      {tab === 'stops' && <StopManager raw={raw} />}
      {tab === 'schedules' && <ScheduleEditor raw={raw} />}
      {tab === 'settings' && (
        <div className="card" style={{ maxWidth: '520px' }}>
          <div className="card-header">
            <h3 className="card-title">Freshness &amp; Delay Thresholds</h3>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="set-live-sec">
              Live GPS max age (seconds)
            </label>
            <input
              id="set-live-sec"
              type="number"
              className="form-control"
              min={3}
              max={300}
              value={freshnessThresholds.liveMaxAgeSec}
              onChange={(e) =>
                setFreshnessThresholds((prev) => ({
                  ...prev,
                  liveMaxAgeSec: Math.max(3, Number(e.target.value) || 30),
                }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="set-delayed-sec">
              Delayed signal max age before Unavailable (seconds)
            </label>
            <input
              id="set-delayed-sec"
              type="number"
              className="form-control"
              min={10}
              max={900}
              value={freshnessThresholds.delayedMaxAgeSec}
              onChange={(e) =>
                setFreshnessThresholds((prev) => ({
                  ...prev,
                  delayedMaxAgeSec: Math.max(10, Number(e.target.value) || 120),
                }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="set-delay-min">
              Schedule delay warning threshold (minutes)
            </label>
            <input
              id="set-delay-min"
              type="number"
              className="form-control"
              min={1}
              max={60}
              value={delayThresholdMin}
              onChange={(e) => setDelayThresholdMin(Math.max(1, Number(e.target.value) || 5))}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFreshnessThresholds(DEFAULT_FRESHNESS_THRESHOLDS)}
            >
              Reset Standard (30s / 120s)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setFreshnessThresholds(VIVA_FAST_THRESHOLDS)}
            >
              Viva Fast Preset (6s / 16s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
