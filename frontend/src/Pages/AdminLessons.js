import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminLessons } from '../utils/api';

const AdminLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    difficulty_level: '',
    is_active: ''
  });

  useEffect(() => {
    fetchLessons();
  }, [currentPage, filters]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await getAdminLessons(currentPage, searchQuery, filters);
      
      if (response.data.results) {
        setLessons(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
      } else {
        setLessons(response.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Failed to load lessons. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLessons();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1);
  };

  return (
    <>
      <div className="admin-header">
        <h1>Lesson Management</h1>
        <div className="admin-header-actions">
          <Link to="/admin/lessons/new" className="admin-button admin-button-primary">
            Add New Lesson
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      <div className="admin-filters-container">
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-form-input"
          />
          <button type="submit" className="admin-button admin-button-secondary">
            Search
          </button>
        </form>

        <div className="admin-filters">
          <select
            name="difficulty_level"
            value={filters.difficulty_level}
            onChange={handleFilterChange}
            className="admin-form-select"
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
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
        {loading ? (
          <div className="admin-loading">Loading lessons...</div>
        ) : lessons.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.title}</td>
                  <td>{lesson.difficulty_level}</td>
                  <td>{lesson.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-no-data">No lessons found.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="admin-pagination-button"
          >
            Previous
          </button>
          <span className="admin-pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="admin-pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default AdminLessons;