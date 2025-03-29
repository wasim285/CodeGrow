import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';

// Component to protect routes that require authentication
const PrivateRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  
  // While checking authentication status, show nothing or a loading spinner
  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;
  }
  
  // For admin routes, check both authentication and admin status
  if (adminOnly) {
    return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" />;
  }
  
  // For regular private routes, just check authentication
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;