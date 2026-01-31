// Maintenance Broadcast Banner Component
import React, { useState, useEffect } from 'react';
import './MaintenanceBanner.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function MaintenanceBanner({ userRole }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBroadcasts();
    // Load dismissed broadcasts from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');
    setDismissedIds(dismissed);
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/maintenance`);
      const data = await response.json();
      
      if (data.success) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (broadcastId) => {
    const newDismissed = [...dismissedIds, broadcastId];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedBroadcasts', JSON.stringify(newDismissed));
  };

  if (loading || broadcasts.length === 0) {
    return null;
  }

  // Filter broadcasts based on user role and dismissal status
  const visibleBroadcasts = broadcasts.filter(broadcast => {
    // Check if already dismissed
    if (dismissedIds.includes(broadcast._id)) return false;
    
    // Check if broadcast targets this user role
    if (broadcast.target_roles.includes('all')) return true;
    if (userRole && broadcast.target_roles.includes(userRole)) return true;
    
    return false;
  });

  if (visibleBroadcasts.length === 0) {
    return null;
  }

  return (
    <div className="maintenance-banner-container">
      {visibleBroadcasts.map(broadcast => (
        <div key={broadcast._id} className={`maintenance-banner ${broadcast.type}`}>
          <div className="banner-content">
            <div className="banner-icon">
              {broadcast.type === 'info' && '📢'}
              {broadcast.type === 'warning' && '⚠️'}
              {broadcast.type === 'critical' && '🚨'}
              {broadcast.type === 'maintenance' && '🔧'}
            </div>
            <div className="banner-text">
              <h4>{broadcast.title}</h4>
              <p>{broadcast.message}</p>
              {broadcast.end_date && (
                <small>
                  Until: {new Date(broadcast.end_date).toLocaleString()}
                </small>
              )}
            </div>
          </div>
          <button 
            className="banner-dismiss" 
            onClick={() => handleDismiss(broadcast._id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default MaintenanceBanner;
