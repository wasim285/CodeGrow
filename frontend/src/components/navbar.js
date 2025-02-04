import { Link, useNavigate } from "react-router-dom"; 
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/Authcontext";
import "../styles/Navbar.css";

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const toggleDropdown = (event) => {
        event.stopPropagation();
        setDropdownOpen(prev => !prev);
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="navbar-logo">CodeGrow</Link>

            <div className="nav-links">
                <Link to="/dashboard">Home</Link>
                <Link to="/lessons">Lessons</Link>
                <Link to="/study-sessions">Study Sessions</Link>
            </div>

            <div className={`profile-container ${dropdownOpen ? "active" : ""}`} ref={dropdownRef}>
                <img 
                    src="/assets/profile.png"
                    alt="Profile" 
                    className="profile-image" 
                    onClick={toggleDropdown} 
                />
                {dropdownOpen && (
                    <div className="dropdown-menu">
                        <Link to="/profile">Profile</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button> 
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
