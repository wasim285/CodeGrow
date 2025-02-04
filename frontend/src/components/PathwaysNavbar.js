import { Link } from "react-router-dom";
import "../styles/PathwayPageNav.css";

const PathwaysNavbar = () => {
    return (
        <nav className="navbar pathways-navbar">
            <div className="logo">
                <Link to="/">CodeGrow</Link>
            </div>
        </nav>
    );
};

export default PathwaysNavbar;
