import axios from "axios"; 

// ✅ Change this to the deployed backend URL
const API_BASE_URL = "https://codegrow-backend.onrender.com/api/accounts/";

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

export const fetchRecommendations = async (token, setRecommendedLessons, setError, setLoadingRecommendations) => {
  try {
    setLoadingRecommendations(true);

    const response = await api.get("recommended-lessons/", {
      headers: { Authorization: `Token ${token}` },
    });

    if (!response.data) throw new Error("Failed to fetch recommendations.");

    setRecommendedLessons(response.data.recommended_lessons || []);
  } catch (err) {
    console.error("Recommendation Fetch Error:", err);
    setError("Failed to load recommended lessons.");
  } finally {
    setLoadingRecommendations(false);
  }
};

export const logoutUser = async (token) => {
  return await api.post("logout/", {}, {
    headers: { Authorization: `Token ${token}` },
  });
};

export default api;
