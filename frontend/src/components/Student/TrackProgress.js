import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TrackProgress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockData = {
        overallProgress: 68,
        subjects: [
          { name: 'Mathematics', completed: 12, total: 15, percentage: 80, color: '#3b82f6' },
          { name: 'English', completed: 10, total: 12, percentage: 83, color: '#10b981' },
          { name: 'Science', completed: 8, total: 14, percentage: 57, color: '#f59e0b' },
        ],
        recentActivities: [
          { date: '2024-12-10', activity: 'Completed Quiz: Algebra', subject: 'Mathematics' },
          { date: '2024-12-09', activity: 'Submitted Assignment: Essay', subject: 'English' },
          { date: '2024-12-08', activity: 'Started Module: Physics', subject: 'Science' },
        ],
        streak: 7,
        totalPoints: 1250,
        level: 12,
      };
      
      setProgressData(mockData);
      setLoading(false);
    };

    loadProgress();
  }, [navigate]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    statIcon: { fontSize: '32px', marginBottom: '8px' },
    statLabel: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937' },
    subjectsCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    cardTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' },
    subjectItem: { marginBottom: '20px' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    subjectName: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
    subjectPercentage: { fontSize: '15px', fontWeight: '700' },
    progressBar: { width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', transition: 'width 0.3s' },
    activitiesCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    activityItem: { padding: '12px', borderLeft: '3px solid #10b981', background: '#f9fafb', marginBottom: '8px', borderRadius: '4px' },
    activityDate: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    activityText: { fontSize: '14px', color: '#1f2937', fontWeight: '500' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📈 Track My Progress</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statLabel}>Overall Progress</div>
            <div style={styles.statValue}>{progressData.overallProgress}%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔥</div>
            <div style={styles.statLabel}>Current Streak</div>
            <div style={styles.statValue}>{progressData.streak} days</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <div style={styles.statLabel}>Total Points</div>
            <div style={styles.statValue}>{progressData.totalPoints}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statLabel}>Current Level</div>
            <div style={styles.statValue}>{progressData.level}</div>
          </div>
        </div>

        <div style={styles.subjectsCard}>
          <h2 style={styles.cardTitle}>Subject Progress</h2>
          {progressData.subjects.map((subject, index) => (
            <div key={index} style={styles.subjectItem}>
              <div style={styles.subjectHeader}>
                <span style={styles.subjectName}>{subject.name}</span>
                <span style={{...styles.subjectPercentage, color: subject.color}}>{subject.percentage}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${subject.percentage}%`, background: subject.color}} />
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {subject.completed} of {subject.total} lessons completed
              </div>
            </div>
          ))}
        </div>

        <div style={styles.activitiesCard}>
          <h2 style={styles.cardTitle}>Recent Activities</h2>
          {progressData.recentActivities.map((activity, index) => (
            <div key={index} style={styles.activityItem}>
              <div style={styles.activityDate}>{activity.date}</div>
              <div style={styles.activityText}>{activity.activity}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>📚 {activity.subject}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}