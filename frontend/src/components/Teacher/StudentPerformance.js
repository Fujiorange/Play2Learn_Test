import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const loadPerformance = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const studentFromState = location.state?.student;
      if (!studentFromState || !studentFromState._id) {
        setError('No student selected. Please go back and select a student from the list.');
        setLoading(false);
        return;
      }

      try {
        const [studentRes, quizRes, skillsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/mongo/teacher/students/${studentFromState._id}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch(`${API_BASE_URL}/api/mongo/teacher/students/${studentFromState._id}/quiz-results`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch(`${API_BASE_URL}/api/mongo/teacher/students/${studentFromState._id}/skills`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          })
        ]);

        const [studentData, quizData, skillsData] = await Promise.all([
          studentRes.json(),
          quizRes.json(),
          skillsRes.json()
        ]);

        // Use displayClass from state if available (passed from StudentList)
        const displayClass = studentFromState.displayClass || studentFromState.class || 'Primary 1';
        const studentInfo = studentData.success ? { ...studentData.student, displayClass } : { ...studentFromState, displayClass };
        setStudent(studentInfo);

        const quizResults = quizData.success ? quizData.results : [];
        const allSkills = skillsData.success ? skillsData.skills : [];
        
        // Filter to Math only
        const skills = allSkills.filter(s => !['English', 'Science', 'english', 'science'].includes(s.skill_name));
        
        const completedQuizzes = quizResults.filter(q => q.is_completed);
        const overallScore = completedQuizzes.length > 0
          ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.accuracy || 0), 0) / completedQuizzes.length)
          : 0;

        const recentActivity = quizResults.slice(0, 5).map(quiz => ({
          date: quiz.startedAt ? new Date(quiz.startedAt).toLocaleDateString() : 'N/A',
          activity: `${quiz.is_completed ? 'Completed' : 'Attempted'} Quiz`,
          score: quiz.accuracy || 0
        }));

        const sortedSkills = [...skills].sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const strengths = sortedSkills.slice(0, 3).filter(s => s.current_level >= 2).map(s => s.skill_name);
        const improvements = sortedSkills.filter(s => s.current_level < 2).slice(0, 3).map(s => s.skill_name);

        setPerformanceData({
          overallScore,
          totalQuizzes: quizResults.length,
          completedQuizzes: completedQuizzes.length,
          skills: skills.map(s => ({ name: s.skill_name, level: s.current_level || 0, xp: s.xp || 0, points: s.points || 0 })),
          recentActivity: recentActivity.length > 0 ? recentActivity : [{ date: 'N/A', activity: 'No activity yet', score: 0 }],
          strengths: strengths.length > 0 ? strengths : ['No strong skills yet'],
          improvements: improvements.length > 0 ? improvements : ['Keep practicing!'],
        });
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [navigate, location]);

  const getSkillColor = (level) => {
    if (level >= 4) return '#10b981';
    if (level >= 3) return '#3b82f6';
    if (level >= 2) return '#f59e0b';
    if (level >= 1) return '#f97316';
    return '#ef4444';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' },
    subtitle: { fontSize: '16px', color: '#6b7280', margin: 0 },
    classBadge: { display: 'inline-block', padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '14px', fontWeight: '600', marginLeft: '12px' },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    scoreCard: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '24px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
    scoreValue: { fontSize: '48px', fontWeight: '700', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    skillItem: { padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' },
    skillBar: { height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
    activityItem: { padding: '12px', borderLeft: '3px solid #10b981', background: '#f9fafb', marginBottom: '8px', borderRadius: '4px' },
    tag: { display: 'inline-block', padding: '6px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '13px', fontWeight: '500', marginRight: '8px', marginBottom: '8px' },
    improvementTag: { background: '#fef3c7', color: '#92400e' },
    error: { padding: '20px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b', marginTop: '20px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading) return <div style={styles.loading}><div>Loading performance data...</div></div>;

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <h1 style={styles.title}>Student Performance</h1>
              <button style={styles.backBtn} onClick={() => navigate('/teacher/students')}>← Back to Students</button>
            </div>
          </div>
          <div style={styles.error}>⚠️ {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>
                {student?.name || 'Student'}
                <span style={styles.classBadge}>{student?.displayClass || 'Primary 1'}</span>
              </h1>
              <p style={styles.subtitle}>Primary 1 Mathematics</p>
            </div>
            <button style={styles.backBtn} onClick={() => navigate('/teacher/students')}>← Back to Students</button>
          </div>
        </div>

        <div style={styles.scoreCard}>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>Overall Performance Score</div>
          <div style={styles.scoreValue}>{performanceData?.overallScore || 0}%</div>
          <div style={{ marginTop: '12px', fontSize: '14px', opacity: 0.9 }}>
            {performanceData?.completedQuizzes || 0} of {performanceData?.totalQuizzes || 0} quizzes completed
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Math Skills</h2>
            {performanceData?.skills?.length > 0 ? (
              performanceData.skills.map((skill, i) => (
                <div key={i} style={styles.skillItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>{skill.name}</span>
                    <span style={{ color: getSkillColor(skill.level), fontWeight: '700' }}>Lv {skill.level}/5</span>
                  </div>
                  <div style={styles.skillBar}>
                    <div style={{ height: '100%', width: `${(skill.level / 5) * 100}%`, background: getSkillColor(skill.level), borderRadius: '4px' }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No skill data available yet</div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📈 Recent Activity</h2>
            {performanceData?.recentActivity.map((activity, i) => (
              <div key={i} style={styles.activityItem}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{activity.date}</div>
                <div style={{ fontWeight: '500' }}>
                  {activity.activity}
                  {activity.score > 0 && <span style={{ color: '#10b981', marginLeft: '8px', fontWeight: '700' }}>{activity.score}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>💪 Strengths</h2>
            <div>{performanceData?.strengths.map((s, i) => <span key={i} style={styles.tag}>✓ {s}</span>)}</div>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🎯 Areas for Improvement</h2>
            <div>{performanceData?.improvements.map((s, i) => <span key={i} style={{...styles.tag, ...styles.improvementTag}}>⚠ {s}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
