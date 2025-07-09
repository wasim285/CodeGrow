import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/NewHomePage.css";

function HomePage() {
  console.log("HomePage component rendering");
  
  return (
    <div className="homepage">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">{"</>"}</span>
          CodeGrow
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <motion.div
          className="hero-content-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">CodeGrow</span>
            </h1>
            <p className="hero-subtitle">
              Your friendly companion for learning Python programming. 
              Start your coding journey today with interactive lessons, 
              fun quizzes, and personalized learning paths!
            </p>

            <div className="hero-buttons">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login" className="btn btn-secondary">
                  Log In
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Welcome Animation */}
        <motion.div
          className="welcome-animation"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="python-logo">🌳</div>
          <div className="floating-elements">
            <div className="float-item">💡</div>
            <div className="float-item">⚡</div>
            <div className="float-item">🎯</div>
            <div className="float-item">🏆</div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.section
        className="features-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <h2 className="section-title">Why Choose CodeGrow?</h2>
        <div className="features-grid">
          <motion.div
            className="feature-card"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feature-icon">📚</div>
            <h3>Interactive Lessons</h3>
            <p>Learn Python step-by-step with hands-on coding exercises and real-world examples.</p>
          </motion.div>

          <motion.div
            className="feature-card"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feature-icon">🎮</div>
            <h3>Gamified Learning</h3>
            <p>Earn XP, level up, and track your progress as you master Python programming.</p>
          </motion.div>

          <motion.div
            className="feature-card"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feature-icon">🎯</div>
            <h3>Smart Quizzes</h3>
            <p>Test your knowledge with adaptive quizzes that help reinforce what you've learned.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="how-it-works"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose Your Path</h3>
            <p>Select your learning goals and current skill level</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Learn & Practice</h3>
            <p>Complete interactive lessons and coding challenges</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Track Progress</h3>
            <p>Monitor your growth and celebrate achievements</p>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        className="cta-section"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className="cta-content">
          <h2>Ready to Start Coding?</h2>
          <p>Join CodeGrow today and begin your Python programming journey!</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/register" className="btn btn-cta">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">{"</>"}</span>
              CodeGrow
            </div>
            <p>Learn Python, Grow Skills</p>
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 CodeGrow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
