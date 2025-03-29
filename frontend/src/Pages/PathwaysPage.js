import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
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
        // Check authentication first
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            setText(learningGoals[i]);
            i = (i + 1) % learningGoals.length;
        }, 3000);

        return () => clearInterval(interval);
    }, [learningGoals, navigate]);

    const handlePathwaySelect = async (pathway) => {
        setLoading(true);
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("User not authenticated. Please log in again.");
                navigate("/login");
                return;
            }
    
            // The correct endpoint should include 'accounts' before 'profile'
            const response = await api.patch("accounts/profile/", 
                { learning_goal: pathway },
                {
                    headers: {
                        "Authorization": `Token ${token}`
                    }
                }
            );
    
            console.log("Pathway selection successful:", response.data);
            localStorage.setItem("learning_goal", pathway); // Save locally too
            navigate("/difficulty");
        } catch (error) {
            console.error("Error updating learning goal:", error);
            
            // More specific error handling
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Response error:", error.response.status, error.response.data);
                
                if (error.response.status === 404) {
                    alert("API endpoint not found. Please contact support.");
                } else {
                    alert(`Error: ${error.response.data?.error || "Failed to update learning goal"}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Request error - no response received");
                alert("No response from server. Please check your internet connection.");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Request setup error:", error.message);
                alert(error.message || "Something went wrong. Please try again.");
            }
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
                        <p>Learn programming for academic success</p>
                    </div>
                    <div className="card" onClick={() => handlePathwaySelect("Portfolio")}>
                        <h2>{loading ? "Saving..." : "Build a Portfolio"}</h2>
                        <p>Create projects to showcase your skills</p>
                    </div>
                    <div className="card" onClick={() => handlePathwaySelect("Career Growth")}>
                        <h2>{loading ? "Saving..." : "Career Growth"}</h2>
                        <p>Advance your professional development</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PathwaysPage;
