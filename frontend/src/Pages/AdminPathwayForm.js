import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminPathway, createAdminPathway, updateAdminPathway } from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminPathwayForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewPathway = !id;
  
  const [loading, setLoading] = useState(!isNewPathway);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    is_active: true,
    estimated_hours: '',
    prerequisites: '',
    learning_objectives: '',
    thumbnail_url: ''
  });

  useEffect(() => {
    if (isNewPathway) return;
    
    const fetchPathwayData = async () => {
      try {
        const response = await getAdminPathway(id);
        setFormData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pathway:', err);
        setError('Failed to load pathway data. Please try again.');
        setLoading(false);
      }
    };

    fetchPathwayData();
  }, [id, isNewPathway]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isNewPathway) {
        await createAdminPathway(formData);
      } else {
        await updateAdminPathway(id, formData);
      }
      
      navigate('/admin/pathways');
    } catch (err) {
      console.error('Error saving pathway:', err);
      setError(err.response?.data?.detail || 'Failed to save pathway. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>{isNewPathway ? 'Preparing form...' : 'Loading pathway data...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">
          {isNewPathway ? 'Create New Learning Pathway' : 'Edit Learning Pathway'}
        </h1>
        <div className="admin-header-actions">
          <button 
            onClick={() => navigate('/admin/pathways')}
            className="admin-button admin-button-secondary"
          >
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Basic Information</h2>
            
            <div className="admin-form-group">
              <label htmlFor="title" className="admin-form-label">Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="admin-form-input"
                required
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="description" className="admin-form-label">Description*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="admin-form-textarea"
                rows="5"
                required
              />
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
                  Active (visible to users)
                </label>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Additional Details</h2>
            
            <div className="admin-form-group">
              <label htmlFor="estimated_hours" className="admin-form-label">Estimated Hours to Complete</label>
              <input
                type="number"
                id="estimated_hours"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                className="admin-form-input"
                min="0"
                step="0.5"
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="prerequisites" className="admin-form-label">Prerequisites</label>
              <textarea
                id="prerequisites"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleChange}
                className="admin-form-textarea"
                rows="3"
                placeholder="Knowledge or skills required before starting this pathway"
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="learning_objectives" className="admin-form-label">Learning Objectives</label>
              <textarea
                id="learning_objectives"
                name="learning_objectives"
                value={formData.learning_objectives}
                onChange={handleChange}
                className="admin-form-textarea"
                rows="3"
                placeholder="What students will learn from this pathway"
              />
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Media</h2>
            
            <div className="admin-form-group">
              <label htmlFor="thumbnail_url" className="admin-form-label">Thumbnail URL</label>
              <input
                type="text"
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                className="admin-form-input"
                placeholder="https://example.com/image.jpg"
              />
              {formData.thumbnail_url && (
                <div className="admin-thumbnail-preview">
                  <img 
                    src={formData.thumbnail_url} 
                    alt="Pathway thumbnail preview" 
                    onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL'}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/admin/pathways')}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-button admin-button-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isNewPathway ? 'Create Pathway' : 'Update Pathway'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminPathwayForm;