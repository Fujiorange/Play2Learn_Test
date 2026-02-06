import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

const shopIcons = ['🎁', '🦄', '🐉', '🌈', '🦁', '🐬', '🦋', '🐱', '🐶', '🦊', '🐼', '🐨', '⚡', '🚀', '✨', '💫', '🌟', '💎'];

export default function PointsManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [shopItems, setShopItems] = useState([]);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
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

  const cosmetics = shopItems.filter(i => i.category === 'cosmetic');
  const boosters = shopItems.filter(i => i.category === 'booster');

  if (loading) return <div className="sa-loading"><div className="sa-loading-text">Loading shop...</div></div>;

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
        <h1 className="sa-page-title">💰 Points & Shop Management</h1>
        <p className="sa-page-subtitle">Manage the reward shop items for students</p>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Shop Items Section */}
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
      </main>

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
