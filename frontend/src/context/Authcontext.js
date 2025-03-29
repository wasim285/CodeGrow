import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get('accounts/profile/');
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.log('No active session found');
        setUser(null);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('accounts/login/', credentials);
      setUser(response.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      setLoading(false);
      return { success: false, error: err.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('accounts/register/', userData);
      setUser(response.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.email?.[0] ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post('accounts/logout/');
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
