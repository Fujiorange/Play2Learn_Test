import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

export default function StudentPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Get student from navigation state or load from API
        const studentData = location.state?.student || {
          id: 1,
          name: 'John Doe',
          class: 'Primary 5A',
          grade: 'Primary 5',
        };

        // Simulated performance data
        const mockData = {
          overallScore: 85,
          subjects: [
            { name: 'English', score: 88, quizzes: 12, assignments: 8, progress: '+5%' },
            { name: 'Mathematics', score: 82, quizzes: 15, assignments: 10, progress: '+3%' },
            { name: 'Science', score: 85, quizzes: 10, assignments: 6, progress: '+7%' },
          ],
          recentActivity: [
            { date: '2024-12-10', activity: 'Completed Quiz: Fractions', score: 92 },
            { date: '2024-12-09', activity: 'Submitted Assignment: Essay Writing', score: 85 },
            { date: '2024-12-08', activity: 'Completed Quiz: Grammar', score: 88 },
          ],
          strengths: ['Problem Solving', 'Reading Comprehension', 'Critical Thinking'],
          improvements: ['Time Management', 'Written Expression'],
        };

        setStudent(studentData);
        setPerformanceData(mockData);
      } catch (error) {
        console.error('Error loading performance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [navigate, location]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    scoreCard: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '16px',
      padding: '32px',
      color: 'white',
      marginBottom: '24px',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    scoreTitle: {
      fontSize: '16px',
      opacity: 0.9,
      marginBottom: '8px',
    },
    scoreValue: {
      fontSize: '48px',
      fontWeight: '700',
      margin: 0,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '24px',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    subjectItem: {
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '12px',
    },
    subjectHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    subjectName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#1f2937',
    },
    subjectScore: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#10b981',
    },
    subjectDetails: {
      fontSize: '13px',
      color: '#6b7280',
      display: 'flex',
      gap: '16px',
    },
    activityItem: {
      padding: '12px',
      borderLeft: '3px solid #10b981',
      background: '#f9fafb',
      marginBottom: '8px',
      borderRadius: '4px',
    },
    activityDate: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '4px',
    },
    activityText: {
      fontSize: '14px',
      color: '#1f2937',
      fontWeight: '500',
    },
    tag: {
      display: 'inline-block',
      padding: '6px 12px',
      background: '#d1fae5',
      color: '#065f46',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '500',
      marginRight: '8px',
      marginBottom: '8px',
    },
    improvementTag: {
      background: '#fef3c7',
      color: '#92400e',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    loadingText: {
      fontSize: '24px',
      color: '#6b7280',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading performance data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>{student?.name}</h1>
              <p style={styles.subtitle}>{student?.class} • {student?.grade}</p>
            </div>
            <button
              style={styles.backButton}
              onClick={() => navigate('/teacher/students')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Students
            </button>
          </div>
        </div>

        <div style={styles.scoreCard}>
          <div style={styles.scoreTitle}>Overall Performance Score</div>
          <div style={styles.scoreValue}>{performanceData?.overallScore}%</div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>📚</span> Subject Performance
            </h2>
            {performanceData?.subjects.map((subject, index) => (
              <div key={index} style={styles.subjectItem}>
                <div style={styles.subjectHeader}>
                  <div style={styles.subjectName}>{subject.name}</div>
                  <div style={styles.subjectScore}>{subject.score}%</div>
                </div>
                <div style={styles.subjectDetails}>
                  <span>📝 {subject.quizzes} quizzes</span>
                  <span>📄 {subject.assignments} assignments</span>
                  <span style={{ color: '#10b981' }}>{subject.progress}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>📊</span> Recent Activity
            </h2>
            {performanceData?.recentActivity.map((activity, index) => (
              <div key={index} style={styles.activityItem}>
                <div style={styles.activityDate}>{activity.date}</div>
                <div style={styles.activityText}>
                  {activity.activity}
                  <span style={{ color: '#10b981', marginLeft: '8px', fontWeight: '700' }}>
                    {activity.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>💪</span> Strengths
            </h2>
            <div>
              {performanceData?.strengths.map((strength, index) => (
                <span key={index} style={styles.tag}>
                  ✓ {strength}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>🎯</span> Areas for Improvement
            </h2>
            <div>
              {performanceData?.improvements.map((improvement, index) => (
                <span key={index} style={{...styles.tag, ...styles.improvementTag}}>
                  ⚠ {improvement}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}