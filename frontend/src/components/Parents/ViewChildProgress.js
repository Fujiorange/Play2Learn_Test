// frontend/src/components/Parents/ViewChildProgress.js
// ✅ FIXED: Now correctly fetches child's quiz history

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function ViewChildProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const childInfo = location.state?.child;

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const loadProgress = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      if (!childInfo?.studentId) {
        setError('No child selected');
        setLoading(false);
        return;
      }

      try {
        console.log('📈 Loading progress for student:', childInfo.studentId);
        
        // ✅ Fetch child's Quiz Journey level
        let adaptiveLevel = 1;
        try {
          const levelResponse = await fetch(
            `${API_BASE_URL}/api/adaptive-quiz/student/${childInfo.studentId}/current-level`,
            { headers: { 'Authorization': `Bearer ${getToken()}` } }
          );
          const levelData = await levelResponse.json();
          
          if (levelData.success) {
            adaptiveLevel = levelData.currentLevel || 1;
            console.log('✅ Child Quiz Journey level:', adaptiveLevel);
          }
        } catch (levelError) {
          console.warn('⚠️ Could not fetch child quiz journey level:', levelError);
        }
        
        // ✅ FIXED: Fetch child's quiz history directly from API
        let recentQuizzes = [];
        try {
          const historyResponse = await fetch(
            `${API_BASE_URL}/api/parents/child/${childInfo.studentId}/quiz-history`,
            { headers: { 'Authorization': `Bearer ${getToken()}` } }
          );
          const historyData = await historyResponse.json();
          
          console.log('📊 Raw quiz history response:', historyData);
          
          if (historyData.success && historyData.history) {
            // ✅ Filter to show only adaptive quizzes
            const adaptiveQuizzes = (historyData.history || []).filter(
              (quiz) => quiz.quizType === 'adaptive'
            );
            
            recentQuizzes = adaptiveQuizzes.slice(0, 10);
            
            console.log('✅ Filtered adaptive quizzes:', recentQuizzes);
          }
        } catch (historyError) {
          console.error('❌ Failed to fetch quiz history:', historyError);
        }
        
        // ✅ Fetch progress data for stats
        const progressResult = await parentService.getChildProgress(childInfo.studentId);
        const progressDataObj = progressResult.success ? progressResult.progress : {};
        
        console.log('📊 Progress data:', progressDataObj);
        
        const combinedData = {
          currentLevel: adaptiveLevel,
          totalPoints: progressDataObj.totalPoints || 0,
          streak: progressDataObj.streak || 0,
          achievements: progressDataObj.achievements || [],
          recentQuizzes
        };
        
        console.log('✅ Final combined data:', combinedData);
        
        setProgressData(combinedData);
        setError(null);
      } catch (error) {
        console.error('❌ Error loading progress:', error);
        setError('Failed to load progress data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate, childInfo]);

  const styles = {
    container: { 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', 
      padding: '32px' 
    },
    content: { maxWidth: '1000px', margin: '0 auto' },
    header: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '32px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: { 
      fontSize: '28px', 
      fontWeight: '700', 
      color: '#1f2937', 
      margin: 0 
    },
    subtitle: { 
      fontSize: '16px', 
      color: '#6b7280', 
      marginTop: '4px' 
    },
    backButton: { 
      padding: '10px 20px', 
      background: '#6b7280', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      fontSize: '14px', 
      fontWeight: '600', 
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px', 
      marginBottom: '24px' 
    },
    statCard: { 
      background: 'white', 
      borderRadius: '12px', 
      padding: '28px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
      textAlign: 'center',
      transition: 'all 0.3s'
    },
    statValue: { 
      fontSize: '36px', 
      fontWeight: '700', 
      color: '#10b981', 
      marginBottom: '8px' 
    },
    statLabel: { 
      fontSize: '14px', 
      color: '#6b7280', 
      textTransform: 'uppercase', 
      fontWeight: '600' 
    },
    achievementsCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '32px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    sectionTitle: { 
      fontSize: '20px', 
      fontWeight: '700',
      color: '#1f2937', 
      marginBottom: '20px'
    },
    achievementsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
      gap: '16px' 
    },
    achievementBadge: { 
      textAlign: 'center', 
      padding: '16px', 
      background: '#f9fafb', 
      borderRadius: '12px', 
      border: '2px solid #e5e7eb',
      transition: 'all 0.3s'
    },
    badgeIcon: { 
      fontSize: '48px', 
      marginBottom: '8px' 
    },
    badgeName: { 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#1f2937' 
    },
    quizzesCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    quizItem: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px', 
      background: '#f9fafb', 
      borderRadius: '8px', 
      marginBottom: '12px'
    },
    quizInfo: { flex: 1 },
    quizDate: { 
      fontSize: '13px', 
      color: '#6b7280', 
      marginBottom: '4px' 
    },
    quizProfile: { 
      fontSize: '15px', 
      fontWeight: '600', 
      color: '#1f2937' 
    },
    quizScore: { 
      fontSize: '20px', 
      fontWeight: '700', 
      textAlign: 'right' 
    },
    emptyState: { 
      textAlign: 'center', 
      padding: '40px 20px', 
      color: '#6b7280' 
    },
    errorMessage: { 
      background: '#fee2e2', 
      color: '#991b1b', 
      padding: '16px', 
      borderRadius: '8px', 
      marginBottom: '24px', 
      border: '1px solid #f87171' 
    },
    loadingContainer: { 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' 
    },
    loadingText: { 
      fontSize: '24px', 
      color: '#6b7280', 
      fontWeight: '600' 
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading progress...</div>
      </div>
    );
  }

  if (error && !childInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.errorMessage}>
            <strong>⚠️ Error:</strong> {error}
            <button 
              style={{...styles.backButton, marginLeft: '16px'}} 
              onClick={() => navigate('/parent')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📈 Learning Progress</h1>
            <p style={styles.subtitle}>{childInfo?.studentName || childInfo?.name || 'Student'}</p>
          </div>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/parent')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Main Stats - 3 cards */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>Level {progressData?.currentLevel || 1}</div>
            <div style={styles.statLabel}>Current Level</div>
          </div>

          <div 
            style={styles.statCard}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>{progressData?.totalPoints || 0}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>

          <div 
            style={styles.statCard}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>{progressData?.streak || 0} 🔥</div>
            <div style={styles.statLabel}>Day Streak</div>
          </div>
        </div>

        {/* Achievements */}
        <div style={styles.achievementsCard}>
          <h2 style={styles.sectionTitle}>🏆 Achievements</h2>
          {progressData?.achievements && progressData.achievements.length > 0 ? (
            <div style={styles.achievementsGrid}>
              {progressData.achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  style={styles.achievementBadge}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={styles.badgeIcon}>{achievement.icon || '🏆'}</div>
                  <div style={styles.badgeName}>{achievement.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>No achievements unlocked yet</p>
              <p>Keep completing quizzes to earn badges and achievements!</p>
            </div>
          )}
        </div>

        {/* ✅ FIXED: Recent Quiz Attempts */}
        <div style={styles.quizzesCard}>
          <h2 style={styles.sectionTitle}>📝 Recent Quiz Attempts</h2>
          {progressData?.recentQuizzes && progressData.recentQuizzes.length > 0 ? (
            <div>
              {progressData.recentQuizzes.map((quiz, idx) => {
                // ✅ Use the same data structure as ViewResults.js
                const score = Number(quiz?.score) || 0;
                const total = Number(quiz?.totalQuestions) || 0;
                const percentage = Number(quiz?.percentage) || 0;
                const scoreColor = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

                console.log('📊 Rendering quiz:', { score, total, percentage, quiz });

                return (
                  <div key={idx} style={styles.quizItem}>
                    <div style={styles.quizInfo}>
                      <div style={styles.quizDate}>{quiz.date || 'Recent'}</div>
                      <div style={styles.quizProfile}>
                        Profile {quiz.profile || quiz.quiz_level || '?'} Math Quiz
                      </div>
                    </div>
                    <div style={{ ...styles.quizScore, color: scoreColor }}>
                      {score}/{total} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <p>No quiz attempts yet.</p>
              <p style={{ fontSize: '14px', marginTop: '8px', color: '#9ca3af' }}>
                Quiz history will appear here once {childInfo?.studentName || 'your child'} completes adaptive quizzes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}