import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/api';
import "../styles/SignUpPage.css";

const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '' // Changed to match Django's expected field name
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
        if (formData.password !== formData.password2) {
            newErrors.password2 = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            console.log("Submitting registration with:", {
                email: formData.email,
                username: formData.username,
                // Password is sensitive, so we don't log it
            });

            const response = await registerUser(formData);

            if (response.status === 201) {
                setSuccessMessage('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                console.log("Registration failed with status:", response.status);
                
                // Handle API error responses
                if (response.data?.username) {
                    setErrors(prev => ({ ...prev, username: Array.isArray(response.data.username) ? response.data.username[0] : response.data.username }));
                }
                if (response.data?.email) {
                    setErrors(prev => ({ ...prev, email: Array.isArray(response.data.email) ? response.data.email[0] : response.data.email }));
                }
                if (response.data?.password) {
                    setErrors(prev => ({ ...prev, password: Array.isArray(response.data.password) ? response.data.password[0] : response.data.password }));
                }
                if (response.data?.password2) {
                    setErrors(prev => ({ ...prev, password2: Array.isArray(response.data.password2) ? response.data.password2[0] : response.data.password2 }));
                }
                if (response.data?.non_field_errors) {
                    setErrors(prev => ({ ...prev, submit: Array.isArray(response.data.non_field_errors) ? response.data.non_field_errors[0] : response.data.non_field_errors }));
                }
                
                // If no specific error was set but we know the request failed
                if (!Object.keys(errors).length && response.data?.error) {
                    setErrors({ submit: response.data.error });
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ submit: "An unexpected error occurred. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear related error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
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
                    
                    {successMessage && (
                        <div className="success-message">{successMessage}</div>
                    )}
                    
                    {errors.submit && (
                        <div className="error-message general">{errors.submit}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={errors.username ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={errors.password ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="password2"
                                placeholder="Confirm Password"
                                value={formData.password2}
                                onChange={handleInputChange}
                                className={errors.password2 ? 'error' : ''}
                                disabled={isLoading}
                            />
                            {errors.password2 && <span className="error-message">{errors.password2}</span>}
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