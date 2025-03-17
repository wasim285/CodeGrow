import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/SignUpPage.css";

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '', // Added second password field for backend validation
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters long';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('https://codegrow.onrender.com/api/accounts/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    password2: formData.password, // Send password2 to match backend requirements
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle API error responses
                if (data.username) {
                    setErrors(prev => ({ ...prev, username: data.username[0] }));
                }
                if (data.email) {
                    setErrors(prev => ({ ...prev, email: data.email[0] }));
                }
                if (data.password) {
                    setErrors(prev => ({ ...prev, password: data.password[0] }));
                }
                if (data.password2) {
                    setErrors(prev => ({ ...prev, confirmPassword: data.password2[0] }));
                }
                if (data.non_field_errors) {
                    setErrors(prev => ({ ...prev, submit: data.non_field_errors[0] }));
                }
                throw new Error(data.detail || 'Registration failed');
            }

            // Registration successful
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
            setErrors(prev => ({
                ...prev,
                submit: error.message || 'Registration failed. Please try again.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <nav className="auth-navbar">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">{"</>"}</span>
                    CodeGrow
                </Link>
            </nav>

            <div className="signup-container">
                <div className="signup-box">
                    <h2>Create Account</h2>
                    
                    {errors.submit && (
                        <div className="error-message general">{errors.submit}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className={errors.email ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className={errors.username ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className={errors.password ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                className={errors.confirmPassword ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="signup-button"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="login-link">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;