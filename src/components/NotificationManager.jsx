import { Bell, BellOff, X } from 'lucide-react';

export function NotificationManager({
  permission,
  onRequestPermission,
  toasts = [],
  onDismissToast,
}) {
  return (
    <>
      {permission === 'default' && (
        <div className="banner banner-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={18} />
            <span>
              Enable browser notifications to get approaching-bus and significant-delay alerts.
            </span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onRequestPermission}>
            Allow Notifications
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="banner banner-warning" style={{ padding: '0.55rem 0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <BellOff size={16} />
            <span>
              Browser notifications are blocked — in-app toast alerts remain active.
            </span>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.severity || 'info'}`}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismissToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: 'var(--color-text-muted)',
                  minWidth: '32px',
                  minHeight: '32px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
