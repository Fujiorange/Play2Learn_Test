import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

// Condition types for the dropdown
const conditionTypes = [
  { value: 'attempt', label: 'Attempt', description: 'Student attempts a certain number of activities' },
  { value: 'score', label: 'Score', description: 'Student achieves a specific score' },
  { value: 'streak', label: 'Login Streak', description: 'Student logs in consecutively' },
  { value: 'points', label: 'Points Earned', description: 'Student earns total points' }
];

// Activity types based on condition
const activityTypes = {
  attempt: [
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' }
  ],
  score: [
    { value: 'perfect', label: 'Perfect Score (100%)' },
    { value: 'high', label: 'High Score (90%+)' }
  ]
};

const rarityLevels = [
  { value: 'common', label: 'Common', color: '#6b7280' },
  { value: 'rare', label: 'Rare', color: '#3b82f6' },
  { value: 'epic', label: 'Epic', color: '#8b5cf6' },
  { value: 'legendary', label: 'Legendary', color: '#f59e0b' }
];

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
    name: '',
    description: '',
    icon: '🏆',
    conditionType: 'attempt',
    activityType: 'quiz',
    conditionValue: 1,
    rarity: 'common',
    isActive: true
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') {
      navigate('/login');
      return;
    }
    loadBadges();
  }, [navigate]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getBadges();
      if (result.success) {
        setBadges(result.badges || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load badges' });
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      setMessage({ type: 'error', text: 'Failed to load badges' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      conditionType: 'attempt',
      activityType: 'quiz',
      conditionValue: 1,
      rarity: 'common',
      isActive: true
    });
  };

  const handleConditionChange = (conditionType) => {
    let defaultActivity = '';
    if (conditionType === 'attempt') {
      defaultActivity = 'quiz';
    } else if (conditionType === 'score') {
      defaultActivity = 'perfect';
    }
    setFormData({ ...formData, conditionType, activityType: defaultActivity });
  };

  const getConditionDescription = () => {
    const { conditionType, activityType, conditionValue } = formData;
    if (conditionType === 'attempt') {
      return `Complete ${conditionValue} ${activityType}${conditionValue > 1 ? 'zes' : ''}`;
    } else if (conditionType === 'score') {
      const scoreType = activityType === 'perfect' ? '100%' : '90%+';
      return `Score ${scoreType} on ${conditionValue} quiz${conditionValue > 1 ? 'zes' : ''}`;
    } else if (conditionType === 'streak') {
      return `Login ${conditionValue} day${conditionValue > 1 ? 's' : ''} in a row`;
    } else if (conditionType === 'points') {
      return `Earn ${conditionValue} total points`;
    }
    return '';
  };

  const handleCreateBadge = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in name and description' });
      return;
    }
    try {
      const result = await schoolAdminService.createBadge(formData);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${formData.name}" created!` });
        setShowCreateModal(false);
        resetForm();
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEditBadge = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in name and description' });
      return;
    }
    try {
      const result = await schoolAdminService.updateBadge(selectedBadge._id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${formData.name}" updated!` });
        setShowEditModal(false);
        setSelectedBadge(null);
        resetForm();
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteBadge = async () => {
    try {
      const result = await schoolAdminService.deleteBadge(selectedBadge._id);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${selectedBadge.name}" deleted!` });
        setShowDeleteModal(false);
        setSelectedBadge(null);
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleActive = async (badge) => {
    try {
      const result = await schoolAdminService.toggleBadge(badge._id);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${badge.name}" ${result.isActive ? 'enabled' : 'disabled'}!` });
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openEditModal = (badge) => {
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      conditionType: badge.conditionType || 'attempt',
      activityType: badge.activityType || 'quiz',
      conditionValue: badge.criteriaValue || 1,
      rarity: badge.rarity || 'common',
      isActive: badge.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'common': return 'badge-rarity-common';
      case 'rare': return 'badge-rarity-rare';
      case 'epic': return 'badge-rarity-epic';
      case 'legendary': return 'badge-rarity-legendary';
      default: return 'badge-rarity-common';
    }
  };

  const formatConditionDisplay = (badge) => {
    const { conditionType, activityType, criteriaValue } = badge;
    if (conditionType === 'attempt') {
      return `${criteriaValue} ${activityType === 'quiz' ? 'Quiz' : 'Assignment'}${criteriaValue > 1 ? 'zes' : ''}`;
    } else if (conditionType === 'score') {
      return `${criteriaValue} ${activityType === 'perfect' ? 'Perfect' : 'High'} Score${criteriaValue > 1 ? 's' : ''}`;
    } else if (conditionType === 'streak') {
      return `${criteriaValue} Day Streak`;
    } else if (conditionType === 'points') {
      return `${criteriaValue} Points`;
    }
    return `${criteriaValue} ${badge.criteriaType || 'Unknown'}`;
  };

  const totalEarned = badges.reduce((sum, b) => sum + (b.earnedCount || 0), 0);
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
            <p className="sa-page-subtitle">Create and manage badges that students can earn</p>
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
              <div key={badge._id} className={`sa-card badge-card ${!badge.isActive ? 'badge-card-disabled' : ''}`}>
                <div className="badge-card-header">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-info">
                    <h3 className="badge-name">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                  </div>
                </div>
                <div className="badge-meta">
                  <span className={`sa-badge ${getRarityClass(badge.rarity)}`} style={{ textTransform: 'capitalize' }}>{badge.rarity}</span>
                  <span className="sa-badge sa-badge-primary">{formatConditionDisplay(badge)}</span>
                  <span className="sa-badge sa-badge-success">👥 {badge.earnedCount || 0} earned</span>
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
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h2 className="sa-modal-title">🏆 Create New Badge</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Badge Name *</label>
              <input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Quiz Master" />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Complete 20 quizzes" style={{ minHeight: '70px' }} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Icon</label>
              <div className="icon-grid">
                {badgeIcons.map((icon) => (
                  <div key={icon} className={`icon-option ${formData.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setFormData({ ...formData, icon })}>{icon}</div>
                ))}
              </div>
            </div>

            {/* Condition Type Dropdown */}
            <div className="sa-form-group">
              <label className="sa-label">Condition Type</label>
              <select className="sa-select" value={formData.conditionType} onChange={(e) => handleConditionChange(e.target.value)}>
                {conditionTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <p className="criteria-help">{conditionTypes.find(c => c.value === formData.conditionType)?.description}</p>
            </div>

            {/* Activity Type Dropdown (shown for attempt and score) */}
            {(formData.conditionType === 'attempt' || formData.conditionType === 'score') && (
              <div className="sa-form-group">
                <label className="sa-label">{formData.conditionType === 'attempt' ? 'Activity Type' : 'Score Type'}</label>
                <select className="sa-select" value={formData.activityType} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}>
                  {activityTypes[formData.conditionType]?.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Condition Value */}
            <div className="sa-form-group">
              <label className="sa-label">
                {formData.conditionType === 'attempt' ? 'Number of Attempts' : 
                 formData.conditionType === 'score' ? 'Number of Times' :
                 formData.conditionType === 'streak' ? 'Days in a Row' : 'Points Required'}
              </label>
              <input type="number" className="sa-input" min="1" value={formData.conditionValue} onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 1 })} />
              <p className="criteria-help" style={{ marginTop: '8px', color: '#10b981', fontStyle: 'normal' }}>
                Preview: {getConditionDescription()}
              </p>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Rarity</label>
              <select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                {rarityLevels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleCreateBadge}>Create Badge</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Badge Modal */}
      {showEditModal && selectedBadge && (
        <div className="sa-modal" onClick={() => setShowEditModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h2 className="sa-modal-title">✏️ Edit Badge</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Badge Name *</label>
              <input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '70px' }} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Icon</label>
              <div className="icon-grid">
                {badgeIcons.map((icon) => (
                  <div key={icon} className={`icon-option ${formData.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setFormData({ ...formData, icon })}>{icon}</div>
                ))}
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Condition Type</label>
              <select className="sa-select" value={formData.conditionType} onChange={(e) => handleConditionChange(e.target.value)}>
                {conditionTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {(formData.conditionType === 'attempt' || formData.conditionType === 'score') && (
              <div className="sa-form-group">
                <label className="sa-label">{formData.conditionType === 'attempt' ? 'Activity Type' : 'Score Type'}</label>
                <select className="sa-select" value={formData.activityType} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}>
                  {activityTypes[formData.conditionType]?.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sa-form-group">
              <label className="sa-label">
                {formData.conditionType === 'attempt' ? 'Number of Attempts' : 
                 formData.conditionType === 'score' ? 'Number of Times' :
                 formData.conditionType === 'streak' ? 'Days in a Row' : 'Points Required'}
              </label>
              <input type="number" className="sa-input" min="1" value={formData.conditionValue} onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 1 })} />
              <p className="criteria-help" style={{ marginTop: '8px', color: '#10b981', fontStyle: 'normal' }}>
                Preview: {getConditionDescription()}
              </p>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Rarity</label>
              <select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                {rarityLevels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleEditBadge}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBadge && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Badge</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedBadge.name}"</strong>?
              <br /><br />
              This badge has been earned by <strong>{selectedBadge.earnedCount || 0} students</strong>. This action cannot be undone.
            </p>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="sa-modal-button-danger" onClick={handleDeleteBadge}>Delete Badge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}