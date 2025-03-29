import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import AdminLayout from './components/AdminLayout';

// User Pages
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import DashboardPage from './Pages/DashboardPage';
import PathwaysPage from './Pages/PathwaysPage';
import LessonPage from './Pages/LessonPage';
import ProfilePage from './Pages/ProfilePage';

// Admin Pages
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import AdminUserDetail from './Pages/AdminUserDetail';
import AdminUserForm from './Pages/AdminUserForm';
import AdminPathways from './Pages/AdminPathways';
import AdminPathwayDetail from './Pages/AdminPathwayDetail';
import AdminPathwayForm from './Pages/AdminPathwayForm';
import AdminLessons from './Pages/AdminLessons';
import AdminLessonDetail from './Pages/AdminLessonDetail';
import AdminLessonForm from './Pages/AdminLessonForm';
import AdminActivityLog from './Pages/AdminActivityLog';

import PrivateRoute from './components/PrivateRoute';
import NotFoundPage from './Pages/NotFoundPage';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected user routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/pathways" element={<PrivateRoute><PathwaysPage /></PrivateRoute>} />
          <Route path="/lessons/:id" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          
          {/* Admin routes with AdminLayout */}
          <Route path="/admin/dashboard" element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          } />
          
          {/* Admin User Management */}
          <Route path="/admin/users" element={
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          } />
          <Route path="/admin/users/new" element={
            <AdminLayout>
              <AdminUserForm />
            </AdminLayout>
          } />
          <Route path="/admin/users/:id" element={
            <AdminLayout>
              <AdminUserDetail />
            </AdminLayout>
          } />
          <Route path="/admin/users/:id/edit" element={
            <AdminLayout>
              <AdminUserForm isEdit={true} />
            </AdminLayout>
          } />
          
          {/* Admin Pathway Management */}
          <Route path="/admin/pathways" element={
            <AdminLayout>
              <AdminPathways />
            </AdminLayout>
          } />
          <Route path="/admin/pathways/new" element={
            <AdminLayout>
              <AdminPathwayForm />
            </AdminLayout>
          } />
          <Route path="/admin/pathways/:id" element={
            <AdminLayout>
              <AdminPathwayDetail />
            </AdminLayout>
          } />
          <Route path="/admin/pathways/:id/edit" element={
            <AdminLayout>
              <AdminPathwayForm isEdit={true} />
            </AdminLayout>
          } />
          
          {/* Admin Lesson Management */}
          <Route path="/admin/lessons" element={
            <AdminLayout>
              <AdminLessons />
            </AdminLayout>
          } />
          <Route path="/admin/lessons/new" element={
            <AdminLayout>
              <AdminLessonForm />
            </AdminLayout>
          } />
          <Route path="/admin/lessons/:id" element={
            <AdminLayout>
              <AdminLessonDetail />
            </AdminLayout>
          } />
          <Route path="/admin/lessons/:id/edit" element={
            <AdminLayout>
              <AdminLessonForm isEdit={true} />
            </AdminLayout>
          } />
          
          {/* Admin Activity Log */}
          <Route path="/admin/activity-log" element={
            <AdminLayout>
              <AdminActivityLog />
            </AdminLayout>
          } />
          
          {/* 404 and redirect */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
