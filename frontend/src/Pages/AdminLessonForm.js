import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminLessonForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewLesson = !id;
  
  const [loading, setLoading] = useState(!isNewLesson);
  const [error, setError] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    pathway: '',
    order: 1,
    difficulty_level: 'beginner',
    is_published: true,
    estimated_minutes: 30,
    exercise: {
      instructions: '',
      starter_code: '',
      solution_code: '',
      test_code: '',
      language: 'javascript'
    }
  });

  useEffect(() => {
    fetchPathways();
    
    if (isNewLesson) return;
    
    const fetchLessonData = async () => {
      try {
        const response = await api.get(`admin/lessons/${id}/`);
        // Ensure exercise object exists
        const lessonData = {
          ...response.data,
          exercise: response.data.exercise || {
            instructions: '',
            starter_code: '',
            solution_code: '',
            test_code: '',
            language: 'javascript'
          }
        };
        setFormData(lessonData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson data. Please try again.');
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [id, isNewLesson]);

  const fetchPathways = async () => {
    try {
      const response = await api.get('admin/pathways/?is_active=true');
      setPathways(response.data.results || []);
    } catch (err) {
      console.error('Error fetching pathways:', err);
      setError('Failed to load pathways. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      exercise: {
        ...formData.exercise,
        [name]: value
      }
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    
    if (!formData.pathway) {
      setError('Pathway is required');
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
      if (isNewLesson) {
        await api.post('admin/lessons/', formData);
      } else {
        await api.put(`admin/lessons/${id}/`, formData);
      }
      
      navigate('/admin/lessons');
    } catch (err) {
      console.error('Error saving lesson:', err);
      setError(err.response?.data?.detail || 'Failed to save lesson. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>{isNewLesson ? 'Preparing form...' : 'Loading lesson data...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-page-title">
          {isNewLesson ? 'Create New Lesson' : 'Edit Lesson'}
        </h1>
        <div className="admin-header-actions">
          <button 
            onClick={() => navigate('/admin/lessons')}
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
              <label htmlFor="pathway" className="admin-form-label">Pathway*</label>
              <select
                id="pathway"
                name="pathway"
                value={formData.pathway}
                onChange={handleChange}
                className="admin-form-select"
                required
              >
                <option value="">Select a pathway</option>
                {pathways.map(pathway => (
                  <option key={pathway.id} value={pathway.id}>
                    {pathway.title}
                  </option>
                ))}
              </select>
            </div>
            
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
              <label htmlFor="order" className="admin-form-label">Order in Pathway</label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="admin-form-input"
                min="1"
              />
              <small className="admin-form-help">Position of this lesson in the pathway sequence</small>
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
              <label htmlFor="estimated_minutes" className="admin-form-label">Estimated Completion Time (minutes)</label>
              <input
                type="number"
                id="estimated_minutes"
                name="estimated_minutes"
                value={formData.estimated_minutes}
                onChange={handleChange}
                className="admin-form-input"
                min="1"
              />
            </div>
            
            <div className="admin-form-group">
              <div className="admin-checkbox-group">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="admin-form-checkbox"
                />
                <label htmlFor="is_published" className="admin-checkbox-label">
                  Published (visible to users)
                </label>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Lesson Content</h2>
            <div className="admin-form-group">
              <label htmlFor="content" className="admin-form-label">Content*</label>
              <small className="admin-form-help">Supports Markdown formatting</small>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="admin-form-textarea admin-content-editor"
                rows="15"
                required
              />
            </div>
          </div>
          
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">Exercise (Optional)</h2>
            <p className="admin-form-help">Create an interactive exercise for students to practice what they've learned</p>
            
            <div className="admin-form-group">
              <label htmlFor="language" className="admin-form-label">Programming Language</label>
              <select
                id="language"
                name="language"
                value={formData.exercise.language}
                onChange={handleExerciseChange}
                className="admin-form-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="instructions" className="admin-form-label">Instructions</label>
              <small className="admin-form-help">Supports Markdown formatting</small>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.exercise.instructions}
                onChange={handleExerciseChange}
                className="admin-form-textarea"
                rows="5"
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="starter_code" className="admin-form-label">Starter Code</label>
              <small className="admin-form-help">Initial code provided to students</small>
              <textarea
                id="starter_code"
                name="starter_code"
                value={formData.exercise.starter_code}
                onChange={handleExerciseChange}
                className="admin-form-textarea admin-code-editor"
                rows="8"
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="solution_code" className="admin-form-label">Solution Code</label>
              <small className="admin-form-help">Correct implementation (not shown to students)</small>
              <textarea
                id="solution_code"
                name="solution_code"
                value={formData.exercise.solution_code}
                onChange={handleExerciseChange}
                className="admin-form-textarea admin-code-editor"
                rows="8"
              />
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="test_code" className="admin-form-label">Test Code</label>
              <small className="admin-form-help">Code to test student submissions</small>
              <textarea
                id="test_code"
                name="test_code"
                value={formData.exercise.test_code}
                onChange={handleExerciseChange}
                className="admin-form-textarea admin-code-editor"
                rows="8"
              />
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/admin/lessons')}
              className="admin-button admin-button-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-button admin-button-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isNewLesson ? 'Create Lesson' : 'Update Lesson'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminLessonForm;