import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/Authcontext';

// Import your components
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import Navbar from './components/navbar';
import HomePage from './Pages/HomePage';
import PathwaysPage from './Pages/PathwaysPage';
import DifficultyPage from './Pages/DifficultyPage';
import LessonPage from './Pages/LessonPage';
import StudyCalendar from './Pages/StudyCalendar';
import LessonsPage from './Pages/LessonsPage';
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/pathways" element={<PathwaysPage />} />
      <Route path="/difficulty" element={<DifficultyPage />} />

      {/* Protected routes for all authenticated users */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/lessons" element={
        <ProtectedRoute>
          <LessonsPage />
        </ProtectedRoute>
      } />
      <Route path="/lessons/:lessonId" element={
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

      {/* Default route - redirect based on authentication */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
