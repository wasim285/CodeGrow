import axios from "axios";

// ✅ Automatically switch between local and deployed backend
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://codegrow-backend.onrender.com/api/"  // ✅ Removed `/accounts/`
    : "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Register User
export const registerUser = async (userData) => {
  try {
    return await api.post("register/", userData);
  } catch (error) {
    console.error("Register API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Login User
export const loginUser = async (userData) => {
  try {
    return await api.post("login/", userData);
  } catch (error) {
    console.error("Login API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get User Profile
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

// ✅ Fetch All Lessons (Filtered by Learning Path & Difficulty)
export const getAllLessons = async (token, learningGoal, difficultyLevel) => {
  try {
    return await api.get("all-lessons/", {
      headers: { Authorization: `Token ${token}` },
      params: {
        learning_goal: learningGoal,
        difficulty_level: difficultyLevel,
      },
    });
  } catch (error) {
    console.error("Lessons API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Fetch User Dashboard (Progress + Current Lesson)
export const getDashboard = async (token) => {
  try {
    return await api.get("dashboard/", {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Fetch Study Sessions
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

// ✅ Mark Lesson as Completed
export const completeLesson = async (token, lessonId) => {
  try {
    return await api.post(`complete-lesson/${lessonId}/`, {}, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Complete Lesson API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Check if a Lesson is Completed
export const checkLessonCompletion = async (token, lessonId) => {
  try {
    return await api.get(`check-lesson-completion/${lessonId}/`, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Lesson Completion API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Run User's Code
export const runCode = async (token, code, lessonId) => {
  try {
    return await api.post("run-code/", { code, lesson_id: lessonId }, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Run Code API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Logout User
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

export default api;
