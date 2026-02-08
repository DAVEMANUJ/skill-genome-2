import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
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
  );
}

export default App;