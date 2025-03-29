import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; 
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

    // Helper function to try multiple API endpoints
    const tryMultipleEndpoints = async (endpoints, data) => {
        let lastError = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying to update profile with endpoint: ${endpoint}`);
                const response = await api.patch(endpoint, data);
                console.log(`Success with endpoint ${endpoint}, status: ${response.status}`);
                return response;
            } catch (error) {
                console.log(`Failed with endpoint ${endpoint}:`, error.message);
                lastError = error;
            }
        }
        
        throw lastError; // If all attempts fail
    };

    const handleDifficultySelect = async (level) => {
        setLoading(true);
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("User not authenticated. Redirecting to login.");
                navigate("/login");
                return;
            }
            
            // Get current learning goal from localStorage
            const currentGoal = localStorage.getItem("learning_goal") || "School";

            console.log(`Updating difficulty to: ${level}, with goal: ${currentGoal}`);
            
            // Create the request payload
            const profileData = { 
                difficulty_level: level,
                learning_goal: currentGoal 
            };
            
            // List of possible API endpoints to try
            const possibleEndpoints = [
                "accounts/profile/",       // Standard Django REST API pattern
                "profile/",                // Direct API pattern
                "accounts/update-profile/", // Alternative endpoint
                "api/accounts/profile/"    // Full path with api prefix
            ];
            
            try {
                // Try all the endpoint patterns
                await tryMultipleEndpoints(possibleEndpoints, profileData);
                
                // If any of them succeeded, save to localStorage and navigate
                localStorage.setItem("difficulty_level", level);
                navigate("/dashboard");
            } catch (apiError) {
                console.error("All API endpoints failed:", apiError);
                
                // Save locally anyway and continue
                localStorage.setItem("difficulty_level", level);
                navigate("/dashboard");
            }
            
        } catch (error) {
            console.error("Error updating difficulty level:", error);
            
            // Just save locally and continue
            localStorage.setItem("difficulty_level", level);
            navigate("/dashboard");
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
