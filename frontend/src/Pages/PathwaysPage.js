import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../utils/api";
import "../styles/Pathways.css";
import PathwaysNavbar from "../components/PathwaysNavbar";

const PathwaysPage = () => {
    const [text, setText] = useState("What are your learning goals?");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const learningGoals = useMemo(() => [
        "Do you want to improve for school?",
        "Are you building a portfolio?",
        "Are you looking for career growth?",
    ], []);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(learningGoals[i]);
            i = (i + 1) % learningGoals.length;
        }, 3000);

        return () => clearInterval(interval);
    }, [learningGoals]);

    const handlePathwaySelect = async (pathway) => {
        setLoading(true);
        localStorage.setItem("learning_goal", pathway);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("User not authenticated. Please log in again.");
                navigate("/login");
                return;
            }

            const response = await getProfile(token);

            if (response.status === 200) {
                navigate("/difficulty");
            } else {
                throw new Error("Failed to update learning goal.");
            }
        } catch (error) {
            console.error("Error updating learning goal:", error);
            alert(error.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PathwaysNavbar />
            <div className="pathways-container">
                <h2 className="pathways-header">{text}</h2>
                <div className="pathways-options">
                    <div className="card" onClick={() => handlePathwaySelect("School")}>
                        <h2>{loading ? "Saving..." : "For School"}</h2>
                    </div>
                    <div className="card" onClick={() => handlePathwaySelect("Portfolio")}>
                        <h2>{loading ? "Saving..." : "Build a Portfolio"}</h2>
                    </div>
                    <div className="card" onClick={() => handlePathwaySelect("Career Growth")}>
                        <h2>{loading ? "Saving..." : "Career Growth"}</h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PathwaysPage;
