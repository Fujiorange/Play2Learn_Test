// frontend/src/components/Teacher/ViewAnnouncements.js
// ✅ FIXED - Sends auth token so backend can filter by schoolId
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

const ViewAnnouncements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAnnouncements();
  }, [navigate]);

  const fetchAnnouncements = async () => {
  try {
    setLoading(true);
    
    console.log('📢 Fetching teacher announcements...');
    const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/announcements`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (data.success) {
      setAnnouncements(data.announcements || []);
      setError('');
    } else {
      setError(data.error || 'Failed to load announcements');
    }
  } catch (err) {
    console.error('❌ Error fetching announcements:', err);
    setError('Failed to load announcements. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '🚨' },
      event: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe', icon: '📅' },
      info: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', icon: 'ℹ️' }
    };
    return colors[priority] || colors.info;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'all') return true;
    return a.priority === filter;
  });

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
      padding: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1b5e20',
      margin: 0
    },
    backButton: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    filterContainer: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    filterButton: {
      padding: '8px 16px',
      border: '2px solid #43a047',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    announcementCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: '4px solid'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
      flexWrap: 'wrap',
      gap: '8px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    },
    cardContent: {
      color: '#555',
      lineHeight: '1.6',
      marginBottom: '12px'
    },
    cardMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      color: '#888',
      flexWrap: 'wrap',
      gap: '8px'
    },
    pinnedBadge: {
      background: '#fff3e0',
      color: '#e65100',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '12px'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px'
    },
    errorBox: {
      background: '#ffebee',
      color: '#c62828',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📢</div>
            <p style={{ color: '#666' }}>Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📢 School Announcements</h1>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/teacher')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.filterContainer}>
        {['all', 'urgent', 'event', 'info'].map(f => (
          <button
            key={f}
            style={{
              ...styles.filterButton,
              background: filter === f ? '#43a047' : 'white',
              color: filter === f ? 'white' : '#43a047'
            }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋 All' : f === 'urgent' ? '🚨 Urgent' : f === 'event' ? '📅 Events' : 'ℹ️ Info'}
          </button>
        ))}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>No Announcements</h3>
          <p style={{ color: '#999' }}>
            {filter === 'all' 
              ? 'There are no announcements from your school at this time.' 
              : `No ${filter} announcements found.`}
          </p>
        </div>
      ) : (
        filteredAnnouncements.map((announcement, index) => {
          const priorityStyle = getPriorityColor(announcement.priority);
          return (
            <div 
              key={announcement._id || index}
              style={{
                ...styles.announcementCard,
                borderLeftColor: priorityStyle.border
              }}
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <span>{priorityStyle.icon}</span>
                  {announcement.title}
                  {announcement.pinned && (
                    <span style={styles.pinnedBadge}>📌 Pinned</span>
                  )}
                </h3>
                <span style={{
                  ...styles.badge,
                  background: priorityStyle.bg,
                  color: priorityStyle.text
                }}>
                  {announcement.priority?.toUpperCase() || 'INFO'}
                </span>
              </div>
              
              <div style={styles.cardContent}>
                {announcement.content}
              </div>
              
              <div style={styles.cardMeta}>
                <span>By: {announcement.author || 'School Admin'}</span>
                <span>Posted: {formatDate(announcement.createdAt)}</span>
                {announcement.expiresAt && (
                  <span>Expires: {formatDate(announcement.expiresAt)}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ViewAnnouncements;
