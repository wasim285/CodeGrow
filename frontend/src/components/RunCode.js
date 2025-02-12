import axios from "axios";

// Automatically switch between local and deployed backend
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://codegrow-backend.onrender.com/api/accounts/"
    : "http://127.0.0.1:8000/api/accounts/";

export const runCode = async (code, lessonId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("User not authenticated.");
        }

        const response = await axios.post(
            `${API_BASE_URL}run-code/`,
            { code, lesson_id: lessonId },
            { headers: { Authorization: `Token ${token}` } }
        );

        return response.data.output || "No output.";
    } catch (error) {
        console.error("Run Code API Error:", error.response?.data || error.message);
        return error.response?.data?.error || "Error executing code.";
    }
};
