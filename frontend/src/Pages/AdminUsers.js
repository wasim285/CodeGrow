import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminUsers, activateAdminUser } from '../utils/api';
import { FaUserPlus, FaSearch, FaUserCheck, FaUserSlash, FaEye } from 'react-icons/fa';

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAdminUsers(token, currentPage, filters);
        setUsers(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setLoading(false);
      }
    };

    fetchUsers();
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
    // The search is handled by the filter change already
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await activateAdminUser(token, userId, !currentStatus);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">Users Management</h1>
          <Link to="/admin/users/new" className="admin-button admin-button-primary">
            <FaUserPlus style={{ marginRight: '0.5rem' }} /> Add User
          </Link>
        </div>

        <div className="admin-filters-container">
          <form onSubmit={handleSearch} className="admin-search-form">
            <div className="admin-search-input">
              <input
                type="text"
                placeholder="Search users..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="admin-form-input"
              />
              <button type="submit" className="admin-search-button">
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="admin-filters">
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="admin-form-select"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
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
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                  <td>
                    <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <Link to={`/admin/users/${user.id}`} className="admin-action-button view">
                      <FaEye />
                    </Link>
                    <button 
                      onClick={() => handleToggleActive(user.id, user.is_active)} 
                      className={`admin-action-button ${user.is_active ? 'deactivate' : 'activate'}`}
                    >
                      {user.is_active ? <FaUserSlash /> : <FaUserCheck />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="admin-no-data">No users found matching your filters.</div>
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

export default AdminUsers;