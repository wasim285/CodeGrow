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

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        
        const fetchLessons = async () => {
            try {
                // Use our API utility for consistent behavior
                const response = await api.get("all-lessons/", {
                    headers: { Authorization: `Token ${token}` }
                });

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
                            onClick={() => window.location.reload()}
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
                                        <span className="difficulty-tag">
                                            {lesson.difficulty_level || "All Levels"}
                                        </span>
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
