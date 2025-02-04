import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Navbar from "../components/navbar";

const Dashboard = () => {
    const navigate = useNavigate();
    
    const [currentLesson, setCurrentLesson] = useState(null);
    const [studySessions, setStudySessions] = useState([]);
    const [recommendedLessons, setRecommendedLessons] = useState([]);
    const [error, setError] = useState(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch("http://127.0.0.1:8000/api/accounts/dashboard/", {
                    method: "GET",
                    headers: { Authorization: `Token ${token}` },
                });

                if (!response.ok) throw new Error("Failed to fetch dashboard data.");
                
                const data = await response.json();

                setCurrentLesson(data.current_lesson || null);
                setStudySessions(data.study_sessions || []);

                fetchRecommendations(token);

            } catch {
                setError("An error occurred while loading.");
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const fetchRecommendations = async (token) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/accounts/recommended-lessons/", {
                method: "GET",
                headers: { Authorization: `Token ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch recommendations.");

            const data = await response.json();
            setRecommendedLessons(data.recommended_lessons || []);

        } catch {
            setError("Failed to load recommended lessons.");
        } finally {
            setLoadingRecommendations(false);
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />

            <div className="welcome-box">
                <h2>Welcome Back!</h2>
                <p>Let's keep growing your coding skills!</p>
            </div>

            <div className="lesson-pathway">
                <div className="lesson-box">
                    <h3>{currentLesson ? currentLesson.title : "No Lesson Available"}</h3>
                    <p>{currentLesson ? currentLesson.description : "Check your pathway settings."}</p>
                    {currentLesson && (
                        <button onClick={() => navigate(`/lessons/${currentLesson.id}`)}>
                            Start Lesson
                        </button>
                    )}
                </div>

                <div className="grid-container">
                    <div className="progress-box">
                        <h3>Your Progress</h3>
                        <p>Lessons Completed: <strong>0</strong></p>
                        <p>Day Streak: <strong>0</strong></p>
                    </div>

                    <div className="study-sessions-box">
                        <h3>Upcoming Study Sessions</h3>
                        {studySessions.length > 0 ? (
                            <ul>
                                {studySessions.map((session) => (
                                    <li key={session.id}>
                                        {session.lesson_title || "No Lesson Name"} - {session.date} 
                                        {session.start_time} - {session.end_time}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No sessions scheduled. Start learning today!</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="recommendations-box">
                <h2>Recommended Lessons for You</h2>
                {loadingRecommendations ? (
                    <p>Loading recommendations...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : recommendedLessons.length > 0 ? (
                    <ul>
                        {recommendedLessons.map((lesson, index) => (
                            <li key={index}>
                                <h3>{lesson.title}</h3>
                                <p>{lesson.description}</p>
                                <button onClick={() => navigate(`/lessons/${lesson.id}`)}>Start Lesson</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No recommendations available.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
