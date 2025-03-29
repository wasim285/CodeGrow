import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../utils/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const navigate = useNavigate();

    const logout = useCallback(() => {
        setUser(null);
        setToken("");
        localStorage.removeItem("token");
        navigate("/");
    }, [navigate]);

    useEffect(() => {
        if (token) {
            getProfile(token)
                .then((res) => setUser(res.data))
                .catch(() => logout());
        }
    }, [token, logout]);

    const login = (userToken) => {
        setToken(userToken);
        localStorage.setItem("token", userToken);
        navigate("/pathways");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
