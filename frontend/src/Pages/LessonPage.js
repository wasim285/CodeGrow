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

  // Helper function to try multiple endpoints
  const tryEndpoints = async (baseEndpoint, method = 'get', data = null) => {
    const endpoints = [
      baseEndpoint,
      `accounts/${baseEndpoint}`,
      `lessons/${baseEndpoint}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        if (method === 'get') {
          const response = await api.get(endpoint);
          console.log(`Success with GET endpoint ${endpoint}`);
          return response;
        } else if (method === 'post') {
          const response = await api.post(endpoint, data || {});
          console.log(`Success with POST endpoint ${endpoint}`);
          return response;
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
      }
    }
    
    throw new Error(`All endpoints failed for ${baseEndpoint}`);
  };

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

        // Try getting lesson data with multiple endpoint patterns
        let response;
        try {
          response = await tryEndpoints(`lessons/${lessonId}/`);
        } catch (lessonError) {
          // Try without lessons/ prefix since it might be included in the endpoints array
          try {
            response = await tryEndpoints(`${lessonId}/`);
          } catch (error) {
            throw new Error("Could not fetch lesson data");
          }
        }

        setLesson(response.data);
        
        // Handle expected output properly
        if (response.data.expected_output) {
          // Normalize expected output to account for line endings
          const normalized = response.data.expected_output.trim().replace(/\r\n/g, '\n');
          setExpectedOutput(normalized);
          console.log("Expected output:", normalized); // Debug log
        } else {
          setExpectedOutput("");
        }

        // Handle code snippets based on step
        if (step === 2) {
          // For guided example, use code snippet if available
          if (response.data.code_snippet && userCode.trim() === "") {
            setUserCode(response.data.code_snippet);
          } 
          // If no snippet is available but we need some starter code
          else if (!response.data.code_snippet && userCode.trim() === "") {
            setUserCode("# Try your code here\n\n");
          }
        } else if (step === 3) {
          // For mini challenge, always start with empty editor
          setUserCode("");
        }

        // Check if lesson is already completed with multiple endpoint patterns
        try {
          const completionResponse = await tryEndpoints(`check-lesson-completion/${lessonId}/`);
          setIsCompleted(completionResponse.data.is_completed);
        } catch (completionError) {
          console.log("Could not check lesson completion:", completionError.message);
          setIsCompleted(false);
        }
        
      } catch (error) {
        console.error("Error fetching lesson:", error);
        setError(error.message || "Lesson not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [user, lessonId, navigate, step]);

  const markAsCompleted = async () => {
    try {
      // Try marking the lesson as completed with multiple endpoint patterns
      try {
        const response = await tryEndpoints(`complete-lesson/${lessonId}/`, 'post');
        
        if (response.status === 200 || response.status === 201) {
          setIsCompleted(true);
          window.dispatchEvent(
            new CustomEvent("lessonCompleted", {
              detail: response.data.progress,
            })
          );
        }
      } catch (error) {
        console.error("Could not mark lesson as completed with any endpoint");
        // Still mark as completed in the UI for better experience
        setIsCompleted(true);
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

      // Try running the code with multiple endpoint patterns
      try {
        const response = await tryEndpoints('run-code/', 'post', { 
          code: userCode.trim(), 
          lesson_id: lessonId 
        });

        setOutput(response.data.output || "No output.");
        return response.data.output || ""; // Return output for checkAnswer
      } catch (error) {
        console.error("All run code endpoints failed:", error);
        setOutput("Error executing code. Please try again.");
        return "Error"; // Return error for checkAnswer
      }
    } catch (error) {
      console.error("Run Code Error:", error);
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
      
      // Better output comparison - normalize both outputs for comparison
      const normalizedUserOutput = userOutput.trim().replace(/\r\n/g, '\n');
      const normalizedExpectedOutput = expectedOutput.trim().replace(/\r\n/g, '\n');
      
      if (normalizedUserOutput === normalizedExpectedOutput) {
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

  // Add these functions to handle step transitions properly

  const goToNextStep = () => {
    // If moving to challenge step, clear the code editor
    if (step === 2) {
      setUserCode("");
    }
    setStep(step + 1);
    setOutput("");  // Clear output
    setCheckResult(null);  // Clear check results
  };

  const goToPreviousStep = () => {
    // If moving from challenge to guided example, load the example code
    if (step === 3 && lesson.code_snippet) {
      setUserCode(lesson.code_snippet);
    }
    setStep(step - 1);
    setOutput("");  // Clear output
    setCheckResult(null);  // Clear check results
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
                          placeholder="Write your solution here..."
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

              {/* Update the step navigation section */}
              <div className="step-navigation">
                {step > 1 && (
                  <button className="previous-btn" onClick={goToPreviousStep}>
                    Previous
                  </button>
                )}
                {step < 3 && (
                  <button className="next-btn" onClick={goToNextStep}>
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
      
      {/* AI Learning Assistant - Now positioned absolutely by CSS */}
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
  );
};

export default LessonPage;
