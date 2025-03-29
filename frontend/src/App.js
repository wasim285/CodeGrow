import { Routes, Route, Navigate, useLocation } from "react-router-dom";  
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "./context/Authcontext";
import Navbar from "./components/navbar";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/SignUpPage";
import PathwaysPage from "./Pages/PathwaysPage";
import DifficultyPage from "./Pages/DifficultyPage";
import Dashboard from "./Pages/Dashboard";
import LessonPage from "./Pages/LessonPage"; 
import StudyCalendar from "./Pages/StudyCalendar"; 
import TreeLoader from "./components/TreeLoader";
import LessonsPage from "./Pages/LessonsPage";
import ProfilePage from "./Pages/ProfilePage";

function App() {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const hideNavbarPaths = ["/", "/login", "/register", "/pathways", "/difficulty"];

    useEffect(() => {
        if (location.pathname === "/dashboard") {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        } else {
            setLoading(false);
        }
    }, [location.pathname]);

    return (
        <>
            {user && !hideNavbarPaths.includes(location.pathname) && !loading && <Navbar />}

            <Routes>
    <Route path="/" element={user ? <Navigate to="/pathways" /> : <HomePage />} />
    <Route path="/login" element={user ? <Navigate to="/pathways" /> : <LoginPage />} />
    <Route path="/register" element={user ? <Navigate to="/pathways" /> : <RegisterPage />} />
    <Route path="/pathways" element={user ? <PathwaysPage /> : <Navigate to="/" />} />
    <Route path="/difficulty" element={user ? <DifficultyPage /> : <Navigate to="/" />} />
    <Route path="/dashboard" element={loading ? <TreeLoader /> : user ? <Dashboard /> : <Navigate to="/" />} />
    <Route path="/lessons" element={user ? <LessonsPage /> : <Navigate to="/" />} />
    <Route path="/lessons/:lessonId" element={user ? <LessonPage /> : <Navigate to="/" />} />
    <Route path="/study-sessions" element={user ? <StudyCalendar /> : <Navigate to="/" />} />
    <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
    <Route path="*" element={<Navigate to="/" />} />
</Routes>

        </>
    );
}

export default App;
