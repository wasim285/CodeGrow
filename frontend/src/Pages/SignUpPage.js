import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignUpPage.css";
import { registerUser } from "../utils/api";

const SignUpPage = () => {
    const [formData, setFormData] = useState({ 
        first_name: "", 
        last_name: "",
        username: "", 
        email: "", 
        password: "",
        password2: ""
    });

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            const response = await registerUser(formData);

            const responseData = await response.json();

            if (response.ok) {
                setSuccessMessage("Signup successful! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                let errorMsg = "Signup failed. Please check your details.";
                if (responseData.username) {
                    errorMsg = `⚠️ ${responseData.username[0]}`;
                } else if (responseData.email) {
                    errorMsg = `⚠️ ${responseData.email[0]}`;
                } else if (responseData.password) {
                    errorMsg = `⚠️ ${responseData.password[0]}`;
                }
                setError(errorMsg);
            }
        } catch (error) {
            console.error("Error:", error);
            setError("❌ Network error. Please try again.");
        }
    };

    return (
        <div>
            {/* ✅ Navbar at the top */}
            <nav className="auth-navbar">
                <a href="/" className="navbar-logo">CodeGrow</a>
            </nav>

            <div className="signup-container">
                <div className="signup-box">
                    <h2>Create your account</h2>

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <form onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            name="first_name" 
                            placeholder="First Name" 
                            value={formData.first_name} 
                            onChange={handleChange} 
                            required 
                        />
                        <input 
                            type="text" 
                            name="last_name" 
                            placeholder="Last Name" 
                            value={formData.last_name} 
                            onChange={handleChange} 
                            required 
                        />
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="Username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                        />
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                        />
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                        />
                        <input 
                            type="password" 
                            name="password2" 
                            placeholder="Confirm Password" 
                            value={formData.password2} 
                            onChange={handleChange} 
                            required 
                        />
                        <button type="submit">Get Started</button>
                    </form>

                    <p>Already have an account? <a href="/login">Login here</a></p>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
