import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { Link } from "react-router-dom";
import axios from "axios"; // ✅ Directly using axios for better control
import "../styles/LessonsPage.css";
import Navbar from "../components/navbar";

// ✅ Correct API Base URL
const API_BASE_URL = "https://codegrow-backend.onrender.com/api/accounts/";

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
                    setError("User not authenticated. Please log in.");
                    setLoading(false);
                    return;
                }

                // ✅ Fetch lessons directly with axios
                const response = await axios.get(`${API_BASE_URL}all-lessons/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                if (!response.data || response.data.length === 0) {
                    setError("No lessons available.");
                } else {
                    setLessons(response.data);
                }
            } catch (error) {
                console.error("Lessons Fetch Error:", error.response?.data || error.message);
                setError(error.response?.data?.error || "Failed to fetch lessons.");
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
