import React, { useState, useEffect } from 'react';

// Reusable component for Student, Teacher, Parent dashboards
// Usage: <AnnouncementBanner userRole="student" />

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`);

const priorityConfig = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚨' },
  event: { label: 'Event', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '📅' },
  info: { label: 'Info', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️' }
};

export default function AnnouncementBanner({ userRole = 'all' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadAnnouncements();
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedIds(dismissed);
  }, [userRole]);

  const loadAnnouncements = async () => {
    try {
      // Fetch from public announcements endpoint (no auth required)
      const response = await fetch(`${API_URL}/mongo/school-admin/announcements/public?audience=${userRole}`);
      const data = await response.json();
      
      if (data.success && data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a._id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {visibleAnnouncements.map(announcement => {
        const config = priorityConfig[announcement.priority] || priorityConfig.info;
        const isExpanded = expandedId === announcement._id;
        const isLongContent = (announcement.content?.length || 0) > 100;

        return (
          <div key={announcement._id} style={{
            background: config.bg,
            border: `2px solid ${config.border}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '12px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '20px' }}>{config.icon}</span>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: config.color }}>
                  {announcement.title}
                </h4>
                {announcement.pinned && <span title="Pinned">📌</span>}
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: config.color,
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {config.label}
                </span>
              </div>
              {!announcement.pinned && (
                <button 
                  onClick={() => dismissAnnouncement(announcement._id)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1 }}
                  title="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
            
            <p style={{
              margin: '8px 0 0 28px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
              ...(isLongContent && !isExpanded ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' } : {})
            }}>
              {announcement.content}
            </p>
            
            {isLongContent && (
              <button 
                onClick={() => setExpandedId(isExpanded ? null : announcement._id)}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', padding: 0, marginLeft: '28px', marginTop: '4px' }}
              >
                {isExpanded ? 'Show less' : 'Read more...'}
              </button>
            )}
            
            <div style={{ margin: '8px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
              Posted: {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown'}
              {announcement.author && ` by ${announcement.author}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
