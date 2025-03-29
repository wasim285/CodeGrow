import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminUsers, activateAdminUser } from '../utils/api';
import { FaSearch, FaFilter, FaUserPlus, FaEye, FaEdit, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import '../styles/AdminDashboard.css';

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    is_active: '',
    role: '',
    learning_goal: '',
    difficulty_level: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [page, filters, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Prepare filters including search term
      const apiFilters = {...filters};
      if (searchTerm) {
        apiFilters.search = searchTerm;
      }
      
      const response = await getAdminUsers(token, page, apiFilters);
      setUsers(response.data.results);
      
      // Calculate total pages from count and page size (default: 10)
      const count = response.data.count;
      const pageSize = 10;
      setTotalPages(Math.ceil(count / pageSize));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await activateAdminUser(token, userId, !currentStatus);
      // Update the user in the state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      is_active: '',
      role: '',
      learning_goal: '',
      difficulty_level: ''
    });
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">User Management</h1>
          <Link to="/admin/users/new" className="admin-button admin-button-primary">
            <FaUserPlus style={{ marginRight: '0.5rem' }} /> Add New User
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-filters-container">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <div className="admin-search-input-container">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="admin-search-input"
              />
              <button type="submit" className="admin-search-button">
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="admin-filter-group">
            <div className="admin-filter-label">
              <FaFilter style={{ marginRight: '0.5rem' }} /> Filters
            </div>
            <select
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
              className="admin-filter-select"
            >
              <option value="">Status (All)</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="admin-filter-select"
            >
              <option value="">Role (All)</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>

            <select
              name="learning_goal"
              value={filters.learning_goal}
              onChange={handleFilterChange}
              className="admin-filter-select"
            >
              <option value="">Learning Goal (All)</option>
              <option value="School">School</option>
              <option value="Portfolio">Portfolio</option>
              <option value="Career Growth">Career Growth</option>
            </select>

            <button 
              onClick={clearFilters} 
              className="admin-button admin-button-secondary"
              style={{ marginLeft: '0.5rem' }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Learning Goal</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-no-data">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td><span className={`admin-role-badge ${user.role}`}>{user.role}</span></td>
                      <td>{user.learning_goal || 'Not set'}</td>
                      <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                      <td>
                        <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="admin-actions">
                        <Link to={`/admin/users/${user.id}`} className="admin-action-btn view">
                          <FaEye title="View Details" />
                        </Link>
                        <Link to={`/admin/users/${user.id}/edit`} className="admin-action-btn edit">
                          <FaEdit title="Edit User" />
                        </Link>
                        <button 
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`admin-action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                        >
                          {user.is_active ? (
                            <FaUserSlash title="Deactivate User" />
                          ) : (
                            <FaUserCheck title="Activate User" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="admin-pagination-btn"
                >
                  Previous
                </button>
                
                <span className="admin-pagination-info">
                  Page {page} of {totalPages}
                </span>
                
                <button 
                  onClick={() => setPage(prev => prev < totalPages ? prev + 1 : prev)}
                  disabled={page === totalPages}
                  className="admin-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;