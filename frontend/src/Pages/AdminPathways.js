import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/api';
import '../styles/AdminPathways.css';

const AdminPathways = () => {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pathwayToDelete, setPathwayToDelete] = useState(null);

  const fetchPathways = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      
      if (searchTerm) params.append('search', searchTerm);
      if (filter !== 'all') params.append('is_active', filter === 'active' ? 'true' : 'false');
      
      const response = await api.get(`admin/pathways/?${params.toString()}`);
      
      if (response.data.results) {
        setPathways(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming page size of 10
      } else {
        setPathways(response.data);
      }
      
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pathways:', err);
      setError('Failed to load learning pathways. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPathways();
  }, [filter]); // Re-fetch when filter changes

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPathways(1); // Reset to first page when searching
  };

  const confirmDelete = (pathway) => {
    setPathwayToDelete(pathway);
    setShowDeleteModal(true);
  };

  const handleDeletePathway = async (pathwayId) => {
    try {
      await api.delete(`admin/pathways/${pathwayId}/`);
      setPathways(pathways.filter(p => p.id !== pathwayId));
      setShowDeleteModal(false);
      setPathwayToDelete(null);
    } catch (err) {
      console.error('Error deleting pathway:', err);
      setError('Failed to delete pathway. Please try again.');
    }
  };

  const handleTogglePathwayStatus = async (pathwayId, currentStatus) => {
    try {
      await api.patch(`admin/pathways/${pathwayId}/`, {
        is_active: !currentStatus
      });
      
      // Update the pathways list without refetching
      setPathways(pathways.map(pathway => 
        pathway.id === pathwayId ? { ...pathway, is_active: !currentStatus } : pathway
      ));
    } catch (err) {
      console.error('Error toggling pathway status:', err);
      setError('Failed to update pathway status. Please try again.');
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchPathways(page);
  };

  return (
    <div className="admin-pathways-container">
      <AdminSidebar activePage="pathways" />
      <div className="admin-content">
        <header className="admin-header">
          <h1>Manage Learning Pathways</h1>
          <div className="admin-actions">
            <Link to="/admin/pathways/new" className="admin-btn primary">
              <i className="fas fa-plus"></i> Create New Pathway
            </Link>
          </div>
        </header>

        <div className="admin-toolbar">
          <form onSubmit={handleSearch} className="admin-search-form">
            <input
              type="text"
              placeholder="Search pathways..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-search-btn">
              <i className="fas fa-search"></i>
            </button>
          </form>

          <div className="admin-filter">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">All Pathways</option>
              <option value="active">Active Pathways</option>
              <option value="inactive">Inactive Pathways</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Loading learning pathways...</p>
          </div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : (
          <>
            <div className="pathways-grid">
              {pathways.length > 0 ? (
                pathways.map(pathway => (
                  <div key={pathway.id} className="pathway-card">
                    <div className="pathway-header">
                      <h3 className="pathway-name">{pathway.name}</h3>
                      <span className={`status-badge ${pathway.is_active ? 'active' : 'inactive'}`}>
                        {pathway.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="pathway-description">
                      {pathway.description?.length > 150 
                        ? `${pathway.description.substring(0, 150)}...` 
                        : pathway.description}
                    </div>
                    
                    <div className="pathway-meta">
                      <span>
                        <i className="fas fa-book"></i> {pathway.lesson_count || 0} Lessons
                      </span>
                      <span>
                        <i className="fas fa-users"></i> {pathway.enrolled_users || 0} Enrolled
                      </span>
                    </div>
                    
                    <div className="pathway-actions">
                      <Link to={`/admin/pathways/${pathway.id}`} className="action-btn view">
                        <i className="fas fa-eye"></i> View
                      </Link>
                      <Link to={`/admin/pathways/${pathway.id}/edit`} className="action-btn edit">
                        <i className="fas fa-edit"></i> Edit
                      </Link>
                      <button 
                        className={`action-btn ${pathway.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleTogglePathwayStatus(pathway.id, pathway.is_active)}
                      >
                        <i className={`fas fa-${pathway.is_active ? 'toggle-off' : 'toggle-on'}`}></i>
                        {pathway.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => confirmDelete(pathway)}
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">
                  <i className="fas fa-route fa-3x"></i>
                  <p>No learning pathways found.</p>
                  <Link to="/admin/pathways/new" className="admin-btn primary">
                    Create your first pathway
                  </Link>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                <button 
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && pathwayToDelete && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h3>Delete Learning Pathway</h3>
              <p>
                Are you sure you want to delete <strong>{pathwayToDelete.name}</strong>? 
                This action cannot be undone and will remove all associated lessons and user progress.
              </p>
              <div className="modal-actions">
                <button 
                  className="modal-btn cancel"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPathwayToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn delete"
                  onClick={() => handleDeletePathway(pathwayToDelete.id)}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPathways;