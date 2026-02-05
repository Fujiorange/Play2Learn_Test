// frontend/src/components/Teacher/ViewAnnouncements.js
// ✅ TEACHER VIEW - Uses existing school admin backend
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

const ViewAnnouncements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // ✅ Uses existing school admin endpoint with teachers audience
      const response = await fetch(`${API_BASE_URL}/school-admin/announcements/public?audience=teachers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements || []);
        setError('');
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

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '🚨' },
      event: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe', icon: '📅' },
      info: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', icon: 'ℹ️' }
    };
    return colors[priority] || colors.info;
  };

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.priority === filter);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '5px solid #e5e7eb',
              borderTop: '5px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>📢</span>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>
              School Announcements
            </h1>
          </div>
          <button
            onClick={() => navigate('/teacher')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: '📋 All', count: announcements.length },
            { value: 'urgent', label: '🚨 Urgent', count: announcements.filter(a => a.priority === 'urgent').length },
            { value: 'event', label: '📅 Events', count: announcements.filter(a => a.priority === 'event').length },
            { value: 'info', label: 'ℹ️ Info', count: announcements.filter(a => a.priority === 'info').length }
          ].map((category) => (
            <button
              key={category.value}
              onClick={() => setFilter(category.value)}
              style={{
                padding: '8px 16px',
                border: filter === category.value ? '2px solid #10b981' : '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: filter === category.value ? '#d1fae5' : 'white',
                color: filter === category.value ? '#065f46' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fca5a5'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📭</span>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              margin: 0
            }}>
              {filter === 'all' 
                ? 'No announcements yet. Check back later!' 
                : `No ${filter} announcements at this time.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAnnouncements.map((announcement) => {
              const priorityStyle = getPriorityColor(announcement.priority);
              
              return (
                <div
                  key={announcement._id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: announcement.pinned ? '3px solid #10b981' : 'none',
                    borderLeft: `4px solid ${priorityStyle.text}`,
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Pinned Badge */}
                  {announcement.pinned && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📌 Pinned
                    </div>
                  )}

                  {/* Priority Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: priorityStyle.bg,
                    color: priorityStyle.text,
                    border: `1px solid ${priorityStyle.border}`,
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                  }}>
                    {priorityStyle.icon} {announcement.priority}
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: '0 0 12px 0',
                    lineHeight: '1.3',
                    paddingRight: announcement.pinned ? '80px' : '0'
                  }}>
                    {announcement.title}
                  </h2>

                  {/* Content */}
                  <p style={{
                    fontSize: '16px',
                    color: '#4b5563',
                    lineHeight: '1.6',
                    margin: '0 0 16px 0',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {announcement.content}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <span>👤</span>
                      <span style={{ fontWeight: '600' }}>{announcement.author || 'School Admin'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <span>📅</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString('en-SG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ViewAnnouncements;
