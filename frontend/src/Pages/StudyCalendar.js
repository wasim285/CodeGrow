import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "../styles/StudyCalendar.css";

const StudyCalendar = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("11:00");
    const [lessons, setLessons] = useState([]);
    const [successPopup, setSuccessPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/accounts/lessons/", {
                    headers: { Authorization: `Token ${token}` },
                });
                setLessons(response.data);
            } catch (error) {
                console.error("Error fetching lessons:", error);
            }
        };
        fetchLessons();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const fetchSessions = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/accounts/study-sessions/", {
                    headers: { Authorization: `Token ${token}` },
                });
                setSessions(response.data);
            } catch (error) {
                console.error("Error fetching study sessions:", error);
            }
        };
        fetchSessions();
    }, [token]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
        setModalOpen(true);
        setErrorMessage("");
    };

    const handleBookLesson = async () => {
        if (!selectedLesson || !startTime || !endTime) {
            setErrorMessage("⚠️ Please fill in all fields.");
            return;
        }

        const newSession = {
            lesson: parseInt(selectedLesson, 10),
            date: selectedDate,
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
        };

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/accounts/study-sessions/", newSession, {
                headers: { Authorization: `Token ${token}` },
            });

            setSessions((prevSessions) => [...prevSessions, response.data]);
            setModalOpen(false);
            setSelectedLesson("");
            setStartTime("10:00");
            setEndTime("11:00");

            setSuccessPopup(true);
            setTimeout(() => setSuccessPopup(false), 3000);
        } catch (error) {
            console.error("Error booking study session:", error);
        }
    };

    return (
        <div className="study-calendar-container">
            {successPopup && (
                <div className="success-alert">
                    ✅ Lesson booked successfully!
                </div>
            )}

            <h2>📅 My Study Schedule</h2>
            <p className="calendar-subtitle">Click on a date to book a lesson!</p>

            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={sessions.map(session => ({
                    title: session.lesson_title || "No Lesson Name",
                    start: `${session.date}T${session.start_time}`,
                    end: `${session.date}T${session.end_time}`,
                }))}
                dateClick={handleDateClick}
                height="auto"
            />

            {modalOpen && (
                <>
                    <div className="modal-overlay" onClick={() => setModalOpen(false)}></div>
                    <div className="modal">
                        <h3>📖 Book a Lesson on {selectedDate}</h3>

                        {errorMessage && <p className="error-message">{errorMessage}</p>} 

                        <label>Select a Lesson:</label>
                        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}>
                            <option value="">-- Choose a Lesson --</option>
                            {lessons.map(lesson => (
                                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                            ))}
                        </select>

                        <label>Start Time:</label>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

                        <label>End Time:</label>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

                        <div className="modal-buttons">
                            <button onClick={handleBookLesson} className="confirm">Confirm</button>
                            <button className="cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudyCalendar;
