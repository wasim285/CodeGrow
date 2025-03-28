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
  
  // Add state to track the learning pathway
  const [learningPathway, setLearningPathway] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Set learning pathway from user context
    if (user.learning_goal) {
      setLearningPathway(user.learning_goal);
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

        const lessonData = response.data;
        setLesson(lessonData);
        setExpectedOutput(lessonData.expected_output || "");

        console.log("Fetched lesson data:", lessonData);
        console.log("Current learning pathway:", user.learning_goal);

        // Handle code snippets based on step and learning pathway
        if (step === 2) {
          // For guided example, use code snippet if available
          if (lessonData.code_snippet && userCode.trim() === "") {
            console.log("Setting code from lesson snippet:", lessonData.code_snippet);
            setUserCode(lessonData.code_snippet);
          } 
          // If no snippet is available but we need some starter code
          else if (!lessonData.code_snippet && userCode.trim() === "") {
            setUserCode("# Try your code here\n\n");
          }
        } else if (step === 3) {
          // For mini challenge, determine if we should provide starter code based on pathway
          if (user.learning_goal === "School" && step === 3) {
            // For school pathway, students might need a bit more guidance in challenges
            setUserCode("# Write your solution here\n\n");
          } else {
            // For other pathways, start with empty editor for challenges
            setUserCode("");
          }
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

  // Improved check answer with pathway-specific feedback
  const checkAnswer = async () => {
    if (checking || running) return;
    setChecking(true);
    
    try {
      const userOutput = await runCode(); // Run the code to get output
      
      // Compare with expected output
      const isCorrect = userOutput.trim() === expectedOutput.trim();
      
      // Create pathway-specific feedback messages
      let feedbackMessage = "";
      
      if (isCorrect) {
        // Customized success messages by pathway
        if (learningPathway === "School") {
          feedbackMessage = "✅ Correct! You've successfully completed this exercise. Great job!";
        } else if (learningPathway === "Portfolio") {
          feedbackMessage = "✅ Excellent! Your solution works perfectly. This would be a great addition to your portfolio.";
        } else if (learningPathway === "Career Growth") {
          feedbackMessage = "✅ Correct implementation. Your solution demonstrates professional-quality code.";
        } else {
          feedbackMessage = "✅ Correct! Your solution matches the expected output.";
        }
        
        markAsCompleted(); // Mark lesson as completed
      } else {
        // Customized error messages by pathway
        if (learningPathway === "School") {
          feedbackMessage = "❌ Not quite right. Try reviewing what you've learned so far, or ask the AI Assistant for help.";
        } else if (learningPathway === "Portfolio") {
          feedbackMessage = "❌ Your solution doesn't match the expected output. Remember that attention to detail is important in portfolio projects.";
        } else if (learningPathway === "Career Growth") {
          feedbackMessage = "❌ Your implementation needs revision. Consider edge cases and validate your approach.";
        } else {
          feedbackMessage = "❌ Incorrect. Your solution doesn't match the expected output.";
        }
      }
      
      setCheckResult({
        correct: isCorrect,
        message: feedbackMessage
      });
      
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

  // Display pathway-specific learning path indicator
  const renderPathwayBadge = () => {
    if (!learningPathway) return null;
    
    let badgeClass = "pathway-badge";
    if (learningPathway === "School") badgeClass += " school";
    if (learningPathway === "Portfolio") badgeClass += " portfolio";
    if (learningPathway === "Career Growth") badgeClass += " career";
    
    return <span className={badgeClass}>{learningPathway}</span>;
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
              <div className="lesson-header">
                <h1>{lesson.title}</h1>
                {renderPathwayBadge()}
              </div>
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
                          placeholder={`Write your solution here for ${learningPathway}...`}
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
                      
                      {/* Pathway-Specific Check Result */}
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
      
      {/* AI Learning Assistant */}
      {lesson && (
        <AILearningAssistant 
          lessonId={lessonId}
          lessonTitle={lesson.title}
          currentStep={step}
          userCode={userCode}
          expectedOutput={expectedOutput}
          learningPathway={learningPathway} // Pass learning pathway to AI assistant
        />
      )}
    </div>
  );
};

export default LessonPage;
