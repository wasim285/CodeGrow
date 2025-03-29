import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../utils/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(() => {
        setUser(null);
        setToken("");
        setIsAdmin(false);
        localStorage.removeItem("token");
        navigate("/");
    }, [navigate]);

    useEffect(() => {
        if (token) {
            setLoading(true);
            getProfile(token)
                .then((res) => {
                    setUser(res.data);
                    // Check if user has admin role
                    if (res.data && res.data.role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                    setLoading(false);
                })
                .catch(() => {
                    logout();
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token, logout]);

    const login = (userToken, userData) => {
        setToken(userToken);
        localStorage.setItem("token", userToken);
        
        // If userData is provided at login, set user state and check role
        if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === "admin");
            // Direct admins to admin dashboard, regular users to pathways
            if (userData.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/pathways");
            }
        } else {
            // Default behavior if no userData
            navigate("/pathways");
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            isAdmin,
            loading,
            setUser  // Allow updating user object
        }}>
            {children}
        </AuthContext.Provider>
    );
};
