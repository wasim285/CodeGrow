import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import { loginUser } from "../utils/api";
import "../styles/LoginPage.css";

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await loginUser(formData);

            if (response.status === 200) {
                const data = response.data;
                login(data.token);
                localStorage.setItem("token", data.token);
                navigate("/pathways");
            } else {
                setError(response.data?.error || "Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            setError("Network error. Please try again.");
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

                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="Username" 
                            value={formData.username} 
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
                        <button type="submit">Login</button>
                    </form>

                    <p>Don't have an account? <Link to="/register">Sign up here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
