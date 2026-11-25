import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { login, isFirebaseConfigured, authError, setAuthError } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get('next') || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setAuthError('');

    const nextFieldErrors = {};
    if (!email.trim()) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!email.includes('@')) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextFieldErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextFieldErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(nextPath);
    } catch (err) {
      setFormError(err?.message || 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: '440px', margin: '2.5rem auto', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--color-primary-tint)',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.65rem',
          }}
        >
          <ShieldCheck size={24} />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Staff Sign In</h1>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
          Sign in with your RouteTrack Driver or Admin account
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="banner banner-warning" style={{ marginBottom: '1rem' }}>
          <span>
            Firebase credentials are not configured in <code>.env</code>. You can enable{' '}
            <strong>Demo Mode</strong> in the top bar without signing in.
          </span>
        </div>
      )}

      {(formError || authError) && (
        <div className="banner banner-danger" role="alert" style={{ marginBottom: '1rem' }}>
          <span>{formError || authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@college.edu"
            autoComplete="email"
          />
          {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          <LogIn size={16} />
          <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
        </button>
      </form>
    </div>
  );
}
