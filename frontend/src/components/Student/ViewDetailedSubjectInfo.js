// MyMathProfile.js - Detailed Math Profile View (Primary 1)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function MyMathProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mathProfile, setMathProfile] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMathProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get math profile and history
        const result = await studentService.getMathProfile();

        if (result.success) {
          setMathProfile(result.profile);
          setQuizHistory(result.quizHistory || []);
        } else {
          setError('Failed to load math profile');
        }
      } catch (error) {
        console.error('Load math profile error:', error);
        setError('Failed to load math profile');
      } finally {
        setLoading(false);
      }
    };

    loadMathProfile();
  }, [navigate]);

  const getProfileInfo = (profileLevel) => {
    const profiles = {
      1: { range: '1-10', operations: ['Addition ➕', 'Subtraction ➖'], color: '#ef4444' },
      2: { range: '1-20', operations: ['Addition ➕', 'Subtraction ➖'], color: '#f97316' },
      3: { range: '1-30', operations: ['Addition ➕', 'Subtraction ➖'], color: '#f59e0b' },
      4: { range: '1-40', operations: ['Addition ➕', 'Subtraction ➖'], color: '#eab308' },
      5: { range: '1-50', operations: ['Addition ➕', 'Subtraction ➖'], color: '#84cc16' },
      6: { range: '1-60', operations: ['Addition ➕', 'Subtraction ➖', 'Multiplication ✖️', 'Division ➗'], color: '#22c55e' },
      7: { range: '1-70', operations: ['Addition ➕', 'Subtraction ➖', 'Multiplication ✖️', 'Division ➗'], color: '#10b981' },
      8: { range: '1-80', operations: ['Addition ➕', 'Subtraction ➖', 'Multiplication ✖️', 'Division ➗'], color: '#14b8a6' },
      9: { range: '1-90', operations: ['Addition ➕', 'Subtraction ➖', 'Multiplication ✖️', 'Division ➗'], color: '#06b6d4' },
      10: { range: '1-100', operations: ['Addition ➕', 'Subtraction ➖', 'Multiplication ✖️', 'Division ➗'], color: '#3b82f6' },
    };
    return profiles[profileLevel] || profiles[1];
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    profileCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    profileBadgeContainer: { textAlign: 'center', marginBottom: '32px' },
    profileBadge: { display: 'inline-block', padding: '20px 40px', borderRadius: '16px', fontSize: '36px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' },
    infoBox: { padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' },
    infoLabel: { fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' },
    infoValue: { fontSize: '20px', color: '#1f2937', fontWeight: '700' },
    operationsSection: { marginBottom: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    operationsList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
    operationItem: { padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6', fontSize: '16px', fontWeight: '600', color: '#1e40af', textAlign: 'center' },
    progressionPath: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    pathSteps: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px' },
    pathStep: { textAlign: 'center', opacity: 0.3 },
    pathStepActive: { textAlign: 'center', opacity: 1, transform: 'scale(1.2)' },
    pathStepCompleted: { textAlign: 'center', opacity: 0.6 },
    stepNumber: { width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '20px', fontWeight: '700', color: 'white' },
    stepLabel: { fontSize: '12px', fontWeight: '600', color: '#6b7280' },
    quizHistoryCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    historyItem: { padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    historyDate: { fontSize: '13px', color: '#6b7280' },
    historyScore: { fontSize: '18px', fontWeight: '700' },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  const profileInfo = mathProfile ? getProfileInfo(mathProfile.current_profile) : null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📊 My Math Profile</h1>
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

        {mathProfile && profileInfo && (
          <>
            {/* Profile Badge */}
            <div style={styles.profileCard}>
              <div style={styles.profileBadgeContainer}>
                <div style={{...styles.profileBadge, background: `linear-gradient(135deg, ${profileInfo.color} 0%, ${profileInfo.color}dd 100%)`}}>
                  🎯 Profile {mathProfile.current_profile}
                </div>
              </div>

              {/* Profile Info Grid */}
              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Number Range</div>
                  <div style={styles.infoValue}>🔢 {profileInfo.range}</div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Quiz Attempts Today</div>
                  <div style={styles.infoValue}>🎮 {mathProfile.attemptsToday || 0}/2</div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Total Quizzes Taken</div>
                  <div style={styles.infoValue}>📝 {mathProfile.totalQuizzes || 0}</div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Average Score</div>
                  <div style={styles.infoValue}>📊 {mathProfile.averageScore || 0}%</div>
                </div>
              </div>

              {/* Operations Section */}
              <div style={styles.operationsSection}>
                <div style={styles.sectionTitle}>Operations Available:</div>
                <div style={styles.operationsList}>
                  {profileInfo.operations.map((op, idx) => (
                    <div key={idx} style={styles.operationItem}>{op}</div>
                  ))}
                </div>
              </div>

              {/* Requirements Section */}
              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '2px solid #22c55e' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  📈 Advancement Requirements:
                </div>
                <div style={{ fontSize: '14px', color: '#065f46', lineHeight: '1.6' }}>
                  • Score <strong>70% or higher</strong> to advance to Profile {mathProfile.current_profile + 1}<br/>
                  • Score <strong>50-69%</strong> to stay at current profile<br/>
                  • Score <strong>below 50% six times</strong> to move down to Profile {mathProfile.current_profile - 1}
                </div>
              </div>
            </div>

            {/* Progression Path */}
            <div style={styles.progressionPath}>
              <div style={styles.sectionTitle}>🎯 Profile Progression Path</div>
              <div style={styles.pathSteps}>
                {[1,2,3,4,5,6,7,8,9,10].map(level => (
                  <div 
                    key={level} 
                    style={
                      level === mathProfile.current_profile ? styles.pathStepActive :
                      level < mathProfile.current_profile ? styles.pathStepCompleted :
                      styles.pathStep
                    }
                  >
                    <div style={{
                      ...styles.stepNumber,
                      background: 
                        level === mathProfile.current_profile ? getProfileInfo(level).color :
                        level < mathProfile.current_profile ? '#10b981' : '#d1d5db'
                    }}>
                      {level}
                    </div>
                    <div style={styles.stepLabel}>
                      {level === mathProfile.current_profile && '← You are here'}
                      {level < mathProfile.current_profile && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz History */}
            <div style={styles.quizHistoryCard}>
              <div style={styles.sectionTitle}>📜 Recent Quiz History</div>
              {quizHistory.length > 0 ? (
                quizHistory.slice(0, 5).map((quiz, idx) => (
                  <div key={idx} style={styles.historyItem}>
                    <div>
                      <div style={styles.historyDate}>{quiz.date}</div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>Profile {quiz.profile_level}</div>
                    </div>
                    <div style={{
                      ...styles.historyScore,
                      color: quiz.percentage >= 70 ? '#10b981' : quiz.percentage >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {quiz.score}/{quiz.total} ({quiz.percentage}%)
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                  <p>No quiz history yet. Take your first quiz!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}