import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAdminUser, toggleUserStatus, deleteAdminUser } from '../utils/api';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await getAdminUser(id);
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again.');
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      const updatedStatus = !user.is_active;
      await toggleUserStatus(id, updatedStatus);
      setUser({ ...user, is_active: updatedStatus });
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to delete the user ${user.username}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteAdminUser(id);
      navigate('/admin/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-error-message">
        <p>User not found or you don't have permission to view this user.</p>
        <Link to="/admin/users" className="admin-button admin-button-secondary">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin/users" className="admin-back-button">
            &larr;
          </Link>
          <h1>User: {user.username}</h1>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={handleToggleStatus}
            className={`admin-button ${user.is_active ? 'admin-button-danger' : 'admin-button-primary'}`}
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <Link to={`/admin/users/${id}/edit`} className="admin-button admin-button-secondary">
            Edit
          </Link>
          <button onClick={handleDeleteUser} className="admin-button admin-button-danger">
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      <div className="admin-detail-container">
        <div className="admin-detail-card">
          <h2 className="admin-detail-title">User Information</h2>
          
          <div className="admin-detail-info">
            <div className="admin-detail-row">
              <span className="admin-detail-label">Username:</span>
              <span>{user.username}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Email:</span>
              <span>{user.email}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Full Name:</span>
              <span>
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : 'Not provided'}
              </span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Role:</span>
              <span>{user.role || 'student'}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Status:</span>
              <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Joined:</span>
              <span>{new Date(user.date_joined).toLocaleString()}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Last Login:</span>
              <span>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
            </div>
          </div>
        </div>

        <div className="admin-detail-card">
          <h2 className="admin-detail-title">Learning Information</h2>
          
          <div className="admin-detail-info">
            <div className="admin-detail-row">
              <span className="admin-detail-label">Learning Goal:</span>
              <span>{user.learning_goal || 'Not set'}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Difficulty Level:</span>
              <span>{user.difficulty_level || 'Not set'}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Completed Lessons:</span>
              <span>{user.completed_lessons_count || 0}</span>
            </div>
            
            <div className="admin-detail-row">
              <span className="admin-detail-label">Study Hours:</span>
              <span>{user.total_study_hours || 0} hours</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminUserDetail;