// frontend/src/components/SchoolAdmin/ManageAnnouncements.js
// School Admin Announcement Management - Create, Edit, Delete Announcements
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/mongo'
    : `${window.location.origin}/api/mongo`);

export default function ManageAnnouncements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'info',
    audience: 'all',
    pinned: false,
    expiresAt: ''
  });
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

    setUser(currentUser);
    fetchAnnouncements();
  }, [navigate]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/school-admin/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements || []);
      } else {
        setError(data.error || 'Failed to load announcements');
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'info',
      audience: 'all',
      pinned: false,
      expiresAt: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `${API_URL}/school-admin/announcements/${editingId}`
        : `${API_URL}/school-admin/announcements`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingId ? 'Announcement updated successfully!' : 'Announcement created successfully!');
        resetForm();
        fetchAnnouncements();
      } else {
        setError(data.error || 'Failed to save announcement');
      }
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Failed to save announcement. Please try again.');
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || 'info',
      audience: announcement.audience || 'all',
      pinned: announcement.pinned || false,
      expiresAt: announcement.expiresAt 
        ? new Date(announcement.expiresAt).toISOString().split('T')[0] 
        : ''
    });
    setEditingId(announcement._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/school-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Announcement deleted successfully!');
        setDeleteConfirm(null);
        fetchAnnouncements();
      } else {
        setError(data.error || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      event: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
      info: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }
    };
    return colors[priority] || colors.info;
  };

  const getAudienceLabel = (audience) => {
    const labels = {
      all: '👥 All Users',
      students: '🎓 Students Only',
      teachers: '👨‍🏫 Teachers Only',
      parents: '👨‍👩‍👧 Parents Only'
    };
    return labels[audience] || audience;
  };

  if (loading && !user) {
    return (
      <div className="sa-loading">
        <div className="sa-loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sa-container">
      {/* Header */}
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn - School Admin</span>
          </div>
          <div className="sa-header-right">
            <div className="sa-user-info">
              <p className="sa-user-name">{user?.name}</p>
              <p className="sa-user-role">School Admin</p>
            </div>
            <button 
              className="sa-button-danger"
              onClick={() => navigate('/school-admin')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="sa-main-wide">
        {/* Page Title */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="sa-page-title">📢 Manage Announcements</h1>
            <p className="sa-page-subtitle" style={{ marginBottom: 0 }}>
              Create and manage school-wide announcements for students, teachers, and parents.
            </p>
          </div>
          {!showForm && (
            <button 
              className="sa-button-primary"
              onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
            >
              + Create Announcement
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && <div className="sa-message sa-message-success">{success}</div>}
        {error && <div className="sa-message sa-message-error">{error}</div>}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="sa-card-large" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1f2937' }}>
              {editingId ? '✏️ Edit Announcement' : '📝 Create New Announcement'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="sa-form-group">
                <label className="sa-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="sa-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div className="sa-form-group">
                <label className="sa-label">Content *</label>
                <textarea
                  name="content"
                  className="sa-textarea"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter announcement content"
                  rows={5}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="sa-form-group">
                  <label className="sa-label">Priority</label>
                  <select
                    name="priority"
                    className="sa-select"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="info">ℹ️ Information</option>
                    <option value="event">📅 Event</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div className="sa-form-group">
                  <label className="sa-label">Target Audience</label>
                  <select
                    name="audience"
                    className="sa-select"
                    value={formData.audience}
                    onChange={handleInputChange}
                  >
                    <option value="all">👥 All Users</option>
                    <option value="students">🎓 Students Only</option>
                    <option value="teachers">👨‍🏫 Teachers Only</option>
                    <option value="parents">👨‍👩‍👧 Parents Only</option>
                  </select>
                </div>

                <div className="sa-form-group">
                  <label className="sa-label">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    name="expiresAt"
                    className="sa-input"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="sa-form-group" style={{ marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="pinned"
                    checked={formData.pinned}
                    onChange={handleInputChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    📌 Pin this announcement (will appear at the top)
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="sa-button-primary">
                  {editingId ? 'Update Announcement' : 'Create Announcement'}
                </button>
                <button 
                  type="button" 
                  className="sa-button-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="sa-card-large">
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1f2937' }}>
            📋 All Announcements ({announcements.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📭</span>
              <p style={{ fontSize: '18px', margin: 0 }}>
                No announcements yet. Create your first announcement!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {announcements.map((announcement) => {
                const priorityStyle = getPriorityColor(announcement.priority);
                
                return (
                  <div
                    key={announcement._id}
                    style={{
                      background: '#f9fafb',
                      borderRadius: '12px',
                      padding: '20px',
                      border: announcement.pinned ? '2px solid #10b981' : '1px solid #e5e7eb',
                      borderLeft: `4px solid ${priorityStyle.text}`,
                      position: 'relative'
                    }}
                  >
                    {/* Pinned Badge */}
                    {announcement.pinned && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        📌 Pinned
                      </div>
                    )}

                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: priorityStyle.bg,
                        color: priorityStyle.text,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {announcement.priority}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getAudienceLabel(announcement.audience)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: '0 0 8px 0',
                      paddingRight: announcement.pinned ? '80px' : '0'
                    }}>
                      {announcement.title}
                    </h3>

                    {/* Content Preview */}
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.5',
                      margin: '0 0 16px 0',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {announcement.content.length > 200 
                        ? `${announcement.content.substring(0, 200)}...` 
                        : announcement.content}
                    </p>

                    {/* Footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        <span>👤 {announcement.author || 'School Admin'}</span>
                        <span style={{ margin: '0 12px' }}>•</span>
                        <span>📅 {new Date(announcement.createdAt).toLocaleDateString('en-SG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                        {announcement.expiresAt && (
                          <>
                            <span style={{ margin: '0 12px' }}>•</span>
                            <span>⏰ Expires: {new Date(announcement.expiresAt).toLocaleDateString('en-SG')}</span>
                          </>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="sa-button-action"
                          onClick={() => handleEdit(announcement)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="sa-button-danger"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => setDeleteConfirm(announcement._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="sa-modal">
          <div className="sa-modal-content">
            <h3 className="sa-modal-title">🗑️ Delete Announcement?</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="sa-modal-buttons">
              <button 
                className="sa-modal-button-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="sa-modal-button-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
