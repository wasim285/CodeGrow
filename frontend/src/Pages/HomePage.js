import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/NewHomePage.css"; // Ensure this path is correct

function HomePage() {
  console.log("HomePage component rendering"); // Debugging

  return (
    <div className="homepage">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">{"</>"}</span>
          CodeGrow
        </div>
      </nav>

      <div className="container">
        {/* Left Section: Heading and Buttons */}
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

            {/* Buttons - Replaced Learn More with Login */}
            <div className="buttons">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/register" className="btn btn-green">
                  Get Started
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/login" className="btn btn-outline login-button">
                  Login
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Section: Code Editor and Lesson Cards */}
        <div className="right-content">
          {/* Code Editor Preview */}
          <motion.div 
            className="code-editor"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="editor-header">
              <div className="editor-title">main.py</div>
              <div className="editor-actions">
                <div className="action-dot dot-red"></div>
                <div className="action-dot dot-yellow"></div>
                <div className="action-dot dot-green"></div>
              </div>
            </div>
            <div className="code-content">
              <div className="code-line">
                <span className="line-number">1</span>
                <span className="keyword">def</span> <span className="function">learn_python</span>():
              </div>
              <div className="code-line">
                <span className="line-number">2</span>
                <span>  </span>skills = [<span className="string">"basics"</span>, <span className="string">"functions"</span>, <span className="string">"classes"</span>]
              </div>
              <div className="code-line">
                <span className="line-number">3</span>
                <span>  </span><span className="keyword">return</span> <span className="string">"Ready to grow!"</span>
              </div>
              <div className="code-line">
                <span className="line-number">4</span>
                <span className="comment"># Start your coding journey today</span>
              </div>
            </div>
          </motion.div>
          
          {/* Lesson Cards */}
          <motion.div
            className="lesson-box completed"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="lesson-title">Python Basics</div>
            <div className="lesson-description">Learn fundamentals of Python programming including variables, data types and operators.</div>
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
            transition={{ duration: 0.5, delay: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="lesson-title">Functions & Control Flow</div>
            <div className="lesson-description">Master functions, conditional statements, and loops to control program flow.</div>
            <div className="lesson-stats">
              <span className="lesson-level">Intermediate</span>
              <div className="completion-indicator">
                <span className="in-progress-icon">●</span> In Progress
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Statistics Section */}
      <motion.div 
        className="stats-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.2 }}
      >
        <div className="stat-item">
          <div className="stat-number">5,000+</div>
          <div className="stat-label">Active Learners</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">200+</div>
          <div className="stat-label">Coding Lessons</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">95%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </motion.div>
      
      {/* Footer Section */}
      <motion.footer 
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
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
