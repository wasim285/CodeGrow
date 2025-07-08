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

export const getAIReview = async (userCode, lessonId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post(
      "accounts/ai-feedback/",
      {
        code: userCode,
        lesson_id: lessonId,
      },
      {
        headers: { Authorization: `Token ${token}` },
      }
    );

    return response.data.feedback;
  } catch (error) {
    console.error("AI Feedback API Error:", error.response?.data || error.message);
    return { error: "Failed to retrieve AI feedback." };
  }
};

export const getLessonFeedback = async (feedbackData) => {
  const token = localStorage.getItem("token");

  try {
    const response = await api.post(
      "accounts/lesson-feedback/",
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

/**
 * Get AI learning assistant response for a student's question
 * @param {Object} requestData - Data for the AI assistant
 * @param {string} requestData.lessonId - ID of the current lesson
 * @param {number} requestData.currentStep - Current step in the lesson (1, 2, or 3)
 * @param {string} requestData.userCode - User's current code (optional)
 * @param {string} requestData.expectedOutput - Expected output for the challenge (optional)
 * @param {string} requestData.question - Student's question
 * @returns {Promise<Object>} - Response from the AI assistant
 */
export const getAIAssistantResponse = async (requestData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required");
  }

  // First attempt with normal timeout
  try {
    const response = await api.post(
      "accounts/lesson-assistant/",
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
        const retryResponse = await api.post(
          "accounts/lesson-assistant/",
          requestData,
          {
            headers: { Authorization: `Token ${token}` },
            timeout: 30000 // 30 second timeout for second attempt
          }
        );
        
        return retryResponse.data;
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        return {
          success: false,
          message: "The request timed out. Please try a shorter question or try again later.",
          fallback: getFallbackResponse(requestData.question, requestData.currentStep)
        };
      }
    } else {
      console.error("AI Assistant API Error:", error.response?.data || error.message);
      return {
        success: false,
        message: "Failed to get a response. Please try again.",
        fallback: getFallbackResponse(requestData.question, requestData.currentStep)
      };
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

  // Simple string comparison with normalization
  const normalizedUser = userOutput.trim().replace(/\r\n/g, '\n');
  const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n');
  
  const isCorrect = normalizedUser === normalizedExpected;
  
  return {
    correct: isCorrect,
    message: isCorrect 
      ? "✅ Great job! Your solution is correct!" 
      : "❌ Your solution doesn't match the expected output. Try asking the AI Assistant for help."
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
