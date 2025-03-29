import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminUser, activateAdminUser } from '../utils/api';
import { FaUser, FaEdit, FaUserSlash, FaUserCheck, FaArrowLeft } from 'react-icons/fa';

const AdminUserDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await getAdminUser(token, id);
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again.');
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, token]);

  const handleToggleActive = async () => {
    if (!user) return;
    
    try {
      await activateAdminUser(token, user.id, !user.is_active);
      setUser({
        ...user,
        is_active: !user.is_active
      });
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-error">{error || 'User not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div className="admin-header-title">
            <Link to="/admin/users" className="admin-back-button">
              <FaArrowLeft /> Back to Users
            </Link>
            <h1 className="admin-page-title">User Details</h1>
          </div>
          <div className="admin-header-actions">
            <Link to={`/admin/users/${id}/edit`} className="admin-button admin-button-secondary">
              <FaEdit style={{ marginRight: '0.5rem' }} /> Edit User
            </Link>
            <button
              onClick={handleToggleActive}
              className={`admin-button ${user.is_active ? 'admin-button-danger' : 'admin-button-primary'}`}
            >
              {user.is_active ? (
                <>
                  <FaUserSlash style={{ marginRight: '0.5rem' }} /> Deactivate User
                </>
              ) : (
                <>
                  <FaUserCheck style={{ marginRight: '0.5rem' }} /> Activate User
                </>
              )}
            </button>
          </div>
        </div>

        <div className="admin-user-detail-container">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.username} />
              ) : (
                <FaUser size={60} />
              )}
            </div>
            <div className="admin-user-header">
              <h2 className="admin-user-name">{user.username}</h2>
              <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className={`admin-role-badge ${user.role}`}>{user.role}</span>
            </div>
          </div>

          <div className="admin-detail-section">
            <h3>Basic Information</h3>
            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <span className="admin-detail-label">Email</span>
                <span className="admin-detail-value">{user.email}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Learning Goal</span>
                <span className="admin-detail-value">{user.learning_goal || 'Not set'}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Difficulty Level</span>
                <span className="admin-detail-value">{user.difficulty_level || 'Not set'}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Joined Date</span>
                <span className="admin-detail-value">
                  {new Date(user.date_joined).toLocaleDateString()}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Last Login</span>
                <span className="admin-detail-value">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleString() 
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="admin-detail-section">
              <h3>Bio</h3>
              <div className="admin-user-bio">
                {user.bio}
              </div>
            </div>
          )}
          
          {/* Additional sections like progress stats could go here */}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;