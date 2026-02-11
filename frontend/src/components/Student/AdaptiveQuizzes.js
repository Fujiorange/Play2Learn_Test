import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdaptiveQuizzes.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function AdaptiveQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      // 🆕 Get student's current level FIRST
      const levelResponse = await fetch(`${API_BASE_URL}/api/adaptive-quiz/student/current-level`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const levelData = await levelResponse.json();
      
      if (levelData.success) {
        setCurrentLevel(levelData.currentLevel);
        setUnlockedLevels(levelData.unlockedLevels);
        console.log('✅ Student level:', levelData.currentLevel, 'Unlocked:', levelData.unlockedLevels);
      }

      // Get all quizzes
      const quizzesRes = await fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const quizzesData = await quizzesRes.json();

      if (quizzesData.success) {
        // Sort by quiz_level
        const sortedQuizzes = quizzesData.data.sort((a, b) => a.quiz_level - b.quiz_level);
        setQuizzes(sortedQuizzes);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const isLevelUnlocked = (quizLevel) => {
    return unlockedLevels.includes(quizLevel);
  };

  const isLevelCurrent = (quizLevel) => {
    return quizLevel === currentLevel;
  };

  const isLevelCompleted = (quizLevel) => {
    return quizLevel < currentLevel;
  };

  const startQuiz = (quiz) => {
    if (!isLevelUnlocked(quiz.quiz_level)) {
      alert(`🔒 Level ${quiz.quiz_level} is locked! Complete Level ${quiz.quiz_level - 1} first.`);
      return;
    }
    
    // Navigate using quiz_level instead of _id
    navigate(`/student/adaptive-quiz/${quiz.quiz_level}`);
  };

  const getLevelStatusBadge = (quizLevel) => {
    if (isLevelCompleted(quizLevel)) {
      return (
        <span className="quiz-badge completed">
          ✓ Completed
        </span>
      );
    }
    
    if (isLevelCurrent(quizLevel)) {
      return (
        <span className="quiz-badge current">
          → Current Level
        </span>
      );
    }

    if (!isLevelUnlocked(quizLevel)) {
      return (
        <span className="quiz-badge locked">
          🔒 Locked
        </span>
      );
    }

    return (
      <span className="quiz-badge available">
        Available
      </span>
    );
  };

  const getButtonText = (quizLevel) => {
    if (!isLevelUnlocked(quizLevel)) return '🔒 Locked';
    if (isLevelCompleted(quizLevel)) return '🔁 Retry';
    if (isLevelCurrent(quizLevel)) return '▶️ Continue';
    return '▶️ Start';
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
          <p className="page-subtitle">
            Your Current Level: <strong>Level {currentLevel}</strong> | 
            Unlocked: <strong>{unlockedLevels.length} / 10</strong>
          </p>
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/student')}
        >
          ← Back to Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* 🆕 Progress Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>📊 Your Progress</h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Current Level</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>Level {currentLevel}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Unlocked Levels</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{unlockedLevels.length} / 10</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completion</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{Math.round((currentLevel / 10) * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="quizzes-grid">
          {quizzes.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📝</div>
              <p>No adaptive quizzes available yet.</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Your teacher will create quizzes when they are ready for you.
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const isUnlocked = isLevelUnlocked(quiz.quiz_level);
              const isCurrent = isLevelCurrent(quiz.quiz_level);
              const isCompleted = isLevelCompleted(quiz.quiz_level);

              return (
                <div 
                  key={quiz._id} 
                  className={`quiz-card ${!isUnlocked ? 'locked' : ''}`}
                  style={{
                    opacity: isUnlocked ? 1 : 0.6,
                    border: isCurrent ? '3px solid #3b82f6' : 
                           isCompleted ? '2px solid #22c55e' : '1px solid #e5e7eb',
                    transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="quiz-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: isUnlocked ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {isCompleted ? '✓' : quiz.quiz_level}
                      </div>
                      <div>
                        <h3 style={{ margin: 0 }}>{quiz.title}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                          Level {quiz.quiz_level}
                        </p>
                      </div>
                    </div>
                    {getLevelStatusBadge(quiz.quiz_level)}
                  </div>

                  <p className="quiz-description">
                    {quiz.description || 'Adaptive quiz that adjusts to your skill level'}
                  </p>

                  <div className="quiz-stats">
                    <div className="stat-item">
                      <span className="stat-icon">🎯</span>
                      <span className="stat-text">
                        Target: 20 questions
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
                    className={`btn-start-quiz ${!isUnlocked ? 'disabled' : ''}`}
                    onClick={() => startQuiz(quiz)}
                    disabled={!isUnlocked}
                    style={{
                      background: !isUnlocked ? '#9ca3af' : 
                                 isCurrent ? '#3b82f6' : 
                                 isCompleted ? '#22c55e' : '#8b5cf6',
                      cursor: !isUnlocked ? 'not-allowed' : 'pointer',
                      opacity: !isUnlocked ? 0.5 : 1
                    }}
                  >
                    {getButtonText(quiz.quiz_level)}
                  </button>
                </div>
              );
            })
          )}
        </div>
    </div>
  );
}

export default AdaptiveQuizzes;