import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewChildProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const childData = location.state?.child || {
        id: 1,
        name: 'Emma Johnson',
        grade: 'Primary 5',
      };

      const mockData = {
        overallProgress: 75,
        subjects: [
          { name: 'English', completed: 18, total: 20, percentage: 90, color: '#10b981' },
          { name: 'Mathematics', completed: 15, total: 20, percentage: 75, color: '#3b82f6' },
          { name: 'Science', completed: 14, total: 18, percentage: 78, color: '#f59e0b' },
          { name: 'History', completed: 12, total: 15, percentage: 80, color: '#8b5cf6' },
        ],
        achievements: ['Perfect Attendance', 'Top 10 Student', 'Quiz Master'],
        upcomingAssignments: [
          { subject: 'English', title: 'Essay Writing', dueDate: '2024-12-20' },
          { subject: 'Mathematics', title: 'Algebra Problems', dueDate: '2024-12-18' },
        ],
      };

      setChild(childData);
      setProgressData(mockData);
      setLoading(false);
    };

    loadProgress();
  }, [navigate, location]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    progressCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    progressTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    subjectItem: { marginBottom: '24px' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    subjectName: { fontSize: '16px', fontWeight: '600', color: '#1f2937' },
    subjectPercentage: { fontSize: '16px', fontWeight: '700' },
    progressBar: { width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '4px' },
    progressFill: { height: '100%', transition: 'width 0.3s' },
    progressText: { fontSize: '12px', color: '#6b7280' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    achievementTag: { display: 'inline-block', padding: '8px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '14px', fontWeight: '500', marginRight: '8px', marginBottom: '8px' },
    assignmentItem: { padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' },
    assignmentTitle: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    assignmentDetails: { fontSize: '12px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📈 {child?.name}'s Progress</h1>
          <button style={styles.backButton} onClick={() => navigate('/parent/children')}>← Back to Children</button>
        </div>

        <div style={styles.progressCard}>
          <h2 style={styles.progressTitle}>Subject Progress</h2>
          {progressData?.subjects.map((subject, index) => (
            <div key={index} style={styles.subjectItem}>
              <div style={styles.subjectHeader}>
                <span style={styles.subjectName}>{subject.name}</span>
                <span style={{...styles.subjectPercentage, color: subject.color}}>{subject.percentage}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${subject.percentage}%`, background: subject.color}} />
              </div>
              <div style={styles.progressText}>{subject.completed} of {subject.total} lessons completed</div>
            </div>
          ))}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🏆 Achievements</h2>
            {progressData?.achievements.map((achievement, index) => (
              <span key={index} style={styles.achievementTag}>✓ {achievement}</span>
            ))}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📅 Upcoming Assignments</h2>
            {progressData?.upcomingAssignments.map((assignment, index) => (
              <div key={index} style={styles.assignmentItem}>
                <div style={styles.assignmentTitle}>{assignment.title}</div>
                <div style={styles.assignmentDetails}>
                  {assignment.subject} • Due: {assignment.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}