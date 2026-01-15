// DisplaySkillMatrix.js - 4 Math Skills Only (Addition, Subtraction, Multiplication, Division)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function DisplaySkillMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSkills = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // REAL API CALL - Get math skills from database
        const result = await studentService.getMathSkills();

        if (result.success) {
          setSkills(result.skills || []);
          setCurrentProfile(result.currentProfile || 1);
        } else {
          setError('Failed to load skill matrix');
          // Set default 4 math skills
          setSkills([
            { skill_name: 'Addition', current_level: 0, max_level: 5, unlocked: true },
            { skill_name: 'Subtraction', current_level: 0, max_level: 5, unlocked: true },
            { skill_name: 'Multiplication', current_level: 0, max_level: 5, unlocked: false },
            { skill_name: 'Division', current_level: 0, max_level: 5, unlocked: false },
          ]);
        }
      } catch (error) {
        console.error('Load skills error:', error);
        setError('Failed to load skill matrix');
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [navigate]);

  const getSkillColor = (level, maxLevel) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Orange
    if (percentage >= 40) return '#3b82f6'; // Blue
    if (percentage >= 20) return '#a855f7'; // Purple
    return '#ef4444'; // Red
  };

  const getSkillIcon = (skillName) => {
    if (skillName.toLowerCase().includes('addition')) return '➕';
    if (skillName.toLowerCase().includes('subtraction')) return '➖';
    if (skillName.toLowerCase().includes('multiplication')) return '✖️';
    if (skillName.toLowerCase().includes('division')) return '➗';
    return '📊';
  };

  const getSkillLevel = (percentage) => {
    if (percentage >= 80) return { label: '🏆 Master', color: '#10b981' };
    if (percentage >= 60) return { label: '⭐ Advanced', color: '#f59e0b' };
    if (percentage >= 40) return { label: '📈 Intermediate', color: '#3b82f6' };
    if (percentage >= 20) return { label: '🌟 Beginner', color: '#a855f7' };
    return { label: '🌱 Novice', color: '#ef4444' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    subtitle: { fontSize: '15px', color: '#6b7280', lineHeight: '1.6' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    infoBox: { padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #3b82f6', marginBottom: '24px' },
    infoText: { fontSize: '14px', color: '#1e40af', fontWeight: '600' },
    skillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    skillCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', position: 'relative' },
    lockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' },
    lockIcon: { fontSize: '48px', marginBottom: '12px' },
    lockText: { fontSize: '16px', fontWeight: '600', textAlign: 'center', padding: '0 20px' },
    skillHeader: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    skillIcon: { fontSize: '40px', marginRight: '12px' },
    skillName: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    progressSection: { marginBottom: '12px' },
    progressBar: { width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' },
    progressFill: { height: '100%', borderRadius: '6px', transition: 'width 0.5s ease' },
    progressText: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' },
    levelBadge: { display: 'inline-block', padding: '6px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', marginTop: '12px', color: 'white' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading skills...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>📊 My Math Skills</h1>
            <button 
              style={styles.backButton} 
              onClick={() => navigate('/student')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Dashboard
            </button>
          </div>
          <p style={styles.subtitle}>
            Track your progress in the 4 core math operations. 
            Skills improve automatically as you complete quizzes!
          </p>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.infoBox}>
          <div style={styles.infoText}>
            🎯 You are currently at Profile {currentProfile}. 
            {currentProfile < 6 ? ' Multiplication & Division will unlock at Profile 6!' : ' All operations unlocked!'}
          </div>
        </div>

        {skills.length > 0 ? (
          <div style={styles.skillsGrid}>
            {skills.map((skill, idx) => {
              const percentage = (skill.current_level / skill.max_level) * 100;
              const color = getSkillColor(skill.current_level, skill.max_level);
              const levelInfo = getSkillLevel(percentage);
              const isLocked = !skill.unlocked && currentProfile < 6;
              
              return (
                <div key={idx} style={styles.skillCard}>
                  {isLocked && (
                    <div style={styles.lockedOverlay}>
                      <div style={styles.lockIcon}>🔒</div>
                      <div style={styles.lockText}>
                        Unlocks at Profile 6<br/>
                        Keep practicing!
                      </div>
                    </div>
                  )}

                  <div style={styles.skillHeader}>
                    <span style={styles.skillIcon}>{getSkillIcon(skill.skill_name)}</span>
                    <h3 style={styles.skillName}>{skill.skill_name}</h3>
                  </div>
                  
                  <div style={styles.progressSection}>
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, width: `${percentage}%`, background: color}} />
                    </div>
                    <div style={styles.progressText}>
                      <span>Level {skill.current_level} / {skill.max_level}</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                  </div>

                  <div style={{...styles.levelBadge, background: levelInfo.color}}>
                    {levelInfo.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No skills tracked yet</p>
            <p>Your math skills will be automatically tracked as you complete quizzes</p>
          </div>
        )}
      </div>
    </div>
  );
}