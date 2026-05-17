import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { pingBackend } from './apiConfig';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ResumeUpload from './pages/ResumeUpload';
import Skills from './pages/Skills';
import Recommendations from './pages/Recommendations';
import GitHubTab from './pages/GitHub';
import CareerPathways from './pages/CareerPathways.tsx';
import Profile from './pages/Profile.tsx';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  // Redirect to Landing page if no token is found
  return token ? <>{children}</> : <Navigate to="/" replace />;
};

// ---------------------------------------------------------------------------
// Backend wake-up gate
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 40;   // 40 × 3 s ≈ 2 min — plenty for Render cold starts
const POLL_INTERVAL = 3_000;

const GlobalStartupLoader = ({ children }: { children: React.ReactNode }) => {
  type Phase = 'checking' | 'ready' | 'failed';

  const [phase, setPhase] = useState<Phase>('checking');
  const [attempt, setAttempt] = useState(0);
  const cancelled = useRef(false);

  const startPolling = useCallback(async () => {
    cancelled.current = false;
    setPhase('checking');
    setAttempt(0);

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      if (cancelled.current) return;
      setAttempt(i);

      const alive = await pingBackend();
      if (alive) {
        setPhase('ready');
        return;
      }

      if (i < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
    }

    if (!cancelled.current) setPhase('failed');
  }, []);

  useEffect(() => {
    startPolling();
    return () => {
      cancelled.current = true;
    };
  }, [startPolling]);

  // --- Ready: render the app ---
  if (phase === 'ready') return <>{children}</>;

  // --- Shared styles ---
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%',
    padding: '1.5rem',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#e2e8f0',
  };

  // --- Failed state ---
  if (phase === 'failed') {
    return (
      <div style={containerStyle}>
        {/* Error icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: '2px solid rgba(239,68,68,0.3)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f87171', marginBottom: 12 }}>
          Connection Failed
        </h1>
        <p style={{ maxWidth: 420, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
          The backend server couldn't be reached after {MAX_ATTEMPTS} attempts.
          It may still be spinning up — hit <strong>Retry</strong> to try again.
        </p>

        <button
          onClick={() => startPolling()}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontWeight: 600, fontSize: '0.95rem',
            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)';
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // --- Checking / polling state ---
  const progress = Math.min((attempt / MAX_ATTEMPTS) * 100, 100);

  return (
    <div style={containerStyle}>
      {/* Animated spinner */}
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 32 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'sg-spin 1.2s linear infinite' }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="url(#sg-grad)" strokeWidth="6"
            strokeDasharray="160" strokeDashoffset="120" strokeLinecap="round" />
          <defs>
            <linearGradient id="sg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>
        Waking up the server&hellip;
      </h1>
      <p style={{ maxWidth: 420, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
        The backend runs on Render's free tier and sleeps after inactivity.
        It usually takes 30–60 seconds to spin up.
      </p>

      {/* Progress bar */}
      <div style={{
        width: '100%', maxWidth: 320, height: 6, borderRadius: 3,
        background: 'rgba(99,102,241,0.12)', overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
          width: `${progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
        Attempt {attempt} / {MAX_ATTEMPTS}
      </p>

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes sg-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <GlobalStartupLoader>
      <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* DASHBOARD SYSTEM - Protected by authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="upload" element={<ResumeUpload />} />
          <Route path="skills" element={<Skills />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="github" element={<GitHubTab />} />
          <Route path="pathways" element={<CareerPathways />} />
          <Route path="profile" element={<Profile />} />
          <Route path="courses" element={<Navigate to="/dashboard/github" replace />} />
        </Route>

        {/* CATCH-ALL: Redirect unknown paths to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </GlobalStartupLoader>
  );
}

export default App;