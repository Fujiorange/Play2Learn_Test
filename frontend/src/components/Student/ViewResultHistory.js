import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewResultHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadHistory = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockHistory = [
        { id: 1, date: '2024-12-10', type: 'Quiz', title: 'Algebra Basics', subject: 'Mathematics', score: 85, maxScore: 100 },
        { id: 2, date: '2024-12-08', type: 'Assignment', title: 'Essay Writing', subject: 'English', score: 92, maxScore: 100 },
        { id: 3, date: '2024-12-05', type: 'Quiz', title: 'Physics Chapter 1', subject: 'Science', score: 78, maxScore: 100 },
        { id: 4, date: '2024-12-03', type: 'Assignment', title: 'Geometry Problems', subject: 'Mathematics', score: 68, maxScore: 100 },
        { id: 5, date: '2024-12-01', type: 'Quiz', title: 'Grammar Test', subject: 'English', score: 95, maxScore: 100 },
      ];
      
      setHistory(mockHistory);
      setLoading(false);
    };

    loadHistory();
  }, [navigate]);

  const filteredHistory = filter === 'all' ? history : history.filter(h => h.type.toLowerCase() === filter);

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    typeBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    quizBadge: { background: '#dbeafe', color: '#1e40af' },
    assignmentBadge: { background: '#fef3c7', color: '#92400e' },
    scoreText: { fontSize: '18px', fontWeight: '700' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>📜 Result History</h1>
            <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
          </div>
          <div style={styles.filterButtons}>
            {['all', 'quiz', 'assignment'].map(type => (
              <button key={type} onClick={() => setFilter(type)} style={{...styles.filterButton, ...(filter === type ? styles.filterButtonActive : {})}}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(item => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.date}</td>
                  <td style={styles.td}>
                    <span style={{...styles.typeBadge, ...(item.type === 'Quiz' ? styles.quizBadge : styles.assignmentBadge)}}>
                      {item.type}
                    </span>
                  </td>
                  <td style={styles.td}><strong>{item.title}</strong></td>
                  <td style={styles.td}>{item.subject}</td>
                  <td style={styles.td}>
                    <span style={{...styles.scoreText, color: getScoreColor(item.score, item.maxScore)}}>
                      {item.score}/{item.maxScore}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{...styles.scoreText, color: getScoreColor(item.score, item.maxScore)}}>
                      {Math.round((item.score / item.maxScore) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}