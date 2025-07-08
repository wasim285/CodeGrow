import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Navbar from "../components/navbar";
import "../styles/QuizPage.css";

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.get("accounts/quiz-questions/").then(res => setQuestions(res.data));
  }, []);

  const choose = (id, pick) =>
    setAnswers(prev => ({ ...prev, [id]: pick }));

  const next = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const submit = async () => {
    const response = await api.post("accounts/quiz-questions/submit/", { answers });
    console.log("Quiz submit response:", response.data);
    setResult(response.data);
    window.dispatchEvent(
      new CustomEvent("xpEarned", {
        detail: {
          xp_total: response.data.xp_total,
          level: response.data.level,
        },
      })
    );
  };

  // Function to format question text with proper line breaks and code formatting
  const formatQuestionText = (text) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const progressPercentage = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  return (
    <>
      <Navbar />
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-title-section">
            <h1 className="quiz-title">
              <span className="quiz-icon">🧠</span>
              General Knowledge Quiz
            </h1>
            <p className="quiz-subtitle">Test your programming knowledge and earn XP!</p>
          </div>
        </div>

        {questions.length > 0 && !result && (
          <div className="question-container">
            <div className="question-card">
              <div className="question-header">
                <span className="question-badge">Q{current + 1}</span>
                <div className="question-text">
                  {formatQuestionText(questions[current].question)}
                </div>
              </div>
              
              <div className="options-container">
                {["A", "B", "C", "D"].map(letter => (
                  <label 
                    key={letter} 
                    className={`option-label ${answers[questions[current].id] === letter ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q${questions[current].id}`}
                      checked={answers[questions[current].id] === letter}
                      onChange={() => choose(questions[current].id, letter)}
                      className="option-input"
                    />
                    <div className="option-content">
                      <span className="option-letter">{letter}</span>
                      <span className="option-text">
                        {questions[current][`option_${letter.toLowerCase()}`]}
                      </span>
                    </div>
                    <div className="option-checkmark">✓</div>
                  </label>
                ))}
              </div>
              
              <div className="navigation-buttons">
                <button
                  className="nav-btn prev-btn"
                  onClick={prev}
                  disabled={current === 0}
                >
                  <span>←</span> Previous
                </button>
                
                {current < questions.length - 1 ? (
                  <button
                    className="nav-btn next-btn"
                    onClick={next}
                    disabled={!answers[questions[current].id]}
                  >
                    Next <span>→</span>
                  </button>
                ) : (
                  <button
                    className="nav-btn submit-btn"
                    onClick={submit}
                    disabled={Object.keys(answers).length !== questions.length}
                  >
                    <span>🚀</span> Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="results-container">
            <div className="results-card">
              <div className="results-header">
                <div className="score-circle">
                  <div className="score-number">
                    {result.correct}/{result.total}
                  </div>
                  <div className="score-label">Score</div>
                </div>
                
                <div className="xp-info">
                  {result.xp_earned > 0 ? (
                    <div className="xp-earned">
                      <span className="xp-icon">⭐</span>
                      <span className="xp-text">+{result.xp_earned} XP</span>
                    </div>
                  ) : (
                    <div className="xp-no-improvement">
                      <span className="xp-icon">📊</span>
                      <span className="xp-text">No XP (Best: {result.best_score}/{result.total})</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="results-message">
                <p>{result.message}</p>
              </div>
              
              <button 
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                <span>🔄</span> Try Again
              </button>
              
              <div className="feedback-section">
                <h3 className="feedback-title">📝 Question Review</h3>
                <div className="feedback-list">
                  {result.feedback.map((f, index) => (
                    <div key={f.id} className="feedback-item">
                      <div className="feedback-header">
                        <span className="feedback-number">Q{index + 1}</span>
                        <span className={`feedback-status ${f.correct ? 'correct' : 'incorrect'}`}>
                          {f.correct ? '✅ Correct' : '❌ Incorrect'}
                        </span>
                      </div>
                      <div className="feedback-question">
                        {formatQuestionText(f.question)}
                      </div>
                      <div className="feedback-explanation">
                        {f.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuizPage;