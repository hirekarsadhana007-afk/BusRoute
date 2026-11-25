import { Clock, MapPin } from 'lucide-react';
import { formatClockTime, formatDistance, formatEtaMinutes } from '../utils/eta.js';
import { FRESHNESS_STATES } from '../utils/freshness.js';

export function EtaCard({ stopEntry, index, isSelected, freshnessState, onSelect }) {
  const { stop, scheduled, eta, delay } = stopEntry;
  const isUnavailable = freshnessState === FRESHNESS_STATES.UNAVAILABLE;
  const isDeparted = eta?.status === 'departed';

  let etaMain = 'Unknown';
  let clockStr = '--:--';

  if (isUnavailable) {
    etaMain = 'Unknown';
  } else if (isDeparted) {
    etaMain = 'Departed';
  } else if (eta?.status === 'ok') {
    etaMain = formatEtaMinutes(eta.etaMinutes);
    clockStr = formatClockTime(eta.etaMs);
  }

  let delayPill = null;
  if (!isUnavailable && !isDeparted && delay?.status === 'delayed') {
    delayPill = <span className="badge badge-delayed">{delay.label}</span>;
  } else if (!isUnavailable && !isDeparted && delay?.status === 'ahead') {
    delayPill = <span className="badge badge-primary">{delay.label}</span>;
  } else if (!isUnavailable && !isDeparted && delay?.status === 'on_time') {
    delayPill = <span className="badge badge-live">On time</span>;
  }

  return (
    <div
      className={`eta-card ${isSelected ? 'highlighted' : ''} ${isDeparted ? 'departed' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: isSelected ? 'var(--color-primary)' : 'var(--color-bg)',
              color: isSelected ? '#fff' : 'var(--color-text-secondary)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <span>{stop.name}</span>
        </span>
        {isSelected && (
          <span className="badge badge-primary">
            <MapPin size={11} />
            <span>My Stop</span>
          </span>
        )}
      </div>

      <div
        className="tabular"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.25rem 0',
        }}
      >
        <span
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: isUnavailable || isDeparted ? 'var(--color-text-muted)' : 'var(--color-primary)',
          }}
        >
          {etaMain}
        </span>
        {!isUnavailable && !isDeparted && eta?.status === 'ok' && (
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} color="#64748B" />
            <span>{clockStr}</span>
          </span>
        )}
      </div>

      <div
        className="tabular"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
          gap: '0.35rem',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.45rem',
        }}
      >
        <span>Sched: <strong>{scheduled || '--:--'}</strong></span>
        {!isUnavailable && !isDeparted && eta?.remainingDistance != null && (
          <span>{formatDistance(eta.remainingDistance)} away</span>
        )}
      </div>

      {delayPill && <div>{delayPill}</div>}
    </div>
  );
}
