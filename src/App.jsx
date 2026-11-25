import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { DemoModeProvider } from './context/DemoModeContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { StudentDashboard } from './pages/StudentDashboard.jsx';
import { LiveTrackPage } from './pages/LiveTrackPage.jsx';
import { DriverTracker } from './pages/DriverTracker.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { Login } from './pages/Login.jsx';

export function App() {
  return (
    <AuthProvider>
      <DemoModeProvider>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/track" element={<LiveTrackPage />} />
              <Route path="/driver" element={<DriverTracker />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </DemoModeProvider>
    </AuthProvider>
  );
}

export default App;
