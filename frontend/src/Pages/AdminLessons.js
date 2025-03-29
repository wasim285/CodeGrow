import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminLessons, deleteAdminLesson } from '../utils/api';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminLessons = () => {
  const { token } = useContext(AuthContext);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    pathway_id: '',
    is_active: '',
    search: ''
  });

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const response = await getAdminLessons(token, currentPage, filters);
        setLessons(response.data.results || []);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons. Please try again.');
        setLoading(false);
      }
    };

    fetchLessons();
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

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled through filter changes
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteAdminLesson(token, id);
      setLessons(lessons.filter(lesson => lesson.id !== id));
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError('Failed to delete lesson. Please try again.');
    }
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading lessons...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">Lessons</h1>
          <Link to="/admin/lessons/new" className="admin-button admin-button-primary">
            <FaPlus style={{ marginRight: '0.5rem' }} /> Create Lesson
          </Link>
        </div>

        <div className="admin-filters-container">
          <form onSubmit={handleSearch} className="admin-search-form">
            <div className="admin-search-input">
              <input
                type="text"
                placeholder="Search lessons..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="admin-form-input"
              />
              <button type="submit" className="admin-search-button">
                Search
              </button>
            </div>
          </form>

          <div className="admin-filters">
            <select
              name="pathway_id"
              value={filters.pathway_id}
              onChange={handleFilterChange}
              className="admin-form-select"
            >
              <option value="">All Pathways</option>
              {/* Ideally you'd fetch pathway options and map them here */}
              <option value="1">Python Basics</option>
              <option value="2">Web Development</option>
              <option value="3">Data Science</option>
            </select>

            <select
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
              className="admin-form-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Pathway</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id}>
                  <td>{lesson.title}</td>
                  <td>{lesson.pathway_name || 'Not assigned'}</td>
                  <td>{lesson.difficulty_level}</td>
                  <td>
                    <span className={`admin-status ${lesson.is_active ? 'active' : 'inactive'}`}>
                      {lesson.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <Link to={`/admin/lessons/${lesson.id}`} className="admin-action-button view">
                      <FaEye />
                    </Link>
                    <Link to={`/admin/lessons/${lesson.id}/edit`} className="admin-action-button edit">
                      <FaEdit />
                    </Link>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)} 
                      className="admin-action-button delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {lessons.length === 0 && (
            <div className="admin-no-data">No lessons found matching your filters.</div>
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

export default AdminLessons;