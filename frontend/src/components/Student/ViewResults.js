import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewResults() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadResults = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockResults = [
        { id: 1, type: 'Quiz', subject: 'Mathematics', title: 'Algebra Basics', score: 85, maxScore: 100, date: '2024-12-10', status: 'passed' },
        { id: 2, type: 'Assignment', subject: 'English', title: 'Essay Writing', score: 92, maxScore: 100, date: '2024-12-08', status: 'passed' },
        { id: 3, type: 'Quiz', subject: 'Science', title: 'Physics Chapter 1', score: 78, maxScore: 100, date: '2024-12-05', status: 'passed' },
        { id: 4, type: 'Assignment', subject: 'Mathematics', title: 'Geometry Problems', score: 68, maxScore: 100, date: '2024-12-03', status: 'passed' },
      ];
      
      setResults(mockResults);
      setLoading(false);
    };

    loadResults();
  }, [navigate]);

  const filteredResults = filter === 'all' ? results : results.filter(r => r.type.toLowerCase() === filter);

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
    resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    resultCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.3s' },
    resultType: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginBottom: '12px' },
    quizType: { background: '#dbeafe', color: '#1e40af' },
    assignmentType: { background: '#fef3c7', color: '#92400e' },
    resultTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    resultSubject: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    scoreSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
    score: { fontSize: '24px', fontWeight: '700' },
    date: { fontSize: '13px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>📊 My Results</h1>
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

        <div style={styles.resultsGrid}>
          {filteredResults.map(result => (
            <div key={result.id} style={styles.resultCard} onClick={() => navigate('/student/results/history')} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <span style={{...styles.resultType, ...(result.type === 'Quiz' ? styles.quizType : styles.assignmentType)}}>
                {result.type}
              </span>
              <div style={styles.resultTitle}>{result.title}</div>
              <div style={styles.resultSubject}>📚 {result.subject}</div>
              <div style={styles.scoreSection}>
                <span style={{...styles.score, color: getScoreColor(result.score, result.maxScore)}}>
                  {result.score}/{result.maxScore}
                </span>
                <span style={styles.date}>{result.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}