import axios from "axios";

// Automatically switch between local and deployed backend
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://codegrow-backend.onrender.com/api/accounts/"
    : "http://127.0.0.1:8000/api/accounts/";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const registerUser = async (userData) => {
  return await api.post("register/", userData);
};

export const loginUser = async (userData) => {
  return await api.post("login/", userData);
};

export const getProfile = async (token) => {
  return await api.get("profile/", {
    headers: { Authorization: `Token ${token}` },
  });
};

export const getAllLessons = async (token) => {
  return await api.get("lessons/", {
    headers: { Authorization: `Token ${token}` },
  });
};

export const getStudySessions = async (token) => {
  return await api.get("study-sessions/", {
    headers: { Authorization: `Token ${token}` },
  });
};

export const logoutUser = async (token) => {
  return await api.post("logout/", {}, {
    headers: { Authorization: `Token ${token}` },
  });
};

export default api;
