import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockQuizzes = [
        { id: 1, title: 'Algebra Fundamentals', subject: 'Mathematics', questions: 15, duration: 30, difficulty: 'Medium', status: 'available' },
        { id: 2, title: 'Grammar Basics', subject: 'English', questions: 20, duration: 25, difficulty: 'Easy', status: 'available' },
        { id: 3, title: 'Physics Chapter 3', subject: 'Science', questions: 12, duration: 35, difficulty: 'Hard', status: 'available' },
        { id: 4, title: 'World War II', subject: 'History', questions: 18, duration: 40, difficulty: 'Medium', status: 'completed' },
      ];
      
      setQuizzes(mockQuizzes);
      setLoading(false);
    };

    loadQuizzes();
  }, [navigate]);

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Easy') return '#10b981';
    if (difficulty === 'Medium') return '#f59e0b';
    return '#ef4444';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    quizzesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    quizCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s' },
    quizTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    quizSubject: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    quizInfo: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    infoItem: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151' },
    difficultyBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    startButton: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    completedButton: { background: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Available Quizzes</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>

        <div style={styles.quizzesGrid}>
          {quizzes.map(quiz => (
            <div key={quiz.id} style={styles.quizCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={styles.quizTitle}>{quiz.title}</div>
              <div style={styles.quizSubject}>📚 {quiz.subject}</div>
              
              <div style={styles.quizInfo}>
                <div style={styles.infoItem}>❓ {quiz.questions} questions</div>
                <div style={styles.infoItem}>⏱️ {quiz.duration} minutes</div>
                <div style={styles.infoItem}>
                  <span style={{...styles.difficultyBadge, background: getDifficultyColor(quiz.difficulty), color: 'white'}}>
                    {quiz.difficulty}
                  </span>
                </div>
              </div>

              <button
                style={{
                  ...styles.startButton,
                  ...(quiz.status === 'completed' ? styles.completedButton : {})
                }}
                disabled={quiz.status === 'completed'}
                onClick={() => alert('Quiz feature coming soon!')}
                onMouseEnter={(e) => quiz.status === 'available' && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {quiz.status === 'completed' ? '✅ Completed' : '🚀 Start Quiz'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}