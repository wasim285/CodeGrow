import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/Authcontext';

// Import components
import Navbar from './components/navbar';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import SignUpPage from './Pages/SignUpPage';
import PathwaysPage from './Pages/PathwaysPage';
import DifficultyPage from './Pages/DifficultyPage';
import Dashboard from './Pages/Dashboard';
import LessonPage from './Pages/LessonPage';
import StudyCalendar from './Pages/StudyCalendar';
import TreeLoader from './components/TreeLoader';
import LessonsPage from './Pages/LessonsPage';
import ProfilePage from './Pages/ProfilePage';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <TreeLoader />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
        
        {/* Protected routes */}
        <Route path="/pathways" element={
          <ProtectedRoute>
            <PathwaysPage />
          </ProtectedRoute>
        } />
        <Route path="/difficulty" element={
          <ProtectedRoute>
            <DifficultyPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/lessons" element={
          <ProtectedRoute>
            <LessonsPage />
          </ProtectedRoute>
        } />
        <Route path="/lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        } />
        <Route path="/study-sessions" element={
          <ProtectedRoute>
            <StudyCalendar />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/pathways" replace />} />
      </Routes>
    </>
  );
}

export default App;
