import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";
import Navbar from "../components/navbar";

const API_BASE_URL = "https://codegrow.onrender.com/api/accounts/";

const Dashboard = () => {
    const navigate = useNavigate();
    const [mainLesson, setMainLesson] = useState(null);
    const [recommendedLessons, setRecommendedLessons] = useState([]);
    const [studySessions, setStudySessions] = useState([]);
    const [lessonsCompleted, setLessonsCompleted] = useState(0);
    const [totalLessons, setTotalLessons] = useState(10);
    const [streak, setStreak] = useState(0);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) {
                setError("User not authenticated. Please log in again.");
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}dashboard/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                setLessonsCompleted(response.data.progress?.total_lessons_completed || 0);
                setTotalLessons(response.data.total_lessons || 10);
                setStreak(response.data.progress?.streak || 0);
                setMainLesson(response.data.current_lesson);
                setRecommendedLessons(response.data.recommended_lessons || []);
                setStudySessions(response.data.study_sessions || []);
            } catch (error) {
                setError("An error occurred while loading.");
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();

        const handleLessonCompletion = (event) => {
            if (event.detail) {
                setLessonsCompleted(event.detail.total_lessons_completed);
                setStreak(event.detail.streak);
            } else {
                fetchDashboardData();
            }
        };

        window.addEventListener("lessonCompleted", handleLessonCompletion);

        return () => {
            window.removeEventListener("lessonCompleted", handleLessonCompletion);
        };
    }, [token]);

    const progressPercentage = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-content">
                <div className="welcome-box">
                    <h2>Welcome Back!</h2>
                    <p>Keep your learning streak going! 🚀</p>
                </div>
                <div className="dashboard-grid">
                    <div className="lesson-box">
                        <h3>{mainLesson ? mainLesson.title : "No Lesson Available"}</h3>
                        <p>{mainLesson ? mainLesson.description : "Check your pathway settings."}</p>
                        {mainLesson && (
                            <button onClick={() => navigate(`/lessons/${mainLesson.id}`)}>
                                Start Lesson
                            </button>
                        )}
                    </div>

                    <div className="progress-section">
                        <h3>📊 Your Progress</h3>
                        <div className="progress-circle">
                            <svg viewBox="0 0 100 100">
                                <circle className="progress-bg" cx="50" cy="50" r="40"></circle>
                                <circle
                                    className="progress-fill"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (progressPercentage / 100) * 251.2}
                                ></circle>
                                <text x="50" y="54" textAnchor="middle" className="progress-text">{progressPercentage}%</text>
                            </svg>
                        </div>
                        <p>Lessons Completed: <strong>{lessonsCompleted}/{totalLessons}</strong></p>
                        <p>🔥 Streak: <strong>{streak} days</strong></p>
                    </div>
                </div>

                <div className="study-sessions-box">
                    <h3>📅 Upcoming Study Sessions</h3>
                    {studySessions.length > 0 ? (
                        <ul>
                            {studySessions.map((session, index) => (
                                <li key={session.id || index}>
                                    <strong>{session.lesson_title || "No Lesson Name"}</strong>
                                    <span>{session.date} {session.start_time} - {session.end_time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No sessions scheduled. Start learning today! 📌</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
