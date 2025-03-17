import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/NewHomePage.css"; // Ensure this file is properly linked

function HomePage() {
  return (
    <div className="homepage">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">{"</>"}</span> CodeGrow
        </div>
      </nav>

      <div className="container">
        {/* Left Content */}
        <motion.div
          className="left-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="text-box">
            <h1 className="title">Master Python.<br />Level Up With AI.</h1>
            <p className="subtitle">
              Unlock personalized lessons, coding challenges, and real-world projects to grow your skills.
            </p>

            <div className="buttons">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/register" className="btn btn-green">
                  Get Started
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/login" className="login-button">
                  Login
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Content - Code editor removed */}
        <div className="right-content">
          {/* Simplified Lesson Boxes */}
          <motion.div
            className="lesson-box completed"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="lesson-title">Lesson 1</div>
            <div className="lesson-stats">
              <span className="lesson-level">Beginner</span>
              <div className="completion-indicator">
                <span className="completed-icon">✓</span> Completed
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lesson-box in-progress"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="lesson-title">Lesson 2</div>
            <div className="lesson-stats">
              <span className="lesson-level">Intermediate</span>
              <div className="completion-indicator">
                <span className="in-progress-icon">●</span> In Progress
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="lesson-box"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="lesson-title">Lesson 3</div>
            <div className="lesson-stats">
              <span className="lesson-level">Advanced</span>
              <div className="completion-indicator">
                <span className="locked-icon">🔒</span> Locked
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div 
        className="stats-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
      >
        <div className="stat-item"><div className="stat-number">5,000+</div><div className="stat-label">Active Learners</div></div>
        <div className="stat-item"><div className="stat-number">200+</div><div className="stat-label">Coding Lessons</div></div>
        <div className="stat-item"><div className="stat-number">95%</div><div className="stat-label">Success Rate</div></div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <div className="footer-links">
          <a href="#about" className="footer-link">About Us</a>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#terms" className="footer-link">Terms of Service</a>
          <a href="#contact" className="footer-link">Contact</a>
        </div>
        <div className="copyright">© 2025 CodeGrow. All rights reserved.</div>
      </motion.footer>
    </div>
  );
}

export default HomePage;
