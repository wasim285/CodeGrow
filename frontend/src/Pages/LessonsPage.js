import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { Link } from "react-router-dom";
import "../styles/LessonsPage.css";
import Navbar from "../components/navbar";

const LessonsPage = () => {
    const { user } = useContext(AuthContext);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("User not authenticated");
                    setLoading(false);
                    return;
                }

                const response = await fetch("http://127.0.0.1:8000/api/accounts/all-lessons/", {
                    method: "GET",
                    headers: { Authorization: `Token ${token}` },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch lessons");
                }

                const data = await response.json();
                setLessons(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, []);

    if (loading) return <p>Loading lessons...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="lessons-page">
            <Navbar />
            <div className="lessons-container">
                <h1 className="lessons-title">All Lessons</h1>
                <div className="lessons-grid">
                    {lessons.length > 0 ? (
                        lessons.map((lesson) => (
                            <div key={lesson.id} className="lesson-card">
                                <h3>{lesson.title}</h3>
                                <p>{lesson.description}</p>
                                <Link to={`/lessons/${lesson.id}`} className="lesson-btn">
                                    Start Lesson
                                </Link>
                            </div>
                        ))
                    ) : (
                        <p>No lessons available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonsPage;
