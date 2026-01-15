// TrackProgress.js - Math-Focused Progress Tracking
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function TrackProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProgress = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get math progress from database
        const result = await studentService.getMathProgress();

        if (result.success) {
          setProgressData(result.progressData);
        } else {
          setError('Failed to load progress data');
          // Set empty data structure
          setProgressData({
            currentProfile: 1,
            profileProgress: 0,
            totalQuizzes: 0,
            averageScore: 0,
            streak: 0,
            totalPoints: 0,
            profileHistory: [],
            recentQuizzes: []
          });
        }
      } catch (error) {
        console.error('Load progress error:', error);
        setError('Failed to load progress data');
        setProgressData({
          currentProfile: 1,
          profileProgress: 0,
          totalQuizzes: 0,
          averageScore: 0,
          streak: 0,
          totalPoints: 0,
          profileHistory: [],
          recentQuizzes: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate]);

  const getProfileColor = (profile) => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];
    return colors[profile - 1] || colors[0];
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    statIcon: { fontSize: '32px', marginBottom: '8px' },
    statLabel: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937' },
    profileProgressCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    cardTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' },
    profileBadge: { display: 'inline-block', padding: '12px 24px', borderRadius: '12px', fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '16px' },
    progressBarLarge: { width: '100%', height: '24px', background: '#e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' },
    progressFillLarge: { height: '100%', transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '700' },
    progressText: { fontSize: '14px', color: '#6b7280', textAlign: 'center' },
    historyCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    historyTimeline: { position: 'relative', paddingLeft: '32px' },
    timelineItem: { position: 'relative', marginBottom: '24px', paddingLeft: '24px' },
    timelineDot: { position: 'absolute', left: '-8px', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 0 3px' },
    timelineLine: { position: 'absolute', left: '0', top: '16px', bottom: '-24px', width: '2px', background: '#e5e7eb' },
    timelineContent: { background: '#f9fafb', padding: '16px', borderRadius: '8px' },
    timelineDate: { fontSize: '13px', color: '#6b7280', marginBottom: '4px' },
    timelineText: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
    quizzesCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    quizItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' },
    quizInfo: { flex: 1 },
    quizDate: { fontSize: '13px', color: '#6b7280', marginBottom: '4px' },
    quizProfile: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
    quizScore: { fontSize: '20px', fontWeight: '700', textAlign: 'right' },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📈 Track My Progress</h1>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/student')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statLabel}>Current Profile</div>
            <div style={styles.statValue}>Profile {progressData?.currentProfile || 1}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <div style={styles.statLabel}>Quizzes Taken</div>
            <div style={styles.statValue}>{progressData?.totalQuizzes || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statLabel}>Average Score</div>
            <div style={styles.statValue}>{progressData?.averageScore || 0}%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔥</div>
            <div style={styles.statLabel}>Current Streak</div>
            <div style={styles.statValue}>{progressData?.streak || 0} days</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <div style={styles.statLabel}>Total Points</div>
            <div style={styles.statValue}>{progressData?.totalPoints || 0}</div>
          </div>
        </div>

        {/* Profile Progress */}
        <div style={styles.profileProgressCard}>
          <h2 style={styles.cardTitle}>Math Profile Progress</h2>
          <div style={{textAlign: 'center', marginBottom: '24px'}}>
            <div style={{
              ...styles.profileBadge, 
              background: `linear-gradient(135deg, ${getProfileColor(progressData?.currentProfile)} 0%, ${getProfileColor(progressData?.currentProfile)}dd 100%)`
            }}>
              🎯 Profile {progressData?.currentProfile || 1}
            </div>
          </div>
          <div style={styles.progressBarLarge}>
            <div style={{
              ...styles.progressFillLarge, 
              width: `${((progressData?.currentProfile || 1) / 10) * 100}%`,
              background: `linear-gradient(135deg, ${getProfileColor(progressData?.currentProfile)} 0%, ${getProfileColor(progressData?.currentProfile)}dd 100%)`
            }}>
              {progressData?.currentProfile || 1}/10
            </div>
          </div>
          <div style={styles.progressText}>
            {progressData?.currentProfile === 10 ? 
              '🏆 Maximum profile reached! Excellent work!' : 
              `Keep practicing to reach Profile ${(progressData?.currentProfile || 1) + 1}!`
            }
          </div>
        </div>

        {/* Profile History */}
        <div style={styles.historyCard}>
          <h2 style={styles.cardTitle}>Profile Change History</h2>
          {progressData?.profileHistory && progressData.profileHistory.length > 0 ? (
            <div style={styles.historyTimeline}>
              {progressData.profileHistory.map((change, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  {idx < progressData.profileHistory.length - 1 && <div style={styles.timelineLine} />}
                  <div style={{
                    ...styles.timelineDot, 
                    background: getProfileColor(change.newProfile),
                    boxShadow: `0 0 0 3px ${getProfileColor(change.newProfile)}30`
                  }} />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineDate}>{change.date}</div>
                    <div style={styles.timelineText}>
                      {change.type === 'advance' && `⬆️ Advanced from Profile ${change.oldProfile} to Profile ${change.newProfile}`}
                      {change.type === 'demote' && `⬇️ Moved from Profile ${change.oldProfile} to Profile ${change.newProfile}`}
                      {change.type === 'initial' && `🎯 Started at Profile ${change.newProfile}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <p>No profile changes yet</p>
            </div>
          )}
        </div>

        {/* Recent Quizzes */}
        <div style={styles.quizzesCard}>
          <h2 style={styles.cardTitle}>Recent Quiz Attempts</h2>
          {progressData?.recentQuizzes && progressData.recentQuizzes.length > 0 ? (
            progressData.recentQuizzes.map((quiz, idx) => {
              const percentage = Math.round((quiz.score / quiz.total) * 100);
              const scoreColor = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
              
              return (
                <div key={idx} style={styles.quizItem}>
                  <div style={styles.quizInfo}>
                    <div style={styles.quizDate}>{quiz.date}</div>
                    <div style={styles.quizProfile}>Profile {quiz.profile} Quiz</div>
                  </div>
                  <div style={{...styles.quizScore, color: scoreColor}}>
                    {quiz.score}/{quiz.total} ({percentage}%)
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <p>No quiz attempts yet. Take your first quiz!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}