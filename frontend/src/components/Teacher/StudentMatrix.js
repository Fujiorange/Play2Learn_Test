import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [sortBy, setSortBy] = useState('overall');

  useEffect(() => {
    const loadMatrix = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockData = [
        { id: 1, name: 'Sarah Williams', english: 92, math: 88, science: 90, overall: 90 },
        { id: 2, name: 'Jane Smith', english: 85, math: 95, science: 88, overall: 89 },
        { id: 3, name: 'John Doe', english: 88, math: 82, science: 85, overall: 85 },
        { id: 4, name: 'Mike Johnson', english: 75, math: 80, science: 78, overall: 78 },
        { id: 5, name: 'David Brown', english: 70, math: 68, science: 72, overall: 70 },
      ];
      
      setStudents(mockData);
      setLoading(false);
    };

    loadMatrix();
  }, [navigate]);

  const sortedStudents = [...students].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    sortSection: { display: 'flex', gap: '8px', alignItems: 'center' },
    sortButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', background: 'white' },
    sortButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    rankBadge: { display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', textAlign: 'center', lineHeight: '30px', fontWeight: '700', fontSize: '14px' },
    scoreCell: { fontWeight: '700', fontSize: '16px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading matrix...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>Student Skill Matrix</h1>
            <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <div style={styles.sortSection}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Sort by:</span>
            {['overall', 'english', 'math', 'science'].map(subject => (
              <button
                key={subject}
                onClick={() => setSortBy(subject)}
                style={{...styles.sortButton, ...(sortBy === subject ? styles.sortButtonActive : {})}}
              >
                {subject.charAt(0).toUpperCase() + subject.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>English</th>
                <th style={styles.th}>Mathematics</th>
                <th style={styles.th}>Science</th>
                <th style={styles.th}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr key={student.id}>
                  <td style={styles.td}>
                    <span style={{...styles.rankBadge, background: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#fb923c' : '#f3f4f6', color: index < 3 ? 'white' : '#6b7280'}}>
                      {index + 1}
                    </span>
                  </td>
                  <td style={styles.td}><strong>{student.name}</strong></td>
                  <td style={{...styles.td, ...styles.scoreCell, color: getScoreColor(student.english)}}>{student.english}%</td>
                  <td style={{...styles.td, ...styles.scoreCell, color: getScoreColor(student.math)}}>{student.math}%</td>
                  <td style={{...styles.td, ...styles.scoreCell, color: getScoreColor(student.science)}}>{student.science}%</td>
                  <td style={{...styles.td, ...styles.scoreCell, color: getScoreColor(student.overall)}}>{student.overall}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}