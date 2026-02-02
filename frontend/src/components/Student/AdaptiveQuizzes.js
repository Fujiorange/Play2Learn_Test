import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdaptiveQuizzes.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function AdaptiveQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [quizzesRes, attemptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/adaptive-quiz/my-attempts`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const quizzesData = await quizzesRes.json();
      const attemptsData = await attemptsRes.json();

      if (quizzesData.success) {
        // Only show launched quizzes
        setQuizzes(quizzesData.data || []);
      }

      if (attemptsData.success) {
        setMyAttempts(attemptsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId) => {
    navigate(`/student/adaptive-quiz/${quizId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="adaptive-quizzes-container">
        <div className="loading">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="adaptive-quizzes-container">
      <header className="page-header">
        <div>
          <h1>🎯 Adaptive Quizzes</h1>
          <p className="page-subtitle">Quizzes that adapt to your skill level - launched by your teacher</p>
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/student')}
        >
          ← Back to Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Quizzes ({quizzes.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          My Attempts ({myAttempts.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="quizzes-grid">
          {quizzes.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📝</div>
              <p>No adaptive quizzes available yet.</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Your teacher will launch quizzes when they are ready for you.
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card">
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                  <span className="quiz-badge adaptive">Adaptive</span>
                </div>

                <p className="quiz-description">
                  {quiz.description || 'No description available'}
                </p>

                <div className="quiz-stats">
                  <div className="stat-item">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-text">
                      Target: {quiz.target_correct_answers} correct
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📚</span>
                    <span className="stat-text">
                      Pool: {quiz.total_questions} questions
                    </span>
                  </div>
                </div>

                {quiz.launch_end_date && (
                  <div className="quiz-deadline">
                    <span className="stat-icon">⏰</span>
                    <span className="stat-text">
                      Deadline: {formatDate(quiz.launch_end_date)}
                    </span>
                  </div>
                )}

                <div className="difficulty-distribution">
                  <div className="distribution-label">Difficulty Levels:</div>
                  <div className="distribution-bars">
                    {Object.entries(quiz.difficulty_distribution || {}).map(([level, count]) => (
                      count > 0 && (
                        <div key={level} className="distribution-bar">
                          <span className={`level-indicator level-${level}`}>
                            L{level}
                          </span>
                          <span className="count">{count}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className="progression-type">
                  <span className="progression-label">Progression:</span>
                  <span className="progression-value">
                    {quiz.difficulty_progression || 'gradual'}
                  </span>
                </div>

                <button 
                  className="btn-start-quiz"
                  onClick={() => startQuiz(quiz._id)}
                >
                  Start Quiz →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="attempts-list">
          {myAttempts.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <p>You haven't attempted any adaptive quizzes yet.</p>
            </div>
          ) : (
            myAttempts.map((attempt) => (
              <div key={attempt.attemptId} className="attempt-card">
                <div className="attempt-header">
                  <h4>{attempt.quizTitle}</h4>
                  <span className={`status-badge ${attempt.is_completed ? 'completed' : 'incomplete'}`}>
                    {attempt.is_completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                <div className="attempt-stats">
                  <div className="attempt-stat">
                    <span className="stat-label">Correct:</span>
                    <span className="stat-value">
                      {attempt.correct_count} / {attempt.target_correct_answers}
                    </span>
                  </div>
                  <div className="attempt-stat">
                    <span className="stat-label">Total Answered:</span>
                    <span className="stat-value">{attempt.total_answered}</span>
                  </div>
                  <div className="attempt-stat">
                    <span className="stat-label">Accuracy:</span>
                    <span className="stat-value">{attempt.accuracy}%</span>
                  </div>
                </div>

                <div className="attempt-footer">
                  <span className="attempt-date">
                    {attempt.is_completed 
                      ? `Completed: ${formatDate(attempt.completedAt)}`
                      : `Started: ${formatDate(attempt.startedAt)}`
                    }
                  </span>
                  {attempt.is_completed && (
                    <button 
                      className="btn-view-results"
                      onClick={() => navigate(`/student/adaptive-quiz/${attempt.attemptId}/results`)}
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdaptiveQuizzes;
