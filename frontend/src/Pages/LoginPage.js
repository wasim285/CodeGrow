import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
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
            const response = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token);
                localStorage.setItem("token", data.token);
                navigate("/pathways");
            } else {
                setError(data.error || "Wrong credentials. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            setError("Something went wrong. Please try again later.");
        }
    };

    return (
        <div>
            {/* ✅ Navbar at the top */}
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

                    <p>Don't have an account? <a href="/register">Sign up here</a></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
