import axios from "axios";

const API_BASE_URL =
  window.location.hostname.includes("onrender.com")
    ? "https://codegrow.onrender.com/api/accounts/"
    : "http://127.0.0.1:8000/api/accounts/";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
});

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

export const getAIReview = async (userCode, lessonId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      `${API_BASE_URL}ai-feedback/`,
      {
        code: userCode,
        lesson_id: lessonId,  // ✅ Pass lesson ID for feedback tracking
      },
      {
        headers: { Authorization: `Token ${token}` },
      }
    );

    return response.data.feedback; // or full response if you want
  } catch (error) {
    console.error("AI Feedback API Error:", error.response?.data || error.message);
    return { error: "Failed to retrieve AI feedback." };
  }
};

export const getLessonFeedback = async (feedbackData) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      `${API_BASE_URL}lesson-feedback/`,
      {
        code: feedbackData.code,
        expected_output: feedbackData.expected_output,
        user_output: feedbackData.user_output, 
        question: feedbackData.question
      },
      {
        headers: { Authorization: `Token ${token}` },
      }
    );

    return {
      success: true,
      feedback: response.data.feedback
    };
  } catch (error) {
    console.error("Lesson Feedback API Error:", error.response?.data || error.message);
    return { 
      success: false,
      error: error.response?.data?.error || "Failed to retrieve lesson feedback."
    };
  }
};

export default api;
