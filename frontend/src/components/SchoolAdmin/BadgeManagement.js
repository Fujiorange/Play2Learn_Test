import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

// Default badges that auto-unlock based on student activity
const defaultBadges = [
  { id: 'badge_1', name: 'First Steps', description: 'Complete your first quiz', icon: '🌟', criteriaType: 'quiz_count', criteriaValue: 1, rarity: 'Common', isActive: true, earnedCount: 12, createdAt: new Date('2026-01-01') },
  { id: 'badge_2', name: 'Streak Master', description: 'Login 7 days in a row', icon: '🔥', criteriaType: 'login_streak', criteriaValue: 7, rarity: 'Rare', isActive: true, earnedCount: 5, createdAt: new Date('2026-01-01') },
  { id: 'badge_3', name: 'Perfect Score', description: 'Score 100% on any quiz', icon: '💯', criteriaType: 'perfect_score', criteriaValue: 1, rarity: 'Epic', isActive: true, earnedCount: 3, createdAt: new Date('2026-01-01') },
  { id: 'badge_4', name: 'High Achiever', description: 'Score 90% or higher on 5 quizzes', icon: '📈', criteriaType: 'high_score_count', criteriaValue: 5, rarity: 'Rare', isActive: true, earnedCount: 7, createdAt: new Date('2026-01-01') },
  { id: 'badge_5', name: 'Fast Learner', description: 'Complete 10 quizzes', icon: '🚀', criteriaType: 'quiz_count', criteriaValue: 10, rarity: 'Common', isActive: true, earnedCount: 8, createdAt: new Date('2026-01-01') },
  { id: 'badge_6', name: 'Math Champion', description: 'Score 90% or higher on 10 quizzes', icon: '👑', criteriaType: 'high_score_count', criteriaValue: 10, rarity: 'Legendary', isActive: true, earnedCount: 1, createdAt: new Date('2026-01-01') }
];

const criteriaTypes = [
  { value: 'quiz_count', label: 'Quizzes Completed', description: 'Student completes X quizzes' },
  { value: 'login_streak', label: 'Login Streak', description: 'Student logs in X days in a row' },
  { value: 'perfect_score', label: 'Perfect Scores', description: 'Student scores 100% on X quizzes' },
  { value: 'high_score_count', label: 'High Scores (90%+)', description: 'Student scores 90%+ on X quizzes' },
  { value: 'total_points', label: 'Total Points Earned', description: 'Student earns X total points' },
  { value: 'assignment_count', label: 'Assignments Completed', description: 'Student completes X assignments' }
];

const rarityLevels = ['Common', 'Rare', 'Epic', 'Legendary'];
const badgeIcons = ['🌟', '🔥', '💯', '📈', '🚀', '👑', '🏆', '💎', '⭐', '🎯', '🎓', '📚', '✨', '🥇', '🥈', '🥉', '🎖️', '🏅'];

export default function BadgeManagement() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', icon: '🌟', criteriaType: 'quiz_count', criteriaValue: 1, rarity: 'Common', isActive: true
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') { navigate('/login'); return; }
    loadBadges();
  }, [navigate]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call when backend is ready
      // const result = await schoolAdminService.getBadges();
      // if (result.success) setBadges(result.badges);
      await new Promise(resolve => setTimeout(resolve, 500));
      setBadges(defaultBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
      setMessage({ type: 'error', text: 'Failed to load badges' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '🌟', criteriaType: 'quiz_count', criteriaValue: 1, rarity: 'Common', isActive: true });
  };

  const handleCreateBadge = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    try {
      // TODO: const result = await schoolAdminService.createBadge(formData);
      const newBadge = { id: `badge_${Date.now()}`, ...formData, earnedCount: 0, createdAt: new Date() };
      setBadges([...badges, newBadge]);
      setMessage({ type: 'success', text: `Badge "${formData.name}" created successfully!` });
      setShowCreateModal(false);
      resetForm();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create badge' });
    }
  };

  const handleEditBadge = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    try {
      // TODO: await schoolAdminService.updateBadge(selectedBadge.id, formData);
      setBadges(badges.map(b => b.id === selectedBadge.id ? { ...b, ...formData } : b));
      setMessage({ type: 'success', text: `Badge "${formData.name}" updated successfully!` });
      setShowEditModal(false);
      setSelectedBadge(null);
      resetForm();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update badge' });
    }
  };

  const handleDeleteBadge = async () => {
    try {
      // TODO: await schoolAdminService.deleteBadge(selectedBadge.id);
      setBadges(badges.filter(b => b.id !== selectedBadge.id));
      setMessage({ type: 'success', text: `Badge "${selectedBadge.name}" deleted successfully!` });
      setShowDeleteModal(false);
      setSelectedBadge(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete badge' });
    }
  };

  const handleToggleActive = (badge) => {
    setBadges(badges.map(b => b.id === badge.id ? { ...b, isActive: !b.isActive } : b));
    setMessage({ type: 'success', text: `Badge "${badge.name}" ${badge.isActive ? 'disabled' : 'enabled'} successfully!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openEditModal = (badge) => {
    setSelectedBadge(badge);
    setFormData({ name: badge.name, description: badge.description, icon: badge.icon, criteriaType: badge.criteriaType, criteriaValue: badge.criteriaValue, rarity: badge.rarity, isActive: badge.isActive });
    setShowEditModal(true);
  };

  const openDeleteModal = (badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'Common': return 'badge-rarity-common';
      case 'Rare': return 'badge-rarity-rare';
      case 'Epic': return 'badge-rarity-epic';
      case 'Legendary': return 'badge-rarity-legendary';
      default: return 'badge-rarity-common';
    }
  };

  const totalEarned = badges.reduce((sum, b) => sum + b.earnedCount, 0);
  const activeBadges = badges.filter(b => b.isActive).length;

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading badges...</div></div>;
  }

  return (
    <div className="sa-container">
      {/* Header */}
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        {/* Page Header */}
        <div className="badge-page-header">
          <div>
            <h1 className="sa-page-title">🏆 Badge Management</h1>
            <p className="sa-page-subtitle">Create and manage badges that students can earn automatically</p>
          </div>
          <button className="sa-button-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>+ Create Badge</button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Stats Row */}
        <div className="sa-stats-grid">
          <div className="sa-stat-card"><div className="sa-stat-icon">🏆</div><p className="sa-stat-label">Total Badges</p><p className="sa-stat-value">{badges.length}</p></div>
          <div className="sa-stat-card"><div className="sa-stat-icon">✅</div><p className="sa-stat-label">Active Badges</p><p className="sa-stat-value">{activeBadges}</p></div>
          <div className="sa-stat-card"><div className="sa-stat-icon">👥</div><p className="sa-stat-label">Total Times Earned</p><p className="sa-stat-value">{totalEarned}</p></div>
        </div>

        {/* Badge Grid */}
        {badges.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No badges yet</p>
            <p style={{ color: '#9ca3af' }}>Create your first badge to get started</p>
          </div>
        ) : (
          <div className="badge-grid">
            {badges.map((badge) => (
              <div key={badge.id} className={`sa-card badge-card ${!badge.isActive ? 'badge-card-disabled' : ''}`}>
                <div className="badge-card-header">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-info">
                    <h3 className="badge-name">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                  </div>
                </div>
                <div className="badge-meta">
                  <span className={`sa-badge ${getRarityClass(badge.rarity)}`}>{badge.rarity}</span>
                  <span className="sa-badge sa-badge-primary">{criteriaTypes.find(c => c.value === badge.criteriaType)?.label}: {badge.criteriaValue}</span>
                  <span className="sa-badge sa-badge-success">👥 {badge.earnedCount} earned</span>
                </div>
                <div className="badge-actions">
                  <button className={badge.isActive ? 'sa-button-disable' : 'sa-button-enable'} onClick={() => handleToggleActive(badge)}>{badge.isActive ? 'Disable' : 'Enable'}</button>
                  <button className="sa-button-action" onClick={() => openEditModal(badge)}>Edit</button>
                  <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(badge)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Badge Modal */}
      {showCreateModal && (
        <div className="sa-modal" onClick={() => setShowCreateModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🏆 Create New Badge</h2>
            <div className="sa-form-group"><label className="sa-label">Badge Name *</label><input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Quiz Master" /></div>
            <div className="sa-form-group"><label className="sa-label">Description *</label><textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Complete 20 quizzes" style={{ minHeight: '80px' }} /></div>
            <div className="sa-form-group"><label className="sa-label">Icon</label><div className="icon-grid">{badgeIcons.map((icon) => (<div key={icon} className={`icon-option ${formData.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setFormData({ ...formData, icon })}>{icon}</div>))}</div></div>
            <div className="sa-form-group"><label className="sa-label">Unlock Criteria</label><select className="sa-select" value={formData.criteriaType} onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}>{criteriaTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}</select><p className="criteria-help">{criteriaTypes.find(c => c.value === formData.criteriaType)?.description}</p></div>
            <div className="sa-form-group"><label className="sa-label">Criteria Value</label><input type="number" className="sa-input" min="1" value={formData.criteriaValue} onChange={(e) => setFormData({ ...formData, criteriaValue: parseInt(e.target.value) || 1 })} /></div>
            <div className="sa-form-group"><label className="sa-label">Rarity</label><select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>{rarityLevels.map((level) => (<option key={level} value={level}>{level}</option>))}</select></div>
            <div className="sa-modal-buttons"><button className="sa-modal-button-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button><button className="sa-modal-button-confirm" onClick={handleCreateBadge}>Create Badge</button></div>
          </div>
        </div>
      )}

      {/* Edit Badge Modal */}
      {showEditModal && selectedBadge && (
        <div className="sa-modal" onClick={() => setShowEditModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">✏️ Edit Badge</h2>
            <div className="sa-form-group"><label className="sa-label">Badge Name *</label><input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="sa-form-group"><label className="sa-label">Description *</label><textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '80px' }} /></div>
            <div className="sa-form-group"><label className="sa-label">Icon</label><div className="icon-grid">{badgeIcons.map((icon) => (<div key={icon} className={`icon-option ${formData.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setFormData({ ...formData, icon })}>{icon}</div>))}</div></div>
            <div className="sa-form-group"><label className="sa-label">Unlock Criteria</label><select className="sa-select" value={formData.criteriaType} onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}>{criteriaTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}</select><p className="criteria-help">{criteriaTypes.find(c => c.value === formData.criteriaType)?.description}</p></div>
            <div className="sa-form-group"><label className="sa-label">Criteria Value</label><input type="number" className="sa-input" min="1" value={formData.criteriaValue} onChange={(e) => setFormData({ ...formData, criteriaValue: parseInt(e.target.value) || 1 })} /></div>
            <div className="sa-form-group"><label className="sa-label">Rarity</label><select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>{rarityLevels.map((level) => (<option key={level} value={level}>{level}</option>))}</select></div>
            <div className="sa-modal-buttons"><button className="sa-modal-button-cancel" onClick={() => setShowEditModal(false)}>Cancel</button><button className="sa-modal-button-confirm" onClick={handleEditBadge}>Save Changes</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBadge && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Badge</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Are you sure you want to delete <strong>"{selectedBadge.name}"</strong>?<br /><br />This badge has been earned by <strong>{selectedBadge.earnedCount} students</strong>. This action cannot be undone.</p>
            <div className="sa-modal-buttons"><button className="sa-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button><button className="sa-modal-button-danger" onClick={handleDeleteBadge}>Delete Badge</button></div>
          </div>
        </div>
      )}
    </div>
  );
}