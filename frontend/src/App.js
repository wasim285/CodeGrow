import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import components with their CORRECT filenames
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

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
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
    </>
  );
}

export default App;
