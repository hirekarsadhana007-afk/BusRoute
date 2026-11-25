import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

vi.mock('../src/components/MapView.jsx', () => ({
  MapView: ({ buses = [], stopsToDraw = [] }) => (
    <div data-testid="mock-map">
      Map ({buses.length} buses, {stopsToDraw?.length || 0} stops)
    </div>
  ),
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('RouteTrack pages & flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders StudentDashboard in Demo Mode with Bus 1, Library Junction, and DEMO DATA badge', () => {
    renderAt('/');

    expect(screen.getAllByText('DEMO DATA').length).toBeGreaterThan(0);
    expect(screen.getByText('Select Bus')).toBeInTheDocument();
    expect(screen.getByText('Bus 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Pick your boarding stop (saved automatically)')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('allows injecting delay and pausing GPS in Demo Mode', () => {
    renderAt('/');

    const injectBtn = screen.getByRole('button', { name: /Inject Delay/i });
    fireEvent.click(injectBtn);
    expect(screen.getByRole('button', { name: /Clear Delay/i })).toBeInTheDocument();

    const pauseGpsBtn = screen.getByRole('button', { name: /Pause GPS/i });
    fireEvent.click(pauseGpsBtn);
    expect(screen.getByRole('button', { name: /Resume GPS/i })).toBeInTheDocument();
  });

  it('renders Admin Panel in Demo Mode and validates & adds a bus', () => {
    renderAt('/admin');

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Live Fleet Status')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Buses' }));
    // Submit empty form to trigger validation
    fireEvent.click(screen.getByRole('button', { name: /Add Bus/i }));
    expect(screen.getByText('Bus number is required.')).toBeInTheDocument();
    expect(screen.getByText('Bus name is required.')).toBeInTheDocument();

    // Fill valid bus details
    fireEvent.change(screen.getByLabelText('Bus Name'), { target: { value: 'Bus 10' } });
    fireEvent.change(screen.getByLabelText('Registration Number'), {
      target: { value: 'KA-01-H-4321' },
    });
    fireEvent.change(screen.getByLabelText('Assigned Route'), { target: { value: 'route_a' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Bus/i }));

    expect(screen.getByText('Bus 10')).toBeInTheDocument();
    expect(screen.getByText('KA-01-H-4321')).toBeInTheDocument();
  });

  it('validates schedule times in Admin Schedules tab', () => {
    renderAt('/admin');

    fireEvent.click(screen.getByRole('tab', { name: 'Schedules' }));
    const firstStopInput = screen.getByLabelText(/Schedule time for Manjunath Nagar Cross/i);
    fireEvent.change(firstStopInput, { target: { value: '99:99' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Schedule/i }));

    expect(screen.getByText('Use valid 24-hour HH:mm format.')).toBeInTheDocument();
  });

  it('renders DriverTracker and Login routes cleanly', () => {
    const { unmount } = renderAt('/driver');
    expect(screen.getByText('Driver GPS Tracker')).toBeInTheDocument();
    unmount();

    renderAt('/login');
    expect(screen.getByText('Staff Sign In')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });
});
