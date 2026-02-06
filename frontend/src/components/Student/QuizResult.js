// QuizResult.js - Quiz Results with Profile Changes
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

export default function QuizResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);

  const { result, quizType, profile } = location.state || {};

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!result) {
      // No result data, redirect back
      navigate('/student/quiz/attempt');
      return;
    }

    // Show confetti if advanced or got high score
    if (result.profile_changed && result.change_type === 'advance') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (result.percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [navigate, result]);

  const getResultColor = (percentage) => {
    if (percentage >= 80) return { bg: '#d1fae5', color: '#065f46', border: '#34d399' };
    if (percentage >= 70) return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
    if (percentage >= 50) return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
    return { bg: '#fee2e2', color: '#991b1b', border: '#f87171' };
  };

  const getChangeMessage = () => {
    if (quizType === 'placement') {
      return {
        icon: '🎯',
        title: 'Placement Complete!',
        message: `You've been assigned to Profile ${result.assigned_profile}`,
        color: '#3b82f6'
      };
    }

    if (result.profile_changed) {
      if (result.change_type === 'advance') {
        return {
          icon: '🎉',
          title: 'Congratulations!',
          message: `You advanced from Profile ${result.old_profile} to Profile ${result.new_profile}!`,
          color: '#10b981'
        };
      } else if (result.change_type === 'demote') {
        return {
          icon: '📉',
          title: 'Profile Updated',
          message: `Moved from Profile ${result.old_profile} to Profile ${result.new_profile}. Keep practicing!`,
          color: '#f59e0b'
        };
      }
    } else {
      if (result.percentage >= 70) {
        if (result.new_profile === 10) {
          return {
            icon: '👑',
            title: 'Maximum Level!',
            message: `You're already at the highest profile (Profile 10)!`,
            color: '#10b981'
          };
        } else {
          return {
            icon: '✅',
            title: 'Great Job!',
            message: `You stayed at Profile ${result.new_profile}. One more 70%+ to advance!`,
            color: '#10b981'
          };
        }
      } else if (result.percentage >= 50) {
        return {
          icon: '💪',
          title: 'Keep Trying!',
          message: `You stayed at Profile ${result.new_profile}. Need 70% to advance.`,
          color: '#3b82f6'
        };
      } else {
        const failsLeft = 6 - (result.consecutive_fails || 0);
        return {
          icon: '📚',
          title: 'More Practice Needed',
          message: `Score 50%+ to avoid demotion (${failsLeft} attempts left)`,
          color: '#f59e0b'
        };
      }
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px', position: 'relative' },
    content: { maxWidth: '800px', margin: '0 auto' },
    
    confetti: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 },
    
    resultCard: { background: 'white', borderRadius: '16px', padding: '48px 32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', textAlign: 'center' },
    
    scoreCircle: { width: '200px', height: '200px', borderRadius: '50%', margin: '0 auto 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '8px solid' },
    scorePercentage: { fontSize: '64px', fontWeight: '700' },
    scoreLabel: { fontSize: '16px', fontWeight: '600', marginTop: '8px' },
    scoreFraction: { fontSize: '24px', fontWeight: '600', marginTop: '16px' },
    
    changeCard: { padding: '24px', borderRadius: '12px', marginBottom: '24px' },
    changeIcon: { fontSize: '48px', marginBottom: '16px' },
    changeTitle: { fontSize: '28px', fontWeight: '700', marginBottom: '12px' },
    changeMessage: { fontSize: '18px', fontWeight: '500', lineHeight: '1.6' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
    statBox: { padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' },
    statLabel: { fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' },
    statValue: { fontSize: '24px', fontWeight: '700', color: '#1f2937' },
    
    buttonsContainer: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
    button: { padding: '12px 32px', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    primaryButton: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' },
    secondaryButton: { background: '#6b7280', color: 'white' },
  };

  if (!result) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ ...styles.resultCard, padding: '32px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>No result data found</p>
          </div>
        </div>
      </div>
    );
  }

  const resultColors = getResultColor(result.percentage);
  const changeInfo = getChangeMessage();

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confetti}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-10px',
                left: `${Math.random() * 100}%`,
                width: '10px',
                height: '10px',
                background: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animation: `fall ${2 + Math.random() * 3}s linear forwards`,
                opacity: Math.random()
              }}
            />
          ))}
        </div>
      )}

      <div style={styles.content}>
        {/* Score Card */}
        <div style={styles.resultCard}>
          <div style={{
            ...styles.scoreCircle,
            borderColor: resultColors.border,
            background: resultColors.bg
          }}>
            <div style={{ ...styles.scorePercentage, color: resultColors.color }}>
              {result.percentage}%
            </div>
            <div style={{ ...styles.scoreLabel, color: resultColors.color }}>
              {result.percentage >= 80 ? 'Excellent!' : 
               result.percentage >= 70 ? 'Great Job!' :
               result.percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
            </div>
          </div>

          <div style={styles.scoreFraction}>
            Your Score: {result.score} / {result.total} correct
          </div>
        </div>

        {/* Profile Change Card */}
        <div style={{
          ...styles.changeCard,
          background: `${changeInfo.color}15`,
          border: `2px solid ${changeInfo.color}`
        }}>
          <div style={styles.changeIcon}>{changeInfo.icon}</div>
          <div style={{ ...styles.changeTitle, color: changeInfo.color }}>
            {changeInfo.title}
          </div>
          <div style={{ ...styles.changeMessage, color: changeInfo.color }}>
            {changeInfo.message}
          </div>
        </div>

        {/* Stats Grid */}
        {quizType !== 'placement' && (
          <div style={styles.statsGrid}>
            {result.points_earned !== undefined && (
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Points Earned</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>
                  +{result.points_earned}
                </div>
              </div>
            )}
            
            {result.consecutive_fails !== undefined && (
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Consecutive Fails</div>
                <div style={{ 
                  ...styles.statValue, 
                  color: result.consecutive_fails >= 4 ? '#ef4444' : '#6b7280' 
                }}>
                  {result.consecutive_fails} / 6
                </div>
              </div>
            )}

            <div style={styles.statBox}>
              <div style={styles.statLabel}>Current Profile</div>
              <div style={{ ...styles.statValue, color: '#3b82f6' }}>
                Profile {result.new_profile}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.buttonsContainer}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => navigate('/student')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🏠 Back to Dashboard
          </button>
          
          {quizType === 'placement' && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => navigate('/student/subjects')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              📊 View My Profile
            </button>
          )}

          {quizType === 'regular' && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => navigate('/student/results/history')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              📜 View History
            </button>
          )}
        </div>
      </div>

      {/* Confetti Animation */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}