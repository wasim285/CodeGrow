import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faPlus, faEdit, faTimes, faCheck,
  faFilter, faSearch, faSort, faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import '../../styles/AdminDashboard.css';

const AdminUsersPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    is_active: '',
    role: '',
    learning_goal: '',
    difficulty_level: ''
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    learning_goal: '',
    difficulty_level: '',
    is_active: true
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let url = `/admin/users/?page=${currentPage}`;
        
        // Add search term if exists
        if (searchTerm) {
          url += `&search=${searchTerm}`;
        }
        
        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '') {
            url += `&${key}=${value}`;
          }
        });
        
        const response = await api.get(url, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` }
        });
        
        setUsers(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // assuming page_size=10
        setError(null);
      } catch (err) {
        setError('Failed to load users. Please try again.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm, filters]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle add user
  const handleAddUser = async () => {
    try {
      await api.post('/admin/users/', formData, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      
      // Reset form and close modal
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'student',
        learning_goal: '',
        difficulty_level: '',
        is_active: true
      });
      setShowAddModal(false);
      
      // Refresh user list
      const response = await api.get(`/admin/users/?page=${currentPage}`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      
      setUsers(response.data.results);
    } catch (err) {
      console.error('Error adding user:', err);
      alert('Failed to add user. Please try again.');
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/`, formData, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Refresh user list
      const response = await api.get(`/admin/users/?page=${currentPage}`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      
      setUsers(response.data.results);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user. Please try again.');
    }
  };

  // Handle activate/deactivate user
  const handleToggleActive = async (userId, activate) => {
    try {
      await api.post(`/admin/users/${userId}/activate/`, { activate }, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      
      // Update user list
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: activate } : user
      ));
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'student',
      learning_goal: user.learning_goal || '',
      difficulty_level: user.difficulty_level || '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="admin-page-title">User Management</h1>
          <Button 
            className="admin-add-btn btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add User
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="admin-filters-bar mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-end">
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="outline-secondary" id="filter-dropdown">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />
                    Filter
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="p-3" style={{ width: '240px' }}>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={filters.is_active}
                          onChange={(e) => setFilters({...filters, is_active: e.target.value})}
                        >
                          <option value="">All</option>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                          value={filters.role}
                          onChange={(e) => setFilters({...filters, role: e.target.value})}
                        >
                          <option value="">All</option>
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Learning Goal</Form.Label>
                        <Form.Select
                          value={filters.learning_goal}
                          onChange={(e) => setFilters({...filters, learning_goal: e.target.value})}
                        >
                          <option value="">All</option>
                          <option value="School">School</option>
                          <option value="Portfolio">Portfolio</option>
                          <option value="Career Growth">Career Growth</option>
                        </Form.Select>
                      </Form.Group>
                      <div className="d-flex justify-content-end">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setFilters({
                            is_active: '',
                            role: '',
                            learning_goal: '',
                            difficulty_level: ''
                          })}
                        >
                          Clear All
                        </Button>
                      </div>
                    </Form>
                  </Dropdown.Menu>
                </Dropdown>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" id="sort-dropdown">
                    <FontAwesomeIcon icon={faSort} className="me-1" />
                    Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>Username (A-Z)</Dropdown.Item>
                    <Dropdown.Item>Username (Z-A)</Dropdown.Item>
                    <Dropdown.Item>Date Joined (Newest)</Dropdown.Item>
                    <Dropdown.Item>Date Joined (Oldest)</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <>
            <div className="admin-table-responsive">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Learning Goal</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {user.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                      </td>
                      <td>{user.learning_goal || 'Not set'}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex">
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="me-2"
                            onClick={() => openEditModal(user)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant={user.is_active ? 'light text-danger' : 'light text-success'}
                            size="sm"
                            onClick={() => handleToggleActive(user.id, !user.is_active)}
                          >
                            <FontAwesomeIcon icon={user.is_active ? faTimes : faCheck} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;