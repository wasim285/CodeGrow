import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import { loginUser } from "../utils/api";
import "../styles/LoginPage.css";

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await loginUser(formData);

            if (response.status === 200) {
                const data = response.data;
                login(data.token);
                localStorage.setItem("token", data.token);
                navigate("/pathways");
            } else {
                // Handle specific error cases
                if (response.data?.non_field_errors) {
                    setErrors({ general: response.data.non_field_errors[0] });
                } else if (response.data?.username) {
                    setErrors({ username: response.data.username[0] });
                } else if (response.data?.password) {
                    setErrors({ password: response.data.password[0] });
                } else {
                    setErrors({ general: "Invalid credentials. Please check your username and password." });
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (error.response?.status === 401) {
                setErrors({ general: "Invalid username or password." });
            } else if (error.response?.status === 429) {
                setErrors({ general: "Too many login attempts. Please try again later." });
            } else if (!navigator.onLine) {
                setErrors({ general: "No internet connection. Please check your network." });
            } else {
                setErrors({ general: "Unable to connect to server. Please try again later." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <nav className="auth-navbar">
                <a href="/" className="navbar-logo">CodeGrow</a>
            </nav>

            <div className="login-container">
                <div className="login-box">
                    <h2>Login to CodeGrow</h2>

                    {errors.general && (
                        <div className="error-message general">{errors.general}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="username" 
                                placeholder="Username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                className={errors.username ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <span className="error-message">{errors.username}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="Password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className={errors.password ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <p>Don't have an account? <Link to="/register">Sign up here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
