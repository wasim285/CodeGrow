import api from "../utils/api";

/**
 * Get general AI feedback on code without expected output comparison
 * @param {string} code - The code to analyze
 * @param {string} lessonId - The lesson ID
 * @returns {Promise<Object>} - The feedback response
 */
export const getGeneralAIFeedback = async (code, lessonId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const response = await api.post(
      "ai-feedback/",
      { code: code.trim(), lesson_id: lessonId },
      { headers: { Authorization: `Token ${token}` } }
    );

    return {
      success: true,
      feedback: response.data.feedback[0]?.generated_text || "No feedback available"
    };
  } catch (error) {
    console.error("Error getting AI feedback:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to get AI feedback"
    };
  }
};

/**
 * Get targeted AI feedback for incorrect answers with expected output comparison
 * @param {Object} data - The feedback request data
 * @param {string} data.code - The code submitted by the user
 * @param {string} data.expected_output - The expected output
 * @param {string} data.user_output - The actual output from the user's code
 * @param {string} data.question - The challenge question
 * @returns {Promise<Object>} - The feedback response
 */
export const getLessonFeedback = async (data) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const response = await api.post(
      "lesson-feedback/",
      {
        code: data.code.trim(),
        expected_output: data.expected_output,
        user_output: data.user_output,
        question: data.question
      },
      { headers: { Authorization: `Token ${token}` } }
    );

    return {
      success: true,
      feedback: response.data.feedback
    };
  } catch (error) {
    console.error("Error getting lesson feedback:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to get lesson feedback"
    };
  }
};