import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function QuizAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [myClasses, setMyClasses] = useState([]);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [quizzesRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mongo/teacher/available-quizzes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const [quizzesData, classesData] = await Promise.all([
        quizzesRes.json(),
        classesRes.json()
      ]);

      if (quizzesData.success) {
        // Filter to only show launched quizzes
        const launched = (quizzesData.quizzes || []).filter(q => q.is_launched);
        setActiveQuizzes(launched);
      }

      if (classesData.success) {
        setMyClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1000px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' },
    backBtn: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    infoBox: { background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    cardTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' },
    cardDesc: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
    activeBadge: { background: '#d1fae5', color: '#065f46' },
    classTags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
    classTag: { padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px', fontSize: '12px' },
    empty: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', color: '#6b7280' },
  };

  if (loading) {
    return <div style={styles.container}><div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 Active Quizzes</h1>
          <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>

        <div style={styles.infoBox}>
          <p style={{ margin: 0, color: '#1e40af' }}>
            ℹ️ Quizzes are managed by P2L Admin. Below are the active quizzes available for your students.
          </p>
        </div>

        {activeQuizzes.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No Active Quizzes</p>
            <p>Quizzes will appear here when launched by P2L Admin</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {activeQuizzes.map(quiz => (
              <div key={quiz._id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={styles.cardTitle}>{quiz.title}</h3>
                  <span style={{ ...styles.badge, ...styles.activeBadge }}>Active</span>
                </div>
                <p style={styles.cardDesc}>{quiz.description || 'Adaptive quiz'}</p>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  <p style={{ margin: '4px 0' }}>Type: {quiz.quiz_type || 'adaptive'}</p>
                  {quiz.launched_for_classes && quiz.launched_for_classes.length > 0 && (
                    <div style={styles.classTags}>
                      <span style={{ marginRight: '8px' }}>Classes:</span>
                      {quiz.launched_for_classes.map((cls, i) => (
                        <span key={i} style={styles.classTag}>{cls}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
