import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/Authcontext';

// Import components with their CORRECT filenames
import Navbar from './components/navbar';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import SignUpPage from './Pages/SignUpPage'; // Changed from RegisterPage to SignUpPage
import PathwaysPage from './Pages/PathwaysPage';
import DifficultyPage from './Pages/DifficultyPage';
import Dashboard from './Pages/Dashboard';
import LessonPage from './Pages/LessonPage';
import StudyCalendar from './Pages/StudyCalendar';
import TreeLoader from './components/TreeLoader';
import LessonsPage from './Pages/LessonsPage';
import ProfilePage from './Pages/ProfilePage';

// Remove the Router from here - it should only exist in index.js
function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} /> {/* Updated element name */}
        <Route path="/pathways" element={<PathwaysPage />} />
        <Route path="/difficulty" element={<DifficultyPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/study-sessions" element={<StudyCalendar />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/pathways" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
