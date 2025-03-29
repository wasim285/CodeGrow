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
import Profile from './Pages/ProfilePage';
import Pathways from './Pages/PathwaysPage';
import Lesson from './Pages/LessonPage';sonPage';

// Admin pages
import AdminDashboard from './Pages/AdminDashboard';import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';ers from './Pages/AdminUsers';
import AdminUserDetail from './Pages/AdminUserDetail';';
import AdminUserForm from './Pages/AdminUserForm';Form';
import AdminPathways from './Pages/AdminPathways';
import AdminPathwayDetail from './Pages/AdminPathwayDetail';ayDetail';
import AdminPathwayForm from './Pages/AdminPathwayForm';Form';
import AdminLessons from './Pages/AdminLessons';
import AdminLessonDetail from './Pages/AdminLessonDetail';';
import AdminLessonForm from './Pages/AdminLessonForm';Form';

import './App.css';

function App() {
  return (  return (
    <AuthProvider>r>
      <Router>ter>
        <Routes>
          {/* Public routes (with regular layout) */}Public routes (with regular layout) */}
          <Route element={<Layout />}> element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />nt={<LoginPage />} />
            {/* Register path removed since you already have a signup page */}dy have a signup page */}
          </Route>
          
          {/* Protected routes (with regular layout) */}ected routes (with regular layout) */}
          <Route element={<PrivateRoute />}><Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />nt={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />ment={<Profile />} />
              <Route path="/pathways" element={<Pathways />} />
              <Route path="/lessons/:id" element={<Lesson />} /> />
            </Route>
          </Route>
          
          {/* Admin routes (with admin layout) */}routes (with admin layout) */}
          <Route element={<PrivateRoute adminOnly={true} />}>lement={<PrivateRoute adminOnly={true} />}>
            <Route element={<AdminLayout />}>  <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />nt={<AdminDashboard />} />
              
              {/* User management */}
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/new" element={<AdminUserForm />} /><Route path="/admin/users/new" element={<AdminUserForm />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />rs/:id" element={<AdminUserDetail />} />
              <Route path="/admin/users/:id/edit" element={<AdminUserForm />} />rForm />} />
              
              {/* Pathway management */}
              <Route path="/admin/pathways" element={<AdminPathways />} />
              <Route path="/admin/pathways/new" element={<AdminPathwayForm />} /><Route path="/admin/pathways/new" element={<AdminPathwayForm />} />
              <Route path="/admin/pathways/:id" element={<AdminPathwayDetail />} />ys/:id" element={<AdminPathwayDetail />} />
              <Route path="/admin/pathways/:id/edit" element={<AdminPathwayForm />} />yForm />} />
              
              {/* Lesson management */}
              <Route path="/admin/lessons" element={<AdminLessons />} />
              <Route path="/admin/lessons/new" element={<AdminLessonForm />} /><Route path="/admin/lessons/new" element={<AdminLessonForm />} />
              <Route path="/admin/lessons/:id" element={<AdminLessonDetail />} />ns/:id" element={<AdminLessonDetail />} />
              <Route path="/admin/lessons/:id/edit" element={<AdminLessonForm />} />nForm />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>>
  );
}

export default App;p;
