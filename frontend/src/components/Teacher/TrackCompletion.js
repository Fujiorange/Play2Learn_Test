import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TrackCompletion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const mockData = [
        { id: 1, assignment: 'Essay on Climate Change', class: 'Primary 5A', totalStudents: 25, completed: 18, pending: 7, completionRate: 72 },
        { id: 2, assignment: 'Quadratic Equations', class: 'Primary 5B', totalStudents: 22, completed: 20, pending: 2, completionRate: 91 },
      ];
      setCompletionData(mockData);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const getCompletionColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    cardClass: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    progressBar: { width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' },
    progressFill: { height: '100%', transition: 'width 0.3s' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
    stat: { textAlign: 'center' },
    statValue: { fontSize: '24px', fontWeight: '700' },
    statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📊 Track Completion Rates</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>
        <div style={styles.grid}>
          {completionData.map(item => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardTitle}>{item.assignment}</div>
              <div style={styles.cardClass}>👥 {item.class}</div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${item.completionRate}%`, background: getCompletionColor(item.completionRate)}} />
              </div>
              <div style={styles.stats}>
                <div style={styles.stat}>
                  <div style={{...styles.statValue, color: getCompletionColor(item.completionRate)}}>{item.completionRate}%</div>
                  <div style={styles.statLabel}>Completion</div>
                </div>
                <div style={styles.stat}>
                  <div style={{...styles.statValue, color: '#10b981'}}>{item.completed}</div>
                  <div style={styles.statLabel}>Completed</div>
                </div>
                <div style={styles.stat}>
                  <div style={{...styles.statValue, color: '#f59e0b'}}>{item.pending}</div>
                  <div style={styles.statLabel}>Pending</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}