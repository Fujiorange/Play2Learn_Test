// ViewResultHistory.js - Math Quiz History Only
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function ViewResultHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get math quiz history from database
        const result = await studentService.getMathQuizHistory();

        if (result.success) {
          setHistory(result.history || []);
        } else {
          setError('Failed to load quiz history');
          setHistory([]);
        }
      } catch (error) {
        console.error('Load history error:', error);
        setError('Failed to load quiz history');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [navigate]);

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
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
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    profileBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: 'white' },
    scoreText: { fontSize: '18px', fontWeight: '700' },
    percentageBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: 'white' },
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
            <h1 style={styles.title}>📜 Math Quiz History</h1>
            <button 
              style={styles.backButton} 
              onClick={() => navigate('/student')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Dashboard
            </button>
          </div>
          <p style={styles.subtitle}>
            Complete history of all your Primary 1 math quiz attempts
          </p>
          
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {history.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Profile</th>
                  <th style={styles.th}>Questions</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Percentage</th>
                  <th style={styles.th}>Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => {
                  const percentage = Math.round((item.score / item.maxScore) * 100);
                  const scoreColor = getScoreColor(item.score, item.maxScore);
                  
                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <div>{item.date}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.time}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.profileBadge,
                          background: `linear-gradient(135deg, ${getProfileColor(item.profile)} 0%, ${getProfileColor(item.profile)}dd 100%)`
                        }}>
                          Profile {item.profile}
                        </span>
                      </td>
                      <td style={styles.td}>{item.totalQuestions || 15} questions</td>
                      <td style={styles.td}>
                        <span style={{...styles.scoreText, color: scoreColor}}>
                          {item.score}/{item.maxScore}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.percentageBadge, background: scoreColor}}>
                          {percentage}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        {percentage >= 70 && <span style={{ color: '#10b981', fontWeight: '600' }}>✅ Passed</span>}
                        {percentage >= 50 && percentage < 70 && <span style={{ color: '#f59e0b', fontWeight: '600' }}>⚠️ Need Practice</span>}
                        {percentage < 50 && <span style={{ color: '#ef4444', fontWeight: '600' }}>💪 Keep Trying</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary Stats */}
            <div style={{ marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>
                📊 Summary Statistics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Attempts</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{history.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Average Score</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {history.length > 0 ? Math.round(history.reduce((sum, h) => sum + ((h.score/h.maxScore)*100), 0) / history.length) : 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Passed Quizzes</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {history.filter(h => (h.score/h.maxScore) >= 0.7).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Best Score</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                    {history.length > 0 ? Math.max(...history.map(h => Math.round((h.score/h.maxScore)*100))) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No quiz history yet</p>
            <p>Your math quiz attempts will appear here after you complete your first quiz</p>
            <button
              onClick={() => navigate('/student/quiz/attempt')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎯 Take Your First Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}