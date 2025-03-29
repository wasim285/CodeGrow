import { createContext, useState, useEffect } from "react";
import api, { getProfile } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set token expiry check (checking every minute)
  useEffect(() => {
    let tokenCheckInterval;
    
    if (isAuthenticated) {
      tokenCheckInterval = setInterval(() => {
        checkTokenExpiry();
      }, 60000); // Check once per minute
    }
    
    return () => {
      if (tokenCheckInterval) clearInterval(tokenCheckInterval);
    };
  }, [isAuthenticated]);
  
  const checkTokenExpiry = async () => {
    const tokenTimestamp = localStorage.getItem('tokenTimestamp');
    if (!tokenTimestamp) return;
    
    // If token is older than 1 hour, refresh it
    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    if (tokenAge > 3600000) { // 1 hour in milliseconds
      try {
        console.log('Token is old, refreshing...');
        const response = await api.post('token/refresh/');
        if (response.status === 200) {
          // Update token in localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('tokenTimestamp', Date.now().toString());
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        if (error.response && error.response.status === 401) {
          // Token is invalid, logout
          logout();
        }
      }
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getProfile();
        
        if (response && response.data) {
          const userData = response.data;
          setUser(userData);
          setIsAuthenticated(true);
          
          // Determine admin status
          const adminStatus = 
            userData.role === 'admin' || 
            userData.is_staff || 
            userData.is_superuser;
          
          setIsAdmin(adminStatus);
          console.log(`User authenticated: ${userData.username}, Admin: ${adminStatus}`);
          
          // Set timestamp for token refresh logic if not already set
          if (!localStorage.getItem('tokenTimestamp')) {
            localStorage.setItem('tokenTimestamp', Date.now().toString());
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // Don't clear token here - let the interceptor handle 401 errors
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (token, userData = null) => {
    localStorage.setItem("token", token);
    localStorage.setItem('tokenTimestamp', Date.now().toString());
    
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      
      const adminStatus = 
        userData.role === 'admin' || 
        userData.is_staff || 
        userData.is_superuser;
      
      setIsAdmin(adminStatus);
      console.log(`User logged in: ${userData.username}, Admin: ${adminStatus}`);
    }
  };

  const logout = () => {
    // Try to call logout API first
    api.post('logout/').catch(err => {
      console.log('Logout API call failed, continuing with local logout');
    }).finally(() => {
      // Always clear local storage and state
      localStorage.removeItem("token");
      localStorage.removeItem("tokenTimestamp");
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      // Redirect to login
      window.location.href = '/login';
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
