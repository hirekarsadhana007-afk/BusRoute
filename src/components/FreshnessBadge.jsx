import { FRESHNESS_STATES, formatLastUpdated, formatTimeAgo } from '../utils/freshness.js';
import { Radio, Clock, AlertTriangle } from 'lucide-react';

export function FreshnessBadge({ freshness, timestamp, now, showLastUpdated = true }) {
  const state = freshness?.state || FRESHNESS_STATES.UNAVAILABLE;

  let badgeClass = 'badge badge-unavailable';
  let dotClass = 'dot dot-unavailable';
  let Icon = AlertTriangle;

  if (state === FRESHNESS_STATES.LIVE) {
    badgeClass = 'badge badge-live';
    dotClass = 'dot dot-live';
    Icon = Radio;
  } else if (state === FRESHNESS_STATES.DELAYED) {
    badgeClass = 'badge badge-delayed';
    dotClass = 'dot dot-delayed';
    Icon = Clock;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
      <span className={badgeClass} title={freshness?.message}>
        <span className={dotClass} />
        <Icon size={13} />
        <span>{freshness?.label || 'Unavailable'}</span>
      </span>
      {showLastUpdated && (
        <span className="tabular" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Updated: <strong>{formatLastUpdated(timestamp)}</strong> ({formatTimeAgo(timestamp, now)})
        </span>
      )}
    </div>
  );
}
