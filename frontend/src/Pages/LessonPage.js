import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import "../styles/LessonPage.css";
import Navbar from "../components/navbar";
import TreeLoader from "../components/TreeLoader";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import api from "../utils/api";
import AILearningAssistant from "../components/AILearningAssistant";

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

  // States for auto-checking code output
  const [expectedOutput, setExpectedOutput] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

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
    setCheckResult(null); // Clear previous check result

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      const response = await api.post(
        `run-code/`,
        { code: userCode.trim(), lesson_id: lessonId },
        { headers: { Authorization: `Token ${token}` } }
      );

      setOutput(response.data.output || "No output.");
      return response.data.output || ""; // Return output for checkAnswer
    } catch (error) {
      console.error("Run Code API Error:", error.response?.data || error.message);
      setOutput("Error executing code.");
      return "Error"; // Return error for checkAnswer
    } finally {
      setRunning(false);
    }
  };

  // Simple check answer without AI feedback
  const checkAnswer = async () => {
    if (checking || running) return;
    setChecking(true);
    
    try {
      const userOutput = await runCode(); // Run the code to get output
      
      // Simple output comparison
      if (userOutput.trim() === expectedOutput.trim()) {
        setCheckResult({
          correct: true,
          message: "✅ Correct! Your solution matches the expected output.",
        });
        markAsCompleted(); // Mark lesson as completed
      } else {
        setCheckResult({
          correct: false,
          message: "❌ Incorrect. Your solution doesn't match the expected output. Try asking the AI Assistant for help.",
        });
      }
    } catch (error) {
      console.error("Check Answer Error:", error);
      setCheckResult({
        correct: false,
        message: "Error checking your answer. Please try again.",
      });
    } finally {
      setChecking(false);
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
                        <button 
                          className="run-btn" 
                          onClick={runCode} 
                          disabled={running || checking}
                        >
                          {running ? "Running..." : "Run Code"}
                        </button>
                        <button
                          className="check-btn"
                          onClick={checkAnswer}
                          disabled={running || checking}
                        >
                          {checking ? "Checking..." : "Check Answer"}
                        </button>
                      </div>
                      
                      <div className="output">
                        <h3>Output:</h3>
                        <pre>{output}</pre>
                      </div>
                      
                      {/* Simple Check Result */}
                      {checkResult && (
                        <div className={`check-result ${checkResult.correct ? 'success' : 'error'}`}>
                          <p>{checkResult.message}</p>
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
        
        {/* AI Learning Assistant */}
        {lesson && (
          <AILearningAssistant 
            lessonId={lessonId}
            lessonTitle={lesson.title}
            currentStep={step}
            userCode={userCode}
            expectedOutput={expectedOutput}
          />
        )}
      </div>
    </div>
  );
};

export default LessonPage;
