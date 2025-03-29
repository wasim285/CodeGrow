import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminUser, createAdminUser, updateAdminUser } from '../utils/api';

const AdminUserForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    is_active: true,
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchUser = async () => {
        try {
          const response = await getAdminUser(id);
          const userData = response.data;
          
          // Don't include password in edit form
          setFormData({
            username: userData.username || '',
            email: userData.email || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'student',
            is_active: userData.is_active ?? true,
            password: '',
            confirm_password: '',
          });
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching user:', err);
          setError('Failed to load user data. Please try again.');
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) errors.username = 'Username is required';
    if (!formData.email) errors.email = 'Email is required';
    
    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
    } else if (formData.password && formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }
    
    try {
      setLoading(true);
      
      // Remove confirm_password field before submitting
      const dataToSubmit = { ...formData };
      delete dataToSubmit.confirm_password;
      
      // Only send password if it has a value
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      if (isEdit) {
        await updateAdminUser(id, dataToSubmit);
      } else {
        await createAdminUser(dataToSubmit);
      }
      
      navigate('/admin/users');
    } catch (err) {
      console.error('Error saving user:', err);
      if (err.response && err.response.data) {
        // Process validation errors from API
        const apiErrors = err.response.data;
        const firstError = Object.values(apiErrors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Failed to save user. Please try again.');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1>{isEdit ? 'Edit User' : 'Create New User'}</h1>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Account Information</h2>
          
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">User Role & Status</h2>
          
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <div className="admin-form-group admin-form-checkbox-group">
              <label htmlFor="is_active" className="admin-checkbox-container">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="admin-checkbox-label">Active Account</span>
              </label>
              <span className="admin-form-help">Inactive accounts cannot log in</span>
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">
            {isEdit ? 'Change Password (leave blank to keep current)' : 'Password'}
          </h2>
          
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="password">{isEdit ? 'New Password' : 'Password'} {!isEdit && '*'}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEdit}
                minLength={8}
              />
              <span className="admin-form-help">Minimum 8 characters</span>
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="confirm_password">Confirm Password {!isEdit && '*'}</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required={!isEdit || !!formData.password}
              />
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
            {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminUserForm;