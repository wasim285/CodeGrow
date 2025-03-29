import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminStats } from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLessons: 0,
    totalPathways: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getAdminStats(token);
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load dashboard statistics. Please try again.');
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading dashboard stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <h1 className="admin-page-title">Admin Dashboard</h1>
        
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon users">
              👥
            </div>
            <div className="admin-stat-info">
              <h3 className="admin-stat-title">Total Users</h3>
              <p className="admin-stat-value">{stats.totalUsers}</p>
              <p className="admin-stat-desc">{stats.activeUsers} active users</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon pathways">
              🛣️
            </div>
            <div className="admin-stat-info">
              <h3 className="admin-stat-title">Learning Pathways</h3>
              <p className="admin-stat-value">{stats.totalPathways}</p>
              <p className="admin-stat-desc">{stats.activePathways} active</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon lessons">
              📖
            </div>
            <div className="admin-stat-info">
              <h3 className="admin-stat-title">Lessons</h3>
              <p className="admin-stat-value">{stats.totalLessons}</p>
              <p className="admin-stat-desc">{stats.activeLessons} active</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon exercises">
              📝
            </div>
            <div className="admin-stat-info">
              <h3 className="admin-stat-title">Exercises</h3>
              <p className="admin-stat-value">{stats.totalExercises || 0}</p>
              <p className="admin-stat-desc">{stats.completedExercises || 0} completed by users</p>
            </div>
          </div>
        </div>
        
        <div className="admin-dashboard-row">
          <div className="admin-dashboard-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Recent Activity</h2>
                <Link to="/admin/activity" className="admin-view-all">View All</Link>
              </div>
              
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="admin-activity-list">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="admin-activity-item">
                      <div className="admin-activity-icon">
                        📅
                      </div>
                      <div className="admin-activity-content">
                        <p className="admin-activity-text">{activity.description}</p>
                        <p className="admin-activity-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-no-data">No recent activity to display.</div>
              )}
            </div>
          </div>
          
          <div className="admin-dashboard-col">
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">New Users</h2>
                <Link to="/admin/users" className="admin-view-all">View All</Link>
              </div>
              
              {stats.newUsers && stats.newUsers.length > 0 ? (
                <div className="admin-users-list">
                  {stats.newUsers.map((user, index) => (
                    <div key={index} className="admin-user-item">
                      <div className="admin-user-avatar">
                        {user.profile_picture ? (
                          <img src={user.profile_picture} alt={user.username} />
                        ) : (
                          <div className="admin-avatar-placeholder">👤</div>
                        )}
                      </div>
                      <div className="admin-user-info">
                        <p className="admin-user-name">{user.username}</p>
                        <p className="admin-user-joined">
                          Joined {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-no-data">No new users to display.</div>
              )}
            </div>
            
            <div className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">User Progress</h2>
              </div>
              
              <div className="admin-progress-stats">
                <div className="admin-progress-item">
                  <div className="admin-progress-info">
                    <span className="admin-progress-label">Completed Lessons</span>
                    <span className="admin-progress-value">{stats.completedLessons || 0}</span>
                  </div>
                  <div className="admin-progress-bar">
                    <div 
                      className="admin-progress-fill"
                      style={{ 
                        width: `${stats.totalLessons > 0 ? 
                          (stats.completedLessons / stats.totalLessons) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="admin-progress-item">
                  <div className="admin-progress-info">
                    <span className="admin-progress-label">Exercise Success Rate</span>
                    <span className="admin-progress-value">{stats.exerciseSuccessRate || 0}%</span>
                  </div>
                  <div className="admin-progress-bar">
                    <div 
                      className="admin-progress-fill success"
                      style={{ width: `${stats.exerciseSuccessRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;