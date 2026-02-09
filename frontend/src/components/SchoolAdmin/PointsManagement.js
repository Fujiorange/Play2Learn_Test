import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

// Point earning rules (automated) - these are display-only for now
const defaultPointRules = [
  { id: 'rule_1', action: 'Daily Login', points: 5, isActive: true },
  { id: 'rule_2', action: 'Login Streak (7 days)', points: 20, isActive: true },
  { id: 'rule_3', action: 'Complete Quiz', points: 10, isActive: true },
  { id: 'rule_4', action: 'Score 90%+', points: 15, isActive: true },
  { id: 'rule_5', action: 'Perfect Score (100%)', points: 25, isActive: true },
  { id: 'rule_6', action: 'Retry & Improve Score', points: 10, isActive: true },
  { id: 'rule_7', action: 'Late Quiz Completion', points: 5, isActive: true }
];

const shopIcons = ['🎁', '🦄', '🐉', '🌈', '🦁', '🐬', '🦋', '🐱', '🐶', '🦊', '🐼', '🐨', '⚡', '🚀', '✨', '💫', '🌟', '💎'];

export default function PointsManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pointRules, setPointRules] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(5);
  const [adjustmentRemarks, setAdjustmentRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemForm, setNewItemForm] = useState({ name: '', description: '', icon: '🎁', cost: 50, category: 'cosmetic', stock: 999, duration: '1 day', multiplier: 1.5 });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load shop items from API
      const shopResult = await schoolAdminService.getShopItems();
      if (shopResult.success) {
        setShopItems(shopResult.items || []);
      }
      // Keep point rules as static for now
      setPointRules(defaultPointRules);
      setStudents([]);
      setTransactions([]);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = (ruleId) => {
    setPointRules(pointRules.map(rule => rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule));
    setMessage({ type: 'success', text: 'Point rule updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateRulePoints = (ruleId, newPoints) => {
    setPointRules(pointRules.map(rule => rule.id === ruleId ? { ...rule, points: newPoints } : rule));
  };

  const openAdjustModal = (student) => {
    setSelectedStudent(student);
    setAdjustmentAmount(5);
    setAdjustmentRemarks('');
    setShowAdjustModal(true);
  };

  const handleAdjustPoints = () => {
    if (!adjustmentRemarks.trim()) {
      setMessage({ type: 'error', text: 'Please provide remarks for the adjustment' });
      return;
    }
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, points: s.points + adjustmentAmount } : s));
    const newTransaction = { id: `tx_${Date.now()}`, studentName: selectedStudent.name, type: 'adjustment', amount: adjustmentAmount, reason: adjustmentRemarks, date: new Date().toISOString().split('T')[0], by: 'School Admin' };
    setTransactions([newTransaction, ...transactions]);
    setMessage({ type: 'success', text: `${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} points ${adjustmentAmount > 0 ? 'awarded to' : 'deducted from'} ${selectedStudent.name}` });
    setShowAdjustModal(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openEditItemModal = (item) => { 
    setSelectedItem({...item}); 
    setShowEditItemModal(true); 
  };

  const handleUpdateItem = async () => {
    try {
      const result = await schoolAdminService.updateShopItem(selectedItem._id, selectedItem);
      if (result.success) {
        setMessage({ type: 'success', text: `"${selectedItem.name}" updated successfully!` });
        setShowEditItemModal(false);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update item' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update item' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteItem = async () => {
    try {
      const result = await schoolAdminService.deleteShopItem(selectedItem._id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Item removed from shop' });
        setShowDeleteModal(false);
        setSelectedItem(null);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete item' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete item' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddItem = async () => {
    if (!newItemForm.name || !newItemForm.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    try {
      const result = await schoolAdminService.createShopItem(newItemForm);
      if (result.success) {
        setMessage({ type: 'success', text: `"${newItemForm.name}" added to shop!` });
        setShowAddItemModal(false);
        setNewItemForm({ name: '', description: '', icon: '🎁', cost: 50, category: 'cosmetic', stock: 999, duration: '1 day', multiplier: 1.5 });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add item' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add item' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()) || s.class.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
  const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;
  const cosmetics = shopItems.filter(i => i.category === 'cosmetic');
  const boosters = shopItems.filter(i => i.category === 'booster');

  if (loading) return <div className="sa-loading"><div className="sa-loading-text">Loading points system...</div></div>;

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
        <h1 className="sa-page-title">💰 Points Management</h1>
        <p className="sa-page-subtitle">Configure point rules, manage the shop, and adjust student points</p>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        <div className="points-tabs">
          {['overview', 'rules', 'shop', 'students', 'history'].map(tab => (
            <button key={tab} className={`points-tab ${activeTab === tab ? 'points-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && '📊 Overview'}{tab === 'rules' && '⚙️ Point Rules'}{tab === 'shop' && '🛒 Shop Items'}{tab === 'students' && '👥 Students'}{tab === 'history' && '📜 History'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="sa-stat-card"><div className="sa-stat-icon">💰</div><p className="sa-stat-label">Total Points in Circulation</p><p className="sa-stat-value">{totalPoints.toLocaleString()}</p></div>
              <div className="sa-stat-card"><div className="sa-stat-icon">📊</div><p className="sa-stat-label">Average Points per Student</p><p className="sa-stat-value">{avgPoints}</p></div>
              <div className="sa-stat-card"><div className="sa-stat-icon">🛒</div><p className="sa-stat-label">Shop Items Available</p><p className="sa-stat-value">{shopItems.length}</p></div>
              <div className="sa-stat-card"><div className="sa-stat-icon">⚙️</div><p className="sa-stat-label">Active Point Rules</p><p className="sa-stat-value">{pointRules.filter(r => r.isActive).length}</p></div>
            </div>
            <div className="points-overview-grid">
              <div className="sa-card">
                <h3 className="points-card-title">🏆 Top Students by Points</h3>
                 <div style={{ color: '#6b7280', fontSize: '14px' }}>
                   Live data will appear here once available.
                 </div>
               </div>
               <div className="sa-card">
                 <h3 className="points-card-title">📜 Recent Transactions</h3>
                 <div style={{ color: '#6b7280', fontSize: '14px' }}>
                   Live data will appear here once available.
                 </div>
               </div>
             </div>
           </>
        )}

        {activeTab === 'rules' && (
          <div className="sa-card">
            <h3 className="points-card-title">⚙️ Automated Point Rules</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Configure how many points students earn for each action</p>
            {pointRules.map(rule => (
              <div key={rule.id} className="rule-row">
                <div className="rule-info">
                  <div className={`toggle-switch ${rule.isActive ? 'toggle-active' : ''}`} onClick={() => handleToggleRule(rule.id)}><div className="toggle-knob"></div></div>
                  <span className={rule.isActive ? '' : 'rule-disabled'}>{rule.action}</span>
                </div>
                <div className="rule-points">
                  <span>+</span>
                  <input type="number" className="points-input" value={rule.points} onChange={(e) => handleUpdateRulePoints(rule.id, parseInt(e.target.value) || 0)} disabled={!rule.isActive} />
                  <span>points</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shop' && (
          <>
            <button className="sa-button-primary sa-mb-4" onClick={() => setShowAddItemModal(true)}>+ Add Shop Item</button>
            <h3 className="points-card-title">🦄 Cosmetic Badges ({cosmetics.length})</h3>
            <div className="shop-grid sa-mb-4">
              {cosmetics.map(item => (
                <div key={item._id || item.id} className="sa-card shop-card">
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-name">{item.name}</div>
                  <div className="shop-description">{item.description}</div>
                  <div className="shop-meta"><span className="shop-tag shop-tag-cost">💰 {item.cost} pts</span><span className="shop-tag shop-tag-type">Cosmetic</span></div>
                  <div className="shop-stats">Purchased: {item.purchaseCount || 0} times</div>
                  <div className="shop-actions"><button className="sa-button-action" onClick={() => openEditItemModal(item)}>Edit</button><button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(item)}>Remove</button></div>
                </div>
              ))}
            </div>
            <h3 className="points-card-title">⚡ Point Boosters ({boosters.length})</h3>
            <div className="shop-grid">
              {boosters.map(item => (
                <div key={item._id || item.id} className="sa-card shop-card">
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-name">{item.name}</div>
                  <div className="shop-description">{item.description}</div>
                  <div className="shop-meta"><span className="shop-tag shop-tag-cost">💰 {item.cost} pts</span><span className="shop-tag shop-tag-booster">{item.multiplier}x for {item.duration}</span></div>
                  <div className="shop-stats">Stock: {(item.stock === -1 ? 'Unlimited' : Math.max(0, item.stock - (item.purchaseCount || 0)))} | Purchased: {item.purchaseCount || 0}</div>
                  <div className="shop-actions"><button className="sa-button-action" onClick={() => openEditItemModal(item)}>Edit</button><button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(item)}>Remove</button></div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'students' && (
          <div className="sa-card">
            <h3 className="points-card-title">👥 Student Points</h3>
            <input type="text" className="sa-search-input" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ maxWidth: '300px' }} />
            <table className="sa-table">
              <thead><tr><th>Student</th><th>Class</th><th>Points</th><th>Active Booster</th><th>Action</th></tr></thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td><div style={{ fontWeight: '600' }}>{student.name}</div><div style={{ fontSize: '12px', color: '#6b7280' }}>{student.email}</div></td>
                    <td>{student.class}</td>
                    <td className="points-value">{student.points}</td>
                    <td>{student.activeBooster ? <span className="booster-active">⚡ {student.activeBooster.name}</span> : <span style={{ color: '#9ca3af' }}>None</span>}</td>
                    <td><button className="sa-button-action" onClick={() => openAdjustModal(student)}>Adjust Points</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="sa-card">
            <h3 className="points-card-title">📜 Transaction History</h3>
            <table className="sa-table">
              <thead><tr><th>Date</th><th>Student</th><th>Type</th><th>Amount</th><th>Reason</th><th>By</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>{tx.studentName}</td>
                    <td><span className={`sa-badge ${tx.type === 'earned' ? 'sa-badge-success' : tx.type === 'spent' ? 'sa-badge-danger' : 'sa-badge-primary'}`}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span></td>
                    <td className={tx.amount > 0 ? 'points-positive' : 'points-negative'}>{tx.amount > 0 ? '+' : ''}{tx.amount}</td>
                    <td>{tx.reason}</td>
                    <td>{tx.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Adjust Points Modal */}
      {showAdjustModal && selectedStudent && (
        <div className="sa-modal" onClick={() => setShowAdjustModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">💰 Adjust Points</h2>
            <div className="student-info-box">
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{selectedStudent.name}</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>{selectedStudent.class}</div>
              <div className="student-points">{selectedStudent.points} points</div>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Adjustment Amount</label>
              <div className="adjustment-buttons">
                {[-10, -5, 5, 10].map(amount => (
                  <button key={amount} className={`amount-button ${adjustmentAmount === amount ? 'amount-button-selected' : ''} ${amount > 0 ? 'amount-positive' : 'amount-negative'}`} onClick={() => setAdjustmentAmount(amount)}>
                    {amount > 0 ? '+' : ''}{amount}
                  </button>
                ))}
              </div>
              <div className="new-balance">New balance: <strong>{selectedStudent.points + adjustmentAmount}</strong></div>
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Remarks (required) *</label>
              <textarea className="sa-textarea" value={adjustmentRemarks} onChange={(e) => setAdjustmentRemarks(e.target.value)} placeholder="e.g., Good behavior, Helped classmate, Late submission..." style={{ minHeight: '80px' }} />
            </div>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowAdjustModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleAdjustPoints}>{adjustmentAmount > 0 ? 'Award' : 'Deduct'} Points</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Item Modal */}
      {showEditItemModal && selectedItem && (
        <div className="sa-modal" onClick={() => setShowEditItemModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">✏️ Edit Shop Item</h2>
            <div className="sa-form-group"><label className="sa-label">Item Name</label><input type="text" className="sa-input" value={selectedItem.name} onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} /></div>
            <div className="sa-form-group"><label className="sa-label">Description</label><textarea className="sa-textarea" value={selectedItem.description} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} style={{ minHeight: '80px' }} /></div>
            <div className="sa-form-group"><label className="sa-label">Cost (points)</label><input type="number" className="sa-input" value={selectedItem.cost} onChange={(e) => setSelectedItem({ ...selectedItem, cost: parseInt(e.target.value) || 0 })} /></div>
            {selectedItem.category === 'booster' && (
              <>
                <div className="sa-form-group"><label className="sa-label">Stock</label><input type="number" className="sa-input" value={selectedItem.stock} onChange={(e) => setSelectedItem({ ...selectedItem, stock: parseInt(e.target.value) || 0 })} /></div>
                <div className="sa-form-group"><label className="sa-label">Multiplier</label><select className="sa-select" value={selectedItem.multiplier} onChange={(e) => setSelectedItem({ ...selectedItem, multiplier: parseFloat(e.target.value) })}><option value={1.25}>1.25x</option><option value={1.5}>1.5x</option><option value={2}>2x</option></select></div>
                <div className="sa-form-group"><label className="sa-label">Duration</label><select className="sa-select" value={selectedItem.duration} onChange={(e) => setSelectedItem({ ...selectedItem, duration: e.target.value })}><option value="1 day">1 day</option><option value="3 days">3 days</option><option value="5 days">5 days</option><option value="7 days">7 days</option></select></div>
              </>
            )}
            <div className="sa-modal-buttons"><button className="sa-modal-button-cancel" onClick={() => setShowEditItemModal(false)}>Cancel</button><button className="sa-modal-button-confirm" onClick={handleUpdateItem}>Save Changes</button></div>
          </div>
        </div>
      )}

      {/* Add Shop Item Modal */}
      {showAddItemModal && (
        <div className="sa-modal" onClick={() => setShowAddItemModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">➕ Add Shop Item</h2>
            <div className="sa-form-group"><label className="sa-label">Item Type</label><select className="sa-select" value={newItemForm.category} onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}><option value="cosmetic">🦄 Cosmetic Badge</option><option value="booster">⚡ Point Booster</option></select></div>
            <div className="sa-form-group"><label className="sa-label">Item Name *</label><input type="text" className="sa-input" value={newItemForm.name} onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })} placeholder="e.g., Panda Badge" /></div>
            <div className="sa-form-group"><label className="sa-label">Description *</label><textarea className="sa-textarea" value={newItemForm.description} onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })} placeholder="e.g., A cute panda for your profile" style={{ minHeight: '80px' }} /></div>
            <div className="sa-form-group"><label className="sa-label">Icon</label><div className="icon-grid">{shopIcons.map((icon) => (<div key={icon} className={`icon-option ${newItemForm.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setNewItemForm({ ...newItemForm, icon })}>{icon}</div>))}</div></div>
            <div className="sa-form-group"><label className="sa-label">Cost (points)</label><input type="number" className="sa-input" value={newItemForm.cost} onChange={(e) => setNewItemForm({ ...newItemForm, cost: parseInt(e.target.value) || 0 })} /></div>
            {newItemForm.category === 'booster' && (
              <>
                <div className="sa-form-group"><label className="sa-label">Stock</label><input type="number" className="sa-input" value={newItemForm.stock} onChange={(e) => setNewItemForm({ ...newItemForm, stock: parseInt(e.target.value) || 0 })} /></div>
                <div className="sa-form-group"><label className="sa-label">Multiplier</label><select className="sa-select" value={newItemForm.multiplier} onChange={(e) => setNewItemForm({ ...newItemForm, multiplier: parseFloat(e.target.value) })}><option value={1.25}>1.25x</option><option value={1.5}>1.5x</option><option value={2}>2x</option></select></div>
                <div className="sa-form-group"><label className="sa-label">Duration</label><select className="sa-select" value={newItemForm.duration} onChange={(e) => setNewItemForm({ ...newItemForm, duration: e.target.value })}><option value="1 day">1 day</option><option value="3 days">3 days</option><option value="5 days">5 days</option><option value="7 days">7 days</option></select></div>
              </>
            )}
            <div className="sa-modal-buttons"><button className="sa-modal-button-cancel" onClick={() => setShowAddItemModal(false)}>Cancel</button><button className="sa-modal-button-confirm" onClick={handleAddItem}>Add Item</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Remove Shop Item</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to remove <strong>"{selectedItem.name}"</strong> from the shop?
              <br /><br />
              This item has been purchased <strong>{selectedItem.purchaseCount || 0} times</strong>.
            </p>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="sa-modal-button-danger" onClick={handleDeleteItem}>Remove Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
