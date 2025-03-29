import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminLesson, deleteAdminLesson } from '../utils/api';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';

const AdminLessonDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        setLoading(true);
        const response = await getAdminLesson(token, id);
        setLesson(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson details:', err);
        setError('Failed to load lesson details. Please try again.');
        setLoading(false);
      }
    };

    fetchLessonDetails();
  }, [id, token]);

  const handleDeleteLesson = async () => {
    if (!window.confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteAdminLesson(token, id);
      navigate('/admin/lessons');
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError('Failed to delete lesson. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading lesson details...</div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-error-message">Lesson not found or you don't have permission to view it.</div>
          <Link to="/admin/lessons" className="admin-back-link">
            <FaArrowLeft /> Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div className="admin-header-left">
            <Link to="/admin/lessons" className="admin-back-button">
              <FaArrowLeft />
            </Link>
            <h1 className="admin-page-title">{lesson.title}</h1>
          </div>
          <div className="admin-header-actions">
            <Link to={`/admin/lessons/${id}/edit`} className="admin-button admin-button-secondary">
              <FaEdit style={{ marginRight: '0.5rem' }} /> Edit
            </Link>
            <button 
              onClick={handleDeleteLesson} 
              className="admin-button admin-button-danger"
            >
              <FaTrash style={{ marginRight: '0.5rem' }} /> Delete
            </button>
          </div>
        </div>

        <div className="admin-detail-container">
          <div className="admin-detail-card">
            <h2 className="admin-detail-title">Lesson Details</h2>
            
            <div className="admin-detail-info">
              <div className="admin-detail-row">
                <span className="admin-detail-label">Status:</span>
                <span className={`admin-status ${lesson.is_active ? 'active' : 'inactive'}`}>
                  {lesson.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="admin-detail-row">
                <span className="admin-detail-label">Pathway:</span>
                <span>
                  {lesson.pathway_name ? (
                    <Link to={`/admin/pathways/${lesson.pathway_id}`}>
                      {lesson.pathway_name}
                    </Link>
                  ) : (
                    'Not assigned to a pathway'
                  )}
                </span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Difficulty Level:</span>
                <span>{lesson.difficulty_level}</span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Created:</span>
                <span>{new Date(lesson.created_at).toLocaleString()}</span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Last Updated:</span>
                <span>{new Date(lesson.updated_at).toLocaleString()}</span>
              </div>
              
              <div className="admin-detail-row full">
                <span className="admin-detail-label">Description:</span>
                <div className="admin-detail-text">
                  {lesson.description}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-detail-card">
            <h2 className="admin-detail-title">Lesson Content</h2>
            
            <div className="admin-detail-content">
              <div className="admin-lesson-content" 
                   dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          </div>

          <div className="admin-detail-card">
            <h2 className="admin-detail-title">Coding Exercise</h2>
            
            {lesson.exercise ? (
              <div className="admin-detail-exercise">
                <h3 className="admin-exercise-title">{lesson.exercise.title}</h3>
                <div className="admin-exercise-description">
                  {lesson.exercise.description}
                </div>
                
                <div className="admin-exercise-code">
                  <h4>Starting Code</h4>
                  <pre className="admin-code-block">{lesson.exercise.starter_code}</pre>
                </div>
                
                <div className="admin-exercise-code">
                  <h4>Expected Output</h4>
                  <pre className="admin-code-block">{lesson.exercise.expected_output}</pre>
                </div>
              </div>
            ) : (
              <div className="admin-no-data">No coding exercise has been added to this lesson.</div>
            )}
            
            <div className="admin-detail-actions">
              {lesson.exercise ? (
                <Link to={`/admin/lessons/${id}/exercise/edit`} className="admin-button admin-button-secondary">
                  Edit Exercise
                </Link>
              ) : (
                <Link to={`/admin/lessons/${id}/exercise/new`} className="admin-button admin-button-primary">
                  Add Exercise
                </Link>
              )}
            </div>
          </div>
        </div>

        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminLessonDetail;