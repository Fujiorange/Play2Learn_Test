import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import teacherService from '../../services/teacherService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Handle menu clicks
  const handleMenuClick = (section, item) => {
    if (section === 'communication' && item === 'testimonial') {
      navigate('/teacher/testimonial');
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'Teacher' && currentUser.role !== 'Trial Teacher') {
      navigate('/login');
      return;
    }

    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
  try {
    const data = await teacherService.getDashboard();
    
    console.log('📊 Dashboard API Response:', data);
    
    if (data.success) {
      console.log('🔍 Dashboard data details:');
      console.log('- Total students:', data.data?.total_students);
      console.log('- Assigned classes:', data.data?.assigned_classes);
      
      setDashboardData(data.data);
    } else {
      console.error('Dashboard API failed:', data.error);
      
      if (data.error?.includes('token') || data.error?.includes('authenticated')) {
        authService.logout();
        navigate('/login');
      }
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // GREEN THEME - matching School Admin
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    header: {
      background: 'white',
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb',
    },
    welcomeText: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937',
    },
    roleText: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '2px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
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
      fontSize: '20px',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
    },
    logoutBtn: {
      padding: '10px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
    },
    main: {
      padding: '32px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    welcomeSection: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      color: 'white',
    },
    welcomeTitle: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    welcomeSubtitle: {
      fontSize: '16px',
      opacity: '0.9',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    statIcon: {
      fontSize: '32px',
      marginBottom: '8px',
    },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' },
    statLabel: { fontSize: '14px', color: '#6b7280', margin: 0 },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
    },
    section: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '2px solid #e5e7eb',
    },
    sectionIcon: {
      fontSize: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0,
    },
    menuList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    menuItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '8px',
      background: '#f9fafb',
    },
    menuItemHover: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
    },
    arrow: {
      fontWeight: '600',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = authService.getCurrentUser()?.name || 'Teacher';

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎓</div>
          <span style={styles.logoText}>Play2Learn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={styles.welcomeText}>{userName}</span>
            <div style={styles.roleText}>
              {authService.getCurrentUser()?.role === 'Trial Teacher' ? 'Trial Teacher' : 'Teacher'}
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome back, {userName}! 👋</h1>
          <p style={styles.welcomeSubtitle}>Primary 1 Mathematics - Manage your classes and students</p>
        </div>

        {/* Stats Cards - ONLY Students and Classes */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <p style={styles.statValue}>{dashboardData?.total_students || 0}</p>
            <p style={styles.statLabel}>Total Students</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <p style={styles.statValue}>{dashboardData?.assigned_classes?.length || 0}</p>
            <p style={styles.statLabel}>My Classes</p>
          </div>
        </div>

        {/* Menu Sections */}
        <div style={styles.sectionsGrid}>
          {/* Profile Management - Only View Profile */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>👤</span>
              <h2 style={styles.sectionTitle}>Profile Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'view-profile' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('view-profile')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/profile')}>
                <span>View Profile</span><span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Student Monitoring - No View Student Performance */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📊</span>
              <h2 style={styles.sectionTitle}>Student Monitoring</h2>
            </div>
            <ul style={styles.menuList}>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'view-students' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('view-students')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/students')}>
                <span>View Classes & Students</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'matrix' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('matrix')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/students/matrix')}>
                <span>View Student Matrix</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'leaderboard' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('leaderboard')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/students/leaderboard')}>
                <span>View Leaderboard</span><span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Communication */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>💬</span>
              <h2 style={styles.sectionTitle}>Communication</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'testimonial' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('testimonial')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'testimonial')}
              >
                <span>Write Review/Testimonial</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'announcements' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('announcements')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/announcements')}
              >
                <span>📢 School Announcements</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎫</span>
              <h2 style={styles.sectionTitle}>Support</h2>
            </div>
            <ul style={styles.menuList}>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'create-ticket' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('create-ticket')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/support/create')}>
                <span>Create Support Ticket</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'track-ticket' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('track-ticket')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/support/track')}>
                <span>Track Support Tickets</span><span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
