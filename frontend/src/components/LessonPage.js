// Add this import
import { getLessonFeedback } from '../services/feedbackService';

// Inside your LessonPage component:
const [feedback, setFeedback] = useState("");
const [isLoading, setIsLoading] = useState(false);

// Add this function to check answer and provide feedback if wrong
const checkAnswer = async () => {
  setIsLoading(true);
  try {
    // First run the code to get the output
    const result = await runCode(code);
    const userOutput = result.output;
    
    // Compare with expected output (you need to add this to your lesson model)
    const expectedOutput = currentLesson.expected_output;
    
    if (userOutput.trim() === expectedOutput.trim()) {
      // Answer is correct
      setFeedback("");
      handleLessonCompletion(); // Your existing function to mark lesson as complete
    } else {
      // Answer is wrong, get AI feedback
      const feedbackResponse = await getLessonFeedback({
        code: code,
        expected_output: expectedOutput,
        user_output: userOutput,
        question: currentLesson.step3_challenge
      });
      
      setFeedback(feedbackResponse.feedback);
    }
  } catch (error) {
    console.error("Error checking answer:", error);
    setFeedback("Error getting feedback. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

// Render feedback component in your UI
{feedback && (
  <div className="feedback-container">
    <h3>AI Feedback</h3>
    <div className="feedback-content">
      {feedback}
    </div>
  </div>
)}