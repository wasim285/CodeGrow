import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import "../styles/LessonPage.css";
import Navbar from "../components/navbar";
import TreeLoader from "../components/TreeLoader";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import api from "../utils/api";
import { getGeneralAIFeedback, getLessonFeedback } from "../services/feedbackService";

const API_BASE_URL =
  window.location.hostname.includes("onrender.com")
    ? "https://codegrow.onrender.com/api/accounts/"
    : "http://127.0.0.1:8000/api/accounts/";

const LessonPage = () => {
  const { user } = useContext(AuthContext);
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [step, setStep] = useState(1);

  // Enhanced AI feedback states
  const [aiFeedback, setAiFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [expectedOutput, setExpectedOutput] = useState("");
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchLesson = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await api.get(`lessons/${lessonId}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        setLesson(response.data);
        setExpectedOutput(response.data.expected_output || "");

        if (response.data.code_snippet && step === 2 && userCode.trim() === "") {
          setUserCode(response.data.code_snippet);
        }

        // Check if lesson is already completed
        const completionResponse = await api.get(`check-lesson-completion/${lessonId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setIsCompleted(completionResponse.data.is_completed);
        
      } catch (error) {
        setError(error.response?.data?.error || "Lesson not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [user, lessonId, navigate, step]);

  const markAsCompleted = async () => {
    try {
      const response = await api.post(
        `complete-lesson/${lessonId}/`,
        {},
        { headers: { Authorization: `Token ${localStorage.getItem("token")}` } }
      );

      if (response.status === 200) {
        setIsCompleted(true);
        window.dispatchEvent(
          new CustomEvent("lessonCompleted", {
            detail: response.data.progress,
          })
        );
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  const runCode = async () => {
    if (running) return;
    setRunning(true);
    setOutput("Running...");
    setAiFeedback(""); // Clear previous feedback

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const response = await api.post(
        `run-code/`,
        { code: userCode.trim(), lesson_id: lessonId },
        { headers: { Authorization: `Token ${token}` } }
      );

      setOutput(response.data.output || "No output.");
      return response.data.output || ""; // Return output for checkAnswer function
    } catch (error) {
      console.error("Run Code API Error:", error.response?.data || error.message);
      setOutput("Error executing code.");
      return "Error"; // Return error for checkAnswer function
    } finally {
      setRunning(false);
    }
  };

  // Manual AI feedback request for general feedback
  const getAIFeedback = async () => {
    setLoadingFeedback(true);
    setAiFeedback("Generating feedback...");
    
    try {
      const result = await getGeneralAIFeedback(userCode, lessonId);
      
      if (result.success) {
        setAiFeedback(result.feedback);
      } else {
        setAiFeedback("Failed to get AI feedback. Please try again.");
      }
    } catch (error) {
      console.error("AI Feedback Error:", error);
      setAiFeedback("Failed to fetch AI feedback.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Check answer against expected output
  const checkAnswer = async () => {
    if (checkingAnswer || running) return;
    setCheckingAnswer(true);
    setLoadingFeedback(true);
    
    try {
      // Run code and get output
      const userOutput = await runCode();
      
      // Compare with expected output
      if (userOutput.trim() === expectedOutput.trim()) {
        // Correct answer
        setAiFeedback("✅ Great job! Your solution is correct!");
        markAsCompleted();
      } else {
        // Wrong answer - get AI feedback
        setAiFeedback("Analyzing your code...");
        
        const result = await getLessonFeedback({
          code: userCode.trim(),
          expected_output: expectedOutput,
          user_output: userOutput,
          question: lesson.step3_challenge
        });
        
        if (result.success) {
          setAiFeedback(result.feedback);
        } else {
          setAiFeedback("Your solution doesn't match the expected output. Try again!");
        }
      }
    } catch (error) {
      console.error("Check Answer Error:", error);
      setAiFeedback("Error analyzing your code. Please try again.");
    } finally {
      setCheckingAnswer(false);
      setLoadingFeedback(false);
    }
  };

  if (loading) return <TreeLoader />;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="lesson-page">
      <Navbar />
      <div className="lesson-container">
        <div className="lesson-content">
          {lesson && (
            <>
              <h1>{lesson.title}</h1>
              <p className="lesson-description">{lesson.description}</p>

              {step === 1 && (
                <div>
                  <h3>Step 1: Introduction</h3>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: lesson.step1_content || "No content available.",
                    }}
                  ></p>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3>Step 2: Guided Code Example</h3>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: lesson.step2_content || "No content available.",
                    }}
                  ></p>
                  <div className="code-editor">
                    <CodeMirror
                      value={userCode}
                      height="250px"
                      extensions={[python()]}
                      theme="dark"
                      onChange={(value) => setUserCode(value)}
                    />
                  </div>
                  <button className="run-btn" onClick={runCode} disabled={running}>
                    {running ? "Running..." : "Run Code"}
                  </button>
                  <div className="output">
                    <h3>Output:</h3>
                    <pre>{output}</pre>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mini-challenge">
                  <h3>Step 3: Mini Challenge</h3>
                  {lesson.step3_challenge ? (
                    <>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: lesson.step3_challenge || "No challenge available.",
                        }}
                      ></p>
                      <div className="code-editor">
                        <CodeMirror
                          value={userCode}
                          height="250px"
                          extensions={[python()]}
                          theme="dark"
                          onChange={(value) => setUserCode(value)}
                        />
                      </div>
                      
                      {/* Button Group */}
                      <div className="button-group">
                        <button className="run-btn" onClick={runCode} disabled={running || checkingAnswer}>
                          {running ? "Running..." : "Run Code"}
                        </button>
                        <button
                          className="check-btn"
                          onClick={checkAnswer}
                          disabled={running || checkingAnswer || loadingFeedback}
                        >
                          {checkingAnswer ? "Checking..." : "Check Answer"}
                        </button>
                      </div>
                      
                      <div className="output">
                        <h3>Output:</h3>
                        <pre>{output}</pre>
                      </div>
                      
                      {/* AI Feedback Section */}
                      {loadingFeedback && !aiFeedback && (
                        <div className="feedback-loading">
                          <div className="spinner"></div>
                          <p>Getting AI feedback...</p>
                        </div>
                      )}
                      
                      {aiFeedback && (
                        <div className="feedback-container">
                          <h3>AI Feedback</h3>
                          <div className="feedback-content">
                            {aiFeedback}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="error-message">No challenge available for this lesson.</p>
                  )}
                </div>
              )}

              <div className="step-navigation">
                {step > 1 && (
                  <button className="previous-btn" onClick={() => setStep(step - 1)}>
                    Previous
                  </button>
                )}
                {step < 3 && (
                  <button className="next-btn" onClick={() => setStep(step + 1)}>
                    Next
                  </button>
                )}
                {step === 3 && (
                  <button
                    className={`mark-btn ${isCompleted ? "completed" : ""}`}
                    onClick={markAsCompleted}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Completed" : "Mark as Completed"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
