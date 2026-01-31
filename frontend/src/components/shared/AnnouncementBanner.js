import React, { useState, useEffect } from 'react';
import './AnnouncementBanner.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function AnnouncementBanner({ userRole }) {
  const [announcements, setAnnouncements] = useState([]);
  const [maintenanceNotices, setMaintenanceNotices] = useState([]);
  const [dismissedItems, setDismissedItems] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
    fetchMaintenanceNotices();
    loadDismissedItems();
  }, [userRole]);

  const fetchAnnouncements = async () => {
    try {
      // Map role to audience parameter
      let audience = 'all';
      if (userRole === 'Parent') audience = 'parents';
      else if (userRole === 'Student') audience = 'students';
      else if (userRole === 'Teacher') audience = 'teachers';

      const response = await fetch(`${API_BASE_URL}/school-admin/announcements/public?audience=${audience}`);
      const data = await response.json();

      if (data.success) {
        // Only show pinned announcements in banner
        const pinnedAnnouncements = (data.announcements || [])
          .filter(ann => ann.pinned && ann.priority === 'urgent')
          .slice(0, 2); // Limit to 2 most urgent
        setAnnouncements(pinnedAnnouncements);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const fetchMaintenanceNotices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/auth/maintenance-notices`);
      const data = await response.json();

      if (data.success) {
        // Filter notices for the current user's role
        const relevantNotices = data.data.filter((notice) => {
          return (
            notice.targetRoles.includes('all') ||
            notice.targetRoles.includes(userRole)
          );
        });
        setMaintenanceNotices(relevantNotices);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance notices:', error);
    }
  };

  const loadDismissedItems = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedBannerItems') || '[]');
    setDismissedItems(dismissed);
  };

  const dismissItem = (itemId, type) => {
    const updated = [...dismissedItems, `${type}-${itemId}`];
    setDismissedItems(updated);
    localStorage.setItem('dismissedBannerItems', JSON.stringify(updated));
  };

  const activeAnnouncements = announcements.filter(
    (ann) => !dismissedItems.includes(`announcement-${ann._id}`)
  );

  const activeNotices = maintenanceNotices.filter(
    (notice) => !dismissedItems.includes(`notice-${notice._id}`)
  );

  const allItems = [
    ...activeAnnouncements.map(ann => ({ ...ann, type: 'announcement' })),
    ...activeNotices.map(notice => ({ ...notice, type: 'maintenance' }))
  ];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="announcement-banner-container">
      {allItems.map((item) => {
        const isAnnouncement = item.type === 'announcement';
        const itemId = item._id;
        
        return (
          <div 
            key={`${item.type}-${itemId}`} 
            className={`announcement-banner ${isAnnouncement ? 'urgent' : item.type}`}
          >
            <div className="banner-icon">
              {isAnnouncement && '📢'}
              {item.type === 'urgent' && '⚠️'}
              {item.type === 'warning' && '⚡'}
              {item.type === 'maintenance' && '🔧'}
              {item.type === 'info' && 'ℹ️'}
            </div>
            <div className="banner-content">
              <h4>{isAnnouncement ? item.title : item.title}</h4>
              <p>{isAnnouncement ? item.content : item.message}</p>
              {!isAnnouncement && item.endDate && (
                <small>
                  Active until {new Date(item.endDate).toLocaleString()}
                </small>
              )}
            </div>
            <button
              className="banner-dismiss"
              onClick={() => dismissItem(itemId, item.type)}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default AnnouncementBanner;
