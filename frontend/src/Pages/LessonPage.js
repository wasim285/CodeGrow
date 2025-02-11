import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import "../styles/LessonPage.css";
import Navbar from "../components/navbar";
import TreeLoader from "../components/TreeLoader";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";

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

                const response = await fetch(`http://127.0.0.1:8000/api/accounts/lessons/${lessonId}/`, {  
                    method: "GET",
                    headers: { Authorization: `Token ${token}` },
                });

                if (!response.ok) throw new Error("Lesson not found.");

                const data = await response.json();
                setLesson(data);
                setUserCode(step === 2 ? (data.code_snippet || "") : ""); 
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [user, lessonId, navigate, step]);

    const markAsCompleted = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/accounts/complete-lesson/${lessonId}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${localStorage.getItem("token")}`
                }
            });
    
            if (response.ok) {
                setIsCompleted(true);
                window.dispatchEvent(new Event("lessonCompleted"));  
            }
        } catch (error) {
            console.error("Error completing lesson:", error);
        }
    };
    
    const runCode = async () => {
        if (running) return;
        setRunning(true);
        setOutput("Running...");
    
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://127.0.0.1:8000/api/accounts/run-code/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    code: userCode.trim(), 
                    lesson_id: lessonId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to execute code.");
            }

            setOutput(result.output || "No output.");
        } catch (error) {
            setOutput("Error running code.");
            console.error("Run Code Error:", error);
        } finally {
            setRunning(false);
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
                                    <p>{lesson.step1_content}</p>
                                </div>
                            )}
                            {step === 2 && (
                                <div>
                                    <h3>Step 2: Guided Code Example</h3>
                                    <p>{lesson.step2_content}</p>
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
                                            <p>{lesson.step3_challenge}</p>
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
                                        </>
                                    ) : (
                                        <p className="error-message">No challenge available for this lesson.</p>
                                    )}
                                </div>
                            )}
                            
                            <div className="step-navigation">
                                {step > 1 && (
                                    <button className="previous-btn" onClick={() => setStep(step - 1)}>Previous</button>
                                )}
                                {step < 3 && (
                                    <button className="next-btn" onClick={() => setStep(step + 1)}>Next</button>
                                )}
                                {step === 3 && (
                                    <button 
                                        className={`mark-btn ${isCompleted ? "completed" : ""}`} 
                                        onClick={markAsCompleted} 
                                        disabled={isCompleted}
                                    >
                                        {isCompleted ? "Completed ✅" : "Mark as Completed"}
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
