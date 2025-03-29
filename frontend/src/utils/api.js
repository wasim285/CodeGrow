import axios from 'axios';

// Determine API base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname.includes('onrender.com')
    ? 'https://codegrow.onrender.com/api'
    : 'http://localhost:8000/api');

// Fix: Remove the extra "/accounts/" from the baseURL
console.log('Using API base URL:', API_BASE_URL);

// Create axios instance with proper configuration
const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000 // Increased timeout for slow connections
});

// Add a request interceptor to include the token
apiInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            // Make sure we set the header correctly
            config.headers['Authorization'] = `Token ${token}`;
            console.log('Adding token to request:', `Token ${token.substring(0, 5)}...`);
        }
        return config;
    },
    error => {
        console.error('Request error interceptor:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors
apiInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                console.log('Unauthorized API request - token may be expired');
                // Token expired, go to login
                if (window.location.pathname !== '/login') {
                    localStorage.removeItem('token');
                    // Don't redirect when already on login page to avoid loops
                    if (!window.location.pathname.includes('/login')) {
                        window.location = '/login';
                    }
                }
            } else {
                console.error('API error response:', error.response.status, error.response.data);
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
    }
);

// Auth endpoints - add "accounts/" prefix to each endpoint
export const loginUser = (credentials) => {
    return apiInstance.post('accounts/login/', credentials);
};

export const registerUser = (userData) => {
    return apiInstance.post('accounts/register/', userData);
};

export const logoutUser = () => {
    return apiInstance.post('accounts/logout/');
};

export const getProfile = () => {
    return apiInstance.get('accounts/profile/');
};

// Admin endpoints - add "accounts/" prefix to each endpoint
export const getAdminDashboard = () => {
    return apiInstance.get('accounts/admin/dashboard/');
};

// Admin User Management
export const getAdminUsers = (page = 1, search = '', filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('search', search);
    
    // Add any additional filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
            params.append(key, value);
        }
    });
    
    return apiInstance.get(`accounts/admin/users/?${params.toString()}`);
};

export const getAdminUser = (userId) => {
    return apiInstance.get(`accounts/admin/users/${userId}/`);
};

export const createAdminUser = (userData) => {
    return apiInstance.post('accounts/admin/users/', userData);
};

export const updateAdminUser = (userId, userData) => {
    return apiInstance.put(`accounts/admin/users/${userId}/`, userData);
};

export const toggleUserStatus = (userId, isActive) => {
    return apiInstance.patch(`accounts/admin/users/${userId}/activate/`, { is_active: isActive });
};

export const deleteAdminUser = (userId) => {
    return apiInstance.delete(`accounts/admin/users/${userId}/`);
};

// Admin Pathways Management
export const getAdminPathways = (page = 1, search = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('search', search);
    return apiInstance.get(`accounts/admin/pathways/?${params.toString()}`);
};

export const getAdminPathway = (pathwayId) => {
    return apiInstance.get(`accounts/admin/pathways/${pathwayId}/`);
};

export const createAdminPathway = (pathwayData) => {
    return apiInstance.post('accounts/admin/pathways/', pathwayData);
};

export const updateAdminPathway = (pathwayId, pathwayData) => {
    return apiInstance.put(`accounts/admin/pathways/${pathwayId}/`, pathwayData);
};

export const deleteAdminPathway = (pathwayId) => {
    return apiInstance.delete(`accounts/admin/pathways/${pathwayId}/`);
};

// Admin Lessons Management
export const getAdminLessons = (page = 1, search = '', filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('search', search);
    
    // Add any additional filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
            params.append(key, value);
        }
    });
    
    return apiInstance.get(`accounts/admin/lessons/?${params.toString()}`);
};

export const getAdminLesson = (lessonId) => {
    return apiInstance.get(`accounts/admin/lessons/${lessonId}/`);
};

export const createAdminLesson = (lessonData) => {
    return apiInstance.post('accounts/admin/lessons/', lessonData);
};

export const updateAdminLesson = (lessonId, lessonData) => {
    return apiInstance.put(`accounts/admin/lessons/${lessonId}/`, lessonData);
};

export const deleteAdminLesson = (lessonId) => {
    return apiInstance.delete(`accounts/admin/lessons/${lessonId}/`);
};

// Admin Activity Log
export const getAdminActivityLog = (page = 1, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    
    // Add any filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
            params.append(key, value);
        }
    });
    
    return apiInstance.get(`accounts/admin/activity-log/?${params.toString()}`);
};

// User-facing pathways endpoints
export const getPathways = () => {
    return apiInstance.get('accounts/pathways/');
};

export const getPathwayDetail = (id) => {
    return apiInstance.get(`accounts/pathways/${id}/`);
};

export const enrollInPathway = (id) => {
    return apiInstance.post(`accounts/pathways/${id}/enroll/`);
};

// User-facing lessons endpoints
export const getLessons = () => {
    return apiInstance.get('accounts/lessons/');
};

export const getLessonDetail = (id) => {
    return apiInstance.get(`accounts/lessons/${id}/`);
};

export const completeLesson = (id) => {
    return apiInstance.post(`accounts/lessons/${id}/complete/`);
};

export const checkLessonCompletion = (id) => {
    return apiInstance.get(`accounts/lessons/${id}/check-completion/`);
};

// Study Sessions
export const getStudySessions = () => {
    return apiInstance.get('accounts/study-sessions/');
};

export const createStudySession = (data) => {
    return apiInstance.post('accounts/study-sessions/', data);
};

export const updateStudySession = (id, data) => {
    return apiInstance.put(`accounts/study-sessions/${id}/`, data);
};

export const deleteStudySession = (id) => {
    return apiInstance.delete(`accounts/study-sessions/${id}/`);
};

// Code execution
export const runCode = (data) => {
    return apiInstance.post('accounts/run-code/', data);
};

// AI assistance
export const getLessonAssistance = (data) => {
    return apiInstance.post('accounts/lesson-assistant/', data);
};

export default apiInstance;
