import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';

// Standard pages - use proper casing based on your actual files
import LoginPage from './Pages/LoginPage';
import HomePage from './Pages/HomePage';
import Dashboard from './Pages/Dashboard'; // Changed from DashboardPage
import Profile from './Pages/Profile'; // Changed from ProfilePage
import Pathways from './Pages/Pathways'; // Changed from PathwaysPage
import PathwayDetail from './Pages/PathwayDetail'; // Changed from PathwayDetailPage
import Lesson from './Pages/Lesson'; // Changed from LessonPage
import NotFound from './Pages/NotFound'; // Changed from NotFoundPage

// Admin pages - these look correct based on your imports
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

import './styles/App.css';

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
              <Route path="/dashboard" element={<Dashboard />} /> {/* Changed */}
              <Route path="/profile" element={<Profile />} /> {/* Changed */}
              <Route path="/pathways" element={<Pathways />} /> {/* Changed */}
              <Route path="/pathways/:id" element={<PathwayDetail />} /> {/* Changed */}
              <Route path="/lessons/:id" element={<Lesson />} /> {/* Changed */}
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
          <Route path="*" element={<NotFound />} /> {/* Changed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
