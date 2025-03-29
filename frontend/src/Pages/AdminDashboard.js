import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import AdminStatsCard from '../components/AdminStatsCard';
import { getAdminStats } from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    user_count: 0,
    active_users: 0,
    pathway_count: 0,
    lesson_count: 0,
    exercise_count: 0,
    completion_rate: 0
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
        setError('Failed to load dashboard data. Please try again.');
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
          <div className="admin-loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
        
        <div className="admin-stats-grid">
          <AdminStatsCard 
            title="Total Users" 
            value={stats.user_count} 
            iconText="👥"
            color="primary"
          />
          <AdminStatsCard 
            title="Active Users" 
            value={stats.active_users} 
            iconText="👤"
            color="success"
          />
          <AdminStatsCard 
            title="Learning Pathways" 
            value={stats.pathway_count} 
            iconText="🛣️"
            color="info"
          />
          <AdminStatsCard 
            title="Lessons" 
            value={stats.lesson_count} 
            iconText="📚"
            color="warning"
          />
          <AdminStatsCard 
            title="Coding Exercises" 
            value={stats.exercise_count} 
            iconText="💻"
            color="danger"
          />
          <AdminStatsCard 
            title="Completion Rate" 
            value={`${stats.completion_rate}%`} 
            iconText="🏆"
            color="dark"
          />
        </div>

        <div className="admin-dashboard-sections">
          <div className="admin-dashboard-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Recent Activity</h2>
              <Link to="/admin/activity" className="admin-view-all-link">View All</Link>
            </div>
            <div className="admin-activity-list">
              {stats.recent_activities?.length > 0 ? (
                stats.recent_activities.map((activity, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-content">
                      <span className="admin-activity-user">{activity.username}</span> 
                      <span className="admin-activity-action">{activity.action}</span>
                      <span className="admin-activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="admin-no-data">No recent activity.</p>
              )}
            </div>
          </div>
          
          <div className="admin-dashboard-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">New Users</h2>
              <Link to="/admin/users" className="admin-view-all-link">View All</Link>
            </div>
            <div className="admin-user-list">
              {stats.new_users?.length > 0 ? (
                stats.new_users.map((user, index) => (
                  <Link to={`/admin/users/${user.id}`} key={index} className="admin-user-item">
                    <div className="admin-avatar-small">
                      <div className="admin-avatar-placeholder-small">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="admin-user-details">
                      <div className="admin-user-name">{user.username}</div>
                      <div className="admin-user-joined">Joined {new Date(user.date_joined).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="admin-no-data">No new users.</p>
              )}
            </div>
          </div>
        </div>

        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;