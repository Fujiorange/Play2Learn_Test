// Maintenance Broadcast Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getMaintenanceBroadcasts,
  createMaintenanceBroadcast,
  updateMaintenanceBroadcast,
  deleteMaintenanceBroadcast
} from '../../services/p2lAdminService';
import './MaintenanceBroadcastManager.css';

function MaintenanceBroadcastManager() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_roles: ['all'],
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await getMaintenanceBroadcasts();
      setBroadcasts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
      alert('Failed to load maintenance broadcasts');
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

  const handleRoleChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    if (value === 'all') {
      // Toggle "All Users" - if checked, set to ['all'], if unchecked, clear all
      if (isChecked) {
        setFormData({ ...formData, target_roles: ['all'] });
      } else {
        // Allow unchecking "All Users" to select specific roles
        setFormData({ ...formData, target_roles: [] });
      }
    } else {
      // Handle individual role selection
      let roles = formData.target_roles.includes('all') ? [] : [...formData.target_roles];
      
      if (isChecked) {
        // Add the role if not already present
        if (!roles.includes(value)) {
          roles.push(value);
        }
      } else {
        // Remove the role
        const index = roles.indexOf(value);
        if (index > -1) {
          roles.splice(index, 1);
        }
      }
      
      // If no roles selected, default to 'all'
      setFormData({ ...formData, target_roles: roles.length > 0 ? roles : ['all'] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        end_date: formData.end_date || null
      };

      if (editingId) {
        await updateMaintenanceBroadcast(editingId, data);
      } else {
        await createMaintenanceBroadcast(data);
      }
      
      setShowForm(false);
      resetForm();
      fetchBroadcasts();
    } catch (error) {
      console.error('Failed to save broadcast:', error);
      alert(error.message || 'Failed to save broadcast');
    }
  };

  const handleEdit = (broadcast) => {
    setEditingId(broadcast._id);
    setFormData({
      title: broadcast.title,
      message: broadcast.message,
      type: broadcast.type,
      target_roles: broadcast.target_roles,
      start_date: new Date(broadcast.start_date).toISOString().slice(0, 16),
      end_date: broadcast.end_date ? new Date(broadcast.end_date).toISOString().slice(0, 16) : '',
      is_active: broadcast.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    
    try {
      await deleteMaintenanceBroadcast(id);
      fetchBroadcasts();
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
      alert('Failed to delete broadcast');
    }
  };

  const handleToggleActive = async (broadcast) => {
    try {
      await updateMaintenanceBroadcast(broadcast._id, {
        is_active: !broadcast.is_active
      });
      fetchBroadcasts();
    } catch (error) {
      console.error('Failed to update broadcast:', error);
      alert('Failed to update broadcast');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_roles: ['all'],
      start_date: new Date().toISOString().slice(0, 16),
      end_date: '',
      is_active: true
    });
    setEditingId(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="maintenance-broadcast-manager">
      <header className="page-header">
        <div>
          <h1>Website Maintenance Broadcasts</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Broadcast
        </button>
      </header>

      <div className="content-container">
        <div className="info-banner">
          <p>📢 Create system-wide announcements for maintenance, updates, or important notices.</p>
          <p>Broadcasts will be visible to selected user roles during the specified time period.</p>
        </div>

        {broadcasts.length === 0 ? (
          <div className="no-data">
            <p>No maintenance broadcasts yet.</p>
            <p>Create one to notify users about system updates or maintenance.</p>
          </div>
        ) : (
          <div className="broadcasts-grid">
            {broadcasts.map((broadcast) => (
              <div 
                key={broadcast._id} 
                className={`broadcast-card ${broadcast.is_active ? 'active' : 'inactive'} ${broadcast.type}`}
              >
                <div className="broadcast-header">
                  <h3>{broadcast.title}</h3>
                  <span className={`badge ${broadcast.type}`}>{broadcast.type.toUpperCase()}</span>
                </div>
                
                <p className="broadcast-message">{broadcast.message}</p>
                
                <div className="broadcast-info">
                  <p><strong>Target:</strong> {broadcast.target_roles.join(', ')}</p>
                  <p><strong>Start:</strong> {new Date(broadcast.start_date).toLocaleString()}</p>
                  {broadcast.end_date && (
                    <p><strong>End:</strong> {new Date(broadcast.end_date).toLocaleString()}</p>
                  )}
                  {!broadcast.end_date && (
                    <p><strong>End:</strong> No end date (until deactivated)</p>
                  )}
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={broadcast.is_active ? 'status-active' : 'status-inactive'}>
                      {broadcast.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </p>
                </div>

                <div className="broadcast-actions">
                  <button onClick={() => handleEdit(broadcast)} className="btn-edit">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleActive(broadcast)} 
                    className={`btn-toggle ${broadcast.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                  >
                    {broadcast.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(broadcast._id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? 'Edit Broadcast' : 'Create Broadcast'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Scheduled Maintenance"
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Detailed message about the maintenance or announcement"
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="critical">Critical (Red)</option>
                  <option value="maintenance">Maintenance (Orange)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      value="all"
                      checked={formData.target_roles.includes('all')}
                      onChange={handleRoleChange}
                    />
                    All Users
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Student"
                      checked={formData.target_roles.includes('Student') && !formData.target_roles.includes('all')}
                      onChange={handleRoleChange}
                      disabled={formData.target_roles.includes('all')}
                    />
                    Students
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Teacher"
                      checked={formData.target_roles.includes('Teacher') && !formData.target_roles.includes('all')}
                      onChange={handleRoleChange}
                      disabled={formData.target_roles.includes('all')}
                    />
                    Teachers
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Parent"
                      checked={formData.target_roles.includes('Parent') && !formData.target_roles.includes('all')}
                      onChange={handleRoleChange}
                      disabled={formData.target_roles.includes('all')}
                    />
                    Parents
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                  <small>Leave empty for no end date</small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Active (broadcast immediately if within date range)
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? 'Update Broadcast' : 'Create Broadcast'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceBroadcastManager;
