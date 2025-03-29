import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';

/**
 * A route wrapper component that ensures only admin users can access
 * the wrapped routes. Redirects non-admin users to the dashboard.
 */
const PrivateAdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect to regular dashboard if user is not an admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // User is authenticated and an admin, allow access
  return children;
};

export default PrivateAdminRoute;