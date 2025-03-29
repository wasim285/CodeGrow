import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/Authcontext';
import '../styles/AdminDashboard.css';

// Simple SVG Icons as components (no external dependencies)
const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Pathways: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15"></line>
      <circle cx="18" cy="6" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle>
      <path d="M18 9a9 9 0 0 1-9 9"></path>
    </svg>
  ),
  Lessons: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  )
};

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };
  
  return (
    <div className="admin-sidebar">
      <div className="admin-logo">
        <Link to="/admin/dashboard">
          <h2>CodeGrow Admin</h2>
        </Link>
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/admin/dashboard" 
          className={`admin-nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
        >
          <span className="admin-nav-icon"><Icons.Dashboard /></span>
          <span>Dashboard</span>
        </Link>
        
        <Link 
          to="/admin/users" 
          className={`admin-nav-item ${location.pathname.includes('/admin/users') ? 'active' : ''}`}
        >
          <span className="admin-nav-icon"><Icons.Users /></span>
          <span>User Management</span>
        </Link>
        
        <Link 
          to="/admin/pathways" 
          className={`admin-nav-item ${location.pathname.includes('/admin/pathways') ? 'active' : ''}`}
        >
          <span className="admin-nav-icon"><Icons.Pathways /></span>
          <span>Learning Pathways</span>
        </Link>
        
        <Link 
          to="/admin/lessons" 
          className={`admin-nav-item ${location.pathname.includes('/admin/lessons') ? 'active' : ''}`}
        >
          <span className="admin-nav-icon"><Icons.Lessons /></span>
          <span>Lesson Management</span>
        </Link>
        
        <Link 
          to="/admin/activity-log" 
          className={`admin-nav-item ${location.pathname.includes('/admin/activity-log') ? 'active' : ''}`}
        >
          <span className="admin-nav-icon"><Icons.Activity /></span>
          <span>Activity Log</span>
        </Link>
      </nav>
      
      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="admin-logout-button">
          <span className="admin-nav-icon"><Icons.Logout /></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;