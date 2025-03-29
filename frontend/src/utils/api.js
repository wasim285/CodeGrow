import axios from "axios";

// More robust API base URL detection
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname.includes("onrender.com") || window.location.hostname === "localhost"
    ? "https://codegrow.onrender.com/api/accounts/"
    : "http://127.0.0.1:8000/api/accounts/");

console.log("Using API base URL:", API_BASE_URL); // Helpful for debugging

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Add request interceptor to handle expired tokens
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 unauthorized errors that might be due to expired tokens
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API request - token may be expired");
      // Optional: You could automatically redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (userData) => {
  try {
    return await api.post("register/", userData);
  } catch (error) {
    console.error("Register API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    return await api.post("login/", userData);
  } catch (error) {
    console.error("Login API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getProfile = async (token) => {
  try {
    return await api.get("profile/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Profile API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllLessons = async (token) => {
  try {
    return await api.get("lessons/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Lessons API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getStudySessions = async (token) => {
  try {
    return await api.get("study-sessions/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Study Sessions API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    return await api.post("logout/", {}, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Logout API Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get AI learning assistant response for a student's question
 * @param {Object} assistantData - Data for the AI assistant
 * @param {string} assistantData.lessonId - ID of the current lesson
 * @param {number} assistantData.currentStep - Current step in the lesson (1, 2, or 3)
 * @param {string} assistantData.userCode - User's current code (optional)
 * @param {string} assistantData.expectedOutput - Expected output for the challenge (optional)
 * @param {string} assistantData.question - Student's question
 * @returns {Promise<Object>} - Response from the AI assistant
 */
export const getAIAssistantResponse = async (requestData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required");
  }

  // First attempt with normal timeout
  try {
    const response = await axios.post(
      `${API_BASE_URL}lesson-assistant/`,
      requestData,
      {
        headers: { Authorization: `Token ${token}` },
        timeout: 15000 // 15 second timeout for first attempt
      }
    );
    
    return response.data;
  } catch (error) {
    // If it's a timeout error, try once more with a longer timeout
    if (error.code === 'ECONNABORTED') {
      console.log("First attempt timed out, trying again with longer timeout...");
      
      try {
        const retryResponse = await axios.post(
          `${API_BASE_URL}lesson-assistant/`,
          requestData,
          {
            headers: { Authorization: `Token ${token}` },
            timeout: 30000 // 30 second timeout for second attempt
          }
        );
        
        return retryResponse.data;
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        throw retryError;
      }
    } else {
      // For non-timeout errors, just throw the original error
      throw error;
    }
  }
};

/**
 * Generate a fallback response when the API call fails
 * @param {string} question - The user's question
 * @param {number} step - The current lesson step
 * @returns {string} - A helpful fallback response
 */
const getFallbackResponse = (question, step) => {
  const questionLower = question.toLowerCase();
  
  // Check for common patterns
  if (questionLower.includes("explain") || questionLower.includes("what is")) {
    return "This concept is a fundamental part of programming that helps you solve problems by breaking them down into manageable steps. If you'd like more specific help, try asking about a particular part you're struggling with.";
  }
  
  if (questionLower.includes("error") || questionLower.includes("not working")) {
    return "When debugging code, check for these common issues: syntax errors (like missing colons or parentheses), variable naming inconsistencies, and logic errors in your conditions. Reading the error message carefully often gives you clues about what's wrong.";
  }
  
  if (questionLower.includes("hint") || questionLower.includes("stuck")) {
    return "Try breaking down the problem into smaller steps. First, understand what inputs you're working with. Then, think about what transformations you need to apply. Finally, format your output according to what's expected.";
  }
  
  // Step-specific fallbacks
  const stepNum = Number(step) || 1;
  switch(stepNum) {
    case 1:
      return "The introduction is meant to give you a foundation for the concepts in this lesson. Take your time to understand each part, and don't worry if it doesn't all click immediately. Learning programming is a step-by-step process.";
    case 2:
      return "In the guided example, try to understand each line of code. What is its purpose? How does it contribute to the overall solution? Experimenting by changing small parts of the code can help you see how it works.";
    case 3:
      return "For challenges, start by making sure you understand what the problem is asking. Then sketch a plan before coding. Break down your solution into steps, and implement one step at a time.";
    default:
      return "I'm here to help with this lesson. Could you tell me more specifically what you're struggling with?";
  }
};

/**
 * Simple method to check if student's answer matches expected output
 * No AI feedback, just direct comparison
 * @param {string} userOutput - Output from user's code
 * @param {string} expectedOutput - Expected correct output
 * @returns {Object} - Result with success flag and message
 */
export const checkCodeOutput = (userOutput, expectedOutput) => {
  if (!userOutput || !expectedOutput) {
    return {
      correct: false,
      message: "Missing output to compare."
    };
  }

  // Normalize both strings before comparing (trim whitespace, normalize line endings)
  const normalizeOutput = (output) => {
    return output
      .trim()
      .replace(/\r\n/g, '\n')     // Convert Windows line endings
      .replace(/\s+/g, ' ')       // Normalize multiple spaces
      .replace(/\n+/g, '\n')      // Normalize multiple line breaks
      .trim();
  };

  const normalizedUser = normalizeOutput(userOutput);
  const normalizedExpected = normalizeOutput(expectedOutput);
  
  const isCorrect = normalizedUser === normalizedExpected;
  
  return {
    correct: isCorrect,
    message: isCorrect 
      ? "✅ Great job! Your solution is correct!" 
      : "❌ Your solution doesn't match the expected output. Try asking the AI Assistant for help."
  };
};

/**
 * Admin Dashboard API Functions
 */

// Fetch admin dashboard data
export const fetchAdminDashboardData = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
};

// Fetch users with pagination, filtering, and sorting
export const fetchUsers = async (params = {}) => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`${API_BASE_URL}/admin/users/?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
};

// Admin endpoints
export const getAdminDashboard = (token) => {
  return axios.get(`${API_BASE_URL}/admin/dashboard/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

// Admin user management
export const getAdminUsers = (token, page = 1, filters = {}) => {
  let queryParams = new URLSearchParams({ page });
  
  // Add any filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return axios.get(`${API_BASE_URL}/admin/users/?${queryParams.toString()}`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const getAdminUser = (token, userId) => {
  return axios.get(`${API_BASE_URL}/admin/users/${userId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const createAdminUser = (token, userData) => {
  return axios.post(`${API_BASE_URL}/admin/users/`, userData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const updateAdminUser = (token, userId, userData) => {
  return axios.patch(`${API_BASE_URL}/admin/users/${userId}/`, userData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const deleteAdminUser = (token, userId) => {
  return axios.delete(`${API_BASE_URL}/admin/users/${userId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const activateAdminUser = (token, userId, activate = true) => {
  return axios.post(`${API_BASE_URL}/admin/users/${userId}/activate/`, 
    { activate }, 
    { headers: { Authorization: `Token ${token}` } }
  );
};

// Admin pathway endpoints
export const getAdminPathway = (token, pathwayId) => {
  return axios.get(`${API_BASE_URL}/admin/pathways/${pathwayId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const getAdminPathways = (token, page = 1, filters = {}) => {
  let queryParams = new URLSearchParams({ page });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return axios.get(`${API_BASE_URL}/admin/pathways/?${queryParams.toString()}`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const createAdminPathway = (token, pathwayData) => {
  return axios.post(`${API_BASE_URL}/admin/pathways/`, pathwayData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const updateAdminPathway = (token, pathwayId, pathwayData) => {
  return axios.patch(`${API_BASE_URL}/admin/pathways/${pathwayId}/`, pathwayData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const deleteAdminPathway = (token, pathwayId) => {
  return axios.delete(`${API_BASE_URL}/admin/pathways/${pathwayId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

// Admin lesson management
export const getAdminLessons = (token, page = 1, filters = {}) => {
  let queryParams = new URLSearchParams({ page });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return axios.get(`${API_BASE_URL}/admin/lessons/?${queryParams.toString()}`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const getAdminLesson = (token, lessonId) => {
  return axios.get(`${API_BASE_URL}/admin/lessons/${lessonId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const createAdminLesson = (token, lessonData) => {
  return axios.post(`${API_BASE_URL}/admin/lessons/`, lessonData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const updateAdminLesson = (token, lessonId, lessonData) => {
  return axios.patch(`${API_BASE_URL}/admin/lessons/${lessonId}/`, lessonData, {
    headers: { Authorization: `Token ${token}` },
  });
};

export const deleteAdminLesson = (token, lessonId) => {
  return axios.delete(`${API_BASE_URL}/admin/lessons/${lessonId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

// Admin activity log
export const getAdminActivityLog = (token, page = 1, filters = {}) => {
  let queryParams = new URLSearchParams({ page });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  return axios.get(`${API_BASE_URL}/admin/activity-log/?${queryParams.toString()}`, {
    headers: { Authorization: `Token ${token}` },
  });
};

// Admin statistics endpoint
export const getAdminStats = (token) => {
  return axios.get(`${API_BASE_URL}/admin/stats/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

// Alias exports for compatibility with different import names
export { getAdminStats as getAdminDashboardStats };
export { getAdminStats as getAdminStatistics };

export default api;
