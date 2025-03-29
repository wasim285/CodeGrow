import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/AdminSidebar.css';

const AdminSidebar = ({ activePage }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (activePage) {
      return activePage === path;
    }
    return currentPath.includes(`/admin/${path}`);
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>CodeGrow Admin</h2>
      </div>
      
      <nav className="admin-nav">
        <ul>
          <li>
            <Link to="/admin/dashboard" className={isActive('dashboard') ? 'active' : ''}>
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/users" className={isActive('users') ? 'active' : ''}>
              <i className="fas fa-users"></i>
              <span>Users</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/pathways" className={isActive('pathways') ? 'active' : ''}>
              <i className="fas fa-route"></i>
              <span>Learning Pathways</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/lessons" className={isActive('lessons') ? 'active' : ''}>
              <i className="fas fa-book"></i>
              <span>Lessons</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/exercises" className={isActive('exercises') ? 'active' : ''}>
              <i className="fas fa-code"></i>
              <span>Exercises</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/activity-log" className={isActive('activity-log') ? 'active' : ''}>
              <i className="fas fa-history"></i>
              <span>Activity Log</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/reports" className={isActive('reports') ? 'active' : ''}>
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/settings" className={isActive('settings') ? 'active' : ''}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="admin-sidebar-footer">
        <Link to="/dashboard" className="admin-exit-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Exit Admin</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;