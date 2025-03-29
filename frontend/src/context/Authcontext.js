import { createContext, useState, useEffect } from 'react';
import { getProfile } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token on component mount
        const token = localStorage.getItem('token');
        const checkAuth = async () => {
            if (token) {
                try {
                    const res = await getProfile(token);
                    if (res.status === 200) {
                        const user = res.data;
                        setUserData(user);
                        setIsAuthenticated(true);
                        
                        // Set admin status based on role, is_staff or is_superuser
                        const adminStatus = user.role === 'admin' || user.is_staff || user.is_superuser;
                        setIsAdmin(adminStatus);
                        console.log(`User authenticated: ${user.username}, Admin: ${adminStatus}`);
                    } else {
                        handleLogout();
                    }
                } catch (err) {
                    console.error("Auth verification error:", err);
                    handleLogout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (token, userDetails = null) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        
        // If user details are provided during login, update them immediately
        if (userDetails) {
            setUserData(userDetails);
            const adminStatus = 
                userDetails.role === 'admin' || 
                userDetails.is_staff || 
                userDetails.is_superuser;
            setIsAdmin(adminStatus);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserData(null);
        setIsAdmin(false);
    };

    // Make additional request to get full user profile after authentication
    const updateUserProfile = async () => {
        const token = localStorage.getItem('token');
        if (token && isAuthenticated) {
            try {
                const res = await getProfile(token);
                if (res.status === 200) {
                    setUserData(res.data);
                    const adminStatus = 
                        res.data.role === 'admin' || 
                        res.data.is_staff || 
                        res.data.is_superuser;
                    setIsAdmin(adminStatus);
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        }
    };

    // Context value
    const contextValue = {
        isAuthenticated,
        isAdmin,
        user: userData,
        loading,
        login,
        logout: handleLogout,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
