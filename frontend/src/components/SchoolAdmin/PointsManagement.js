import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

const shopCategories = [
  { value: 'cosmetic', label: '🎨 Cosmetic Badge' },
  { value: 'booster', label: '⚡ Point Booster' },
  { value: 'special', label: '✨ Special Item' }
];

const shopIcons = ['🎁', '🦄', '🐉', '🌈', '🦁', '🐬', '🦋', '🐱', '🐶', '🦊', '🐼', '🐨', '⚡', '🚀', '✨', '💫', '🌟', '💎'];

export default function PointsManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shop');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [shopItems, setShopItems] = useState([]);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    description: '',
    icon: '🎁',
    cost: 50,
    category: 'cosmetic',
    stock: -1
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
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const result = await schoolAdminService.getShopItems();
      if (result.success) {
        setShopItems(result.items || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load shop items' });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const openEditItemModal = (item) => {
    setSelectedItem({ ...item });
    setShowEditItemModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem.name || !selectedItem.description) {
      setMessage({ type: 'error', text: 'Name and description are required' });
      return;
    }
    try {
      const result = await schoolAdminService.updateShopItem(selectedItem._id, selectedItem);
      if (result.success) {
        setMessage({ type: 'success', text: `"${selectedItem.name}" updated!` });
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
      setMessage({ type: 'error', text: 'Please fill in name and description' });
      return;
    }
    try {
      const result = await schoolAdminService.createShopItem(newItemForm);
      if (result.success) {
        setMessage({ type: 'success', text: `"${newItemForm.name}" added to shop!` });
        setShowAddItemModal(false);
        setNewItemForm({
          name: '',
          description: '',
          icon: '🎁',
          cost: 50,
          category: 'cosmetic',
          stock: -1
        });
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
  const specials = shopItems.filter(i => i.category === 'special');

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading shop...</div></div>;
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
        <h1 className="sa-page-title">🛒 Points Shop Management</h1>
        <p className="sa-page-subtitle">Manage shop items that students can purchase with points</p>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        <div className="points-tabs">
          {['shop', 'overview'].map(tab => (
            <button key={tab} className={`points-tab ${activeTab === tab ? 'points-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'shop' && '🛒 Shop Items'}
              {tab === 'overview' && '📊 Overview'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">🛒</div>
                <p className="sa-stat-label">Total Shop Items</p>
                <p className="sa-stat-value">{shopItems.length}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">🎨</div>
                <p className="sa-stat-label">Cosmetics</p>
                <p className="sa-stat-value">{cosmetics.length}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">⚡</div>
                <p className="sa-stat-label">Boosters</p>
                <p className="sa-stat-value">{boosters.length}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">✨</div>
                <p className="sa-stat-label">Special Items</p>
                <p className="sa-stat-value">{specials.length}</p>
              </div>
            </div>
            <div className="sa-card">
              <h3 className="points-card-title">📈 Shop Statistics</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Total items purchased: {shopItems.reduce((sum, item) => sum + (item.purchased || 0), 0)}
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                Active items: {shopItems.filter(i => i.isActive).length}
              </p>
            </div>
          </>
        )}

        {activeTab === 'shop' && (
          <>
            <button className="sa-button-primary sa-mb-4" onClick={() => setShowAddItemModal(true)}>+ Add Shop Item</button>
            
            {shopItems.length === 0 ? (
              <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No shop items yet</p>
                <p style={{ color: '#9ca3af' }}>Create your first shop item</p>
              </div>
            ) : (
              <>
                {cosmetics.length > 0 && (
                  <>
                    <h3 className="points-card-title">🎨 Cosmetic Items ({cosmetics.length})</h3>
                    <div className="shop-grid sa-mb-4">
                      {cosmetics.map(item => (
                        <div key={item._id} className={`sa-card shop-card ${!item.isActive ? 'shop-card-disabled' : ''}`}>
                          <div className="shop-icon">{item.icon}</div>
                          <div className="shop-name">{item.name}</div>
                          <div className="shop-description">{item.description}</div>
                          <div className="shop-meta">
                            <span className="shop-tag shop-tag-cost">💰 {item.cost} pts</span>
                            <span className="shop-tag shop-tag-type">Cosmetic</span>
                          </div>
                          <div className="shop-stats">
                            {item.stock === -1 ? 'Unlimited' : `Stock: ${item.stock}`} | Purchased: {item.purchased || 0} times
                          </div>
                          <div className="shop-actions">
                            <button className="sa-button-action" onClick={() => openEditItemModal(item)}>Edit</button>
                            <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(item)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {boosters.length > 0 && (
                  <>
                    <h3 className="points-card-title">⚡ Point Boosters ({boosters.length})</h3>
                    <div className="shop-grid sa-mb-4">
                      {boosters.map(item => (
                        <div key={item._id} className={`sa-card shop-card ${!item.isActive ? 'shop-card-disabled' : ''}`}>
                          <div className="shop-icon">{item.icon}</div>
                          <div className="shop-name">{item.name}</div>
                          <div className="shop-description">{item.description}</div>
                          <div className="shop-meta">
                            <span className="shop-tag shop-tag-cost">💰 {item.cost} pts</span>
                            <span className="shop-tag shop-tag-booster">Booster</span>
                          </div>
                          <div className="shop-stats">
                            {item.stock === -1 ? 'Unlimited' : `Stock: ${item.stock}`} | Purchased: {item.purchased || 0} times
                          </div>
                          <div className="shop-actions">
                            <button className="sa-button-action" onClick={() => openEditItemModal(item)}>Edit</button>
                            <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(item)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {specials.length > 0 && (
                  <>
                    <h3 className="points-card-title">✨ Special Items ({specials.length})</h3>
                    <div className="shop-grid">
                      {specials.map(item => (
                        <div key={item._id} className={`sa-card shop-card ${!item.isActive ? 'shop-card-disabled' : ''}`}>
                          <div className="shop-icon">{item.icon}</div>
                          <div className="shop-name">{item.name}</div>
                          <div className="shop-description">{item.description}</div>
                          <div className="shop-meta">
                            <span className="shop-tag shop-tag-cost">💰 {item.cost} pts</span>
                            <span className="shop-tag" style={{ background: '#f0fdf4', color: '#16a34a' }}>Special</span>
                          </div>
                          <div className="shop-stats">
                            {item.stock === -1 ? 'Unlimited' : `Stock: ${item.stock}`} | Purchased: {item.purchased || 0} times
                          </div>
                          <div className="shop-actions">
                            <button className="sa-button-action" onClick={() => openEditItemModal(item)}>Edit</button>
                            <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openDeleteModal(item)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Edit Shop Item Modal */}
      {showEditItemModal && selectedItem && (
        <div className="sa-modal" onClick={() => setShowEditItemModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">✏️ Edit Shop Item</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Item Name *</label>
              <input type="text" className="sa-input" value={selectedItem.name} onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={selectedItem.description} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} style={{ minHeight: '80px' }} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Icon</label>
              <div className="icon-grid">
                {shopIcons.map((icon) => (
                  <div key={icon} className={`icon-option ${selectedItem.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setSelectedItem({ ...selectedItem, icon })}>{icon}</div>
                ))}
              </div>
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Cost (points)</label>
              <input type="number" className="sa-input" min="1" value={selectedItem.cost} onChange={(e) => setSelectedItem({ ...selectedItem, cost: parseInt(e.target.value) || 1 })} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Category</label>
              <select className="sa-select" value={selectedItem.category} onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}>
                {shopCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Stock (-1 for unlimited)</label>
              <input type="number" className="sa-input" min="-1" value={selectedItem.stock} onChange={(e) => setSelectedItem({ ...selectedItem, stock: parseInt(e.target.value) })} />
            </div>
            
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowEditItemModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleUpdateItem}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shop Item Modal */}
      {showAddItemModal && (
        <div className="sa-modal" onClick={() => setShowAddItemModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">➕ Add Shop Item</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Category</label>
              <select className="sa-select" value={newItemForm.category} onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}>
                {shopCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Item Name *</label>
              <input type="text" className="sa-input" value={newItemForm.name} onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })} placeholder="e.g., Golden Crown Badge" />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Description *</label>
              <textarea className="sa-textarea" value={newItemForm.description} onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })} placeholder="e.g., A shiny golden crown for your profile" style={{ minHeight: '80px' }} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Icon</label>
              <div className="icon-grid">
                {shopIcons.map((icon) => (
                  <div key={icon} className={`icon-option ${newItemForm.icon === icon ? 'icon-option-selected' : ''}`} onClick={() => setNewItemForm({ ...newItemForm, icon })}>{icon}</div>
                ))}
              </div>
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Cost (points)</label>
              <input type="number" className="sa-input" min="1" value={newItemForm.cost} onChange={(e) => setNewItemForm({ ...newItemForm, cost: parseInt(e.target.value) || 1 })} />
            </div>
            
            <div className="sa-form-group">
              <label className="sa-label">Stock (-1 for unlimited)</label>
              <input type="number" className="sa-input" min="-1" value={newItemForm.stock} onChange={(e) => setNewItemForm({ ...newItemForm, stock: parseInt(e.target.value) })} />
              <p className="criteria-help">Enter -1 for unlimited stock</p>
            </div>
            
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowAddItemModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleAddItem}>Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Remove Item</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to remove <strong>"{selectedItem.name}"</strong> from the shop?
              <br /><br />
              This item has been purchased <strong>{selectedItem.purchased || 0} times</strong>.
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
