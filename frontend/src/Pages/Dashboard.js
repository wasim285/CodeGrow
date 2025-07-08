import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Dashboard.css";
import Navbar from "../components/navbar";

const Dashboard = () => {
    const navigate = useNavigate();
    const LESSON_CAP_FALLBACK = 5;
    const [mainLesson, setMainLesson] = useState(null);
    const [recommendedLessons, setRecommendedLessons] = useState([]);
    const [studySessions, setStudySessions] = useState([]);
    const [lessonsCompleted, setLessonsCompleted] = useState(0);
    const [totalLessons, setTotalLessons] = useState(LESSON_CAP_FALLBACK);
    const [streak, setStreak] = useState(0);
    const [error, setError] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [sessionTitleToDelete, setSessionTitleToDelete] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [recentActivities, setRecentActivities] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get("accounts/dashboard/");
                setXp(response.data.progress.xp);
                setLevel(response.data.progress.level);
                setLessonsCompleted(response.data.progress.total_lessons_completed || 0);
                setTotalLessons(response.data.progress.lesson_cap ?? LESSON_CAP_FALLBACK);
                setStreak(response.data.progress.streak || 0);
                setMainLesson(response.data.current_lesson);
                setRecommendedLessons(response.data.recommended_lessons || []);
                setStudySessions(response.data.study_sessions || []);
                setRecentActivities(response.data.recent_activities || []);
            } catch (err) {
                setError("Failed to load dashboard data");
            }
        };

        fetchDashboard();

        const refresh = () => fetchDashboard();
        
        // Listen for various updates
        window.addEventListener("xpEarned", refresh);
        window.addEventListener("studySessionAdded", refresh);
        window.addEventListener("studySessionRemoved", refresh); // Add this line
        window.addEventListener("activityUpdate", refresh);
        
        return () => {
            window.removeEventListener("xpEarned", refresh);
            window.removeEventListener("studySessionAdded", refresh);
            window.removeEventListener("studySessionRemoved", refresh); // Add this line
            window.removeEventListener("activityUpdate", refresh);
        };
    }, [token]);

    const progressPercentage = totalLessons > 0 
        ? Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100)) 
        : 0;

    const xpToLevel = 50;
    const xpWithinLevel = xp % xpToLevel;
    const xpPercentage = Math.min(100, Math.round((xpWithinLevel / xpToLevel) * 100));

    const radius = 76;
    const circumference = 2 * Math.PI * radius;
    const circleStroke = circumference - (progressPercentage / 100) * circumference;

    const handleSessionClick = (session) => {
        setSessionToDelete(session.id);
        setSessionTitleToDelete(session.lesson_title || "No Lesson Name");
        setDeleteModalOpen(true);
    };

    const handleRemoveSession = async () => {
        if (!sessionToDelete) return;
        
        try {
            // First, try to delete from backend
            const response = await api.delete(`study-sessions/${sessionToDelete}/`);
            
            if (response.status === 204 || response.status === 200) {
                // Successfully deleted from backend
                setStudySessions(prevSessions => 
                    prevSessions.filter(session => session.id !== sessionToDelete)
                );
                setSuccessMessage("Study session removed successfully!");
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 3000);
                
                // Dispatch events to notify other components
                window.dispatchEvent(new CustomEvent("studySessionRemoved"));
                window.dispatchEvent(new CustomEvent("activityUpdate"));
                
                console.log("Session deleted successfully:", sessionToDelete);
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
            
        } catch (error) {
            console.error("Error removing session:", error);
            
            // Check if it's a network error or 404 (already deleted)
            if (error.response?.status === 404) {
                // Session doesn't exist on backend, remove from UI anyway
                setStudySessions(prevSessions => 
                    prevSessions.filter(session => session.id !== sessionToDelete)
                );
                setSuccessMessage("Session removed from view");
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 3000);
                
                // Still dispatch events
                window.dispatchEvent(new CustomEvent("studySessionRemoved"));
                window.dispatchEvent(new CustomEvent("activityUpdate"));
            } else {
                // Real error occurred
                setSuccessMessage("Failed to remove session. Please try again.");
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 3000);
            }
        } finally {
            // Always close modal
            setDeleteModalOpen(false);
            setSessionToDelete(null);
            setSessionTitleToDelete("");
        }
    };

    const getLevelBadge = (level) => {
        if (level <= 3) return { emoji: "🥉", color: "#CD7F32", name: "Bronze" };
        if (level <= 6) return { emoji: "🥈", color: "#C0C0C0", name: "Silver" };
        return { emoji: "🥇", color: "#FFD700", name: "Gold" };
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="dashboard-content">
                {showSuccessMessage && (
                    <div className="success-alert">
                        {successMessage}
                    </div>
                )}

                {/* Welcome Section */}
                <div className="welcome-section">
                    <h1>Welcome back, {localStorage.getItem("username") || "Coder"}!</h1>
                    <p>Ready to continue your coding journey? Let's build something amazing today.</p>
                </div>

                {/* Stats Overview - Simplified */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Lessons</span>
                            <div className="stat-icon progress">📚</div>
                        </div>
                        <div className="stat-value">{lessonsCompleted}</div>
                        <div className="stat-description">
                            out of {totalLessons} completed
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Streak</span>
                            <div className="stat-icon streak">🔥</div>
                        </div>
                        <div className="stat-value">{streak}</div>
                        <div className="stat-description">
                            {streak === 1 ? 'day' : 'days'} in a row
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Upcoming</span>
                            <div className="stat-icon lessons">📅</div>
                        </div>
                        <div className="stat-value">{studySessions.length}</div>
                        <div className="stat-description">Study sessions scheduled</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="main-grid">
                    {/* Left Column */}
                    <div className="left-column">
                        {/* Current Lesson */}
                        <div className="current-lesson-card">
                            <div className="lesson-header">
                                <span className="lesson-badge">Next Lesson</span>
                                <h2 className="lesson-title">
                                    {mainLesson ? mainLesson.title : "No Lesson Available"}
                                </h2>
                            </div>
                            <p className="lesson-description">
                                {mainLesson 
                                    ? mainLesson.description 
                                    : "Check your pathway settings or contact support for assistance."}
                            </p>
                            {mainLesson && (
                                <button
                                    className="lesson-button"
                                    onClick={() => navigate(`/lessons/${mainLesson.id}`)}
                                >
                                    Start Learning
                                </button>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="quick-actions">
                            <h3 className="section-title">🚀 Quick Actions</h3>
                            <div className="actions-grid">
                                <div className="action-item" onClick={() => navigate('/lessons')}>
                                    <h4 className="action-title">Browse Lessons</h4>
                                    <p className="action-description">Explore all available lessons and topics</p>
                                </div>
                                <div className="action-item" onClick={() => navigate('/pathway')}>
                                    <h4 className="action-title">Learning Path</h4>
                                    <p className="action-description">Customize your learning journey</p>
                                </div>
                                <div className="action-item" onClick={() => navigate('/study-sessions')}>
                                    <h4 className="action-title">Schedule Study</h4>
                                    <p className="action-description">Plan your next study session</p>
                                </div>
                                <div className="action-item" onClick={() => navigate('/quiz')}>
                                    <h4 className="action-title">Take Quiz</h4>
                                    <p className="action-description">Test your knowledge</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="recent-activity">
                            <h3 className="section-title">📊 Recent Activity</h3>
                            <div className="activity-list">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity) => (
                                        <div key={activity.id} className="activity-item">
                                            <div className={`activity-icon ${activity.activity_type}`}>
                                                {activity.activity_type === 'lesson_completed' ? '✅' : 
                                                 activity.activity_type === 'quiz_passed' ? '🎯' : 
                                                 activity.activity_type === 'streak_milestone' ? '🔥' : 
                                                 activity.activity_type === 'level_up' ? '🎉' : 
                                                 activity.activity_type === 'account_created' ? '🎊' : '⭐'}
                                            </div>
                                            <div className="activity-content">
                                                <h4 className="activity-title">{activity.title}</h4>
                                                <p className="activity-description">{activity.description} • {activity.time_ago}</p>
                                            </div>
                                            {activity.xp_earned > 0 && (
                                                <span className="activity-xp">+{activity.xp_earned} XP</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="activity-item">
                                        <div className="activity-icon completed">🎉</div>
                                        <div className="activity-content">
                                            <h4 className="activity-title">Welcome to CodeGrow!</h4>
                                            <p className="activity-description">Start learning to see your progress here</p>
                                        </div>
                                        <span className="activity-xp">Ready to learn!</span>
                                    </div>
                                )}
                            </div>
                            <button className="view-all-btn" onClick={() => navigate('/activity')}>
                                {recentActivities.length > 0 ? 'View All Activity' : 'Start Your First Lesson'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        {/* Combined Progress & XP Card */}
                        <div className="progress-card">
                            <h3 className="section-title">📈 Your Progress</h3>
                            <div className="progress-circle">
                                <svg viewBox="0 0 180 180">
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#4caf50" />
                                            <stop offset="100%" stopColor="#8bc34a" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        className="progress-bg"
                                        cx="90"
                                        cy="90"
                                        r={radius}
                                    />
                                    <circle
                                        className="progress-fill"
                                        cx="90"
                                        cy="90"
                                        r={radius}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circleStroke}
                                        style={{ stroke: 'url(#progressGradient)' }}
                                    />
                                </svg>
                                <div className="progress-text">
                                    <span className="progress-percentage">{progressPercentage}%</span>
                                    <div className="progress-label">Complete</div>
                                </div>
                            </div>

                            {/* Unified Level & XP Section with Badge */}
                            <div className="level-section">
                                <div className="level-info">
                                    <div className="level-badge-container">
                                        <div 
                                            className="level-badge-medal"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${getLevelBadge(level).color}, ${getLevelBadge(level).color}dd)`,
                                                boxShadow: `0 4px 12px ${getLevelBadge(level).color}33`
                                            }}
                                        >
                                            <span className="level-badge-emoji">{getLevelBadge(level).emoji}</span>
                                        </div>
                                        <div className="level-details">
                                            <span className="level-number">Level {level}</span>
                                            <span className="level-title">{getLevelBadge(level).name}</span>
                                        </div>
                                    </div>
                                    <div className="total-xp">
                                        <span className="total-xp-value">{xp}</span>
                                        <span className="total-xp-label">Total XP</span>
                                    </div>
                                </div>
                                
                                <div className="xp-progress">
                                    <div className="xp-header">
                                        <span className="xp-label">Progress to Level {level + 1}</span>
                                        <span className="xp-points">{xpWithinLevel}/{xpToLevel} XP</span>
                                    </div>
                                    <div className="xp-bar">
                                        <div 
                                            className="xp-fill" 
                                            style={{ width: `${xpPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="xp-next">
                                        {xpToLevel - xpWithinLevel} XP needed for {getLevelBadge(level + 1).name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Study Sessions - Single Location */}
                        <div className="sessions-card">
                            <div className="sessions-header">
                                <h3 className="section-title">📅 Study Sessions</h3>
                                <button 
                                    className="add-session-btn"
                                    onClick={() => navigate('/study-sessions')}
                                >
                                    + Add Session
                                </button>
                            </div>
                            <div className="sessions-list">
                                {studySessions.length > 0 ? (
                                    studySessions.map((session, index) => (
                                        <div
                                            key={session.id || index}
                                            className="session-item"
                                            onClick={() => handleSessionClick(session)}
                                        >
                                            <h4 className="session-title">
                                                {session.lesson_title || "No Lesson Name"}
                                            </h4>
                                            <p className="session-time">
                                                {session.date} • {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                                            </p>
                                            <span className="session-remove">Click to remove</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-sessions">
                                        <p>No sessions scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommended Lessons */}
                <div className="bottom-section">
                    <h3 className="section-title">📚 Recommended For You</h3>
                    {recommendedLessons.length > 0 ? (
                        <div className="recommendations-grid">
                            {recommendedLessons
                                .filter(lesson => lesson.id !== mainLesson?.id)
                                .slice(0, 3)
                                .map((lesson) => (
                                    <div key={lesson.id} className="recommendation-card">
                                        <h4 className="recommendation-title">{lesson.title}</h4>
                                        <p className="recommendation-description">{lesson.description}</p>
                                        <button
                                            className="recommendation-button"
                                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                                        >
                                            Start Lesson
                                        </button>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="no-sessions">
                            No recommendations available at the moment.
                        </div>
                    )}
                </div>

                {/* Modal */}
                {deleteModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>Remove Study Session?</h3>
                            <p>
                                Are you sure you want to remove your study session for "{sessionTitleToDelete}"?
                            </p>
                            <div className="modal-buttons">
                                <button onClick={handleRemoveSession} className="confirm">
                                    Yes, Remove
                                </button>
                                <button className="cancel" onClick={() => setDeleteModalOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;