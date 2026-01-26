import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

const statusConfig = {
  scheduled: { label: 'Scheduled', color: '#2563eb', bg: '#eff6ff', icon: '📅' },
  active: { label: 'Active', color: '#d97706', bg: '#fffbeb', icon: '🔄' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fffbeb', icon: '⚙️' },
  completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6', icon: '❌' }
};

export default function MaintenanceMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', description: '', scheduledDate: '', startTime: '02:00', endTime: '04:00', notifyBefore: '24'
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role?.toLowerCase() !== 'school-admin') { navigate('/login'); return; }
    loadMessages();
  }, [navigate]);

  const loadMessages = async () => {
    try {
      const result = await schoolAdminService.getMaintenanceMessages();
      if (result.success) {
        setMessages(result.messages || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load' });
      }
    } catch (error) {
      console.error('Error loading maintenance messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      title: '', description: '', 
      scheduledDate: tomorrow.toISOString().split('T')[0], 
      startTime: '02:00', endTime: '04:00', notifyBefore: '24'
    });
    setEditingId(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (msg) => {
    setEditingId(msg._id);
    setFormData({
      title: msg.title,
      description: msg.description,
      scheduledDate: msg.scheduledDate ? new Date(msg.scheduledDate).toISOString().split('T')[0] : '',
      startTime: msg.startTime || '02:00',
      endTime: msg.endTime || '04:00',
      notifyBefore: msg.notifyBefore || '24'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scheduledDate) {
      setMessage({ type: 'error', text: 'Please fill in title and date' });
      return;
    }
    try {
      let result;
      if (editingId) {
        result = await schoolAdminService.updateMaintenanceMessage(editingId, formData);
      } else {
        result = await schoolAdminService.createMaintenanceMessage(formData);
      }
      if (result.success) {
        setMessage({ type: 'success', text: editingId ? 'Updated!' : 'Created!' });
        setShowModal(false);
        loadMessages();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleStatusChange = async (msg, newStatus) => {
    try {
      await schoolAdminService.updateMaintenanceMessage(msg._id, { status: newStatus });
      setMessage({ type: 'success', text: `Status updated to ${newStatus}` });
      loadMessages();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async () => {
    try {
      const result = await schoolAdminService.deleteMaintenanceMessage(selectedMessage._id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Deleted!' });
        loadMessages();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
    setShowDeleteModal(false);
    setSelectedMessage(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getCountdown = (scheduledDate) => {
    if (!scheduledDate) return '';
    const now = new Date();
    const date = new Date(scheduledDate);
    const diffMs = date - now;
    if (diffMs < 0) return 'Past';
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'Soon';
  };

  const filteredMessages = messages
    .filter(m => filter === 'all' || m.status === filter)
    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  const statusCounts = {
    all: messages.length,
    scheduled: messages.filter(m => m.status === 'scheduled').length,
    active: messages.filter(m => m.status === 'active' || m.status === 'in_progress').length,
    completed: messages.filter(m => m.status === 'completed').length
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
        <div className="badge-page-header">
          <div>
            <h1 className="sa-page-title">🔧 System Maintenance</h1>
            <p className="sa-page-subtitle">Schedule and manage maintenance windows (Stored in Database)</p>
          </div>
          <button className="sa-button-primary" onClick={openCreateModal}>+ Schedule Maintenance</button>
        </div>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="points-tabs">
          <button className={`points-tab ${filter === 'all' ? 'points-tab-active' : ''}`} onClick={() => setFilter('all')}>All ({statusCounts.all})</button>
          <button className={`points-tab ${filter === 'scheduled' ? 'points-tab-active' : ''}`} onClick={() => setFilter('scheduled')}>📅 Scheduled ({statusCounts.scheduled})</button>
          <button className={`points-tab ${filter === 'active' ? 'points-tab-active' : ''}`} onClick={() => setFilter('active')}>🔄 Active ({statusCounts.active})</button>
          <button className={`points-tab ${filter === 'completed' ? 'points-tab-active' : ''}`} onClick={() => setFilter('completed')}>✅ Completed ({statusCounts.completed})</button>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No maintenance scheduled</p>
            <p style={{ color: '#9ca3af' }}>Schedule maintenance to notify users of upcoming downtime</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredMessages.map(msg => {
              const status = statusConfig[msg.status] || statusConfig.scheduled;
              const countdown = getCountdown(msg.scheduledDate);
              return (
                <div key={msg._id} className="sa-card" style={{ borderLeft: `4px solid ${status.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{msg.title}</h3>
                      <p style={{ color: '#6b7280', margin: 0 }}>{msg.description}</p>
                    </div>
                    <span className="sa-badge" style={{ background: status.bg, color: status.color }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                    <span>📅 {msg.scheduledDate ? new Date(msg.scheduledDate).toLocaleDateString() : 'No date'}</span>
                    <span>🕐 {msg.startTime} - {msg.endTime}</span>
                    <span>⏰ Notify {msg.notifyBefore}h before</span>
                    {msg.status === 'scheduled' && countdown !== 'Past' && (
                      <span style={{ color: '#d97706', fontWeight: '600' }}>⏳ {countdown}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {msg.status === 'scheduled' && (
                        <button className="sa-button-warning" onClick={() => handleStatusChange(msg, 'active')}>▶️ Start</button>
                      )}
                      {(msg.status === 'active' || msg.status === 'in_progress') && (
                        <button className="sa-button-enable" onClick={() => handleStatusChange(msg, 'completed')}>✅ Complete</button>
                      )}
                      {msg.status === 'scheduled' && (
                        <button className="sa-button-secondary" onClick={() => handleStatusChange(msg, 'cancelled')}>Cancel</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="sa-button-action" onClick={() => openEditModal(msg)}>Edit</button>
                      <button className="sa-button-danger" style={{ padding: '6px 12px' }} onClick={() => { setSelectedMessage(msg); setShowDeleteModal(true); }}>🗑️</button>
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
            <h2 className="sa-modal-title">{editingId ? '✏️ Edit Maintenance' : '🔧 Schedule Maintenance'}</h2>

            <div className="sa-form-group">
              <label className="sa-label">Title *</label>
              <input type="text" className="sa-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Server Upgrade" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Description</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What will be done during maintenance?" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Scheduled Date *</label>
              <input type="date" className="sa-input" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sa-form-group">
                <label className="sa-label">Start Time</label>
                <input type="time" className="sa-input" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div className="sa-form-group">
                <label className="sa-label">End Time</label>
                <input type="time" className="sa-input" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Notify Users Before</label>
              <select className="sa-select" value={formData.notifyBefore} onChange={(e) => setFormData({ ...formData, notifyBefore: e.target.value })}>
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
              </select>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>{editingId ? 'Save' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMessage && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Maintenance</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedMessage.title}"</strong>?
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
