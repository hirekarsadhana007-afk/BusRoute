import { NavLink } from 'react-router-dom';
import {
  Bus,
  Home,
  Compass,
  Navigation,
  ShieldCheck,
  LogIn,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/track', label: 'Track', Icon: Compass, end: false },
  { to: '/driver', label: 'Driver', Icon: Navigation, end: false },
  { to: '/admin', label: 'Admin', Icon: ShieldCheck, end: false },
];

export function Navbar() {
  const { demoMode, toggleDemoMode } = useDemoMode();
  const { user, logout } = useAuth();

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-icon">
              <Bus size={20} />
            </span>
            <div>
              <span className="brand-title">RouteTrack</span>
              <span className="brand-sub">KLS VDIT, Haliyal</span>
            </div>
          </NavLink>

          <nav className="app-nav-dock" aria-label="Primary navigation">
            {NAV_ITEMS.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="app-nav-icon">
                  <Icon size={18} />
                </span>
                <span className="app-nav-label">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            {demoMode && (
              <span className="demo-pill">
                <FlaskConical size={13} />
                <span>DEMO DATA</span>
              </span>
            )}

            <button
              type="button"
              className={`switch-btn ${demoMode ? 'on' : ''}`}
              onClick={() => toggleDemoMode()}
              aria-pressed={demoMode}
            >
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              <span>Demo Mode: {demoMode ? 'ON' : 'OFF'}</span>
            </button>

            {!demoMode &&
              (user ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              ) : (
                <NavLink to="/login" className="btn btn-secondary btn-sm">
                  <LogIn size={15} />
                  <span>Sign in</span>
                </NavLink>
              ))}
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-dock" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-dock-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
