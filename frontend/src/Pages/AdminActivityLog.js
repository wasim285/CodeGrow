import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminActivityLog } from '../utils/api';
import { FaFilter, FaCalendarAlt, FaUser, FaCode } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminActivityLog = () => {
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    activity_type: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    const fetchActivityLog = async () => {
      try {
        setLoading(true);
        const response = await getAdminActivityLog(token, currentPage, filters);
        setActivities(response.data.results || []);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
        setLoading(false);
      } catch (err) {
        console.error('Error fetching activity log:', err);
        setError('Failed to load activity log. Please try again.');
        setLoading(false);
      }
    };

    fetchActivityLog();
  }, [token, currentPage, filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Filters are already applied through the useEffect dependency
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <FaUser />;
      case 'lesson_view':
        return <FaCode />;
      case 'exercise_submission':
        return <FaCode />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case 'login':
        return 'Login';
      case 'lesson_view':
        return 'Lesson View';
      case 'lesson_complete':
        return 'Lesson Completed';
      case 'exercise_start':
        return 'Exercise Started';
      case 'exercise_submission':
        return 'Exercise Submitted';
      case 'exercise_complete':
        return 'Exercise Completed';
      case 'pathway_start':
        return 'Pathway Started';
      case 'pathway_complete':
        return 'Pathway Completed';
      default:
        return type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading activity log...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">Activity Log</h1>
        </div>

        <div className="admin-filters-container">
          <form onSubmit={handleFilterSubmit} className="admin-filters-form">
            <div className="admin-filters-header">
              <FaFilter /> <span>Filter Activities</span>
            </div>
            
            <div className="admin-filters-grid">
              <div className="admin-filter-group">
                <label>Activity Type</label>
                <select
                  name="activity_type"
                  value={filters.activity_type}
                  onChange={handleFilterChange}
                  className="admin-form-select"
                >
                  <option value="">All Types</option>
                  <option value="login">Login</option>
                  <option value="lesson_view">Lesson View</option>
                  <option value="lesson_complete">Lesson Complete</option>
                  <option value="exercise_submission">Exercise Submission</option>
                  <option value="exercise_complete">Exercise Complete</option>
                  <option value="pathway_start">Pathway Start</option>
                  <option value="pathway_complete">Pathway Complete</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Date From</label>
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-filter-group">
                <label>Date To</label>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="admin-form-input"
                />
              </div>

              <div className="admin-filter-group">
                <label>User ID</label>
                <input
                  type="text"
                  name="user_id"
                  value={filters.user_id}
                  onChange={handleFilterChange}
                  placeholder="Enter user ID"
                  className="admin-form-input"
                />
              </div>
            </div>
            
            <div className="admin-filters-actions">
              <button type="submit" className="admin-button admin-button-primary">
                Apply Filters
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setFilters({
                    activity_type: '',
                    user_id: '',
                    date_from: '',
                    date_to: ''
                  });
                }}
                className="admin-button admin-button-secondary"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        <div className="admin-activity-log-container">
          {activities.length > 0 ? (
            <div className="admin-activity-log">
              {activities.map((activity, index) => (
                <div key={index} className="admin-activity-log-item">
                  <div className="admin-activity-log-icon">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="admin-activity-log-content">
                    <div className="admin-activity-log-header">
                      <span className="admin-activity-log-type">
                        {getActivityTypeLabel(activity.activity_type)}
                      </span>
                      <span className="admin-activity-log-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-activity-log-user">
                      User: {activity.username || activity.user_id}
                    </div>
                    <div className="admin-activity-log-details">
                      {activity.details}
                    </div>
                    {activity.resource_type && (
                      <div className="admin-activity-log-resource">
                        {`${activity.resource_type}: ${activity.resource_name || activity.resource_id}`}
                      </div>
                    )}
                    {activity.ip_address && (
                      <div className="admin-activity-log-ip">
                        IP: {activity.ip_address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-no-data">No activities found matching your filters.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="admin-pagination-button"
            >
              Previous
            </button>
            
            <div className="admin-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`admin-pagination-page ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="admin-pagination-button"
            >
              Next
            </button>
          </div>
        )}

        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminActivityLog;