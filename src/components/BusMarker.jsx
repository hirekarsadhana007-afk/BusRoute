import L from 'leaflet';
import { FRESHNESS_STATES, formatLastUpdated } from '../utils/freshness.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createBusIcon(bus) {
  const state = bus.freshness?.state || FRESHNESS_STATES.UNAVAILABLE;
  const shortLabel = bus.name.replace(/^Bus\s+/i, 'B');
  return L.divIcon({
    className: '',
    html: `<div class="rt-bus-pin ${state}" style="width:36px;height:36px;">${escapeHtml(
      shortLabel.slice(0, 4)
    )}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export function createBusPopupHtml(bus) {
  const state = bus.freshness?.state || FRESHNESS_STATES.UNAVAILABLE;
  const isUnavailable = state === FRESHNESS_STATES.UNAVAILABLE;
  const speedKmh =
    bus.location?.speed != null ? `${(bus.location.speed * 3.6).toFixed(1)} km/h` : '--';

  return `
    <div style="min-width:190px;font-family:Inter,sans-serif;font-size:13px;">
      <div style="font-weight:700;color:#111827;margin-bottom:2px;">
        ${escapeHtml(bus.name)} (${escapeHtml(bus.number)})
      </div>
      <div style="color:#4B5563;margin-bottom:6px;">
        ${escapeHtml(bus.route?.name || 'Unassigned route')}
      </div>
      <div style="margin-bottom:4px;">
        <strong>Status:</strong> ${
          isUnavailable ? 'Last known (Location data is outdated)' : escapeHtml(bus.freshness?.label)
        }
      </div>
      <div><strong>Last updated:</strong> ${escapeHtml(formatLastUpdated(bus.location?.timestamp))}</div>
      ${!isUnavailable ? `<div><strong>Speed:</strong> ${escapeHtml(speedKmh)}</div>` : ''}
      ${bus.location?.simulated ? '<div style="margin-top:4px;font-size:11px;font-weight:700;color:#92400E;">DEMO DATA</div>' : ''}
    </div>
  `;
}

export function createStopIcon(index, isSelected) {
  return L.divIcon({
    className: '',
    html: `<div class="rt-stop-pin ${isSelected ? 'selected' : ''}" style="width:24px;height:24px;">${
      index + 1
    }</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}
