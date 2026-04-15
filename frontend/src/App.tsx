import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { warmUpBackend } from './apiConfig';
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

const GlobalStartupLoader = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const success = await warmUpBackend();
      if (!mounted) return;
      if (success) {
        setIsReady(true);
      } else {
        setHasError(true);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  if (hasError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="mb-4 text-3xl font-bold text-red-600">Failed to connect</h1>
        <p className="mb-6 max-w-lg text-gray-600">
          The backend server could not be reached after multiple attempts. It might be down or sleeping. 
          Please try refreshing the page in a minute.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-600"></div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-800">Waking up backend server...</h1>
        <p className="mx-auto max-w-md animate-pulse text-gray-500">
          Because the backend is hosted on a free Render tier, it may take up to 60 seconds to spin up after a period of inactivity.
        </p>
      </div>
    );
  }

  return <>{children}</>;
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