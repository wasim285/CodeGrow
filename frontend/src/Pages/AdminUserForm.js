import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminUser, createAdminUser, updateAdminUser } from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewUser = !id;
  const [loading, setLoading] = useState(!isNewUser);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
    role: 'student',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    learning_goal: 'general',
    difficulty_level: 'beginner'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (isNewUser) return;
      
      try {
        const response = await getAdminUser(id);
        const userData = response.data;
        
        // Remove password fields for editing existing users
        const { password, ...userDataWithoutPassword } = userData;
        
        setFormData({
          ...userDataWithoutPassword,
          password: '',
          confirm_password: ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, isNewUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    // Required fields
    const requiredFields = ['username', 'email'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required.`);
        return false;
      }
    }
    
    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    // Password requirements for new users
    if (isNewUser) {
      if (!formData.password) {
        setError('Password is required for new users.');
        return false;
      }
      
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match.');
        return false;
      }
    } else if (formData.password) {
      // Password validation for existing users (only if password provided)
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare submission data (remove confirm_password)
      const { confirm_password, ...submissionData } = formData;
      
      // Don't send empty password for existing users
      if (!isNewUser && !submissionData.password) {
        delete submissionData.password;
      }
      
      // Create or update based on whether we have an ID
      if (isNewUser) {
        await createAdminUser(submissionData);
      } else {
        await updateAdminUser(id, submissionData);
      }
      
      navigate('/admin/users');
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.detail || 'Failed to save user. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>{isNewUser ? 'Preparing form...' : 'Loading user data...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">{isNewUser ? 'Create New User' : 'Edit User'}</h1>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">User Information</h2>
            
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="username" className="admin-form-label">Username*</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="email" className="admin-form-label">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="first_name" className="admin-form-label">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="admin-form-input"
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="last_name" className="admin-form-label">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="admin-form-input"
                />
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Password</h2>
            <p className="admin-form-section-desc">
              {isNewUser 
                ? 'Set a password for this new user.' 
                : 'Leave blank to keep the current password.'}
            </p>
            
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="password" className="admin-form-label">
                  Password {isNewUser && '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="admin-form-input"
                  required={isNewUser}
                  minLength={8}
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="confirm_password" className="admin-form-label">
                  Confirm Password {isNewUser && '*'}
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="admin-form-input"
                  required={isNewUser}
                />
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Roles & Permissions</h2>
            
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="role" className="admin-form-label">User Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>
              
              <div className="admin-form-group">
                <div className="admin-checkbox-group">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="admin-form-checkbox"
                  />
                  <label htmlFor="is_active" className="admin-checkbox-label">
                    Active Account
                  </label>
                </div>
                
                <div className="admin-checkbox-group">
                  <input
                    type="checkbox"
                    id="is_staff"
                    name="is_staff"
                    checked={formData.is_staff}
                    onChange={handleChange}
                    className="admin-form-checkbox"
                  />
                  <label htmlFor="is_staff" className="admin-checkbox-label">
                    Staff Access (Django Admin)
                  </label>
                </div>
                
                <div className="admin-checkbox-group">
                  <input
                    type="checkbox"
                    id="is_superuser"
                    name="is_superuser"
                    checked={formData.is_superuser}
                    onChange={handleChange}
                    className="admin-form-checkbox"
                  />
                  <label htmlFor="is_superuser" className="admin-checkbox-label">
                    Superuser Access
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Learning Preferences</h2>
            
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="learning_goal" className="admin-form-label">Learning Goal</label>
                <select
                  id="learning_goal"
                  name="learning_goal"
                  value={formData.learning_goal}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="general">General Programming</option>
                  <option value="web_dev">Web Development</option>
                  <option value="data_science">Data Science</option>
                  <option value="mobile_dev">Mobile Development</option>
                </select>
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="difficulty_level" className="admin-form-label">Difficulty Level</label>
                <select
                  id="difficulty_level"
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/admin/users')}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-button admin-button-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isNewUser ? 'Create User' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminUserForm;