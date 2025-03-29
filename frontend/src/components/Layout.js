import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/Authcontext';
import '../styles/Layout.css';

const Layout = () => {
  const { isAuthenticated, isAdmin, logout } = useContext(AuthContext);

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-logo">
          <Link to="/">
            <h1>CodeGrow</h1>
          </Link>
        </div>
        
        <nav className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-item">Dashboard</Link>
              <Link to="/pathways" className="nav-item">Learning Pathways</Link>
              <div className="dropdown">
                <button className="dropdown-toggle">Account</button>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">My Profile</Link>
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="dropdown-item">Admin Dashboard</Link>
                  )}
                  <button onClick={logout} className="dropdown-item">Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item">Login</Link>
              <Link to="/register" className="nav-button">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>CodeGrow</h3>
            <p>Learn coding through interactive lessons and exercises.</p>
          </div>
          
          <div className="footer-section">
            <h4>Links</h4>
            <Link to="/">Home</Link>
            <Link to="/pathways">Learning Pathways</Link>
            <Link to="/about">About Us</Link>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>support@codegrow.com</p>
            <p>© {new Date().getFullYear()} CodeGrow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;