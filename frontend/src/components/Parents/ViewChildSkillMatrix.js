// frontend/src/pages/Parent/ViewChildSkillMatrix.js - NEW FILE
// ✅ Parent-facing view of child's math skill matrix
// ✅ Shows Addition, Subtraction, Multiplication, Division skills
// ✅ Read-only view for parents

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

const SKILL_ORDER = ['Addition', 'Subtraction', 'Multiplication', 'Division'];

function sortSkillsBySequence(skills) {
  const orderIndex = new Map(SKILL_ORDER.map((name, idx) => [name, idx]));
  return [...skills].sort((a, b) => {
    const ai = orderIndex.has(a.skill_name) ? orderIndex.get(a.skill_name) : 999;
    const bi = orderIndex.has(b.skill_name) ? orderIndex.get(b.skill_name) : 999;
    return ai - bi;
  });
}

function getSkillColor(level, maxLevel) {
  const percentage = (level / maxLevel) * 100;
  if (percentage >= 80) return "#10b981";
  if (percentage >= 60) return "#f59e0b";
  if (percentage >= 40) return "#3b82f6";
  if (percentage >= 20) return "#a855f7";
  return "#ef4444";
}

function getSkillIcon(skillName) {
  const name = (skillName || "").toLowerCase();
  if (name.includes("addition")) return "➕";
  if (name.includes("subtraction")) return "➖";
  if (name.includes("multiplication")) return "✖️";
  if (name.includes("division")) return "➗";
  return "📊";
}

function getSkillLevel(level) {
  if (level >= 5) return { label: "🏆 Master", color: "#10b981" };
  if (level >= 4) return { label: "⭐ Advanced", color: "#f59e0b" };
  if (level >= 3) return { label: "📈 Intermediate", color: "#3b82f6" };
  if (level >= 2) return { label: "🌟 Beginner", color: "#a855f7" };
  if (level >= 1) return { label: "🌱 Learning", color: "#8b5cf6" };
  return { label: "✨ Novice", color: "#ef4444" };
}

function getLevelPointRange(level) {
  const ranges = [
    "0-24", "25-49", "50-99", "100-199", "200-399", "400+"
  ];
  return ranges[level] || "0-24";
}

function getNextLevelThreshold(currentLevel) {
  const thresholds = [25, 50, 100, 200, 400];
  if (currentLevel >= 5) return null;
  return thresholds[currentLevel];
}

export default function ViewChildSkillMatrix() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(1);
  const [error, setError] = useState('');
  const childInfo = location.state?.child;

  useEffect(() => {
    const loadSkills = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      if (!childInfo?.studentId) {
        setError('No child selected');
        setLoading(false);
        return;
      }

      try {
        const result = await parentService.getChildSkills(childInfo.studentId);

        if (result?.success) {
          const sorted = sortSkillsBySequence(result.skills || []);
          setSkills(sorted);
          setCurrentProfile(result.currentProfile || 1);
        } else {
          setError(result.error || 'Failed to load skill matrix');
          // Fallback to default skills
          const fallback = sortSkillsBySequence([
            { skill_name: 'Addition', current_level: 0, xp: 0, points: 0, max_level: 5, unlocked: true, percentage: 0 },
            { skill_name: 'Subtraction', current_level: 0, xp: 0, points: 0, max_level: 5, unlocked: true, percentage: 0 },
            { skill_name: 'Multiplication', current_level: 0, xp: 0, points: 0, max_level: 5, unlocked: false, percentage: 0 },
            { skill_name: 'Division', current_level: 0, xp: 0, points: 0, max_level: 5, unlocked: false, percentage: 0 },
          ]);
          setSkills(fallback);
          setCurrentProfile(1);
        }
      } catch (err) {
        console.error('Load skills error:', err);
        setError('Failed to load skill matrix');
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [navigate, childInfo]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: { maxWidth: '1200px', margin: '0 auto' },
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
      marginBottom: '16px',
    },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    subtitle: { fontSize: '16px', color: '#6b7280', marginTop: '4px' },
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
    description: { fontSize: '15px', color: '#6b7280', lineHeight: '1.6', marginTop: '12px' },
    errorMessage: {
      padding: '12px 16px',
      background: '#fee2e2',
      color: '#991b1b',
      borderRadius: '8px',
      marginTop: '16px',
      fontSize: '14px',
    },
    infoBox: {
      padding: '16px',
      background: '#f0f9ff',
      borderRadius: '12px',
      border: '2px solid #3b82f6',
      marginTop: '16px',
    },
    infoText: { fontSize: '14px', color: '#1e40af', fontWeight: '600' },

    skillsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '20px',
    },
    skillCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s',
    },

    lockedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 5,
      gap: '6px',
    },
    lockIcon: { fontSize: '44px' },
    lockText: {
      fontSize: '14px',
      fontWeight: '700',
      textAlign: 'center',
      padding: '0 18px',
      lineHeight: 1.4,
    },

    skillHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
    skillIcon: { fontSize: '40px' },
    skillName: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },

    progressBar: { width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
    row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '8px' },

    badge: {
      display: 'inline-block',
      marginTop: '12px',
      padding: '6px 14px',
      borderRadius: '999px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '800',
    },
    xp: { marginTop: '8px', fontSize: '12px', color: '#6b7280' },

    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    
    emptyState: { 
      textAlign: 'center', 
      padding: '60px 20px', 
      background: 'white', 
      borderRadius: '16px', 
      color: '#6b7280',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    emptyIcon: { fontSize: '64px', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    emptyText: { fontSize: '15px', color: '#6b7280' }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading skills...</div>
      </div>
    );
  }

  if (error && !childInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚠️</div>
            <div style={styles.emptyTitle}>{error}</div>
            <div style={styles.emptyText}>Please select a child from the dashboard</div>
            <button 
              style={{...styles.backButton, marginTop: '16px'}} 
              onClick={() => navigate('/parent')}
            >
              ← Back to Dashboard
            </button>
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
              <h1 style={styles.title}>📊 Math Skills Progress</h1>
              <p style={styles.subtitle}>{childInfo?.studentName || 'Student'}</p>
            </div>
            <button
              style={styles.backButton}
              onClick={() => navigate('/parent/children')}
              onMouseEnter={(e) => (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => (e.target.style.background = '#6b7280')}
            >
              ← Back to Children
            </button>
          </div>

          <p style={styles.description}>
            Track progress in the 4 core math operations. Skills improve automatically as your child completes quizzes! Each skill has 6 levels (0-5) based on points earned.
          </p>

          {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

          <div style={styles.infoBox}>
            <div style={styles.infoText}>
              🎯 {childInfo?.studentName || 'Your child'} is currently at Profile {currentProfile}. 
              {currentProfile < 6 && ' Multiplication & Division will unlock at Profile 6!'}
              <br />
              💡 Points-based leveling: Level 0 (0-24pts) → Level 1 (25-49pts) → Level 2 (50-99pts) → Level 3 (100-199pts) → Level 4 (200-399pts) → Level 5 (400+pts)
            </div>
          </div>
        </div>

        {skills.length > 0 ? (
          <div style={styles.skillsGrid}>
            {skills.map((skill, idx) => {
              const pct = Number.isFinite(skill.percentage)
                ? skill.percentage
                : Number.isFinite(skill.xp)
                ? skill.xp
                : 0;

              const color = getSkillColor(skill.current_level, skill.max_level);
              const levelInfo = getSkillLevel(skill.current_level);

              // Lock rule by profile: ×/÷ locked below 6
              const isAdvanced = ['Multiplication', 'Division'].includes(skill.skill_name);
              const isLocked = isAdvanced && currentProfile < 6;

              return (
                <div 
                  key={idx} 
                  style={styles.skillCard}
                  onMouseEnter={(e) => !isLocked && (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isLocked && (
                    <div style={styles.lockedOverlay}>
                      <div style={styles.lockIcon}>🔒</div>
                      <div style={styles.lockText}>
                        Unlocks at Profile 6
                        <br />
                        Keep practicing!
                      </div>
                    </div>
                  )}

                  <div style={styles.skillHeader}>
                    <div style={styles.skillIcon}>{getSkillIcon(skill.skill_name)}</div>
                    <div style={styles.skillName}>{skill.skill_name}</div>
                  </div>

                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.max(0, Math.min(100, pct))}%`,
                        background: color,
                      }}
                    />
                  </div>

                  <div style={styles.row}>
                    <span>
                      Level {skill.current_level} / {skill.max_level}
                    </span>
                    <span>{Math.max(0, Math.min(100, pct))}%</span>
                  </div>

                  <div style={{ ...styles.badge, background: levelInfo.color }}>{levelInfo.label}</div>
                  <div style={styles.xp}>Level Range: {getLevelPointRange(skill.current_level)} points</div>
                  <div style={{
                    marginTop: "4px",
                    fontSize: "14px",
                    color: "#3b82f6",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    🎯 Current Points: {skill.points || 0}
                  </div>
                  {skill.current_level < 5 && (
                    <div style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#6b7280",
                      fontStyle: "italic"
                    }}>
                      Next level at {getNextLevelThreshold(skill.current_level)} points
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <div style={styles.emptyTitle}>No Skills Data Yet</div>
            <div style={styles.emptyText}>
              Skills will be tracked once {childInfo?.studentName || 'your child'} completes quizzes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}