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
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import AdminUserDetail from './Pages/AdminUserDetail';
import AdminPathways from './Pages/AdminPathways';
import AdminPathwayDetail from './Pages/AdminPathwayDetail';
import AdminLessons from './Pages/AdminLessons';
import AdminLessonDetail from './Pages/AdminLessonDetail';
import AdminActivityLog from './Pages/AdminActivityLog';
import PrivateAdminRoute from './components/PrivateAdminRoute';

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

                {/* Admin Routes - Protected by PrivateAdminRoute */}
                <Route path="/admin/dashboard" element={
                    <PrivateAdminRoute>
                        <AdminDashboard />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/users" element={
                    <PrivateAdminRoute>
                        <AdminUsers />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/users/:id" element={
                    <PrivateAdminRoute>
                        <AdminUserDetail />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/pathways" element={
                    <PrivateAdminRoute>
                        <AdminPathways />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/pathways/:id" element={
                    <PrivateAdminRoute>
                        <AdminPathwayDetail />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/lessons" element={
                    <PrivateAdminRoute>
                        <AdminLessons />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/lessons/:id" element={
                    <PrivateAdminRoute>
                        <AdminLessonDetail />
                    </PrivateAdminRoute>
                } />
                
                <Route path="/admin/activity" element={
                    <PrivateAdminRoute>
                        <AdminActivityLog />
                    </PrivateAdminRoute>
                } />
            </Routes>
        </>
    );
}

export default App;
