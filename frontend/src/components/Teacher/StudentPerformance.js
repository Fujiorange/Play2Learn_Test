import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

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

      try {
        // Get student from navigation state
        const studentFromState = location.state?.student;
        
        if (!studentFromState || !studentFromState._id) {
          setError('No student selected. Please select a student from the list.');
          setLoading(false);
          return;
        }

        // Fetch student details from API
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

        if (studentData.success) {
          setStudent(studentData.student);
        } else {
          setStudent(studentFromState);
        }

        // Process quiz results to create performance data
        const quizResults = quizData.success ? quizData.results : [];
        const skills = skillsData.success ? skillsData.skills : [];
        
        // Calculate overall score from quiz results
        const completedQuizzes = quizResults.filter(q => q.is_completed);
        const overallScore = completedQuizzes.length > 0
          ? Math.round(completedQuizzes.reduce((sum, q) => sum + q.accuracy, 0) / completedQuizzes.length)
          : 0;

        // Get recent activity from quiz attempts
        const recentActivity = quizResults.slice(0, 5).map(quiz => ({
          date: quiz.startedAt ? new Date(quiz.startedAt).toLocaleDateString() : 'N/A',
          activity: `${quiz.is_completed ? 'Completed' : 'Attempted'} Quiz: ${quiz.quizTitle}`,
          score: quiz.accuracy
        }));

        // Calculate skill strengths and areas for improvement
        const sortedSkills = [...skills].sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const strengths = sortedSkills.slice(0, 3).filter(s => s.current_level >= 2).map(s => s.skill_name);
        const improvements = sortedSkills.filter(s => s.current_level < 2).slice(0, 3).map(s => s.skill_name);

        // Create skill summary for display
        const skillSummary = skills.map(skill => ({
          name: skill.skill_name,
          level: skill.current_level || 1,
          xp: skill.xp || 0,
          unlocked: skill.unlocked !== false
        }));

        setPerformanceData({
          overallScore,
          totalQuizzes: quizResults.length,
          completedQuizzes: completedQuizzes.length,
          skills: skillSummary,
          recentActivity: recentActivity.length > 0 ? recentActivity : [{ date: 'N/A', activity: 'No activity yet', score: 0 }],
          strengths: strengths.length > 0 ? strengths : ['No strong skills identified yet'],
          improvements: improvements.length > 0 ? improvements : ['Keep practicing!'],
          mathProfile: studentData.student?.mathProfile
        });
      } catch (error) {
        console.error('Error loading performance:', error);
        setError('Failed to load student performance data');
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div>
                <h1 style={styles.title}>Student Performance</h1>
              </div>
              <button
                style={styles.backButton}
                onClick={() => navigate('/teacher/students')}
              >
                ← Back to Students
              </button>
            </div>
          </div>
          <div style={{ padding: '20px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b' }}>
            ⚠️ {error}
          </div>
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
              <h1 style={styles.title}>{student?.name}</h1>
              <p style={styles.subtitle}>{student?.class} • {student?.gradeLevel || 'N/A'}</p>
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
          <div style={styles.scoreValue}>{performanceData?.overallScore || 0}%</div>
          <div style={{ marginTop: '12px', fontSize: '14px', opacity: 0.9 }}>
            {performanceData?.completedQuizzes || 0} of {performanceData?.totalQuizzes || 0} quizzes completed
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>📚</span> Skill Matrix
            </h2>
            {performanceData?.skills && performanceData.skills.length > 0 ? (
              performanceData.skills.map((skill, index) => (
                <div key={index} style={styles.subjectItem}>
                  <div style={styles.subjectHeader}>
                    <div style={styles.subjectName}>{skill.name}</div>
                    <div style={styles.subjectScore}>Level {skill.level}/5</div>
                  </div>
                  <div style={styles.subjectDetails}>
                    <span>⭐ {skill.xp} XP</span>
                    <span style={{ color: skill.unlocked ? '#10b981' : '#ef4444' }}>
                      {skill.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                No skill data available yet
              </div>
            )}
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
                  {activity.score > 0 && (
                    <span style={{ color: '#10b981', marginLeft: '8px', fontWeight: '700' }}>
                      {activity.score}%
                    </span>
                  )}
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

        {/* Math Profile Info */}
        {performanceData?.mathProfile && (
          <div style={{ ...styles.card, marginTop: '24px' }}>
            <h2 style={styles.cardTitle}>
              <span>🎓</span> Math Profile
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {performanceData.mathProfile.current_profile || 1}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Current Level</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {(performanceData.mathProfile.total_points || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Points</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {performanceData.mathProfile.streak || 0}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: performanceData.mathProfile.placement_completed ? '#10b981' : '#ef4444' }}>
                  {performanceData.mathProfile.placement_completed ? '✓' : '✗'}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Placement Complete</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}