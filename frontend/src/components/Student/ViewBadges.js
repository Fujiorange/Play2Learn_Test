// frontend/src/components/Student/ViewBadges.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function ViewBadges() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const rarityConfig = {
    common: { label: 'Common', color: '#6b7280', bg: '#f3f4f6', border: '#9ca3af' },
    rare: { label: 'Rare', color: '#3b82f6', bg: '#eff6ff', border: '#60a5fa' },
    epic: { label: 'Epic', color: '#8b5cf6', bg: '#f5f3ff', border: '#a78bfa' },
    legendary: { label: 'Legendary', color: '#f59e0b', bg: '#fffbeb', border: '#fbbf24' }
  };

  const criteriaLabels = {
    quizzes_completed: 'Quizzes Completed',
    login_streak: 'Login Streak (days)',
    perfect_scores: 'Perfect Scores',
    high_scores: 'High Scores (90%+)',
    points_earned: 'Total Points Earned'
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      const [badgesResult, progressResult] = await Promise.all([
        studentService.getBadges(),
        studentService.getBadgeProgress()
      ]);

      if (badgesResult.success) {
        setBadges(badgesResult.badges || []);
        setEarnedBadges(badgesResult.earnedBadges || []);
      }

      if (progressResult.success) {
        setProgress(progressResult.progress || {});
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badgeId) => {
    return earnedBadges.some(b => b.badge_id === badgeId);
  };

  const getBadgeProgress = (badge) => {
    const current = progress[badge.criteriaType] || 0;
    const required = badge.criteriaValue;
    const percentage = Math.min(100, (current / required) * 100);
    return { current, required, percentage };
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setShowModal(true);
  };

  const getEarnedBadgeInfo = (badgeId) => {
    return earnedBadges.find(b => b.badge_id === badgeId);
  };

  const filteredBadges = selectedRarity === 'all' 
    ? badges 
    : badges.filter(badge => badge.rarity === selectedRarity);

  const earnedCount = badges.filter(b => isBadgeEarned(b._id)).length;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading badges...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoArea}>
            <div style={styles.logo}>P</div>
            <h1 style={styles.logoText}>Play2Learn</h1>
          </div>
          <div style={styles.userArea}>
            <div style={styles.statsBadge}>
              <span style={styles.statsIcon}>🏆</span>
              <span style={styles.statsText}>{earnedCount}/{badges.length} Earned</span>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/student')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.titleSection}>
          <div>
            <h2 style={styles.pageTitle}>🏆 My Badge Collection</h2>
            <p style={styles.pageSubtitle}>Earn badges by completing achievements!</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div style={styles.progressOverview}>
          <h3 style={styles.progressTitle}>Your Progress</h3>
          <div style={styles.progressGrid}>
            {Object.entries(criteriaLabels).map(([key, label]) => (
              <div key={key} style={styles.progressCard}>
                <div style={styles.progressLabel}>{label}</div>
                <div style={styles.progressValue}>{progress[key] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rarity Filter */}
        <div style={styles.filterSection}>
          <button 
            style={{...styles.filterButton, ...(selectedRarity === 'all' ? styles.filterButtonActive : {})}}
            onClick={() => setSelectedRarity('all')}
          >
            All Badges ({badges.length})
          </button>
          {Object.entries(rarityConfig).map(([key, config]) => (
            <button 
              key={key}
              style={{
                ...styles.filterButton, 
                ...(selectedRarity === key ? {...styles.filterButtonActive, backgroundColor: config.color} : {})
              }}
              onClick={() => setSelectedRarity(key)}
            >
              {config.label} ({badges.filter(b => b.rarity === key).length})
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🏆</p>
            <p style={styles.emptyTitle}>No badges in this category</p>
            <p style={styles.emptySubtitle}>Try selecting a different rarity!</p>
          </div>
        ) : (
          <div style={styles.badgesGrid}>
            {filteredBadges.map(badge => {
              const earned = isBadgeEarned(badge._id);
              const earnedInfo = getEarnedBadgeInfo(badge._id);
              const badgeProgress = getBadgeProgress(badge);
              const rarity = rarityConfig[badge.rarity] || rarityConfig.common;

              return (
                <div 
                  key={badge._id} 
                  style={{
                    ...styles.badgeCard,
                    borderColor: rarity.border,
                    opacity: earned ? 1 : 0.7,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleBadgeClick(badge)}
                >
                  {/* Rarity Badge */}
                  <div style={{
                    ...styles.rarityBadge,
                    backgroundColor: rarity.bg,
                    color: rarity.color
                  }}>
                    {rarity.label}
                  </div>

                  {/* Badge Icon with Lock Overlay */}
                  <div style={styles.badgeIconContainer}>
                    {earned ? (
                      <>
                        <div style={styles.badgeIcon}>{badge.icon}</div>
                        <div style={styles.earnedBadge}>✓</div>
                      </>
                    ) : (
                      <>
                        <div style={{...styles.badgeIcon, filter: 'grayscale(100%)', opacity: 0.5}}>
                          {badge.icon}
                        </div>
                        <div style={styles.lockedOverlay}>🔒</div>
                      </>
                    )}
                  </div>

                  {/* Badge Info */}
                  <h3 style={styles.badgeName}>{badge.name}</h3>
                  <p style={styles.badgeDescription}>{badge.description}</p>

                  {/* Criteria */}
                  <div style={styles.criteriaSection}>
                    <div style={styles.criteriaLabel}>
                      {criteriaLabels[badge.criteriaType] || badge.criteriaType}
                    </div>
                    {earned ? (
                      <div style={styles.earnedDate}>
                        Earned: {new Date(earnedInfo.earned_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <>
                        <div style={styles.progressBar}>
                          <div style={{
                            ...styles.progressFill,
                            width: `${badgeProgress.percentage}%`,
                            backgroundColor: rarity.color
                          }}></div>
                        </div>
                        <div style={styles.progressText}>
                          {badgeProgress.current} / {badgeProgress.required}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Badge Detail Modal */}
      {showModal && selectedBadge && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const earned = isBadgeEarned(selectedBadge._id);
              const earnedInfo = getEarnedBadgeInfo(selectedBadge._id);
              const badgeProgress = getBadgeProgress(selectedBadge);
              const rarity = rarityConfig[selectedBadge.rarity] || rarityConfig.common;

              return (
                <>
                  <div style={{
                    ...styles.modalRarityBadge,
                    backgroundColor: rarity.bg,
                    color: rarity.color
                  }}>
                    {rarity.label}
                  </div>

                  <div style={styles.modalIconContainer}>
                    {earned ? (
                      <>
                        <div style={styles.modalIcon}>{selectedBadge.icon}</div>
                        <div style={styles.modalEarnedBadge}>✓ Earned</div>
                      </>
                    ) : (
                      <>
                        <div style={{...styles.modalIcon, filter: 'grayscale(100%)', opacity: 0.5}}>
                          {selectedBadge.icon}
                        </div>
                        <div style={styles.modalLockedBadge}>🔒 Locked</div>
                      </>
                    )}
                  </div>

                  <h2 style={styles.modalTitle}>{selectedBadge.name}</h2>
                  <p style={styles.modalDescription}>{selectedBadge.description}</p>

                  <div style={styles.modalDetails}>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Requirement:</span>
                      <span style={styles.modalDetailValue}>
                        {criteriaLabels[selectedBadge.criteriaType]} ≥ {selectedBadge.criteriaValue}
                      </span>
                    </div>
                    
                    {earned ? (
                      <div style={styles.modalDetailRow}>
                        <span style={styles.modalDetailLabel}>Earned On:</span>
                        <span style={styles.modalDetailValue}>
                          {new Date(earnedInfo.earned_at).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={styles.modalDetailRow}>
                          <span style={styles.modalDetailLabel}>Your Progress:</span>
                          <span style={styles.modalDetailValue}>
                            {badgeProgress.current} / {badgeProgress.required}
                          </span>
                        </div>
                        <div style={styles.modalProgressBar}>
                          <div style={{
                            ...styles.modalProgressFill,
                            width: `${badgeProgress.percentage}%`,
                            backgroundColor: rarity.color
                          }}></div>
                        </div>
                        <div style={styles.modalProgressText}>
                          {badgeProgress.percentage.toFixed(0)}% Complete
                        </div>
                      </>
                    )}
                  </div>

                  <button 
                    style={styles.modalCloseButton}
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    backgroundColor: '#fff',
    padding: '15px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: {
    margin: 0,
    fontSize: '20px',
    color: '#111827',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fef3c7',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid #fbbf24',
  },
  statsIcon: {
    fontSize: '20px',
  },
  statsText: {
    fontWeight: 'bold',
    color: '#92400e',
  },
  backButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px',
  },
  titleSection: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  pageSubtitle: {
    color: '#6b7280',
    marginTop: '8px',
  },
  progressOverview: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  progressTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  progressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  progressCard: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  progressLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  progressValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
  },
  filterSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '10px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    color: '#fff',
    borderColor: '#10b981',
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  badgeCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    border: '3px solid',
  },
  rarityBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgeIconContainer: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: '16px',
  },
  badgeIcon: {
    fontSize: '64px',
  },
  earnedBadge: {
    position: 'absolute',
    top: '0',
    right: '50%',
    transform: 'translateX(50%)',
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '32px',
  },
  badgeName: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  badgeDescription: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '16px',
  },
  criteriaSection: {
    marginTop: '16px',
  },
  criteriaLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  },
  earnedDate: {
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    margin: '0 0 16px 0',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    color: '#9ca3af',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    position: 'relative',
  },
  modalRarityBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '6px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalIconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
    position: 'relative',
  },
  modalIcon: {
    fontSize: '96px',
  },
  modalEarnedBadge: {
    marginTop: '8px',
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  modalLockedBadge: {
    marginTop: '8px',
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textAlign: 'center',
  },
  modalDescription: {
    color: '#6b7280',
    fontSize: '16px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  modalDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  modalDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  modalDetailLabel: {
    fontWeight: '600',
    color: '#6b7280',
  },
  modalDetailValue: {
    color: '#111827',
  },
  modalProgressBar: {
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '16px',
    marginBottom: '8px',
  },
  modalProgressFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  modalProgressText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
  },
  modalCloseButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingSpinner: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #10b981',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '15px',
    color: '#6b7280',
  },
};