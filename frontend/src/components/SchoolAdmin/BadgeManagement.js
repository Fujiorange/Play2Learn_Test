import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

// Criteria categories for the dropdown
const criteriaCategories = [
  { value: 'attempt', label: 'Attempt', description: 'Number of attempts' },
  { value: 'score', label: 'Score', description: 'Based on score achieved' },
  { value: 'streak', label: 'Streak', description: 'Login streak days' },
  { value: 'points', label: 'Points', description: 'Total points earned' }
];

// Targets based on category
const criteriaTargets = {
  attempt: [
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' }
  ],
  score: [
    { value: 'perfect', label: 'Perfect Score (100%)' },
    { value: 'high', label: 'High Score (90%+)' }
  ],
  streak: [
    { value: 'login', label: 'Login Days' }
  ],
  points: [
    { value: 'earned', label: 'Points Earned' }
  ]
};

// Map to backend criteria types
const getCriteriaType = (category, target) => {
  const mapping = {
    'attempt_quiz': 'quizzes_completed',
    'attempt_assignment': 'assignments_completed',
    'score_perfect': 'perfect_scores',
    'score_high': 'high_scores',
    'streak_login': 'login_streak',
    'points_earned': 'points_earned'
  };
  return mapping[`${category}_${target}`] || 'quizzes_completed';
};

// Reverse map from criteria type to category/target
const parseCriteriaType = (criteriaType) => {
  const reverseMapping = {
    'quizzes_completed': { category: 'attempt', target: 'quiz' },
    'assignments_completed': { category: 'attempt', target: 'assignment' },
    'perfect_scores': { category: 'score', target: 'perfect' },
    'high_scores': { category: 'score', target: 'high' },
    'login_streak': { category: 'streak', target: 'login' },
    'points_earned': { category: 'points', target: 'earned' },
    // Support old criteria types
    'quiz_count': { category: 'attempt', target: 'quiz' },
    'assignment_count': { category: 'attempt', target: 'assignment' },
    'perfect_score': { category: 'score', target: 'perfect' },
    'high_score_count': { category: 'score', target: 'high' },
    'total_points': { category: 'points', target: 'earned' }
  };
  return reverseMapping[criteriaType] || { category: 'attempt', target: 'quiz' };
};

const getCriteriaLabel = (criteriaType) => {
  const labels = {
    'quizzes_completed': 'Quizzes Completed',
    'assignments_completed': 'Assignments Completed',
    'perfect_scores': 'Perfect Scores',
    'high_scores': 'High Scores (90%+)',
    'login_streak': 'Login Streak Days',
    'points_earned': 'Points Earned',
    'quiz_count': 'Quizzes Completed',
    'assignment_count': 'Assignments Completed',
    'perfect_score': 'Perfect Scores',
    'high_score_count': 'High Scores (90%+)',
    'total_points': 'Points Earned'
  };
  return labels[criteriaType] || criteriaType;
};

const rarityLevels = ['common', 'rare', 'epic', 'legendary'];
const rarityLabels = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
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
  
  // Form state with category-based criteria
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    icon: '🌟', 
    criteriaCategory: 'attempt',
    criteriaTarget: 'quiz',
    criteriaValue: 1, 
    rarity: 'common', 
    isActive: true
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') { navigate('/login'); return; }
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
      icon: '🌟', 
      criteriaCategory: 'attempt',
      criteriaTarget: 'quiz',
      criteriaValue: 1, 
      rarity: 'common', 
      isActive: true 
    });
  };

  const handleCategoryChange = (category) => {
    const targets = criteriaTargets[category];
    setFormData({ 
      ...formData, 
      criteriaCategory: category,
      criteriaTarget: targets && targets[0] ? targets[0].value : ''
    });
  };

  const handleCreateBadge = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    try {
      const criteriaType = getCriteriaType(formData.criteriaCategory, formData.criteriaTarget);
      const badgeData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        criteriaType: criteriaType,
        criteriaTarget: formData.criteriaTarget,
        criteriaValue: formData.criteriaValue,
        rarity: formData.rarity,
        isActive: formData.isActive
      };
      
      const result = await schoolAdminService.createBadge(badgeData);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${formData.name}" created successfully!` });
        setShowCreateModal(false);
        resetForm();
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create badge' });
      }
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
      const criteriaType = getCriteriaType(formData.criteriaCategory, formData.criteriaTarget);
      const badgeData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        criteriaType: criteriaType,
        criteriaTarget: formData.criteriaTarget,
        criteriaValue: formData.criteriaValue,
        rarity: formData.rarity,
        isActive: formData.isActive
      };
      
      const result = await schoolAdminService.updateBadge(selectedBadge._id, badgeData);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${formData.name}" updated successfully!` });
        setShowEditModal(false);
        setSelectedBadge(null);
        resetForm();
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update badge' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update badge' });
    }
  };

  const handleDeleteBadge = async () => {
    try {
      const result = await schoolAdminService.deleteBadge(selectedBadge._id);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${selectedBadge.name}" deleted successfully!` });
        setShowDeleteModal(false);
        setSelectedBadge(null);
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete badge' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete badge' });
    }
  };

  const handleToggleActive = async (badge) => {
    try {
      const result = await schoolAdminService.toggleBadge(badge._id);
      if (result.success) {
        setMessage({ type: 'success', text: `Badge "${badge.name}" ${result.isActive ? 'enabled' : 'disabled'} successfully!` });
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle badge' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle badge' });
    }
  };

  const openEditModal = (badge) => {
    setSelectedBadge(badge);
    const parsed = parseCriteriaType(badge.criteriaType);
    setFormData({ 
      name: badge.name, 
      description: badge.description, 
      icon: badge.icon, 
      criteriaCategory: parsed.category,
      criteriaTarget: parsed.target,
      criteriaValue: badge.criteriaValue, 
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
    const rarityLower = (rarity || 'common').toLowerCase();
    switch (rarityLower) {
      case 'common': return 'badge-rarity-common';
      case 'rare': return 'badge-rarity-rare';
      case 'epic': return 'badge-rarity-epic';
      case 'legendary': return 'badge-rarity-legendary';
      default: return 'badge-rarity-common';
    }
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
              <div key={badge._id} className={`sa-card badge-card ${!badge.isActive ? 'badge-card-disabled' : ''}`}>
                <div className="badge-card-header">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-info">
                    <h3 className="badge-name">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                  </div>
                </div>
                <div className="badge-meta">
                  <span className={`sa-badge ${getRarityClass(badge.rarity)}`}>{rarityLabels[badge.rarity] || badge.rarity}</span>
                  <span className="sa-badge sa-badge-primary">{getCriteriaLabel(badge.criteriaType)}: {badge.criteriaValue}</span>
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
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🏆 Create New Badge</h2>
            <div className="sa-form-group">
              <label className="sa-label">Badge Name *</label>
              <input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Quiz Master" />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Complete 20 quizzes" style={{ minHeight: '80px' }} />
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
              <label className="sa-label">Criteria Type</label>
              <select className="sa-select" value={formData.criteriaCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                {criteriaCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <p className="criteria-help">{criteriaCategories.find(c => c.value === formData.criteriaCategory)?.description}</p>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Criteria Target</label>
              <select className="sa-select" value={formData.criteriaTarget} onChange={(e) => setFormData({ ...formData, criteriaTarget: e.target.value })}>
                {(criteriaTargets[formData.criteriaCategory] || []).map((target) => (
                  <option key={target.value} value={target.value}>{target.label}</option>
                ))}
              </select>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Required Value (number)</label>
              <input type="number" className="sa-input" min="1" value={formData.criteriaValue} onChange={(e) => setFormData({ ...formData, criteriaValue: parseInt(e.target.value) || 1 })} />
              <p className="criteria-help">How many times must the student achieve this?</p>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Rarity</label>
              <select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                {rarityLevels.map((level) => (
                  <option key={level} value={level}>{rarityLabels[level]}</option>
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
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">✏️ Edit Badge</h2>
            <div className="sa-form-group">
              <label className="sa-label">Badge Name *</label>
              <input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '80px' }} />
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
              <label className="sa-label">Criteria Type</label>
              <select className="sa-select" value={formData.criteriaCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                {criteriaCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <p className="criteria-help">{criteriaCategories.find(c => c.value === formData.criteriaCategory)?.description}</p>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Criteria Target</label>
              <select className="sa-select" value={formData.criteriaTarget} onChange={(e) => setFormData({ ...formData, criteriaTarget: e.target.value })}>
                {(criteriaTargets[formData.criteriaCategory] || []).map((target) => (
                  <option key={target.value} value={target.value}>{target.label}</option>
                ))}
              </select>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Required Value (number)</label>
              <input type="number" className="sa-input" min="1" value={formData.criteriaValue} onChange={(e) => setFormData({ ...formData, criteriaValue: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Rarity</label>
              <select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                {rarityLevels.map((level) => (
                  <option key={level} value={level}>{rarityLabels[level]}</option>
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
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Are you sure you want to delete <strong>"{selectedBadge.name}"</strong>?<br /><br />This badge has been earned by <strong>{selectedBadge.earnedCount || 0} students</strong>. This action cannot be undone.</p>
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