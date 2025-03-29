import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, InputGroup, Badge, Modal, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import api from '../utils/api';
import '../styles/AdminUserList.css';

const AdminUserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    is_active: '',
    role: '',
    learning_goal: '',
    difficulty_level: ''
  });
  
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current: 1,
    totalPages: 1
  });

  // Modal state for user creation/editing
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    learning_goal: '',
    difficulty_level: '',
    bio: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, searchTerm, pagination.current]);

  const fetchUsers = async (url = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      let endpoint = url || 'admin/users/';
      let params = {};

      // Add search parameter if there's a search term
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });

      // Add page parameter
      if (!url) {
        params.page = pagination.current;
      }

      const response = await api.get(endpoint, {
        headers: { Authorization: `Token ${token}` },
        params
      });

      setUsers(response.data.results);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        current: url ? extractPageFromUrl(url) : pagination.current,
        totalPages: Math.ceil(response.data.count / 10) // Assuming page_size is 10
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
      
      // Redirect if unauthorized
      if (err.response && err.response.status === 403) {
        navigate('/dashboard');
      }
    }
  };

  const extractPageFromUrl = (url) => {
    const match = url.match(/page=(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({...pagination, current: 1}); // Reset to first page on new search
    fetchUsers();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({...filters, [name]: value});
    setPagination({...pagination, current: 1}); // Reset to first page on new filter
  };

  const handlePageChange = (pageNumber) => {
    setPagination({...pagination, current: pageNumber});
  };

  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
      learning_goal: '',
      difficulty_level: '',
      bio: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      // Don't set password for editing
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'student',
      learning_goal: user.learning_goal || '',
      difficulty_level: user.difficulty_level || '',
      bio: user.bio || '',
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleToggleActive = async (userId, isCurrentlyActive) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await api.post(`admin/users/${userId}/activate/`, {
        activate: !isCurrentlyActive
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      // Update the user's status in the local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {...user, is_active: !isCurrentlyActive};
        }
        return user;
      }));

    } catch (err) {
      console.error("Failed to toggle user status:", err);
      alert(`Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} user.`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (currentUser) {
        // Update existing user
        await api.patch(`admin/users/${currentUser.id}/`, formData, {
          headers: { Authorization: `Token ${token}` }
        });
      } else {
        // Create new user
        await api.post('admin/users/', formData, {
          headers: { Authorization: `Token ${token}` }
        });
      }

      setShowModal(false);
      fetchUsers(); // Refresh the list

    } catch (err) {
      console.error("Failed to save user:", err);
      alert(`Failed to ${currentUser ? 'update' : 'create'} user. ${err.response?.data?.error || ''}`);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const { current, totalPages } = pagination;

    // Always show first page
    pages.push(
      <Pagination.Item 
        key={1} 
        active={current === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );

    // Add ellipsis if needed
    if (current > 3) {
      pages.push(<Pagination.Ellipsis key="ellipsis-1" />);
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={current === i}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Add ellipsis if needed
    if (current < totalPages - 2) {
      pages.push(<Pagination.Ellipsis key="ellipsis-2" />);
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(
        <Pagination.Item
          key={totalPages}
          active={current === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination>
        <Pagination.Prev 
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
        />
        {pages}
        <Pagination.Next 
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
        />
      </Pagination>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-user-list-container">
      <Row>
        <Col md={2} className="admin-sidebar-container">
          <AdminSidebar active="users" />
        </Col>
        <Col md={10} className="admin-main-content">
          <h1 className="admin-page-title">User Management</h1>

          {/* Search and Filter */}
          <div className="admin-actions-bar">
            <Row>
              <Col md={6}>
                <Form onSubmit={handleSearch}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="primary" type="submit">
                      Search
                    </Button>
                  </InputGroup>
                </Form>
              </Col>
              <Col md={6} className="text-end">
                <Button variant="success" onClick={handleCreateUser}>
                  + Add User
                </Button>
              </Col>
            </Row>

            {/* Filters */}
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    name="is_active" 
                    value={filters.is_active} 
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Role</Form.Label>
                  <Form.Select 
                    name="role" 
                    value={filters.role} 
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Learning Goal</Form.Label>
                  <Form.Select 
                    name="learning_goal" 
                    value={filters.learning_goal} 
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="School">For School</option>
                    <option value="Portfolio">Build a Portfolio</option>
                    <option value="Career Growth">Career Growth</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Difficulty Level</Form.Label>
                  <Form.Select 
                    name="difficulty_level" 
                    value={filters.difficulty_level} 
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* User Table */}
          <div className="admin-table-container">
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Learning Goal</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{`${user.first_name || ''} ${user.last_name || ''}`}</td>
                    <td>{user.role}</td>
                    <td>{user.learning_goal || 'N/A'}</td>
                    <td>{user.difficulty_level || 'N/A'}</td>
                    <td>
                      {user.is_active ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={user.is_active ? "outline-danger" : "outline-success"}
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            {renderPagination()}
            <div className="pagination-info">
              Showing {users.length} of {pagination.count} users
            </div>
          </div>

          {/* User Create/Edit Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{currentUser ? 'Edit User' : 'Create New User'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleFormChange}
                        required
                        disabled={currentUser}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {!currentUser && (
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required={!currentUser}
                      placeholder="Minimum 8 characters with uppercase, lowercase and number"
                    />
                  </Form.Group>
                )}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleFormChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleFormChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    {currentUser && (
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="is-active-switch"
                          name="is_active"
                          label="User is active"
                          checked={formData.is_active}
                          onChange={handleFormChange}
                        />
                      </Form.Group>
                    )}
                  </Col>
                </Row>

                {formData.role === 'student' && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Learning Goal</Form.Label>
                          <Form.Select
                            name="learning_goal"
                            value={formData.learning_goal}
                            onChange={handleFormChange}
                          >
                            <option value="">Select a goal</option>
                            <option value="School">For School</option>
                            <option value="Portfolio">Build a Portfolio</option>
                            <option value="Career Growth">Career Growth</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Difficulty Level</Form.Label>
                          <Form.Select
                            name="difficulty_level"
                            value={formData.difficulty_level}
                            onChange={handleFormChange}
                          >
                            <option value="">Select a level</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={formData.bio}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {currentUser ? 'Update User' : 'Create User'}
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </div>
  );
};

export default AdminUserList;