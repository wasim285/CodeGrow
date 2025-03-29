import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { getProfile } from "../utils/api"; 
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

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    const handleDifficultySelect = async (level) => {
        setLoading(true);
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("User not authenticated. Redirecting to login.");
                navigate("/login");
                return;
            }
            
            // Get current learning goal (either from localStorage or profile)
            let currentGoal = localStorage.getItem("learning_goal") || "School";
            
            try {
                // Try to get the latest data from profile
                const profileResponse = await getProfile(token);
                if (profileResponse?.data?.learning_goal) {
                    currentGoal = profileResponse.data.learning_goal;
                }
            } catch (profileError) {
                console.warn("Could not fetch profile, using stored learning goal:", currentGoal);
            }

            console.log(`Updating difficulty to: ${level}, with goal: ${currentGoal}`);
            
            // IMPORTANT FIX: Use 'accounts/profile/' instead of just 'profile/'
            const updateResponse = await api.patch("accounts/profile/", 
                { 
                    difficulty_level: level,
                    learning_goal: currentGoal 
                }
            );
            
            console.log("Profile update response:", updateResponse.status);
            
            // Save to localStorage for faster access later
            localStorage.setItem("difficulty_level", level);
            navigate("/dashboard");
            
        } catch (error) {
            console.error("Error updating difficulty level:", error);
            
            // More specific error message with details about what went wrong
            if (!navigator.onLine) {
                alert("You appear to be offline. Please check your internet connection and try again.");
            } else if (error.response) {
                if (error.response.status === 404) {
                    alert("API endpoint not found. This might be a configuration issue. Please contact support.");
                } else {
                    alert(`Error (${error.response.status}): ${error.response.data?.error || "Failed to update difficulty level"}`);
                }
            } else {
                alert("Failed to update difficulty level. Please try again.");
            }
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
                        <p>Perfect for those new to programming</p>
                    </div>
                    <div className="card" onClick={() => handleDifficultySelect("Intermediate")}>
                        <h2>{loading ? "Saving..." : "Intermediate"}</h2>
                        <p>For those with some coding experience</p>
                    </div>
                    <div className="card" onClick={() => handleDifficultySelect("Advanced")}>
                        <h2>{loading ? "Saving..." : "Advanced"}</h2>
                        <p>Challenging content for experienced coders</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DifficultyPage;
