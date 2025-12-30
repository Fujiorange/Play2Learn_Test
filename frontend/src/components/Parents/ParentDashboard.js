import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    // Check authentication and load user data
    const loadUserData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Get user from localStorage first (fast)
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // Then fetch fresh data from server
        const result = await authService.getCurrentUserFromServer();
        if (result.success) {
          setUser(result.user);
        }

        // Load dashboard data
        const dashData = await authService.getDashboardData();
        if (dashData.success) {
          setDashboardData(dashData.data);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      }}>
        <div style={{
          fontSize: '24px',
          color: '#6b7280',
          fontWeight: '600',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    header: {
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 0',
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      fontWeight: 'bold',
      fontSize: '18px',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    userInfo: {
      textAlign: 'right',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0,
    },
    userRole: {
      fontSize: '12px',
      color: '#6b7280',
      margin: '2px 0 0 0',
    },
    logoutBtn: {
      padding: '8px 20px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    main: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '32px',
    },
    welcomeSection: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '16px',
      padding: '32px',
      color: 'white',
      marginBottom: '32px',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    welcomeTitle: {
      fontSize: '28px',
      fontWeight: '700',
      margin: '0 0 8px 0',
    },
    welcomeSubtitle: {
      fontSize: '16px',
      opacity: 0.9,
      margin: 0,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    statIcon: {
      fontSize: '32px',
      marginBottom: '8px',
    },
    statLabel: {
      fontSize: '13px',
      color: '#6b7280',
      margin: '0 0 4px 0',
      fontWeight: '500',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px',
    },
    section: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e5e7eb',
    },
    sectionIcon: {
      fontSize: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    menuList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    menuItem: {
      padding: '12px 16px',
      marginBottom: '8px',
      background: '#f9fafb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      border: '2px solid transparent',
    },
    menuItemHover: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      transform: 'translateX(4px)',
      borderColor: '#10b981',
    },
    arrow: {
      fontSize: '16px',
      opacity: 0.6,
    },
  };

  const handleMenuClick = (section, item) => {
    console.log(`Navigating to: ${section} - ${item}`);
    
    // Navigation logic
    if (section === 'profile') {
      if (item === 'view') navigate('/parent/profile');
      else if (item === 'update') navigate('/parent/profile/edit');
      else if (item === 'picture') navigate('/parent/profile/picture');
      else if (item === 'child-details') navigate('/parent/children');
    } else if (section === 'monitoring') {
      if (item === 'progression') navigate('/parent/children/progress');
      else if (item === 'skill-matrix') navigate('/parent/children/performance');
      else if (item === 'assessment') navigate('/parent/children/performance');
      else if (item === 'rewards') navigate('/parent/children/progress');
    } else if (section === 'communication') {
      if (item === 'chat') navigate('/parent/chat');
      else if (item === 'announcements') navigate('/parent/feedback');
      else if (item === 'testimonial') navigate('/parent/testimonial');
    } else if (section === 'support') {
      if (item === 'create') navigate('/parent/support/create');
      else if (item === 'track') navigate('/parent/support/track');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>Play2Learn</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.name || 'Parent'}</p>
              <p style={styles.userRole}>Parent Account</p>
            </div>
            <button
              style={styles.logoutBtn}
              onClick={handleLogout}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome, {user.name?.split(' ')[0] || 'Parent'}! 👨‍👩‍👧‍👦</h1>
          <p style={styles.welcomeSubtitle}>
            Stay connected with your child's learning journey and track their progress!
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👶</div>
            <p style={styles.statLabel}>Children Registered</p>
            <p style={styles.statValue}>{dashboardData?.total_children || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <p style={styles.statLabel}>Average Progress</p>
            <p style={styles.statValue}>{dashboardData?.avg_progress || 0}%</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏆</div>
            <p style={styles.statLabel}>Total Achievements</p>
            <p style={styles.statValue}>{dashboardData?.total_achievements || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💬</div>
            <p style={styles.statLabel}>Unread Messages</p>
            <p style={styles.statValue}>{dashboardData?.unread_messages || 0}</p>
          </div>
        </div>

        {/* Sections Grid */}
        <div style={styles.sectionsGrid}>
          {/* Profile Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>👤</span>
              <h2 style={styles.sectionTitle}>Profile Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'profile-view' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('profile-view')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('profile', 'view')}
              >
                <span>View Profile Page</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'profile-update' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('profile-update')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('profile', 'update')}
              >
                <span>Update Profile Details</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'profile-picture' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('profile-picture')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('profile', 'picture')}
              >
                <span>Update Profile Picture</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'child-details' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('child-details')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('profile', 'child-details')}
              >
                <span>Update Child's Details</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Child's Monitoring */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📈</span>
              <h2 style={styles.sectionTitle}>Child's Monitoring</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'progression-chart' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('progression-chart')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'progression')}
              >
                <span>View Child's Progression Chart</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'skill-matrix' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('skill-matrix')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'skill-matrix')}
              >
                <span>View Child's Skill Matrix</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'assessment' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('assessment')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'assessment')}
              >
                <span>View Detailed Assessment Reports</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'rewards' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('rewards')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'rewards')}
              >
                <span>View Child's Incentives/Rewards</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Communication & Feedback */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>💬</span>
              <h2 style={styles.sectionTitle}>Communication</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'chat-teachers' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('chat-teachers')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'chat')}
              >
                <span>Chat with Teachers/Lecturers</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'announcements' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('announcements')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'announcements')}
              >
                <span>View Announcements</span>
                <span style={styles.arrow}>→</span>
              </li>
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
            </ul>
          </div>

          {/* Support */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎫</span>
              <h2 style={styles.sectionTitle}>Support & Assistance</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'create-ticket' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('create-ticket')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('support', 'create')}
              >
                <span>Create Support Ticket</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'track-ticket' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('track-ticket')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('support', 'track')}
              >
                <span>Track Support Ticket</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}