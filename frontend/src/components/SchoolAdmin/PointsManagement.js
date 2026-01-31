import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

export default function PointsManagement() {
  const navigate = useNavigate();
  const [pointRules, setPointRules] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('rules');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('rule'); // 'rule' or 'shop'
  
  const [ruleForm, setRuleForm] = useState({ action: '', points: 10, description: '', isActive: true });
  const [shopForm, setShopForm] = useState({ name: '', description: '', icon: '🎁', cost: 100, category: 'cosmetic', stock: -1, isActive: true });

  const actionOptions = [
    { value: 'daily_login', label: 'Daily Login' },
    { value: 'quiz_complete', label: 'Quiz Completed' },
    { value: 'quiz_pass', label: 'Quiz Passed (≥60%)' },
    { value: 'perfect_score', label: 'Perfect Score (100%)' },
    { value: 'high_score', label: 'High Score (≥90%)' },
    { value: 'streak_3', label: '3-Day Streak' },
    { value: 'streak_7', label: '7-Day Streak' },
    { value: 'streak_30', label: '30-Day Streak' },
    { value: 'first_quiz', label: 'First Quiz Ever' },
    { value: 'badge_earned', label: 'Badge Earned' }
  ];

  const shopCategories = [
    { value: 'cosmetic', label: '🎨 Cosmetic' },
    { value: 'booster', label: '⚡ Booster' },
    { value: 'special', label: '✨ Special' }
  ];

  const shopIcons = ['🎁', '🎨', '👕', '🎩', '🎪', '🎭', '⭐', '💎', '🏆', '🎮', '📚', '🎵'];

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (!currentUser.role?.toLowerCase().includes('school')) { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [rulesResult, shopResult] = await Promise.all([
        schoolAdminService.getPointRules(),
        schoolAdminService.getShopItems()
      ]);
      
      if (rulesResult.success) setPointRules(rulesResult.rules || []);
      if (shopResult.success) setShopItems(shopResult.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingId(null);
    if (type === 'rule') {
      setRuleForm({ action: '', points: 10, description: '', isActive: true });
    } else {
      setShopForm({ name: '', description: '', icon: '🎁', cost: 100, category: 'cosmetic', stock: -1, isActive: true });
    }
    setShowModal(true);
  };

  const openEditModal = (item, type) => {
    setModalType(type);
    setEditingId(item._id);
    if (type === 'rule') {
      setRuleForm({ action: item.action, points: item.points, description: item.description, isActive: item.isActive });
    } else {
      setShopForm({ name: item.name, description: item.description, icon: item.icon, cost: item.cost, category: item.category, stock: item.stock, isActive: item.isActive });
    }
    setShowModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.action || !ruleForm.description) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    try {
      let result;
      if (editingId) {
        result = await schoolAdminService.updatePointRule(editingId, ruleForm);
      } else {
        result = await schoolAdminService.createPointRule(ruleForm);
      }
      if (result.success) {
        setMessage({ type: 'success', text: editingId ? 'Rule updated!' : 'Rule created!' });
        setShowModal(false);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save rule' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveShop = async () => {
    if (!shopForm.name || !shopForm.description) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    try {
      let result;
      if (editingId) {
        result = await schoolAdminService.updateShopItem(editingId, shopForm);
      } else {
        result = await schoolAdminService.createShopItem(shopForm);
      }
      if (result.success) {
        setMessage({ type: 'success', text: editingId ? 'Item updated!' : 'Item created!' });
        setShowModal(false);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save item' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async () => {
    try {
      let result;
      if (modalType === 'rule') {
        result = await schoolAdminService.deletePointRule(selectedItem._id);
      } else {
        result = await schoolAdminService.deleteShopItem(selectedItem._id);
      }
      if (result.success) {
        setMessage({ type: 'success', text: 'Deleted successfully!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
    setShowDeleteModal(false);
    setSelectedItem(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading...</div></div>;
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
        <h1 className="sa-page-title">💰 Points & Rewards Management</h1>
        <p className="sa-page-subtitle">Configure point rules and reward shop items (Stored in Database)</p>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          ℹ️ Note: Manual point adjustments for individual students are done by Teachers, not School Admin.
        </p>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="points-tabs">
          <button className={`points-tab ${activeTab === 'rules' ? 'points-tab-active' : ''}`} onClick={() => setActiveTab('rules')}>
            📋 Point Rules ({pointRules.length})
          </button>
          <button className={`points-tab ${activeTab === 'shop' ? 'points-tab-active' : ''}`} onClick={() => setActiveTab('shop')}>
            🛒 Reward Shop ({shopItems.length})
          </button>
        </div>

        {/* Point Rules Tab */}
        {activeTab === 'rules' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="sa-button-primary" onClick={() => openCreateModal('rule')}>+ Add Point Rule</button>
            </div>

            {pointRules.length === 0 ? (
              <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No point rules configured</p>
                <p style={{ color: '#9ca3af' }}>Create rules to define how students earn points</p>
              </div>
            ) : (
              <div className="sa-card">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Points</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointRules.map(rule => (
                      <tr key={rule._id} style={{ opacity: rule.isActive ? 1 : 0.5 }}>
                        <td style={{ fontWeight: '600' }}>{actionOptions.find(a => a.value === rule.action)?.label || rule.action}</td>
                        <td className="points-value">+{rule.points}</td>
                        <td>{rule.description}</td>
                        <td>
                          <span className={`sa-badge ${rule.isActive ? 'sa-badge-success' : 'sa-badge-secondary'}`}>
                            {rule.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <button className="sa-button-action" onClick={() => openEditModal(rule, 'rule')}>Edit</button>
                          <button className="sa-button-danger" style={{ marginLeft: '8px', padding: '6px 12px' }} 
                            onClick={() => { setSelectedItem(rule); setModalType('rule'); setShowDeleteModal(true); }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="sa-button-primary" onClick={() => openCreateModal('shop')}>+ Add Shop Item</button>
            </div>

            {shopItems.length === 0 ? (
              <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No shop items yet</p>
                <p style={{ color: '#9ca3af' }}>Create items that students can purchase with their points</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {shopItems.map(item => (
                  <div key={item._id} className="sa-card" style={{ opacity: item.isActive ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontSize: '40px' }}>{item.icon}</div>
                      <span className="sa-badge sa-badge-primary">{shopCategories.find(c => c.value === item.category)?.label || item.category}</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>{item.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span className="points-value" style={{ fontSize: '18px' }}>{item.cost} pts</span>
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>
                        {item.stock === -1 ? 'Unlimited' : `Stock: ${item.stock}`} • Sold: {item.purchaseCount || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="sa-button-action" onClick={() => openEditModal(item, 'shop')}>Edit</button>
                      <button className="sa-button-danger" style={{ padding: '6px 12px' }}
                        onClick={() => { setSelectedItem(item); setModalType('shop'); setShowDeleteModal(true); }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="sa-modal" onClick={() => setShowModal(false)}>
          <div className="sa-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">
              {modalType === 'rule' 
                ? (editingId ? '✏️ Edit Point Rule' : '📋 Add Point Rule')
                : (editingId ? '✏️ Edit Shop Item' : '🛒 Add Shop Item')
              }
            </h2>

            {modalType === 'rule' ? (
              <>
                <div className="sa-form-group">
                  <label className="sa-label">Action *</label>
                  <select className="sa-select" value={ruleForm.action} onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}>
                    <option value="">Select action</option>
                    {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Points Awarded</label>
                  <input type="number" className="sa-input" min="1" value={ruleForm.points} onChange={(e) => setRuleForm({ ...ruleForm, points: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Description *</label>
                  <input type="text" className="sa-input" value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="e.g., Complete a quiz" />
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Status</label>
                  <select className="sa-select" value={ruleForm.isActive} onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="sa-modal-buttons">
                  <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="sa-modal-button-confirm" onClick={handleSaveRule}>{editingId ? 'Save' : 'Create'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="sa-form-group">
                  <label className="sa-label">Icon</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {shopIcons.map(icon => (
                      <button key={icon} type="button" onClick={() => setShopForm({ ...shopForm, icon })}
                        style={{ fontSize: '24px', padding: '8px', border: shopForm.icon === icon ? '2px solid #10b981' : '2px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Name *</label>
                  <input type="text" className="sa-input" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} placeholder="e.g., Cool Avatar" />
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Description *</label>
                  <textarea className="sa-textarea" value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} placeholder="e.g., Unlock a new profile avatar" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="sa-form-group">
                    <label className="sa-label">Cost (points)</label>
                    <input type="number" className="sa-input" min="1" value={shopForm.cost} onChange={(e) => setShopForm({ ...shopForm, cost: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="sa-form-group">
                    <label className="sa-label">Stock (-1 = unlimited)</label>
                    <input type="number" className="sa-input" min="-1" value={shopForm.stock} onChange={(e) => setShopForm({ ...shopForm, stock: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Category</label>
                  <select className="sa-select" value={shopForm.category} onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}>
                    {shopCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div className="sa-modal-buttons">
                  <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="sa-modal-button-confirm" onClick={handleSaveShop}>{editingId ? 'Save' : 'Create'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete {modalType === 'rule' ? 'Rule' : 'Item'}</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedItem.name || selectedItem.action}"</strong>?
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
