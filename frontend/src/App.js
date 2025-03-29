import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';

// Standard pages - fixing imports to match your file structure
import LoginPage from './Pages/LoginPage';
import HomePage from './Pages/HomePage';
import Dashboard from './Pages/Dashboard';
import Profile from './Pages/ProfilePage'; // Changed to match your file structure
import Pathways from './Pages/PathwaysPage'; // Changed to match your file structure
import Lesson from './Pages/LessonPage'; // Changed to match your file structure

// Admin pages
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

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes (with regular layout) */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Register path removed since you already have a signup page */}
          </Route>
          
          {/* Protected routes (with regular layout) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/pathways" element={<Pathways />} />
              <Route path="/pathways/:id" element={<PathwayDetail />} />
              <Route path="/lessons/:id" element={<Lesson />} />
            </Route>
          </Route>
          
          {/* Admin routes (with admin layout) */}
          <Route element={<PrivateRoute adminOnly={true} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              
              {/* User management */}
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/new" element={<AdminUserForm />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/users/:id/edit" element={<AdminUserForm />} />
              
              {/* Pathway management */}
              <Route path="/admin/pathways" element={<AdminPathways />} />
              <Route path="/admin/pathways/new" element={<AdminPathwayForm />} />
              <Route path="/admin/pathways/:id" element={<AdminPathwayDetail />} />
              <Route path="/admin/pathways/:id/edit" element={<AdminPathwayForm />} />
              
              {/* Lesson management */}
              <Route path="/admin/lessons" element={<AdminLessons />} />
              <Route path="/admin/lessons/new" element={<AdminLessonForm />} />
              <Route path="/admin/lessons/:id" element={<AdminLessonDetail />} />
              <Route path="/admin/lessons/:id/edit" element={<AdminLessonForm />} />
            </Route>
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
