import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiEdit, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await api.get(`admin/users/?${params.toString()}`);
      
      if (response.data.results) {
        setUsers(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
      } else {
        setUsers(response.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const toggleUserStatus = async (userId, isCurrentlyActive) => {
    try {
      await api.patch(`admin/users/${userId}/activate/`, {
        is_active: !isCurrentlyActive
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !isCurrentlyActive } : user
      ));
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  const toggleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const bulkActivate = async (activate = true) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    try {
      // This would ideally be a bulk endpoint in your API
      // For now we'll handle each user individually
      const promises = selectedUsers.map(userId => 
        api.patch(`admin/users/${userId}/activate/`, {
          is_active: activate
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setUsers(users.map(user => 
        selectedUsers.includes(user.id) ? { ...user, is_active: activate } : user
      ));
      
      setSelectedUsers([]);
      alert(`Successfully ${activate ? 'activated' : 'deactivated'} ${selectedUsers.length} users`);
    } catch (err) {
      console.error('Error performing bulk action:', err);
      alert('Failed to update users. Please try again.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-page-title">User Management</h1>
        </div>

        {/* Search and filters */}
        <div className="admin-actions-bar">
          <form onSubmit={handleSearch} className="admin-search-form">
            <div className="admin-search-input-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
              <button type="submit" className="admin-search-button">
                <FiSearch />
              </button>
            </div>
          </form>
          
          <div className="admin-bulk-actions">
            <button 
              onClick={() => bulkActivate(true)} 
              disabled={selectedUsers.length === 0}
              className="admin-button admin-button-secondary"
            >
              <FiUserCheck /> Activate Selected
            </button>
            <button 
              onClick={() => bulkActivate(false)} 
              disabled={selectedUsers.length === 0}
              className="admin-button admin-button-secondary"
            >
              <FiUserX /> Deactivate Selected
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    checked={selectedUsers.length > 0 && selectedUsers.length === users.length}
                  />
                </th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan="7" className="admin-error-cell">{error}</td>
                </tr>
              ) : users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                      />
                    </td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role || 'student'}</td>
                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span className={`admin-status ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        <Link 
                          to={`/admin/users/${user.id}`} 
                          className="admin-button admin-button-secondary"
                          title="Edit user"
                        >
                          <FiEdit />
                        </Link>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`admin-button ${user.is_active ? 'admin-button-danger' : 'admin-button-primary'}`}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? <FiUserX /> : <FiUserCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="admin-empty-cell">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="admin-button admin-button-secondary"
            >
              Previous
            </button>
            
            <div className="admin-pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="admin-button admin-button-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;