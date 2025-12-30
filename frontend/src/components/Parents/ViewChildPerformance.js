import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewChildPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const childData = location.state?.child || {
        id: 1,
        name: 'Emma Johnson',
        grade: 'Primary 5',
        class: 'Primary 5A',
      };

      const mockData = {
        overallScore: 88,
        subjects: [
          { name: 'English', score: 90, grade: 'A', progress: '+5%' },
          { name: 'Mathematics', score: 85, grade: 'A-', progress: '+3%' },
          { name: 'Science', score: 89, grade: 'A', progress: '+7%' },
          { name: 'History', score: 86, grade: 'A-', progress: '+2%' },
        ],
        recentTests: [
          { date: '2024-12-10', subject: 'English', type: 'Quiz', score: 92, maxScore: 100 },
          { date: '2024-12-09', subject: 'Mathematics', type: 'Assignment', score: 85, maxScore: 100 },
          { date: '2024-12-08', subject: 'Science', type: 'Quiz', score: 88, maxScore: 100 },
        ],
        attendance: '95%',
        rank: 4,
        totalStudents: 30,
      };

      setChild(childData);
      setPerformanceData(mockData);
      setLoading(false);
    };

    loadPerformance();
  }, [navigate, location]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' },
    subtitle: { fontSize: '16px', color: '#6b7280', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    scoreCard: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
    scoreTitle: { fontSize: '16px', opacity: 0.9, marginBottom: '8px' },
    scoreValue: { fontSize: '48px', fontWeight: '700', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    subjectItem: { padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    subjectName: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
    subjectGrade: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    testItem: { padding: '12px', borderLeft: '3px solid #10b981', background: '#f9fafb', marginBottom: '8px', borderRadius: '4px' },
    testDate: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    testText: { fontSize: '14px', color: '#1f2937', fontWeight: '500' },
    statsCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    statRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
    statLabel: { fontSize: '14px', color: '#6b7280' },
    statValue: { fontSize: '16px', fontWeight: '700', color: '#1f2937' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>{child?.name}</h1>
              <p style={styles.subtitle}>{child?.class} • {child?.grade}</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/parent/children')}>← Back to Children</button>
          </div>
        </div>

        <div style={styles.scoreCard}>
          <div style={styles.scoreTitle}>Overall Performance Score</div>
          <div style={styles.scoreValue}>{performanceData?.overallScore}%</div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📚 Subject Performance</h2>
            {performanceData?.subjects.map((subject, index) => (
              <div key={index} style={styles.subjectItem}>
                <div style={styles.subjectHeader}>
                  <div style={styles.subjectName}>{subject.name}</div>
                  <div style={styles.subjectGrade}>{subject.grade}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Score: {subject.score}% <span style={{ color: '#10b981', marginLeft: '8px' }}>{subject.progress}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Recent Tests & Assignments</h2>
            {performanceData?.recentTests.map((test, index) => (
              <div key={index} style={styles.testItem}>
                <div style={styles.testDate}>{test.date}</div>
                <div style={styles.testText}>
                  {test.subject} - {test.type}
                  <span style={{ color: '#10b981', marginLeft: '8px', fontWeight: '700' }}>
                    {test.score}/{test.maxScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.statsCard}>
          <h2 style={styles.cardTitle}>📈 Additional Statistics</h2>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Attendance Rate</span>
            <span style={{...styles.statValue, color: '#10b981'}}>{performanceData?.attendance}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Class Rank</span>
            <span style={styles.statValue}>{performanceData?.rank} of {performanceData?.totalStudents}</span>
          </div>
        </div>
      </div>
    </div>
  );
}