import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PathwaysNavbar from "../components/PathwaysNavbar";
import "../styles/Difficulty.css";

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
            if (!token) throw new Error("User not authenticated.");

            const profileResponse = await fetch("http://127.0.0.1:8000/api/accounts/profile/", {
                method: "GET",
                headers: { Authorization: `Token ${token}` },
            });

            if (!profileResponse.ok) throw new Error("Failed to fetch user profile.");

            const profileData = await profileResponse.json();
            const currentGoal = profileData.learning_goal || "School";

            const updateResponse = await fetch("http://127.0.0.1:8000/api/accounts/profile/", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ difficulty_level: level, learning_goal: currentGoal }),
            });

            if (!updateResponse.ok) throw new Error("Failed to update difficulty level.");

            navigate("/dashboard");
        } catch (error) {
            alert(error.message || "Something went wrong. Please try again.");
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
