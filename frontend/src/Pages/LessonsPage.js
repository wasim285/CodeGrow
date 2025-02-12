import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { Link } from "react-router-dom";
import { getAllLessons } from "../utils/api"; // ✅ Import API function
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

                const response = await getAllLessons(token); // ✅ Use API helper function

                if (response.status !== 200) {
                    throw new Error("Failed to fetch lessons");
                }

                setLessons(response.data);
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
