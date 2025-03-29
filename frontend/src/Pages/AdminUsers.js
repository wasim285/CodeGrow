import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminUsers, deleteAdminUser, activateAdminUser } from '../utils/api';
import '../styles/AdminDashboard.css';
import { FaUserPlus, FaSearch, FaUserCheck, FaUserSlash, FaEye } from 'react-icons/fa';

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAdminUsers(token, currentPage, filters);
        setUsers(response.data.results || []);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
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

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteAdminUser(token, id);
      // Refresh the list
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
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

  if (loading && users.length === 0) {
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
          <form onSubmit={(e) => e.preventDefault()} className="admin-search-form">
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
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Link to={`/admin/users/${user.id}`} className="admin-table-link">
                        {user.username}
                      </Link>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role || 'student'}</td>
                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <Link 
                        to={`/admin/users/${user.id}`} 
                        className="admin-button admin-button-sm"
                        title="View User"
                      >
                        <FaEye />
                      </Link>
                      <Link 
                        to={`/admin/users/${user.id}/edit`} 
                        className="admin-button admin-button-sm admin-button-secondary"
                        title="Edit User"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="admin-button admin-button-sm admin-button-danger"
                        title="Delete User"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => handleToggleActive(user.id, user.is_active)} 
                        className={`admin-action-button ${user.is_active ? 'deactivate' : 'activate'}`}
                      >
                        {user.is_active ? <FaUserSlash /> : <FaUserCheck />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-no-data">
                    No users found. Try adjusting your filters or create a new user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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