import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function DisplaySkillMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const loadSkills = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const mockSkills = [
        { skill: 'Problem Solving', level: 4, maxLevel: 5, color: '#10b981' },
        { skill: 'Critical Thinking', level: 3, maxLevel: 5, color: '#3b82f6' },
        { skill: 'Reading Comprehension', level: 5, maxLevel: 5, color: '#8b5cf6' },
        { skill: 'Mathematical Reasoning', level: 3, maxLevel: 5, color: '#f59e0b' },
        { skill: 'Writing Skills', level: 4, maxLevel: 5, color: '#ec4899' },
        { skill: 'Scientific Method', level: 2, maxLevel: 5, color: '#06b6d4' },
      ];
      
      setSkills(mockSkills);
      setLoading(false);
    };

    loadSkills();
  }, [navigate]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1000px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    skillsCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    skillItem: { marginBottom: '32px' },
    skillHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    skillName: { fontSize: '16px', fontWeight: '600', color: '#1f2937' },
    skillLevel: { fontSize: '14px', fontWeight: '600' },
    skillBar: { display: 'flex', gap: '8px' },
    skillDot: { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', color: 'white', transition: 'all 0.3s' },
    skillDotInactive: { background: '#e5e7eb', color: '#9ca3af' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>💡 My Skills Matrix</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>

        <div style={styles.skillsCard}>
          {skills.map((skill, index) => (
            <div key={index} style={styles.skillItem}>
              <div style={styles.skillHeader}>
                <span style={styles.skillName}>{skill.skill}</span>
                <span style={{...styles.skillLevel, color: skill.color}}>
                  Level {skill.level}/{skill.maxLevel}
                </span>
              </div>
              <div style={styles.skillBar}>
                {[...Array(skill.maxLevel)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.skillDot,
                      ...(i < skill.level ? { background: skill.color } : styles.skillDotInactive)
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}