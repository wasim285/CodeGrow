import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Navbar from "../components/navbar";
import "../styles/Activity.css";

const Activity = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActivities = async () => {
        try {
            const response = await api.get("accounts/activities/");
            let activitiesData = response.data.results || response.data;
            
            // Enhanced filtering for better XP activity handling
            const filteredActivities = activitiesData.filter(activity => {
                if (activity.activity_type === 'xp_earned') {
                    // Check if there's a recent main activity that already includes this XP
                    const recentMainActivity = activitiesData.find(mainActivity => 
                        mainActivity.activity_type !== 'xp_earned' &&
                        Math.abs(new Date(mainActivity.created_at) - new Date(activity.created_at)) < 120000 && // Within 2 minutes
                        (
                            mainActivity.xp_earned === activity.xp_earned || // Same XP amount
                            mainActivity.xp_earned > 0 // Main activity has XP
                        )
                    );
                    
                    // If we found a main activity, don't show the standalone XP
                    if (recentMainActivity) {
                        return false;
                    }
                    
                    // If no main activity found, enhance the XP activity with better context
                    if (activity.description) {
                        // Try to extract context from description
                        if (activity.description.includes('quiz')) {
                            activity.title = '🎯 Quiz Completed!';
                            activity.activity_type = 'quiz_completed';
                        } else if (activity.description.includes('lesson')) {
                            activity.title = '✅ Lesson Completed!';
                            activity.activity_type = 'lesson_completed';
                        } else if (activity.description.includes('study session')) {
                            activity.title = '📅 Study Session Completed!';
                            activity.activity_type = 'study_session_completed';
                        } else {
                            activity.title = `⭐ Earned ${activity.xp_earned} XP`;
                        }
                    }
                    
                    return true; // Keep enhanced XP activity
                }
                return true; // Keep all non-XP activities
            });
            
            // Sort by creation date (newest first)
            filteredActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setActivities(filteredActivities);
            setError(null);
        } catch (err) {
            setError("Failed to load activities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();

        // Listen for activity updates
        const handleActivityUpdate = () => {
            fetchActivities();
        };

        // Listen for various events that should trigger activity refresh
        window.addEventListener("activityUpdate", handleActivityUpdate);
        window.addEventListener("xpEarned", handleActivityUpdate);
        window.addEventListener("lessonCompleted", handleActivityUpdate);
        window.addEventListener("quizCompleted", handleActivityUpdate);
        window.addEventListener("studySessionAdded", handleActivityUpdate);

        // Cleanup event listeners
        return () => {
            window.removeEventListener("activityUpdate", handleActivityUpdate);
            window.removeEventListener("xpEarned", handleActivityUpdate);
            window.removeEventListener("lessonCompleted", handleActivityUpdate);
            window.removeEventListener("quizCompleted", handleActivityUpdate);
            window.removeEventListener("studySessionAdded", handleActivityUpdate);
        };
    }, []);

    const getActivityIcon = (activityType) => {
        switch (activityType) {
            case 'lesson_completed': return '✅';
            case 'quiz_passed':
            case 'quiz_completed': return '🎯';
            case 'streak_milestone': return '🔥';
            case 'level_up': return '🎉';
            case 'account_created': return '🎊';
            case 'study_session_added':
            case 'study_session_completed': return '📅';
            case 'xp_earned': return '⭐';
            default: return '📈';
        }
    };

    if (loading) {
        return (
            <div className="activity-container">
                <Navbar />
                <div className="activity-content">
                    <div className="loading">Loading your activity...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="activity-container">
            <Navbar />
            <div className="activity-content">
                <div className="activity-header">
                    <h1>Your Activity History</h1>
                    <p>Track your learning progress and achievements</p>
                    <button 
                        className="refresh-btn"
                        onClick={fetchActivities}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <div className="activity-timeline">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="timeline-item">
                                <div className={`timeline-icon ${activity.activity_type}`}>
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <h3 className="timeline-title">
                                            {activity.title}
                                            {activity.xp_earned > 0 && (
                                                <span className="inline-xp">+{activity.xp_earned} XP</span>
                                            )}
                                        </h3>
                                        <span className="timeline-time">{activity.time_ago}</span>
                                    </div>
                                    <p className="timeline-description">{activity.description}</p>
                                    <div className="timeline-badges">
                                        {activity.quiz_score && (
                                            <span className="timeline-score">Score: {activity.quiz_score}%</span>
                                        )}
                                        {activity.streak_count && (
                                            <span className="timeline-streak">{activity.streak_count} day streak</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-activity">
                            <div className="empty-icon">📊</div>
                            <h3>No Activity Yet</h3>
                            <p>Start learning to see your progress here!</p>
                            <button 
                                className="start-learning-btn"
                                onClick={() => navigate('/lessons')}
                            >
                                Browse Lessons
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Activity;