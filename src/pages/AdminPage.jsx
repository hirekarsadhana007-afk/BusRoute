import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDemoMode } from '../context/DemoModeContext.jsx';
import { useBuses } from '../hooks/useBuses.js';
import { AdminLayout } from '../components/Admin/AdminLayout.jsx';

export function AdminPage() {
  const { user, isAdmin, authLoading } = useAuth();
  const { demoMode } = useDemoMode();
  const { buses, raw, loading, error, now } = useBuses();

  if (!demoMode) {
    if (authLoading) {
      return <div className="card empty-state">Checking admin permissions...</div>;
    }

    if (!user) {
      return (
        <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
          <h2 className="card-title" style={{ justifyContent: 'center', marginBottom: '0.6rem' }}>
            Admin Authentication Required
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Sign in with an administrator account to manage buses, routes, stops, and schedules.
          </p>
          <Link to="/login?next=/admin" className="btn btn-primary">
            Sign In as Admin
          </Link>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="card" style={{ maxWidth: '540px', margin: '2rem auto' }}>
          <div className="banner banner-danger" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldAlert size={20} />
              <div>
                <strong>Access denied</strong>
                <div style={{ fontSize: '0.85rem' }}>
                  Account <code>{user.email}</code> is not authorized under <code>/admins/{user.uid}</code>.
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="main-stack">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <ShieldCheck size={20} color="#1D4ED8" />
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Admin Panel</h1>
        </div>
        {demoMode ? (
          <span className="demo-pill">DEMO DATA — changes apply locally in browser</span>
        ) : (
          <span className="badge badge-live">Live Firebase Admin ({user?.email})</span>
        )}
      </div>

      {error && <div className="banner banner-danger">{error}</div>}
      {loading ? (
        <div className="card empty-state">Loading fleet data...</div>
      ) : (
        <AdminLayout buses={buses} raw={raw} now={now} />
      )}
    </div>
  );
}
