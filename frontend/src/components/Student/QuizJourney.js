import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function QuizJourney() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      // Get student's current level
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
        const sortedQuizzes = quizzesData.data.sort((a, b) => a.quiz_level - b.quiz_level);
        setQuizzes(sortedQuizzes);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load quiz journey');
    } finally {
      setLoading(false);
    }
  };

  const isLevelUnlocked = (quizLevel) => unlockedLevels.includes(quizLevel);
  const isLevelCurrent = (quizLevel) => quizLevel === currentLevel;
  const isLevelCompleted = (quizLevel) => quizLevel < currentLevel;

  const handleLevelClick = (quiz) => {
    if (!isLevelUnlocked(quiz.quiz_level)) {
      alert(`🔒 Level ${quiz.quiz_level} is locked!\n\nComplete Level ${currentLevel} to unlock the next level.`);
      return;
    }
    navigate(`/student/adaptive-quiz/${quiz.quiz_level}`);
  };

  const getLevelIcon = (quizLevel) => {
    if (isLevelCompleted(quizLevel)) return '⭐';
    if (isLevelCurrent(quizLevel)) return '🎯';
    if (isLevelUnlocked(quizLevel)) return '📖';
    return '🔒';
  };

  const getLevelColor = (quizLevel) => {
    if (isLevelCompleted(quizLevel)) return {
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: '#10b981',
      shadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
    };
    if (isLevelCurrent(quizLevel)) return {
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      border: '#3b82f6',
      shadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
    };
    if (isLevelUnlocked(quizLevel)) return {
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      border: '#f59e0b',
      shadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
    };
    return {
      bg: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
      border: '#9ca3af',
      shadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    };
  };

  // Calculate path position (zigzag pattern)
  const getNodePosition = (index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const isEvenRow = row % 2 === 0;
    
    return {
      left: isEvenRow ? `${col * 33 + 16}%` : `${(2 - col) * 33 + 16}%`,
      top: `${row * 180 + 100}px`
    };
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'auto'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '24px 32px',
      marginBottom: '40px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerContent: {
      flex: 1
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: 0
    },
    backButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    progressCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '40px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    progressTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '20px'
    },
    statBox: {
      textAlign: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      borderRadius: '16px',
      transition: 'all 0.3s'
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    gameboardContainer: {
      position: 'relative',
      minHeight: `${Math.ceil(quizzes.length / 3) * 180 + 200}px`,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    },
    pathLine: {
      position: 'absolute',
      height: '4px',
      background: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '2px',
      transformOrigin: 'left center',
      zIndex: 1
    },
    levelNode: {
      position: 'absolute',
      width: '140px',
      height: '140px',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '4px solid',
      zIndex: 2,
      transform: 'translateX(-50%)'
    },
    levelIcon: {
      fontSize: '48px',
      marginBottom: '8px'
    },
    levelNumber: {
      fontSize: '20px',
      fontWeight: '800',
      color: 'white',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    levelLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'white',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      marginTop: '4px'
    },
    tooltip: {
      position: 'absolute',
      bottom: '160px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      zIndex: 10,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none'
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '32px',
      flexWrap: 'wrap',
      marginTop: '60px',
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#4b5563'
    },
    legendIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px'
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    loadingText: {
      fontSize: '24px',
      color: 'white',
      fontWeight: '700',
      textAlign: 'center'
    },
    errorMessage: {
      background: 'rgba(254, 226, 226, 0.95)',
      color: '#991b1b',
      padding: '16px 24px',
      borderRadius: '12px',
      marginBottom: '24px',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(153, 27, 27, 0.2)'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
          Loading Your Quiz Journey...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🎮 Quiz Journey</h1>
          <p style={styles.subtitle}>
            Complete each level to unlock the next adventure!
          </p>
        </div>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/student')}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

      {/* Progress Card */}
      <div style={styles.progressCard}>
        <div style={styles.progressTitle}>
          📊 Your Progress
        </div>
        <div style={styles.statsGrid}>
          <div 
            style={styles.statBox}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>Level {currentLevel}</div>
            <div style={styles.statLabel}>Current Level</div>
          </div>
          <div 
            style={styles.statBox}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>{unlockedLevels.length}</div>
            <div style={styles.statLabel}>Unlocked Levels</div>
          </div>
          <div 
            style={styles.statBox}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>{Math.round((currentLevel / 10) * 100)}%</div>
            <div style={styles.statLabel}>Completion</div>
          </div>
        </div>
      </div>

      {/* Gameboard */}
      <div style={styles.gameboardContainer}>
        {quizzes.map((quiz, index) => {
          const position = getNodePosition(index);
          const colors = getLevelColor(quiz.quiz_level);
          const isUnlocked = isLevelUnlocked(quiz.quiz_level);
          const isCurrent = isLevelCurrent(quiz.quiz_level);
          const isCompleted = isLevelCompleted(quiz.quiz_level);

          return (
            <div
              key={quiz._id}
              style={{
                ...styles.levelNode,
                ...position,
                background: colors.bg,
                borderColor: colors.border,
                boxShadow: colors.shadow,
                opacity: isUnlocked ? 1 : 0.5,
                transform: hoveredLevel === quiz.quiz_level 
                  ? 'translateX(-50%) scale(1.15) translateY(-8px)' 
                  : 'translateX(-50%) scale(1)',
                animation: isCurrent ? 'pulse 2s infinite' : 'none'
              }}
              onClick={() => handleLevelClick(quiz)}
              onMouseEnter={() => setHoveredLevel(quiz.quiz_level)}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <div style={styles.levelIcon}>{getLevelIcon(quiz.quiz_level)}</div>
              <div style={styles.levelNumber}>Level {quiz.quiz_level}</div>
              <div style={styles.levelLabel}>
                {isCompleted ? 'Completed' : 
                 isCurrent ? 'Current' : 
                 isUnlocked ? 'Available' : 'Locked'}
              </div>

              {/* Tooltip */}
              {hoveredLevel === quiz.quiz_level && (
                <div style={styles.tooltip}>
                  {quiz.title}
                  {!isUnlocked && ` - Complete Level ${currentLevel} first`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendIcon,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          }}>⭐</div>
          <span>Completed</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendIcon,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          }}>🎯</div>
          <span>Current Level</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendIcon,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          }}>📖</div>
          <span>Available</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendIcon,
            background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
          }}>🔒</div>
          <span>Locked</span>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.8);
          }
        }
      `}</style>
    </div>
  );
}

export default QuizJourney;