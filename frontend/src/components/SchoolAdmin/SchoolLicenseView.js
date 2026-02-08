// School License View Component for School Admin Dashboard
import React, { useState, useEffect } from 'react';
import './SchoolLicenseView.css';

const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

function SchoolLicenseView() {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  const fetchLicenseInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mongo/school-admin/license-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLicenseInfo(data.license);
      } else {
        setError(data.error || 'Failed to load license information');
      }
    } catch (error) {
      console.error('Failed to fetch license info:', error);
      setError('Failed to load license information');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current, max) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444'; // Red
    if (percentage >= 70) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  if (loading) {
    return (
      <div className="school-license-view loading">
        <div className="loading-spinner">Loading license information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="school-license-view error">
        <div className="error-message">⚠️ {error}</div>
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className="school-license-view error">
        <div className="error-message">No license information available</div>
      </div>
    );
  }

  const teacherPercentage = getUsagePercentage(licenseInfo.usage.currentTeachers, licenseInfo.limits.maxTeachers);
  const studentPercentage = getUsagePercentage(licenseInfo.usage.currentStudents, licenseInfo.limits.maxStudents);
  const classPercentage = getUsagePercentage(licenseInfo.usage.currentClasses, licenseInfo.limits.maxClasses);

  return (
    <div className="school-license-view">
      <div className="license-header">
        <div className="license-title-section">
          <h2>License Information</h2>
          <span className={`license-badge ${licenseInfo.type}`}>
            {licenseInfo.name}
          </span>
        </div>
        
        {licenseInfo.type === 'free' && (
          <button 
            className="btn-upgrade"
            onClick={() => setShowUpgradeModal(true)}
          >
            ⬆️ Upgrade License
          </button>
        )}
      </div>

      {/* Free License Expiry Warning */}
      {licenseInfo.type === 'free' && licenseInfo.expiresAt && (
        <div className={`expiry-notice ${licenseInfo.isExpired ? 'expired' : licenseInfo.isNearExpiry ? 'warning' : 'info'}`}>
          <div className="notice-icon">
            {licenseInfo.isExpired ? '🚫' : licenseInfo.isNearExpiry ? '⚠️' : '📅'}
          </div>
          <div className="notice-content">
            <strong>
              {licenseInfo.isExpired 
                ? 'License Expired' 
                : licenseInfo.isNearExpiry 
                  ? 'License Expiring Soon' 
                  : 'Free License Active'}
            </strong>
            <p>
              {licenseInfo.isExpired 
                ? 'Your license has expired. Please upgrade to continue using all features.' 
                : `Your license expires in ${licenseInfo.daysRemaining} day${licenseInfo.daysRemaining !== 1 ? 's' : ''}.`}
            </p>
          </div>
          {!licenseInfo.isExpired && (
            <button 
              className="btn-upgrade-small"
              onClick={() => setShowUpgradeModal(true)}
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {/* License Description */}
      {licenseInfo.description && (
        <div className="license-description">
          <p>{licenseInfo.description}</p>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="usage-section">
        <h3>Current Usage</h3>
        
        <div className="usage-grid">
          {/* Teachers */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">👨‍🏫</span>
              <span className="usage-label">Teachers</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentTeachers}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxTeachers === -1 ? '∞' : licenseInfo.limits.maxTeachers}
              </span>
            </div>
            {licenseInfo.limits.maxTeachers !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${teacherPercentage}%`,
                    backgroundColor: getUsageColor(teacherPercentage)
                  }}
                />
              </div>
            )}
            {teacherPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>

          {/* Students */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">👨‍🎓</span>
              <span className="usage-label">Students</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentStudents}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxStudents === -1 ? '∞' : licenseInfo.limits.maxStudents}
              </span>
            </div>
            {licenseInfo.limits.maxStudents !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${studentPercentage}%`,
                    backgroundColor: getUsageColor(studentPercentage)
                  }}
                />
              </div>
            )}
            {studentPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>

          {/* Classes */}
          <div className="usage-card">
            <div className="usage-header">
              <span className="usage-icon">🏫</span>
              <span className="usage-label">Classes</span>
            </div>
            <div className="usage-stats">
              <span className="usage-current">{licenseInfo.usage.currentClasses}</span>
              <span className="usage-separator">/</span>
              <span className="usage-limit">
                {licenseInfo.limits.maxClasses === -1 ? '∞' : licenseInfo.limits.maxClasses}
              </span>
            </div>
            {licenseInfo.limits.maxClasses !== -1 && (
              <div className="usage-bar">
                <div 
                  className="usage-bar-fill" 
                  style={{ 
                    width: `${classPercentage}%`,
                    backgroundColor: getUsageColor(classPercentage)
                  }}
                />
              </div>
            )}
            {classPercentage >= 90 && (
              <div className="usage-warning">Near limit!</div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upgrade Your License</h3>
            <p>
              To upgrade your license, please contact our sales team or visit our website 
              to explore available plans and pricing.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowUpgradeModal(false)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  window.open('mailto:sales@play2learn.com?subject=License Upgrade Request', '_blank');
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolLicenseView;
