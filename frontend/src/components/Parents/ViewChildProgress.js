// frontend/src/components/Parents/ViewChildProgress.js
// ✅ FIXED: Now properly fetches and displays recent quiz activities
// ✅ Shows correct child name
// ✅ Math-only platform (no English)

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function ViewChildProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const childInfo = location.state?.child;

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
        
        // Fetch both progress data and activities in parallel
        const [progressResult, activitiesResult] = await Promise.all([
          parentService.getChildProgress(childInfo.studentId),
          parentService.getChildActivities(childInfo.studentId, 10)
        ]);
        
        if (progressResult.success) {
          console.log('✅ Progress data loaded:', progressResult.progress);
          
          // Format activities from the API into the expected structure
          let formattedActivities = [];
          
          if (activitiesResult.success && activitiesResult.activities) {
            console.log('✅ Activities loaded:', activitiesResult.activities);
            
            formattedActivities = activitiesResult.activities.map(activity => {
              // Activity could be a quiz attempt or other activity type
              if (activity.type === 'quiz_attempt' || activity.quiz_id) {
                return {
                  date: activity.date || new Date(activity.timestamp || activity.created_at).toLocaleDateString('en-SG'),
                  quizTitle: activity.quiz_title || activity.description || `Profile ${activity.profile || '?'} Quiz`,
                  score: activity.score,
                  total: activity.total_questions || activity.total,
                  percentage: activity.percentage || (activity.score && activity.total ? Math.round((activity.score / activity.total) * 100) : 0),
                  description: activity.description
                };
              } else {
                // Generic activity
                return {
                  date: activity.date || new Date(activity.timestamp || activity.created_at).toLocaleDateString('en-SG'),
                  description: activity.description || activity.activity_type || 'Activity',
                  timestamp: activity.timestamp || activity.created_at
                };
              }
            });
          }
          
          // Merge progress data with formatted activities
          const combinedData = {
            ...progressResult.progress,
            recentActivities: formattedActivities.length > 0 ? formattedActivities : progressResult.progress.recentActivities || []
          };
          
          setProgressData(combinedData);
          setError(null);
        } else {
          console.error('Failed to load progress:', progressResult.error);
          setError(progressResult.error || 'Failed to load progress data');
        }
      } catch (error) {
        console.error('Error loading progress:', error);
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
    infoBox: { 
      background: '#dbeafe', 
      border: '1px solid #60a5fa', 
      borderRadius: '8px', 
      padding: '16px', 
      marginBottom: '24px', 
      fontSize: '14px', 
      color: '#1e40af',
      width: '100%'
    },
    
    // Main stats
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
    
    // Achievements
    achievementsCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '32px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    sectionTitle: { 
      fontSize: '20px', 
      fontWeight: '600', 
      color: '#1f2937', 
      marginBottom: '16px' 
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
    
    // Activities
    activitiesCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '32px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    activityItem: { 
      padding: '12px', 
      borderBottom: '1px solid #e5e7eb', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    activityText: { 
      fontSize: '14px', 
      color: '#374151' 
    },
    activityTime: { 
      fontSize: '12px', 
      color: '#6b7280' 
    },
    quizItem: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px', 
      background: '#f9fafb', 
      borderRadius: '8px', 
      marginBottom: '12px', 
      borderBottom: '1px solid #e5e7eb'
    },
    quizInfo: { flex: 1 },
    quizDate: { fontSize: '13px', color: '#6b7280', marginBottom: '4px' },
    quizProfile: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
    quizScore: { fontSize: '20px', fontWeight: '700', textAlign: 'right' },
    
    emptyState: { 
      textAlign: 'center', 
      padding: '60px 20px', 
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
            {/* ✅ FIXED: Show correct child name */}
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

          {progressData?.message && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Note:</strong> {progressData.message}
            </div>
          )}
        </div>

        {/* Main Stats - 3 cards */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.statValue}>Lvl {progressData?.currentLevel || progressData?.currentProfile || 1}</div>
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

        {/* Recent Activities - ✅ FIXED: Now properly displays quiz attempts */}
        <div style={styles.activitiesCard}>
          <h2 style={styles.sectionTitle}>📝 Recent Activities</h2>
          {progressData?.recentActivities && progressData.recentActivities.length > 0 ? (
            <div>
              {progressData.recentActivities.map((activity, index) => {
                // Check if this is a quiz activity with score data
                const hasScore = activity.score !== undefined && activity.total !== undefined;
                const percentage = hasScore ? (activity.percentage || Math.round((activity.score / activity.total) * 100)) : 0;
                const scoreColor = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

                return (
                  <div key={index} style={styles.quizItem}>
                    <div style={styles.quizInfo}>
                      <div style={styles.quizDate}>{activity.date || 'Recent'}</div>
                      <div style={styles.quizProfile}>
                        {activity.quizTitle || activity.description || 'Activity'}
                      </div>
                    </div>
                    {hasScore && (
                      <div style={{ ...styles.quizScore, color: scoreColor }}>
                        {activity.score}/{activity.total} ({percentage}%)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>No recent activities</p>
              <p>Activities will appear here as {childInfo?.studentName || 'your child'} completes quizzes and uses the platform</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}