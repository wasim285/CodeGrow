import { useEffect, useState, useContext } from "react";
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

                if (!response.ok) {
                    throw new Error("Lesson not found.");
                }

                const data = await response.json();
                setLesson(data);
                setUserCode(data.code_snippet || ""); 
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [user, lessonId, navigate]);

    const runCode = async () => {
        if (running) return;
        setRunning(true);
        setOutput("Running...");

        try {
            const response = await fetch("http://127.0.0.1:8000/api/accounts/run-code/", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    code: userCode,
                    lesson_id: lessonId  
                }),
            });

            const result = await response.json();
            setOutput(result.output || result.error || "No output");
        } catch (error) {
            setOutput("Error running code.");
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
                    {lesson ? (
                        <>
                            <h1>{lesson.title}</h1>
                            <p className="lesson-description">{lesson.description}</p>

                            <div className="lesson-details">
                                <h3>Lesson Overview</h3>
                                {lesson.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, "<br>") }} />
                                ) : (
                                    <p className="error-message">No content available.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="error-message">No lesson available.</p>
                    )}
                </div>

                <div className="lesson-code">
                    {lesson && (
                        <>
                            <h3>Try it out:</h3>
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonPage;
