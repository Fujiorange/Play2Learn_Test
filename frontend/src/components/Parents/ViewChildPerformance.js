// frontend/src/components/Parents/ViewChildPerformance.js
// ✅ PARENT VIEW - Displays 5 stats matching student view
// ✅ Stats: Current Profile, Quizzes Taken, Highest Score, Current Streak, Total Points

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function ViewChildPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState(null);
  const childInfo = location.state?.child;

  useEffect(() => {
    const loadPerformance = async () => {
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
        console.log('📊 Loading performance for student:', childInfo.studentId);
        const result = await parentService.getChildPerformance(childInfo.studentId);
        
        if (result.success) {
          console.log('✅ Performance data loaded:', result.performance);
          setPerformanceData(result.performance);
          setError(null);
        } else {
          console.error('Failed to load performance:', result.error);
          setError(result.error || 'Failed to load performance data');
        }
      } catch (error) {
        console.error('Error loading performance:', error);
        setError('Failed to load performance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
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
      marginTop: '16px',
      fontSize: '14px', 
      color: '#1e40af',
      width: '100%'
    },
    
    // Stats Grid - 4 stats only
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '28px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      transition: 'all 0.3s'
    },
    statIcon: { fontSize: '40px', marginBottom: '12px' },
    statLabel: { 
      fontSize: '14px', 
      color: '#6b7280', 
      marginBottom: '10px',
      fontWeight: '500'
    },
    statValue: { 
      fontSize: '36px', 
      fontWeight: '700', 
      color: '#1f2937' 
    },
    
    emptyState: { 
      textAlign: 'center', 
      padding: '80px 20px', 
      background: 'white',
      borderRadius: '16px',
      color: '#6b7280',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    emptyText: {
      fontSize: '15px',
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
        <div style={styles.loadingText}>Loading performance...</div>
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

  // Extract the 4 essential stats (matching student view exactly)
  const totalQuizzes = performanceData?.totalQuizzes || 0;
  const highestScore = performanceData?.highestScore || 0;
  const streak = performanceData?.streak || 0;
  const totalPoints = performanceData?.totalPoints || 0;

  const hasData = totalQuizzes > 0;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 {childInfo?.studentName}'s Performance</h1>
            <p style={styles.subtitle}>Primary 1 Mathematics</p>
          </div>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/parent')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>

          {performanceData?.message && (
            <div style={styles.infoBox}>
              <strong>ℹ️ Note:</strong> {performanceData.message}
            </div>
          )}
        </div>

        {/* Only 4 Stat Cards - Matching TrackProgress.js */}
        {hasData ? (
          <div style={styles.statsGrid}>
            <div 
              style={styles.statCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.statIcon}>📝</div>
              <div style={styles.statLabel}>Quizzes Taken</div>
              <div style={styles.statValue}>{totalQuizzes}</div>
            </div>

            <div 
              style={styles.statCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.statIcon}>🏅</div>
              <div style={styles.statLabel}>Highest Score</div>
              <div style={styles.statValue}>{highestScore}%</div>
            </div>

            <div 
              style={styles.statCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.statIcon}>🔥</div>
              <div style={styles.statLabel}>Current Streak</div>
              <div style={styles.statValue}>{streak} days</div>
            </div>

            <div 
              style={styles.statCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statLabel}>Total Points</div>
              <div style={styles.statValue}>{totalPoints}</div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <div style={styles.emptyTitle}>No Performance Data Yet</div>
            <div style={styles.emptyText}>
              Performance data will appear once {childInfo?.studentName || 'your child'} completes math quizzes
            </div>
          </div>
        )}
      </div>
    </div>
  );
}