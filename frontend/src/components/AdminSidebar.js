import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminSidebar = () => {
  const location = useLocation();
  
  return (
    <div className="admin-sidebar">
      <div className="admin-logo">
        <Link to="/admin/dashboard">CodeGrow Admin</Link>
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/admin/dashboard" 
          className={`admin-nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/admin/users" 
          className={`admin-nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
        >
          User Management
        </Link>
        
        <Link 
          to="/admin/pathways" 
          className={`admin-nav-item ${location.pathname.includes('/admin/pathways') ? 'active' : ''}`}
        >
          Learning Pathways
        </Link>
        
        <Link 
          to="/admin/lessons" 
          className={`admin-nav-item ${location.pathname.includes('/admin/lessons') ? 'active' : ''}`}
        >
          Lessons
        </Link>
        
        <Link 
          to="/admin/activity-log" 
          className={`admin-nav-item ${location.pathname === '/admin/activity-log' ? 'active' : ''}`}
        >
          Activity Log
        </Link>
      </nav>
      
      <div className="admin-sidebar-footer">
        <Link to="/dashboard" className="admin-nav-item">
          Back to User Dashboard
        </Link>
        
        <Link to="/logout" className="admin-nav-item">
          Logout
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;