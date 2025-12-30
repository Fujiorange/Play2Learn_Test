import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ViewDetailedSubjectInfo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockSubjects = [
        {
          id: 1,
          name: 'Mathematics',
          teacher: 'Ms. Sarah Johnson',
          progress: 80,
          grade: 'A',
          topics: ['Algebra', 'Geometry', 'Statistics'],
          nextLesson: 'Quadratic Equations',
          assignments: 3,
          quizzes: 2,
        },
        {
          id: 2,
          name: 'English',
          teacher: 'Mr. David Smith',
          progress: 75,
          grade: 'B+',
          topics: ['Literature', 'Grammar', 'Writing'],
          nextLesson: 'Essay Structure',
          assignments: 2,
          quizzes: 1,
        },
        {
          id: 3,
          name: 'Science',
          teacher: 'Dr. Emily Chen',
          progress: 65,
          grade: 'B',
          topics: ['Physics', 'Chemistry', 'Biology'],
          nextLesson: 'States of Matter',
          assignments: 4,
          quizzes: 3,
        },
      ];
      
      setSubjects(mockSubjects);
      setLoading(false);
    };

    loadSubjects();
  }, [navigate]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' },
    subjectCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' },
    subjectName: { fontSize: '22px', fontWeight: '700', color: '#1f2937' },
    grade: { padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', background: '#d1fae5', color: '#065f46' },
    teacher: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    progressSection: { marginBottom: '16px' },
    progressLabel: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    progressBar: { width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' },
    progressFill: { height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', transition: 'width 0.3s' },
    progressText: { fontSize: '12px', color: '#6b7280', textAlign: 'right' },
    infoSection: { marginBottom: '12px' },
    infoLabel: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    topicsList: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
    topicTag: { padding: '4px 10px', background: '#f3f4f6', borderRadius: '12px', fontSize: '12px', color: '#374151' },
    statsRow: { display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
    stat: { flex: 1, textAlign: 'center' },
    statValue: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    statLabel: { fontSize: '11px', color: '#6b7280', marginTop: '4px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📚 My Subjects</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>

        <div style={styles.subjectsGrid}>
          {subjects.map(subject => (
            <div key={subject.id} style={styles.subjectCard}>
              <div style={styles.subjectHeader}>
                <h2 style={styles.subjectName}>{subject.name}</h2>
                <span style={styles.grade}>{subject.grade}</span>
              </div>
              
              <div style={styles.teacher}>👨‍🏫 {subject.teacher}</div>

              <div style={styles.progressSection}>
                <div style={styles.progressLabel}>Overall Progress</div>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${subject.progress}%`}} />
                </div>
                <div style={styles.progressText}>{subject.progress}% complete</div>
              </div>

              <div style={styles.infoSection}>
                <div style={styles.infoLabel}>Topics Covered</div>
                <div style={styles.topicsList}>
                  {subject.topics.map((topic, idx) => (
                    <span key={idx} style={styles.topicTag}>{topic}</span>
                  ))}
                </div>
              </div>

              <div style={styles.infoSection}>
                <div style={styles.infoLabel}>Next Lesson</div>
                <div style={{ fontSize: '14px', color: '#1f2937' }}>📖 {subject.nextLesson}</div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{subject.assignments}</div>
                  <div style={styles.statLabel}>Assignments</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{subject.quizzes}</div>
                  <div style={styles.statLabel}>Quizzes</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}