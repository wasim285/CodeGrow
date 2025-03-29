import { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch user profile using token
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("profile/");
        
        if (response.status === 200) {
          const userData = response.data;
          setUser(userData);
          setIsAuthenticated(true);
          
          // Check if user is admin based on their role or permissions
          const adminStatus = 
            userData.role === 'admin' || 
            userData.is_staff || 
            userData.is_superuser;
          
          setIsAdmin(adminStatus);
          console.log(`Auth verified: ${userData.username}, Admin: ${adminStatus}`);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // Clear token if invalid
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const login = (token, userData = null) => {
    localStorage.setItem("token", token);
    
    // If we received user data with login response, use it
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      
      // Set admin status based on userData
      const adminStatus = 
        userData.role === 'admin' || 
        userData.is_staff || 
        userData.is_superuser;
      
      setIsAdmin(adminStatus);
      console.log(`User logged in: ${userData.username}, Admin: ${adminStatus}`);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
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
