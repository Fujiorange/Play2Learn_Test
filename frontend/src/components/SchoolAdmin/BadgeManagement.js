import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

const rarityConfig = {
  common: { label: 'Common', color: '#6b7280', bg: '#f3f4f6' },
  rare: { label: 'Rare', color: '#3b82f6', bg: '#eff6ff' },
  epic: { label: 'Epic', color: '#8b5cf6', bg: '#f5f3ff' },
  legendary: { label: 'Legendary', color: '#f59e0b', bg: '#fffbeb' }
};

const criteriaTypes = [
  { value: 'quizzes_completed', label: 'Quizzes Completed' },
  { value: 'login_streak', label: 'Login Streak (days)' },
  { value: 'perfect_scores', label: 'Perfect Scores' },
  { value: 'high_scores', label: 'High Scores (90%+)' },
  { value: 'points_earned', label: 'Total Points Earned' }
];

const iconOptions = ['🏆', '⭐', '🌟', '🔥', '💯', '🚀', '👑', '💎', '🎯', '📈', '🎓', '🏅', '🥇', '🎖️', '✨'];

export default function BadgeManagement() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', icon: '🏆', criteriaType: 'quizzes_completed', criteriaValue: 1, rarity: 'common', isActive: true
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role?.toLowerCase() !== 'school-admin') { navigate('/login'); return; }
    loadBadges();
  }, [navigate]);

  const loadBadges = async () => {
    try {
      const result = await schoolAdminService.getBadges();
      if (result.success) {
        setBadges(result.badges || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load badges' });
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '🏆', criteriaType: 'quizzes_completed', criteriaValue: 1, rarity: 'common', isActive: true });
    setEditingId(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (badge) => {
    setEditingId(badge._id);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteriaType: badge.criteriaType,
      criteriaValue: badge.criteriaValue,
      rarity: badge.rarity,
      isActive: badge.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in name and description' });
      return;
    }

    try {
      let result;
      if (editingId) {
        result = await schoolAdminService.updateBadge(editingId, formData);
      } else {
        result = await schoolAdminService.createBadge(formData);
      }

      if (result.success) {
        setMessage({ type: 'success', text: editingId ? 'Badge updated!' : 'Badge created!' });
        setShowModal(false);
        resetForm();
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save badge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async () => {
    try {
      const result = await schoolAdminService.deleteBadge(selectedBadge._id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Badge deleted!' });
        loadBadges();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete badge' });
    }
    setShowDeleteModal(false);
    setSelectedBadge(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const toggleBadgeStatus = async (badge) => {
    try {
      await schoolAdminService.updateBadge(badge._id, { isActive: !badge.isActive });
      setMessage({ type: 'success', text: `Badge ${badge.isActive ? 'disabled' : 'enabled'}!` });
      loadBadges();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update badge' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading badges...</div></div>;
  }

  return (
    <div className="sa-container">
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
        <div className="badge-page-header">
          <div>
            <h1 className="sa-page-title">🏆 Badge Management</h1>
            <p className="sa-page-subtitle">Create and manage achievement badges (Stored in Database)</p>
          </div>
          <button className="sa-button-primary" onClick={openCreateModal}>+ Create Badge</button>
        </div>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Badges Grid */}
        {badges.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No badges created yet</p>
            <p style={{ color: '#9ca3af' }}>Create your first badge to reward student achievements</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {badges.map(badge => {
              const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
              return (
                <div key={badge._id} className="sa-card" style={{ opacity: badge.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '40px' }}>{badge.icon}</div>
                    <span className="sa-badge" style={{ background: rarity.bg, color: rarity.color }}>{rarity.label}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{badge.name}</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>{badge.description}</p>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    <strong>Criteria:</strong> {criteriaTypes.find(c => c.value === badge.criteriaType)?.label || badge.criteriaType} ≥ {badge.criteriaValue}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Earned: {badge.earnedCount || 0} times</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="sa-button-action" onClick={() => openEditModal(badge)}>Edit</button>
                      <button className={badge.isActive ? 'sa-button-warning' : 'sa-button-enable'} onClick={() => toggleBadgeStatus(badge)}>
                        {badge.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="sa-button-danger" style={{ padding: '6px 12px' }} onClick={() => { setSelectedBadge(badge); setShowDeleteModal(true); }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="sa-modal" onClick={() => setShowModal(false)}>
          <div className="sa-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">{editingId ? '✏️ Edit Badge' : '🏆 Create Badge'}</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Icon</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {iconOptions.map(icon => (
                  <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })}
                    style={{ fontSize: '24px', padding: '8px', border: formData.icon === icon ? '2px solid #10b981' : '2px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Name *</label>
              <input type="text" className="sa-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Quiz Master" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Complete 10 quizzes" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sa-form-group">
                <label className="sa-label">Criteria Type</label>
                <select className="sa-select" value={formData.criteriaType} onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}>
                  {criteriaTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="sa-form-group">
                <label className="sa-label">Required Value</label>
                <input type="number" className="sa-input" min="1" value={formData.criteriaValue} onChange={(e) => setFormData({ ...formData, criteriaValue: parseInt(e.target.value) || 1 })} />
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Rarity</label>
              <select className="sa-select" value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                {Object.entries(rarityConfig).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Badge'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBadge && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Badge</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedBadge.name}"</strong>?
            </p>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="sa-modal-button-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
