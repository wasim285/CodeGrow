import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/NewHomePage.css";

function HomePage() {
  return (
    <div className="homepage">
      <div className="navbar">
        <h2 className="logo">CodeGrow</h2>
      </div>

      <div className="floating-boxes">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="container">
        <motion.div
          className="left-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="text-box">
            <h1 className="title">Master Python.<br />Level Up With AI.</h1>
            <p className="subtitle">
              Unlock personalised lessons, coding challenges, and real-world projects to grow your skills.
            </p>

            <div className="buttons">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/register" className="btn btn-green">
                  Get Started
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/login" className="btn btn-blue">
                  Login
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="right-content">
          <motion.div
            className="lesson-box completed"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            Lesson 1
          </motion.div>
          <motion.div
            className="lesson-box completed"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2 }}
            whileHover={{ scale: 1.05 }}
          >
            Lesson 2
          </motion.div>
          <motion.div
            className="lesson-box in-progress"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 3 }}
            whileHover={{ scale: 1.05 }}
          >
            Lesson 3
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
