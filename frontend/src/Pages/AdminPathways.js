import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminPathways, deleteAdminPathway } from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminPathways = () => {
  const { token } = useContext(AuthContext);
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    is_active: ''
  });

  useEffect(() => {
    const fetchPathways = async () => {
      try {
        setLoading(true);
        const response = await getAdminPathways(token, filters);
        setPathways(response.data.results || response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pathways:', err);
        setError('Failed to load pathways. Please try again.');
        setLoading(false);
      }
    };

    fetchPathways();
  }, [token, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeletePathway = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pathway? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteAdminPathway(token, id);
      setPathways(pathways.filter(pathway => pathway.id !== id));
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
          <div className="admin-loading">Loading pathways...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">Learning Pathways</h1>
          <Link to="/admin/pathways/new" className="admin-button admin-button-primary">
            + Add Pathway
          </Link>
        </div>

        <div className="admin-filters-container">
          <div className="admin-filters">
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
                <th>Name</th>
                <th>Description</th>
                <th>Difficulty</th>
                <th>Lessons</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pathways.map(pathway => (
                <tr key={pathway.id}>
                  <td>{pathway.name}</td>
                  <td className="description-cell">{pathway.description.substring(0, 100)}...</td>
                  <td>{pathway.difficulty_level}</td>
                  <td>{pathway.lesson_count || '0'}</td>
                  <td>
                    <span className={`admin-status ${pathway.is_active ? 'active' : 'inactive'}`}>
                      {pathway.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <Link to={`/admin/pathways/${pathway.id}`} className="admin-action-button view">
                      View
                    </Link>
                    <Link to={`/admin/pathways/${pathway.id}/edit`} className="admin-action-button edit">
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeletePathway(pathway.id)} 
                      className="admin-action-button delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {pathways.length === 0 && (
            <div className="admin-no-data">No pathways found matching your filters.</div>
          )}
        </div>

        {error && <div className="admin-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminPathways;