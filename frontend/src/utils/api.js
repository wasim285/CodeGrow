import axios from "axios";

// ✅ Automatically switch between local and deployed backend
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://codegrow-backend.onrender.com/api/accounts/"  // ✅ Ensure `/accounts/` is included
    : "http://127.0.0.1:8000/api/accounts/";

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

// ✅ Fetch All Lessons
export const getAllLessons = async (token) => {
  try {
    return await api.get("all-lessons/", {  // ✅ Use "all-lessons/" instead of "lessons/"
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Lessons API Error:", error.response?.data || error.message);
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
