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
export const getAIAssistantResponse = async (assistantData) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return { 
      success: false, 
      error: "Authentication required" 
    };
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}lesson-assistant/`,
      {
        lessonId: assistantData.lessonId,
        currentStep: assistantData.currentStep || 1,
        userCode: assistantData.userCode || "",
        expectedOutput: assistantData.expectedOutput || "",
        question: assistantData.question
      },
      {
        headers: { Authorization: `Token ${token}` },
        timeout: 8000 // 8-second timeout for this specific request
      }
    );

    // Validate response
    if (response.data && typeof response.data.response === 'string') {
      return {
        success: true,
        response: response.data.response
      };
    } else {
      // If server response is not in expected format
      return {
        success: false,
        error: "Invalid response format from server",
        fallbackResponse: getFallbackResponse(assistantData.question, assistantData.currentStep)
      };
    }
  } catch (error) {
    console.error("AI Assistant API Error:", error);
    
    // Provide more detailed error information and a fallback response
    let errorMessage = "Failed to get AI assistant response.";
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timed out. The assistant is taking too long to respond.";
    } else if (error.response) {
      errorMessage = error.response.data?.error || 
                    `Server error (${error.response.status}): ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = "No response received from server. Check your internet connection.";
    }
    
    return { 
      success: false, 
      error: errorMessage,
      fallbackResponse: getFallbackResponse(assistantData.question, assistantData.currentStep)
    };
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

  // Simple string comparison
  const isCorrect = userOutput.trim() === expectedOutput.trim();
  
  return {
    correct: isCorrect,
    message: isCorrect 
      ? "✅ Great job! Your solution is correct!" 
      : "❌ Your solution doesn't match the expected output. Try asking the AI Assistant for help."
  };
};

export default api;
