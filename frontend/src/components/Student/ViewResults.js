import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function ViewResults() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const result = await studentService.getMathQuizHistory();

        if (result.success) {
          // Filter to show only adaptive quizzes
          const adaptiveQuizzes = (result.history || []).filter(
            (quiz) => quiz.quizType === 'adaptive'
          );
          setResults(adaptiveQuizzes);
        } else {
          setError('Failed to load results');
          setResults([]);
        }
      } catch (err) {
        console.error('Load results error:', err);
        setError('Failed to load results');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [navigate]);

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getProfileColor = (profile) => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];
    return colors[profile - 1] || colors[0];
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    subtitle: { fontSize: '15px', color: '#6b7280' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    resultCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.3s' },
    profileBadge: { display: 'inline-block', padding: '6px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '12px' },
    resultTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    resultDate: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    scoreSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
    scoreFraction: { fontSize: '24px', fontWeight: '700' },
    scorePercentage: { fontSize: '20px', fontWeight: '700' },
    questionsLabel: { fontSize: '13px', color: '#6b7280' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎲 My Adaptive Quiz Results</h1>
            <button
              style={styles.backButton}
              onClick={() => navigate('/student')}
              onMouseEnter={(e) => (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => (e.target.style.background = '#6b7280')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <p style={styles.subtitle}>View all your completed adaptive quiz attempts and scores</p>

          {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
        </div>

        {results.length > 0 ? (
          <div style={styles.resultsGrid}>
            {results.map((result) => {
              const percentage = result.percentage;
              const scoreColor = getScoreColor(percentage);

              return (
                <div
                  key={result.id}
                  style={styles.resultCard}
                  onClick={() => navigate(`/student/results/${result.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div
                    style={{
                      ...styles.profileBadge,
                      background: `linear-gradient(135deg, ${getProfileColor(result.profile)} 0%, ${getProfileColor(result.profile)}dd 100%)`,
                    }}
                  >
                    Profile {result.profile}
                  </div>

                  {/* ✅ dynamic title */}
                  <div style={styles.resultTitle}>Profile {result.profile} Math Quiz</div>

                  <div style={styles.resultDate}>📅 {result.date}</div>

                  <div style={styles.scoreSection}>
                    <div>
                      <div style={{ ...styles.scoreFraction, color: scoreColor }}>
                        {result.score}/{result.totalQuestions}
                      </div>
                      <div style={styles.questionsLabel}>questions</div>
                    </div>

                    <div style={{ ...styles.scorePercentage, color: scoreColor }}>
                      {percentage}%
                    </div>
                  </div>

                  {percentage >= 70 && (
                    <div style={{ marginTop: '12px', padding: '8px', background: '#d1fae5', borderRadius: '6px', fontSize: '13px', color: '#065f46', fontWeight: '600', textAlign: 'center' }}>
                      ✅ Passed!
                    </div>
                  )}

                  {percentage < 50 && (
                    <div style={{ marginTop: '12px', padding: '8px', background: '#fee2e2', borderRadius: '6px', fontSize: '13px', color: '#991b1b', fontWeight: '600', textAlign: 'center' }}>
                      💪 Keep practicing!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No adaptive quiz results yet</p>
            <p>Complete the placement quiz first, then start adaptive quizzes to see your results here!</p>
            <button
              onClick={() => navigate('/student/adaptive-quizzes')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              🎲 Start Adaptive Quizzes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
