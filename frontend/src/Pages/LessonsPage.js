import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LessonsPage.css";
import Navbar from "../components/navbar";
import api from "../utils/api";
import TreeLoader from "../components/TreeLoader";

const LessonsPage = () => {
    const { user } = useContext(AuthContext);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Helper function to try multiple endpoints
    const tryEndpoints = async (baseEndpoint) => {
        const endpoints = [
            baseEndpoint,
            `accounts/${baseEndpoint}`,
            `lessons/${baseEndpoint}`
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying lessons endpoint: ${endpoint}`);
                const token = localStorage.getItem("token");
                const response = await api.get(endpoint, {
                    headers: { Authorization: `Token ${token}` }
                });
                console.log(`Lessons endpoint ${endpoint} succeeded`);
                return response;
            } catch (endpointError) {
                console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
            }
        }
        
        // If all endpoints fail, throw an error
        throw new Error("Could not fetch lessons from any endpoint");
    };

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        
        const fetchLessons = async () => {
            try {
                // Try multiple endpoints to fetch lessons
                let response;
                try {
                    // Try the all-lessons endpoint with multiple patterns
                    response = await tryEndpoints("all-lessons/");
                } catch (firstError) {
                    try {
                        // Try the lessons endpoint with multiple patterns
                        response = await tryEndpoints("lessons/");
                    } catch (secondError) {
                        try {
                            // Try the user-lessons endpoint with multiple patterns
                            response = await tryEndpoints("user-lessons/");
                        } catch (thirdError) {
                            // If all attempts fail, throw the first error for handling below
                            throw firstError;
                        }
                    }
                }

                // Process the successful response
                if (!response.data || response.data.length === 0) {
                    setError("No lessons available at this time.");
                } else {
                    setLessons(response.data);
                }
            } catch (error) {
                console.error("Lessons Fetch Error:", error.response?.data || error.message);
                
                if (error.response?.status === 401) {
                    // Handle unauthorized access
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
                
                setError(error.response?.data?.error || "Failed to fetch lessons. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, [navigate]);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        window.location.reload();
    };

    if (loading) return (
        <div className="loading-container">
            <TreeLoader />
            <p>Loading lessons...</p>
        </div>
    );
    
    return (
        <div className="lessons-page">
            <Navbar />
            <div className="lessons-container">
                <h1 className="lessons-title">All Lessons</h1>
                
                {error ? (
                    <div className="error-container">
                        <p className="error-message">{error}</p>
                        <button 
                            className="retry-button" 
                            onClick={handleRetry}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="lessons-grid">
                        {lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <div key={lesson.id} className="lesson-card">
                                    <h3>{lesson.title}</h3>
                                    <p>{lesson.description}</p>
                                    <div className="lesson-meta">
                                        {/* Only show difficulty tag if there's a specific level */}
                                        {lesson.difficulty_level && (
                                            <span className="difficulty-tag">
                                                {lesson.difficulty_level}
                                            </span>
                                        )}
                                        {lesson.completed && (
                                            <span className="completed-tag">✓ Completed</span>
                                        )}
                                    </div>
                                    <Link to={`/lessons/${lesson.id}`} className="lesson-btn">
                                        {lesson.completed ? "Review Lesson" : "Start Lesson"}
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="no-lessons-message">
                                No lessons are available for your profile. 
                                Please update your learning preferences.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonsPage;
