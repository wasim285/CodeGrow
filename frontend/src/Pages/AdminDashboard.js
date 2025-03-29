import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiBook, FiLayers, FiCheckCircle, FiActivity, FiChevronRight } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import AdminStatsCard from '../components/AdminStatsCard';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPathways: 0,
    totalLessons: 0,
    totalExercises: 0,
    completionRate: 0,
    newUsers: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const response = await api.get('admin/dashboard/');
        console.log('Admin dashboard data:', response.data);
        setStats(response.data);
        
        // Get recent users if available in response
        if (response.data.newUsers) {
          setRecentUsers(response.data.newUsers);
        } else {
          // Fetch users separately if not included in dashboard data
          const usersResponse = await api.get('admin/users/');
          setRecentUsers(usersResponse.data.results?.slice(0, 5) || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-error">
            <p>{error}</p>
            <button 
              className="admin-button admin-button-primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">Admin Dashboard</h1>
        </div>

        <div className="admin-widgets-container">
          <AdminStatsCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon={<FiUsers />}
            color="purple"
          />
          <AdminStatsCard
            title="Active Users"
            value={stats.activeUsers || 0}
            icon={<FiActivity />}
            color="blue"
          />
          <AdminStatsCard
            title="Learning Pathways"
            value={stats.totalPathways || 0}
            icon={<FiLayers />}
            color="green"
          />
          <AdminStatsCard
            title="Lessons"
            value={stats.totalLessons || 0}
            icon={<FiBook />}
            color="amber"
          />
        </div>

        <div className="admin-dashboard-grid">
          {/* Recent Users Section */}
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2 className="admin-table-title">Recent Users</h2>
              <Link to="/admin/users" className="admin-view-all">
                View All <FiChevronRight />
              </Link>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                      <td>
                        <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/users/${user.id}`} className="admin-button admin-button-secondary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="admin-empty-state">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Activity Section */}
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2 className="admin-table-title">Recent Activity</h2>
              <Link to="/admin/activity-log" className="admin-view-all">
                View All <FiChevronRight />
              </Link>
            </div>
            <div className="admin-activity-list">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-icon">
                      <FiActivity />
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-header">
                        <span className="admin-activity-user">{activity.user}</span>
                        <span className="admin-activity-type">{activity.action_type}</span>
                      </div>
                      <p className="admin-activity-details">{activity.details}</p>
                      <time className="admin-activity-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </time>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty-state">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;