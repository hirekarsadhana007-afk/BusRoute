import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { FRESHNESS_STATES, formatLastUpdated } from '../utils/freshness.js';

export function DelayBanner({ bus, stopEntry, now }) {
  if (!bus) return null;

  if (bus.freshness?.state === FRESHNESS_STATES.UNAVAILABLE) {
    return (
      <div className="banner banner-warning" role="alert">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Location data is outdated</strong>
            <div style={{ fontSize: '0.85rem' }}>
              Last GPS signal from {bus.name} ({bus.number}) was at{' '}
              {formatLastUpdated(bus.location?.timestamp)}. ETAs are marked unavailable.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bus.freshness?.state === FRESHNESS_STATES.DELAYED) {
    return (
      <div className="banner banner-warning" role="status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={20} />
          <div>
            <strong>Signal delayed</strong> — GPS updates are arriving slowly (last update{' '}
            {formatLastUpdated(bus.location?.timestamp)}).
          </div>
        </div>
      </div>
    );
  }

  if (bus.projection?.offRoute) {
    return (
      <div className="banner banner-warning" role="status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Off-route detected</strong> — {bus.name} is more than 200 m from its assigned
            route. ETA uses straight-line distance.
          </div>
        </div>
      </div>
    );
  }

  const delay = stopEntry?.delay;
  if (delay?.status === 'delayed') {
    return (
      <div className="banner banner-danger" role="alert">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>{delay.label}</strong> — {bus.name} is running behind schedule for{' '}
            <strong>{stopEntry.stop?.name}</strong> (scheduled {stopEntry.scheduled}).
          </div>
        </div>
      </div>
    );
  }

  if (delay?.status === 'ahead') {
    return (
      <div className="banner banner-info" role="status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={20} />
          <div>
            <strong>{delay.label}</strong> — {bus.name} is arriving earlier than scheduled for{' '}
            <strong>{stopEntry.stop?.name}</strong>.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
