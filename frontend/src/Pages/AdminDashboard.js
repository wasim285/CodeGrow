import React, { useState, useEffect, useContext } from 'react';
import { 
  Row, Col, Card, Spinner, Alert, Table, 
  Badge, Container, ProgressBar 
} from 'react-bootstrap';
import { 
  FaUsers, FaBook, FaRoute, FaUserCheck,
  FaChartLine, FaCalendarAlt
} from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { AuthContext } from '../context/Authcontext'; // Lowercase c is correct
import api from '../utils/api';
import '../styles/AdminDashboard.css';

// Register Chart.js components
Chart.register(...registerables);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/admin/dashboard/', {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <Spinner animation="border" variant="primary" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  // Learning goal chart data
  const learningGoalData = {
    labels: Object.keys(dashboardData?.learning_goal_stats || {}),
    datasets: [
      {
        label: 'Users by Learning Goal',
        data: Object.values(dashboardData?.learning_goal_stats || {}),
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(155, 89, 182, 0.7)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Difficulty level chart data
  const difficultyData = {
    labels: Object.keys(dashboardData?.difficulty_level_stats || {}),
    datasets: [
      {
        label: 'Users by Difficulty',
        data: Object.values(dashboardData?.difficulty_level_stats || {}),
        backgroundColor: [
          'rgba(241, 196, 15, 0.7)',
          'rgba(230, 126, 34, 0.7)',
          'rgba(231, 76, 60, 0.7)'
        ],
        borderColor: [
          'rgba(241, 196, 15, 1)',
          'rgba(230, 126, 34, 1)',
          'rgba(231, 76, 60, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      
      <div className="admin-main-content">
        <Container fluid>
          <h1 className="admin-page-title">
            Admin Dashboard
            <small className="text-muted ms-3">Welcome back, {user?.username || 'Admin'}</small>
          </h1>
          
          <Row className="admin-stats-section">
            <Col md={3}>
              <Card className="admin-stat-card">
                <Card.Body>
                  <div className="stat-icon-container">
                    <FaUsers className="stat-icon" />
                  </div>
                  <h3>{dashboardData?.total_users || 0}</h3>
                  <p>Total Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="admin-stat-card">
                <Card.Body>
                  <div className="stat-icon-container">
                    <FaUserCheck className="stat-icon" />
                  </div>
                  <h3>{dashboardData?.active_users || 0}</h3>
                  <p>Active Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="admin-stat-card">
                <Card.Body>
                  <div className="stat-icon-container">
                    <FaBook className="stat-icon" />
                  </div>
                  <h3>{dashboardData?.total_lessons || 0}</h3>
                  <p>Total Lessons</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="admin-stat-card">
                <Card.Body>
                  <div className="stat-icon-container">
                    <FaRoute className="stat-icon" />
                  </div>
                  <h3>{dashboardData?.total_pathways || 0}</h3>
                  <p>Learning Pathways</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="admin-user-stats-section">
            <Col md={6}>
              <Card>
                <Card.Header as="h5">
                  Users by Learning Goal
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Pie 
                      data={learningGoalData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          }
                        }
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header as="h5">
                  Users by Difficulty Level
                </Card.Header>
                <Card.Body>
                  <div className="chart-container">
                    <Bar 
                      data={difficultyData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="admin-recent-users-section">
            <Col>
              <Card>
                <Card.Header as="h5">
                  <FaUsers className="me-2" />
                  Recently Registered Users
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Registered</th>
                        <th>Learning Goal</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent_users?.map((user) => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <FaCalendarAlt className="me-1" />
                            {new Date(user.date_joined).toLocaleDateString()}
                          </td>
                          <td>{user.learning_goal || 'Not set'}</td>
                          <td>
                            <Badge bg={user.is_active ? "success" : "danger"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="admin-recent-activity-section">
            <Col>
              <Card>
                <Card.Header as="h5">
                  <FaChartLine className="me-2" />
                  Recent Admin Activity
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Details</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent_activity?.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.admin_username}</td>
                          <td>{activity.action_name}</td>
                          <td>{activity.target_name}</td>
                          <td>{activity.action_details}</td>
                          <td>{new Date(activity.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default AdminDashboard;