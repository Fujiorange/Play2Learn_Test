import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewSubmissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const mockData = [
        { id: 1, student: 'John Doe', assignment: 'Essay on Climate Change', submittedOn: '2024-12-11', status: 'pending', grade: null },
        { id: 2, student: 'Jane Smith', assignment: 'Essay on Climate Change', submittedOn: '2024-12-10', status: 'graded', grade: 92 },
        { id: 3, student: 'Mike Johnson', assignment: 'Quadratic Equations', submittedOn: '2024-12-09', status: 'graded', grade: 85 },
      ];
      setSubmissions(mockData);
      setLoading(false);
    };
    loadSubmissions();
  }, [navigate]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    pendingBadge: { background: '#fef3c7', color: '#92400e' },
    gradedBadge: { background: '#d1fae5', color: '#065f46' },
    button: { padding: '6px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📄 Submitted Assignments</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Assignment</th>
                <th style={styles.th}>Submitted On</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td style={styles.td}><strong>{sub.student}</strong></td>
                  <td style={styles.td}>{sub.assignment}</td>
                  <td style={styles.td}>{sub.submittedOn}</td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, ...(sub.status === 'pending' ? styles.pendingBadge : styles.gradedBadge)}}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={styles.td}>{sub.grade ? `${sub.grade}%` : '-'}</td>
                  <td style={styles.td}>
                    <button style={styles.button}>
                      {sub.status === 'pending' ? '✏️ Grade' : '👁️ View'}
                    </button>
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