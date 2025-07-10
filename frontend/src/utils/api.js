import axios from "axios";

// Detect environment
const isLocalhost = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1";

// Set API base URL based on environment
const API_BASE_URL = isLocalhost
  ? "http://127.0.0.1:8000/api/"
  : "https://codegrow.onrender.com/api/";

console.log("Using API base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add token to all requests except login and register
    const token = localStorage.getItem("token");
    if (token && !config.url.includes('login') && !config.url.includes('register')) {
      console.log("Adding token to request");
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 404) {
      console.log("API Error Response:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (userData) => {
  try {
    const response = await api.post("accounts/register/", userData);
    console.log("Registration successful:", response.data);
    
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    
    return response;
  } catch (error) {
    console.error("Register API Error:", error);
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await api.post("accounts/login/", userData);
    return response;
  } catch (error) {
    console.error("Login API Error:", error.response?.data || error.message);
    return { 
      status: error.response?.status || 500, 
      data: error.response?.data || { error: "Login failed" } 
    };
  }
};

export const getProfile = async (token) => {
  try {
    return await api.get("accounts/profile/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Profile API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllLessons = async (token) => {
  try {
    return await api.get("accounts/lessons/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Lessons API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getStudySessions = async (token) => {
  try {
    return await api.get("accounts/study-sessions/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Study Sessions API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    return await api.post("accounts/logout/", {}, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Logout API Error:", error.response?.data || error.message);
    throw error;
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

  // Simple string comparison with normalization
  const normalizedUser = userOutput.trim().replace(/\r\n/g, '\n');
  const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n');
  
  const isCorrect = normalizedUser === normalizedExpected;
  
  return {
    correct: isCorrect,
    message: isCorrect 
      ? "✅ Great job! Your solution is correct!" 
      : "❌ Your solution doesn't match the expected output. Try reviewing the problem again."
  };
};

export const getLessonSolution = async (lessonId) => {
  const token = localStorage.getItem("token");
  try {
    // Use the correct endpoint for your backend
    return await api.get(`accounts/lessons/${lessonId}/`, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Lesson Solution API Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * General Quiz API
 * Use these for the stand-alone /quiz page (site-wide quiz)
 */
export const getGeneralQuizQuestions = async () => {
  try {
    // Correct endpoint for general quiz questions
    return await api.get("accounts/quiz-questions/");
  } catch (error) {
    console.error("General Quiz Questions API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const submitGeneralQuizAnswers = async (answers) => {
  try {
    // Correct endpoint for submitting general quiz answers
    return await api.post("accounts/quiz-questions/submit/", { answers });
  } catch (error) {
    console.error("General Quiz Submit API Error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
