import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminPathway, deleteAdminPathway } from '../utils/api';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';

const AdminPathwayDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPathwayDetails = async () => {
      try {
        setLoading(true);
        const response = await getAdminPathway(token, id);
        setPathway(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pathway details:', err);
        setError('Failed to load pathway details. Please try again.');
        setLoading(false);
      }
    };

    fetchPathwayDetails();
  }, [id, token]);

  const handleDeletePathway = async () => {
    if (!window.confirm('Are you sure you want to delete this pathway? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteAdminPathway(token, id);
      navigate('/admin/pathways');
    } catch (err) {
      console.error('Error deleting pathway:', err);
      setError('Failed to delete pathway. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading pathway details...</div>
        </div>
      </div>
    );
  }

  if (!pathway) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-error-message">Pathway not found or you don't have permission to view it.</div>
          <Link to="/admin/pathways" className="admin-back-link">
            <FaArrowLeft /> Back to Pathways
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
            <Link to="/admin/pathways" className="admin-back-button">
              <FaArrowLeft />
            </Link>
            <h1 className="admin-page-title">{pathway.name}</h1>
          </div>
          <div className="admin-header-actions">
            <Link to={`/admin/pathways/${id}/edit`} className="admin-button admin-button-secondary">
              <FaEdit style={{ marginRight: '0.5rem' }} /> Edit
            </Link>
            <button 
              onClick={handleDeletePathway} 
              className="admin-button admin-button-danger"
            >
              <FaTrash style={{ marginRight: '0.5rem' }} /> Delete
            </button>
          </div>
        </div>

        <div className="admin-detail-container">
          <div className="admin-detail-card">
            <h2 className="admin-detail-title">Pathway Details</h2>
            
            <div className="admin-detail-info">
              <div className="admin-detail-row">
                <span className="admin-detail-label">Status:</span>
                <span className={`admin-status ${pathway.is_active ? 'active' : 'inactive'}`}>
                  {pathway.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Difficulty Level:</span>
                <span>{pathway.difficulty_level}</span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Created:</span>
                <span>{new Date(pathway.created_at).toLocaleString()}</span>
              </div>
              
              <div className="admin-detail-row">
                <span className="admin-detail-label">Last Updated:</span>
                <span>{new Date(pathway.updated_at).toLocaleString()}</span>
              </div>
              
              <div className="admin-detail-row full">
                <span className="admin-detail-label">Description:</span>
                <div className="admin-detail-text">
                  {pathway.description}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-detail-card">
            <h2 className="admin-detail-title">Lessons in This Pathway</h2>
            
            {pathway.lessons && pathway.lessons.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pathway.lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td>{lesson.order}</td>
                      <td>{lesson.title}</td>
                      <td>
                        <span className={`admin-status ${lesson.is_active ? 'active' : 'inactive'}`}>
                          {lesson.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/lessons/${lesson.id}`} className="admin-action-button view">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-no-data">No lessons have been assigned to this pathway yet.</div>
            )}
            
            <div className="admin-detail-actions">
              <Link to={`/admin/pathways/${id}/lessons/new`} className="admin-button admin-button-primary">
                Add Lesson
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminPathwayDetail;