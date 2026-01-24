// Landing Page Manager Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLandingPage, saveLandingPage } from '../../services/p2lAdminService';
import './LandingPageManager.css';

function LandingPageManager() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    type: 'hero',
    title: '',
    content: '',
    image_url: '',
    order: 0,
    is_visible: true,
    custom_data: {}
  });

  useEffect(() => {
    fetchLandingPage();
  }, []);

  const fetchLandingPage = async () => {
    try {
      const response = await getLandingPage();
      setBlocks(response.blocks || []);
    } catch (error) {
      console.error('Failed to fetch landing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleAddBlock = () => {
    setEditingIndex(null);
    setFormData({
      type: 'hero',
      title: '',
      content: '',
      image_url: '',
      order: blocks.length,
      is_visible: true,
      custom_data: {}
    });
    setShowForm(true);
  };

  const handleEditBlock = (index) => {
    setEditingIndex(index);
    setFormData(blocks[index]);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newBlocks = [...blocks];
    
    if (editingIndex !== null) {
      newBlocks[editingIndex] = formData;
    } else {
      newBlocks.push(formData);
    }
    
    setBlocks(newBlocks);
    setShowForm(false);
  };

  const handleDeleteBlock = (index) => {
    if (!window.confirm('Are you sure you want to delete this block?')) {
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    try {
      await saveLandingPage(blocks);
      alert('Landing page saved successfully!');
    } catch (error) {
      console.error('Failed to save landing page:', error);
      alert(error.message || 'Failed to save landing page');
    }
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    newBlocks.forEach((block, i) => block.order = i);
    setBlocks(newBlocks);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="landing-page-manager">
      <header className="page-header">
        <div>
          <h1>Landing Page Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
          <button onClick={handleAddBlock} className="btn-primary">
            + Add Block
          </button>
          <button onClick={handleSave} className="btn-save">
            💾 Save Changes
          </button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingIndex !== null ? 'Edit Block' : 'Add New Block'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Block Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="hero">Hero</option>
                  <option value="features">Features</option>
                  <option value="about">About</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="pricing">Pricing</option>
                  <option value="contact">Contact</option>
                  <option value="footer">Footer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_visible"
                    checked={formData.is_visible}
                    onChange={handleInputChange}
                  />
                  {' '}Visible
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="blocks-list">
        {blocks.length === 0 ? (
          <p className="no-data">No blocks added yet. Create your first block!</p>
        ) : (
          blocks.map((block, index) => (
            <div key={index} className={`block-card ${!block.is_visible ? 'hidden' : ''}`}>
              <div className="block-header">
                <span className="block-type">{block.type.toUpperCase()}</span>
                {!block.is_visible && <span className="hidden-badge">Hidden</span>}
              </div>
              
              <h3>{block.title || 'No Title'}</h3>
              <p className="block-content">{block.content?.substring(0, 100)}...</p>
              
              <div className="block-actions">
                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                  ↑
                </button>
                <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                  ↓
                </button>
                <button onClick={() => handleEditBlock(index)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDeleteBlock(index)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LandingPageManager;
