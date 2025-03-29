import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import logo from '../assets/logo.png'; // Adjust path to your logo
import '../styles/AdminDashboard.css';

const AdminSidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: '📊' // Dashboard icon
    },
    {
      title: 'Users',
      path: '/admin/users',
      icon: '👥' // Users icon
    },
    {
      title: 'Learning Pathways',
      path: '/admin/pathways',
      icon: '🛣️' // Road/pathway icon
    },
    {
      title: 'Lessons',
      path: '/admin/lessons',
      icon: '📚' // Book icon
    },
    {
      title: 'Activity Log',
      path: '/admin/activity',
      icon: '📝' // History/log icon
    }
  ];

  return (
    <div className="admin-sidebar-container">
      <div className="admin-sidebar-header">
        <img src={logo} alt="CodeGrow Admin" className="admin-logo" />
        <h2 className="admin-title">CodeGrow</h2>
      </div>

      <div className="admin-profile-section">
        <div className="admin-avatar">
          <div className="admin-avatar-placeholder">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
        <div className="admin-info">
          <div className="admin-name">{user?.username || 'Admin'}</div>
          <div className="admin-role">Administrator</div>
        </div>
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-text">{item.title}</span>
          </Link>
        ))}
      </nav>
      
      <div className="admin-sidebar-footer">
        <button onClick={logout} className="admin-logout-btn">
          <span className="admin-nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;