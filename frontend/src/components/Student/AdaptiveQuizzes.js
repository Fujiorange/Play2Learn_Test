import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AdaptiveQuizzes.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function AdaptiveQuizzes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedLevel = searchParams.get('level');
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentLevel, setStudentLevel] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // If a level is requested via URL parameter and we have loaded the student level
    if (requestedLevel && studentLevel !== null) {
      const level = parseInt(requestedLevel);
      if (level >= 1 && level <= 10) {
        setSelectedLevel(level);
        fetchQuizForLevel(level);
      }
    } else if (studentLevel !== null && selectedLevel === null) {
      // Auto-select student's current level
      setSelectedLevel(studentLevel);
    }
  }, [requestedLevel, studentLevel]);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      // Fetch student's current level
      const levelRes = await fetch(`${API_BASE_URL}/api/adaptive-quiz/student/level`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const levelData = await levelRes.json();
      if (levelData.success) {
        setStudentLevel(levelData.data.currentLevel || 1);
      }

      // Fetch all available quizzes
      const quizzesRes = await fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const quizzesData = await quizzesRes.json();

      if (quizzesData.success) {
        // Only show launched quizzes
        setQuizzes(quizzesData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizForLevel = async (level) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/adaptive-quiz/quizzes/level/${level}`,
        {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        // Start the quiz directly
        startQuiz(data.data._id);
      } else {
        setError(data.error || `No quiz available for level ${level}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch quiz for level:', error);
      setError('Failed to load quiz for the requested level');
      setLoading(false);
    }
  };

  const startQuiz = (quizId) => {
    navigate(`/student/adaptive-quiz/${quizId}`);
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    fetchQuizForLevel(level);
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
          <p className="page-subtitle">Quizzes that adapt to your skill level</p>
          {studentLevel && (
            <p className="current-level-info">
              Your current level: <strong>Level {studentLevel}</strong>
            </p>
          )}
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/student')}
        >
          ← Back to Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Level Selector */}
      {studentLevel && (
        <div className="level-selector">
          <h3>Select Quiz Level</h3>
          <div className="level-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <button
                key={level}
                className={`level-button ${selectedLevel === level ? 'selected' : ''} ${level === studentLevel ? 'current' : ''}`}
                onClick={() => handleLevelSelect(level)}
                title={level === studentLevel ? 'Your current level' : `Level ${level}`}
              >
                <span className="level-number">Level {level}</span>
                {level === studentLevel && <span className="current-badge">Current</span>}
              </button>
            ))}
          </div>
          <p className="level-hint">
            💡 Start with your current level (Level {studentLevel}) or choose any level to practice
          </p>
        </div>
      )}

      <div className="quizzes-grid">
          {quizzes.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📝</div>
              <p>No quizzes available in the list view.</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Use the level selector above to start a quiz at any level.
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
    </div>
  );
}

export default AdaptiveQuizzes;
