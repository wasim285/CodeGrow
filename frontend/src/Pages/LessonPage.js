import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import "../styles/LessonPage.css";
import Navbar from "../components/navbar";
import TreeLoader from "../components/TreeLoader";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import axios from "axios";

// ✅ Correct API Base URL
const API_BASE_URL = "https://codegrow-backend.onrender.com/api/accounts/";

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

                const response = await axios.get(`${API_BASE_URL}lessons/${lessonId}/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                setLesson(response.data);

                // ✅ Load code snippet only when in Step 2 and the user hasn't modified code yet
                if (response.data.code_snippet && step === 2 && userCode.trim() === "") {
                    setUserCode(response.data.code_snippet);
                }
            } catch (error) {
                setError(error.response?.data?.error || "Lesson not found.");
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [user, lessonId, navigate, step]); // ✅ Ensure it re-fetches when the step changes

    const markAsCompleted = async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}complete-lesson/${lessonId}/`,
                {},
                {
                    headers: { Authorization: `Token ${localStorage.getItem("token")}` },
                }
            );

            if (response.status === 200) {
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
            if (!token) throw new Error("User not authenticated.");

            const response = await axios.post(
                `${API_BASE_URL}run-code/`,
                { code: userCode.trim(), lesson_id: lessonId },
                { headers: { Authorization: `Token ${token}` } }
            );

            setOutput(response.data.output || "No output.");
        } catch (error) {
            console.error("Run Code API Error:", error.response?.data || error.message);
            setOutput("Error executing code.");
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
                                    <p dangerouslySetInnerHTML={{ __html: lesson.step1_content || "No content available." }}></p>
                                </div>
                            )}
                            {step === 2 && (
                                <div>
                                    <h3>Step 2: Guided Code Example</h3>
                                    <p dangerouslySetInnerHTML={{ __html: lesson.step2_content || "No content available." }}></p>
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
                                            <p dangerouslySetInnerHTML={{ __html: lesson.step3_challenge || "No challenge available." }}></p>
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
