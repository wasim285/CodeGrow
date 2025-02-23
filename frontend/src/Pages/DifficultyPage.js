import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../utils/api"; // ✅ Import API helper
import "../styles/Difficulty.css";
import PathwaysNavbar from "../components/PathwaysNavbar";

const DifficultyPage = () => {
    const [text, setText] = useState("Select Your Difficulty Level");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const difficultyLevels = useMemo(() => [
        "Are you a beginner?",
        "Do you have some coding experience?",
        "Are you confident and want a challenge?",
    ], []);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(difficultyLevels[i]);
            i = (i + 1) % difficultyLevels.length;
        }, 3000);

        return () => clearInterval(interval);
    }, [difficultyLevels]);

    const handleDifficultySelect = async (level) => {
        setLoading(true);
        localStorage.setItem("difficulty_level", level);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("User not authenticated. Redirecting to login.");
                navigate("/login");
                return;
            }

            // ✅ Fetch user profile correctly
            const profileResponse = await getProfile(token);
            const profileData = profileResponse.data;

            const currentGoal = profileData.learning_goal || "School";

            // ✅ FIXED: Corrected the API endpoint (ensuring `/accounts/profile/` is used)
            const updateResponse = await fetch(
                "https://codegrow-backend.onrender.com/api/accounts/profile/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify({ difficulty_level: level, learning_goal: currentGoal }),
                }
            );

            if (!updateResponse.ok) {
                throw new Error("Failed to update difficulty level.");
            }

            navigate("/dashboard"); // ✅ Navigate to dashboard

        } catch (error) {
            console.error("Error updating difficulty level:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PathwaysNavbar />
            <div className="difficulty-container">
                <h2 className="difficulty-header">{text}</h2>
                <div className="difficulty-options">
                    <div className="card" onClick={() => handleDifficultySelect("Beginner")}>
                        <h2>{loading ? "Saving..." : "Beginner"}</h2>
                    </div>
                    <div className="card" onClick={() => handleDifficultySelect("Intermediate")}>
                        <h2>{loading ? "Saving..." : "Intermediate"}</h2>
                    </div>
                    <div className="card" onClick={() => handleDifficultySelect("Advanced")}>
                        <h2>{loading ? "Saving..." : "Advanced"}</h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DifficultyPage;
