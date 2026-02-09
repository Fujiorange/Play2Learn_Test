import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Define styles at the top level, outside the component
const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#6b7280',
    fontSize: '16px',
  },
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    padding: '20px',
  },
  innerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
  },
  title: {
    fontSize: '32px',
    color: '#1f2937',
    margin: '10px 0 5px 0',
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '16px',
    margin: 0,
  },
  logoutButton: {
    padding: '12px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    color: '#1f2937',
    marginBottom: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  infoGrid: {
    display: 'grid',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '600',
  },
  infoValue: {
    color: '#1f2937',
    fontSize: '16px',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  statCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
  },
  statValue: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '16px',
    opacity: 0.9,
  },
  successMessage: {
    padding: '20px',
    background: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '12px',
    color: '#166534',
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
  errorMessage: {
    padding: '20px',
    background: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '12px',
    color: '#dc2626',
    marginBottom: '20px',
  },
};

// Helper functions
const getRoleBadgeColor = (role) => {
  const colors = {
    'student': '#3b82f6',
    'teacher': '#10b981',
    'school-admin': '#f59e0b',
    'platform-admin': '#ef4444',
    'parent': '#8b5cf6'
  };
  return colors[role] || '#6b7280';
};

const getRoleDisplayName = (role) => {
  const names = {
    'student': 'Student',
    'teacher': 'Teacher',
    'school-admin': 'School Admin',
    'platform-admin': 'Platform Admin',
    'parent': 'Parent'
  };
  return names[role] || role;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Load dashboard data
      const result = await authService.getDashboardData();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>P</div>
              <div style={styles.logoText}>Play2Learn</div>
            </div>
            <h1 style={styles.title}>Welcome, {user.name}! 👋</h1>
            <p style={styles.subtitle}>{user.organization_name}</p>
          </div>
          
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.target.style.background = '#dc2626';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ef4444';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Logout
          </button>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* User Information Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              👤 Account Information
            </h2>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email</span>
                <span style={styles.infoValue}>{user.email}</span>
              </div>
              
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Role</span>
                <div
                  style={{
                    ...styles.badge,
                    background: getRoleBadgeColor(user.role) + '20',
                    color: getRoleBadgeColor(user.role),
                  }}
                >
                  {getRoleDisplayName(user.role)}
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Organization Type</span>
                <span style={styles.infoValue}>
                  {user.organization_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              {user.contact && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Contact</span>
                  <span style={styles.infoValue}>{user.contact}</span>
                </div>
              )}

              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Account Status</span>
                <div
                  style={{
                    ...styles.badge,
                    background: user.is_active ? '#dcfce7' : '#fee2e2',
                    color: user.is_active ? '#166534' : '#991b1b',
                  }}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Stats */}
          {dashboardData && user.role === 'student' && (
            <>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{dashboardData.points || 0}</div>
                <div style={styles.statLabel}>Total Points</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statValue}>Level {dashboardData.level || 1}</div>
                <div style={styles.statLabel}>Current Level</div>
              </div>
            </>
          )}

          {dashboardData && user.role === 'teacher' && (
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardData.total_courses || 0}</div>
              <div style={styles.statLabel}>Courses Teaching</div>
            </div>
          )}
        </div>

        {/* Success Message */}
        <div style={styles.card}>
          <div style={styles.successMessage}>
            <p style={styles.successTitle}>
              ✅ Authentication Successful!
            </p>
            <p style={styles.successText}>
              You are now logged in to your Play2Learn account. Your session is secure and your data is stored safely in the MySQL database. 
              {user.role === 'student' && ' Start your learning journey by exploring courses and completing quests!'}
              {user.role === 'teacher' && ' You can now manage your courses and track student progress.'}
              {user.role === 'school-admin' && ' Access administrative tools to manage your school.'}
              {user.role === 'parent' && ' Monitor your child\'s learning progress and achievements.'}
            </p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            🚀 Quick Actions
          </h2>
          <div style={styles.infoGrid}>
            {user.role === 'student' && (
              <>
                <p style={styles.infoValue}>• Browse available courses</p>
                <p style={styles.infoValue}>• Complete daily quests</p>
                <p style={styles.infoValue}>• Check your achievements</p>
                <p style={styles.infoValue}>• View leaderboard</p>
              </>
            )}
            {user.role === 'teacher' && (
              <>
                <p style={styles.infoValue}>• Create new courses</p>
                <p style={styles.infoValue}>• Assign quests to students</p>
                <p style={styles.infoValue}>• Review student submissions</p>
                <p style={styles.infoValue}>• Track class progress</p>
              </>
            )}
            {user.role === 'school-admin' && (
              <>
                <p style={styles.infoValue}>• Manage teachers and students</p>
                <p style={styles.infoValue}>• View school analytics</p>
                <p style={styles.infoValue}>• Approve new accounts</p>
                <p style={styles.infoValue}>• Generate reports</p>
              </>
            )}
            {user.role === 'parent' && (
              <>
                <p style={styles.infoValue}>• View child's progress</p>
                <p style={styles.infoValue}>• Communicate with teachers</p>
                <p style={styles.infoValue}>• Track assignments</p>
                <p style={styles.infoValue}>• Review achievements</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}