import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import logo from '../assets/logo.png'; // Adjust path to your logo
import '../styles/AdminDashboard.css';

// Import icons
import { 
  FaTachometerAlt, FaUsers, FaBookOpen, FaRoad,
  FaHistory, FaSignOutAlt, FaUserCircle
} from 'react-icons/fa';

const AdminSidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: <FaTachometerAlt className="sidebar-icon" />
    },
    {
      title: 'Users',
      path: '/admin/users',
      icon: <FaUsers className="sidebar-icon" />
    },
    {
      title: 'Learning Pathways',
      path: '/admin/pathways',
      icon: <FaRoad className="sidebar-icon" />
    },
    {
      title: 'Lessons',
      path: '/admin/lessons',
      icon: <FaBookOpen className="sidebar-icon" />
    },
    {
      title: 'Activity Log',
      path: '/admin/activity',
      icon: <FaHistory className="sidebar-icon" />
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
          <FaUserCircle size={40} />
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
            {item.icon}
            <span className="admin-nav-text">{item.title}</span>
          </Link>
        ))}
      </nav>
      
      <div className="admin-sidebar-footer">
        <button onClick={logout} className="admin-logout-btn">
          <FaSignOutAlt className="sidebar-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;