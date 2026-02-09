// ViewProfile.js - Clean Version (No Math Section, Original Colors)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

// Styles defined first (fixes ESLint warning)
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    padding: '32px',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  backButton: {
    padding: '10px 20px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  profileSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  value: {
    fontSize: '16px',
    color: '#1f2937',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
  },
  editButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
  },
  loadingText: {
    fontSize: '24px',
    color: '#6b7280',
    fontWeight: '600',
  },
};

export default function ViewProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Get fresh user data from server (includes accountActive field)
        const result = await authService.getCurrentUserFromServer();
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate('/student')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Personal Information */}
        <div style={styles.profileSection}>
          <h2 style={styles.sectionTitle}>Personal Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.label}>Full Name</div>
              <div style={styles.value}>{user?.name || 'N/A'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Email Address</div>
              <div style={styles.value}>{user?.email || 'N/A'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Contact Number</div>
              <div style={styles.value}>{user?.contact || 'Not provided'}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Gender</div>
              <div style={styles.value}>
                {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Date of Birth</div>
              <div style={styles.value}>
                {formatDate(user?.date_of_birth)}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div style={styles.profileSection}>
          <h2 style={styles.sectionTitle}>Academic Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.label}>Grade Level</div>
              <div style={styles.value}>Primary 1</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Subject</div>
              <div style={styles.value}>Mathematics</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.label}>Account Status</div>
              <div style={styles.value}>
                {user?.accountActive ? '✅ Active' : '❌ Inactive'}
              </div>
            </div>
            {user?.points !== undefined && (
              <div style={styles.infoItem}>
                <div style={styles.label}>Total Points</div>
                <div style={styles.value}>⭐ {user.points}</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            style={styles.editButton}
            onClick={() => navigate('/student/profile/edit')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ✏️ Edit Profile Details
          </button>
          <button
            style={styles.editButton}
            onClick={() => navigate('/student/profile/picture')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            📸 Update Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
}