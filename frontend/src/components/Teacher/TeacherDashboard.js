import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [buttonHovered, setButtonHovered] = useState(false);

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
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
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
    subMenuItem: {
      padding: '10px 16px',
      marginBottom: '6px',
      marginLeft: '16px',
      background: '#f3f4f6',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '13px',
      color: '#4b5563',
      border: '1px solid #e5e7eb',
    },
  };

  const handleMenuClick = (section, item) => {
    console.log(`Navigating to: ${section} - ${item}`);
    
    // Navigation logic based on section and item
    switch(section) {
      case 'profile':
        if (item === 'view') {
          navigate('/teacher/profile');
        } else if (item === 'update') {
          navigate('/teacher/profile/edit');
        } else if (item === 'picture') {
          navigate('/teacher/profile/picture');
        }
        break;
      
      case 'monitoring':
        if (item === 'student-list') {
          navigate('/teacher/students');
        } else if (item === 'performance') {
          navigate('/teacher/students/performance');
        } else if (item === 'matrix') {
          navigate('/teacher/students/matrix');
        } else if (item === 'leaderboard') {
          navigate('/teacher/students/leaderboard');
        }
        break;
      
      case 'communication':
        if (item === 'create-feedback') {
          navigate('/teacher/feedback/create');
        } else if (item === 'view-feedback') {
          navigate('/teacher/feedback/view');
        } else if (item === 'chat') {
          navigate('/teacher/chat');
        } else if (item === 'testimonial') {
          navigate('/teacher/testimonial');
        }
        break;
      
      case 'assignment':
        if (item === 'create') {
          navigate('/teacher/assignments/create');
        } else if (item === 'modify') {
          navigate('/teacher/assignments/modify');
        } else if (item === 'view-submitted') {
          navigate('/teacher/assignments/submitted');
        } else if (item === 'track') {
          navigate('/teacher/assignments/track');
        }
        break;
      
      case 'support':
        if (item === 'create') {
          navigate('/teacher/support/create');
        } else if (item === 'track') {
          navigate('/teacher/support/track');
        }
        break;
      
      default:
        console.log('No route defined for:', section, item);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
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
              <p style={styles.userName}>{user.name || 'Teacher'}</p>
              <p style={styles.userRole}>Teacher Account</p>
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
          <h1 style={styles.welcomeTitle}>Welcome back, {user.name?.split(' ')[user.name?.split(' ').length - 1] || 'Teacher'}! 👋</h1>
          <p style={styles.welcomeSubtitle}>
            Ready to inspire young minds today? Your students are excited to learn!
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <p style={styles.statLabel}>Total Classes</p>
            <p style={styles.statValue}>{dashboardData?.total_courses || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <p style={styles.statLabel}>Total Students</p>
            <p style={styles.statValue}>{dashboardData?.total_students || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <p style={styles.statLabel}>Active Assignments</p>
            <p style={styles.statValue}>{dashboardData?.active_assignments || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <p style={styles.statLabel}>Average Performance</p>
            <p style={styles.statValue}>{dashboardData?.avg_performance || 0}%</p>
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
            </ul>
          </div>

          {/* Student Monitoring */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📊</span>
              <h2 style={styles.sectionTitle}>Student Monitoring</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'view-classes' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('view-classes')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => toggleSection('classes')}
              >
                <span>View Classes</span>
                <span style={styles.arrow}>{expandedSection === 'classes' ? '▼' : '→'}</span>
              </li>
              {expandedSection === 'classes' && (
                <li style={styles.subMenuItem} onClick={() => handleMenuClick('monitoring', 'student-list')}>
                  → View Student List
                </li>
              )}
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'performance' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('performance')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'performance')}
              >
                <span>View Student Performance</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'matrix' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('matrix')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'matrix')}
              >
                <span>View Student Matrix</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'leaderboard' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('leaderboard')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('monitoring', 'leaderboard')}
              >
                <span>View Student Leaderboard</span>
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
                  ...(hoveredItem === 'create-feedback' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('create-feedback')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'create-feedback')}
              >
                <span>Create Feedback</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'view-feedback' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('view-feedback')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'view-feedback')}
              >
                <span>View Feedback Received</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'chat-parents' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('chat-parents')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('communication', 'chat')}
              >
                <span>Chat with Parents</span>
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

          {/* Quiz Assignment - NEW */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎯</span>
              <h2 style={styles.sectionTitle}>Quiz Assignment</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'launch-quiz' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('launch-quiz')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/quiz-assignment')}
              >
                <span>Launch Adaptive Quiz</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'view-launched' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('view-launched')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/quiz-assignment')}
              >
                <span>View Launched Quizzes</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Assignment Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📋</span>
              <h2 style={styles.sectionTitle}>Assignment Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'create-assignment' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('create-assignment')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('assignment', 'create')}
              >
                <span>Create Assignment</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'modify-deadline' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('modify-deadline')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('assignment', 'modify')}
              >
                <span>Modify Assignment Deadline</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'view-submitted' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('view-submitted')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('assignment', 'view-submitted')}
              >
                <span>View Submitted Assignments</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'track-completion' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('track-completion')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('assignment', 'track')}
              >
                <span>Track Student Completion</span>
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
