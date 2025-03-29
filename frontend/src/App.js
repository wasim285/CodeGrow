import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/Authcontext';

// Import your components with correct filenames
import LoginPage from './Pages/LoginPage';  // Updated from Login to LoginPage
import SignUpPage from './Pages/SignUpPage';  // Changed from RegisterPage to SignUpPage
import Dashboard from './Pages/Dashboard';
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import Navbar from './components/navbar';
import PathwaysPage from './Pages/PathwaysPage';
import LessonPage from './Pages/LessonPage';
import StudyCalendar from './Pages/StudyCalendar';
import ProfilePage from './Pages/ProfilePage';
import AdminUserDetail from './Pages/AdminUserDetail';
import AdminPathways from './Pages/AdminPathways';
import AdminPathwayDetail from './Pages/AdminPathwayDetail';
import AdminLessons from './Pages/AdminLessons';
import AdminLessonDetail from './Pages/AdminLessonDetail';
import AdminActivityLog from './Pages/AdminActivityLog';
import TreeLoader from './components/TreeLoader';

// Protected route component for admin access
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    console.log("Access denied: User is not an admin");
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Protected route component for any authenticated user
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} /> {/* Updated path */}
      <Route path="/register" element={<SignUpPage />} /> {/* Updated element name */}
      <Route path="/" element={<Navigate to="/pathways" replace />} /> {/* Updated default route */}
      <Route path="/pathways" element={<PathwaysPage />} />

      {/* Protected routes for all authenticated users */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/lesson/:lessonId" element={
        <ProtectedRoute>
          <LessonPage />
        </ProtectedRoute>
      } />
      <Route path="/study-sessions" element={
        <ProtectedRoute>
          <StudyCalendar />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminUsers />
        </AdminRoute>
      } />
      <Route path="/admin/users/:id" element={
        <AdminRoute>
          <AdminUserDetail />
        </AdminRoute>
      } />
      <Route path="/admin/pathways" element={
        <AdminRoute>
          <AdminPathways />
        </AdminRoute>
      } />
      <Route path="/admin/pathways/:id" element={
        <AdminRoute>
          <AdminPathwayDetail />
        </AdminRoute>
      } />
      <Route path="/admin/lessons" element={
        <AdminRoute>
          <AdminLessons />
        </AdminRoute>
      } />
      <Route path="/admin/lessons/:id" element={
        <AdminRoute>
          <AdminLessonDetail />
        </AdminRoute>
      } />
      <Route path="/admin/activity" element={
        <AdminRoute>
          <AdminActivityLog />
        </AdminRoute>
      } />

      {/* Default route */}
      <Route path="*" element={<Navigate to="/pathways" replace />} /> {/* Updated default route */}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
