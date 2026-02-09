// Teacher News & Updates Component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDismissedBroadcasts } from '../../utils/userUtils';
import './ViewNewsUpdates.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function ViewNewsUpdates() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    fetchBroadcasts();
    // Load dismissed broadcasts from localStorage with user-specific key
    const dismissed = getDismissedBroadcasts();
    setDismissedIds(dismissed);
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/maintenance`);
      
      if (!response.ok) {
        console.error('Broadcast fetch failed:', response.status, response.statusText);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter broadcasts relevant to teachers
        const teacherBroadcasts = (data.broadcasts || []).filter(broadcast => 
          broadcast.target_roles && 
          (broadcast.target_roles.includes('teacher') || broadcast.target_roles.includes('all'))
        );
        setBroadcasts(teacherBroadcasts);
      } else {
        console.error('Broadcast fetch unsuccessful:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'info': return '📢';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'maintenance': return '🔧';
      default: return '📰';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'info': return 'Information';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      case 'maintenance': return 'Maintenance';
      default: return 'Update';
    }
  };

  if (loading) {
    return (
      <div className="news-updates-container">
        <div className="loading">Loading news and updates...</div>
      </div>
    );
  }

  return (
    <div className="news-updates-container">
      <div className="page-header">
        <div>
          <h1>📰 News & Updates</h1>
          <p className="page-subtitle">Stay informed about system updates and announcements</p>
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/teacher')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {broadcasts.length === 0 ? (
        <div className="no-broadcasts">
          <div className="no-broadcasts-icon">📭</div>
          <h3>No Updates</h3>
          <p>There are no news or updates at this time.</p>
        </div>
      ) : (
        <div className="broadcasts-list">
          {broadcasts.map(broadcast => {
            const isDismissed = dismissedIds.includes(broadcast._id);
            const isActive = !broadcast.end_date || new Date(broadcast.end_date) > new Date();
            
            return (
              <div 
                key={broadcast._id} 
                className={`broadcast-card ${broadcast.type} ${isDismissed ? 'dismissed' : ''} ${!isActive ? 'expired' : ''}`}
              >
                <div className="broadcast-header">
                  <div className="broadcast-title-row">
                    <span className="broadcast-icon">{getTypeIcon(broadcast.type)}</span>
                    <h3>{broadcast.title}</h3>
                  </div>
                  <div className="broadcast-badges">
                    <span className={`type-badge ${broadcast.type}`}>
                      {getTypeLabel(broadcast.type)}
                    </span>
                    {isDismissed && <span className="status-badge dismissed">Dismissed</span>}
                    {!isActive && <span className="status-badge expired">Expired</span>}
                    {isActive && !isDismissed && <span className="status-badge active">Active</span>}
                  </div>
                </div>
                
                <p className="broadcast-message">{broadcast.message}</p>
                
                <div className="broadcast-footer">
                  <div className="broadcast-date">
                    <strong>Posted:</strong> {formatDate(broadcast.createdAt || broadcast.start_date)}
                  </div>
                  {broadcast.end_date && (
                    <div className="broadcast-date">
                      <strong>Until:</strong> {formatDate(broadcast.end_date)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ViewNewsUpdates;
