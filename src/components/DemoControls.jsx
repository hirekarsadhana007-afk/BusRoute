import { Play, Pause, RotateCcw, Clock, WifiOff, Wifi, Gauge, Timer } from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext.jsx';
import { DEFAULT_FRESHNESS_THRESHOLDS, VIVA_FAST_THRESHOLDS } from '../utils/freshness.js';

export function DemoControls({ selectedBus }) {
  const {
    demoMode,
    isRunning,
    toggleRunning,
    speedMultiplier,
    setSpeedMultiplier,
    injectDelay,
    clearDelay,
    pauseGps,
    resumeGps,
    resetDemo,
    getBusControlState,
    freshnessThresholds,
    setFreshnessThresholds,
  } = useDemoMode();

  if (!demoMode) return null;

  const busId = selectedBus?.id;
  const ctrl = busId ? getBusControlState(busId) : { delayed: false, gpsPaused: false };
  const isFastThresholds =
    freshnessThresholds.liveMaxAgeSec === VIVA_FAST_THRESHOLDS.liveMaxAgeSec;

  return (
    <div className="card demo-studio">
      <div className="card-header" style={{ marginBottom: '0.75rem' }}>
        <h2 className="card-title" style={{ color: '#92400E' }}>
          <Gauge size={18} />
          <span>Simulation Studio {selectedBus ? `– ${selectedBus.name}` : ''}</span>
        </h2>
        <span className="demo-pill">DEMO DATA</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={toggleRunning}>
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          <span>{isRunning ? 'Pause Sim' : 'Start Sim'}</span>
        </button>

        <div className="segmented" role="group" aria-label="Simulation speed">
          {[1, 2, 5].map((mult) => (
            <button
              key={mult}
              type="button"
              className={`segmented-btn ${speedMultiplier === mult ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(mult)}
            >
              {mult}×
            </button>
          ))}
        </div>

        {busId && (
          <>
            {ctrl.delayed ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => clearDelay(busId)}
              >
                <Clock size={15} />
                <span>Clear Delay</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => injectDelay(busId)}
              >
                <Clock size={15} />
                <span>Inject Delay</span>
              </button>
            )}

            {ctrl.gpsPaused ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => resumeGps(busId)}
              >
                <Wifi size={15} />
                <span>Resume GPS</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => pauseGps(busId)}
              >
                <WifiOff size={15} />
                <span>Pause GPS</span>
              </button>
            )}
          </>
        )}

        <button type="button" className="btn btn-secondary btn-sm" onClick={resetDemo}>
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${isFastThresholds ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() =>
            setFreshnessThresholds(
              isFastThresholds ? DEFAULT_FRESHNESS_THRESHOLDS : VIVA_FAST_THRESHOLDS
            )
          }
          title="Shortens stale thresholds to 6s / 16s for quick viva demonstration"
        >
          <Timer size={15} />
          <span>
            Stale Timer: {isFastThresholds ? 'Fast (6s/16s)' : 'Standard (30s/120s)'}
          </span>
        </button>
      </div>
    </div>
  );
}
