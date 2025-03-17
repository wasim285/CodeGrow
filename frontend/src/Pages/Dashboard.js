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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [sessionTitleToDelete, setSessionTitleToDelete] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
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

    // Calculate the progress percentage
    const progressPercentage = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;
    
    // Calculate the circle circumference based on the radius (r = 40)
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate stroke offset - when progress is 0%, offset equals circumference (empty circle)
    // When progress is 100%, offset equals 0 (full circle)
    const circleStroke = circumference - (progressPercentage / 100) * circumference;

    // Handle clicking on a study session to delete
    const handleSessionClick = (session) => {
        setSessionToDelete(session.id);
        setSessionTitleToDelete(session.lesson_title || "No Lesson Name");
        setDeleteModalOpen(true);
    };

    // Handle removing a study session
    const handleRemoveSession = async () => {
        if (!sessionToDelete) return;
        
        try {
            const response = await axios.delete(`${API_BASE_URL}study-sessions/${sessionToDelete}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            
            if (response.status === 204) {
                // Update the sessions list
                setStudySessions(studySessions.filter(session => session.id !== sessionToDelete));
                // Show success message
                displaySuccessMessage("Study session removed successfully!");
            } else {
                console.error("Failed to delete session:", response.data);
            }
        } catch (error) {
            console.error("Error removing study session:", error);
        }
        
        // Close the modal
        setDeleteModalOpen(false);
        setSessionToDelete(null);
        setSessionTitleToDelete("");
    };

    // Display a success message
    const displaySuccessMessage = (message) => {
        setSuccessMessage(message);
        setShowSuccessMessage(true);
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 3000);
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-content">
                {/* Success Message */}
                {showSuccessMessage && (
                    <div className="success-alert">
                        {successMessage}
                    </div>
                )}

                {/* Welcome Banner */}
                <div className="welcome-box">
                    <h2>Welcome to CodeGrow, {localStorage.getItem('username') || 'Coder'}! 👋</h2>
                    <p>Ready to level up your coding skills today?</p>
                </div>

                {/* Dashboard Layout */}
                <div className="dashboard-grid">
                    {/* Left Section: Lessons & Study Sessions */}
                    <div className="left-section">
                        {/* Current Lesson */}
                        <div className="lesson-box">
                            <h3>{mainLesson ? mainLesson.title : "No Lesson Available"}</h3>
                            <p>{mainLesson ? mainLesson.description : "Check your pathway settings."}</p>
                            {mainLesson && (
                                <button onClick={() => navigate(`/lessons/${mainLesson.id}`)}>
                                    Start Lesson
                                </button>
                            )}
                        </div>

                        {/* Study Sessions */}
                        <div className="study-sessions-box">
                            <h3>📅 Upcoming Study Sessions</h3>
                            <p className="click-info">Click on a session to remove it</p>
                            {studySessions.length > 0 ? (
                                <ul>
                                    {studySessions.map((session, index) => (
                                        <li 
                                            key={session.id || index} 
                                            onClick={() => handleSessionClick(session)}
                                            className="clickable-session"
                                        >
                                            <strong>{session.lesson_title || "No Lesson Name"}</strong>
                                            <span>{session.date} {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No sessions scheduled. Start learning today! 📌</p>
                            )}
                        </div>

                        {/* Recommended Lessons */}
                        <div className="recommendations-box">
                            <h3>📚 Recommended Lessons</h3>
                            {recommendedLessons.length > 0 ? (
                                <ul>
                                    {recommendedLessons
                                        .filter(lesson => lesson.id !== mainLesson?.id)
                                        .map((lesson) => (
                                            <li key={lesson.id} className="recommended-lesson">
                                                <div className="lesson-content">
                                                    <h4>{lesson.title}</h4>
                                                    <p>{lesson.description}</p>
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                    className="start-lesson-btn"
                                                >
                                                    Start Lesson
                                                </button>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p className="no-lessons">No recommended lessons available.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Progress Tracker */}
                    <div className="progress-section">
                        <h3>📊 Your Progress</h3>
                        <div className="progress-circle">
                            <div className="progress-wrapper">
                                <svg viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#4caf50" />
                                            <stop offset="100%" stopColor="#8bc34a" />
                                        </linearGradient>
                                    </defs>
                                    <circle 
                                        className="progress-bg" 
                                        cx="50" 
                                        cy="50" 
                                        r="40"
                                    ></circle>
                                    <circle
                                        className="progress-fill"
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circleStroke}
                                        style={{ stroke: 'url(#progressGradient)' }}
                                    ></circle>
                                </svg>
                                <div className="percentage-display">
                                    <span>{progressPercentage}%</span>
                                </div>
                            </div>
                        </div>
                        <p>Lessons Completed: <strong>{lessonsCompleted}/{totalLessons}</strong></p>
                        <p>🔥 Current Streak: <strong>{streak} {streak === 1 ? 'day' : 'days'}</strong></p>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>⚠️ Remove Study Session?</h3>
                            <p>Are you sure you want to remove your study session for "{sessionTitleToDelete}"?</p>
                            <div className="modal-buttons">
                                <button onClick={handleRemoveSession} className="confirm">Yes, Remove</button>
                                <button className="cancel" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;