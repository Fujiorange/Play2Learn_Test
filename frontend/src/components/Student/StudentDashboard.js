import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';
import AnnouncementBanner from '../shared/AnnouncementBanner';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Get user from localStorage first (fast)
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        // Set initial permissions from localStorage user (might be stale)
        if (currentUser?.permissions) {
          setPermissions(currentUser.permissions);
        }

        // Then fetch fresh data from server (includes updated permissions)
        const result = await authService.getCurrentUserFromServer();
        if (result.success) {
          setUser(result.user);
          // Load permissions from user object - use what's in DB
          const userPerms = result.user.permissions;
          console.log('🔐 Permissions from server:', userPerms);
          
          if (userPerms && Object.keys(userPerms).length > 0) {
            // User has permissions set - use them directly
            setPermissions(userPerms);
          } else {
            // No permissions set - default to all allowed
            setPermissions({
              canAccessPoints: true,
              canAccessBadges: true,
              canAccessShop: true,
              canAccessLeaderboard: true,
              canTakeQuizzes: true,
              canViewProgress: true,
              canCreateTickets: true
            });
          }
        }

        // Load dashboard data from MongoDB
        const dashData = await studentService.getDashboard();
        console.log('📊 Dashboard data loaded:', dashData);

        if (dashData.success) {
          const dashboardInfo = dashData.dashboard || dashData.data || {};
          const points = dashboardInfo.totalPoints ?? dashboardInfo.points ?? 0;
          const completedQuizzes = dashboardInfo.completedQuizzes ?? dashboardInfo.quizzesTaken ?? 0;
          const level = dashboardInfo.level ?? dashboardInfo.currentProfile ?? 1;
          const gradeLevel = dashboardInfo.gradeLevel ?? 'Primary 1';

          setDashboardData({
            points,
            level,
            levelProgress: ((points % 500) / 500) * 100,
            achievements: dashboardInfo.achievements?.length || 0,
            rank: '#-',
            completedQuizzes,
            grade_level: gradeLevel,
          });
        } else {
          setDashboardData({
            points: 0, level: 1, levelProgress: 0, achievements: 0,
            rank: '#-', completedQuizzes: 0, grade_level: 'Primary 1',
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setDashboardData({
          points: 0, level: 1, levelProgress: 0, achievements: 0,
          rank: '#-', completedQuizzes: 0, grade_level: 'Primary 1',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // Check if a feature is allowed
  const isAllowed = (permissionKey) => {
    if (!permissions) return true; // Default allow if permissions not loaded
    return permissions[permissionKey] !== false;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={styles.errorContainer}>
        <h2>Unable to load dashboard</h2>
        <p>Please try refreshing the page</p>
        <button style={styles.button} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }

  // Menu items with permission requirements
  const allMenuItems = [
    {
      id: 'quiz',
      title: 'Attempt Quiz',
      description: 'Take a quiz to earn points & level up',
      icon: '🎯',
      action: () => navigate('/student/quiz/attempt'),
      permission: 'canTakeQuizzes',
    },
    {
      id: 'skills',
      title: 'Skill Matrix',
      description: 'See your unlocked math skills',
      icon: '📊',
      action: () => navigate('/student/skills'),
      permission: 'canViewProgress',
    },
    {
      id: 'progress',
      title: 'Track Progress',
      description: 'View your learning progress and stats',
      icon: '📈',
      action: () => navigate('/student/progress'),
      permission: 'canViewProgress',
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See how you rank against classmates',
      icon: '🏆',
      action: () => navigate('/student/leaderboard'),
      permission: 'canAccessLeaderboard',
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and update your profile',
      icon: '👤',
      action: () => navigate('/student/profile'),
      permission: null, // Always allowed
    },
    {
      id: 'results',
      title: 'View Results',
      description: 'Review your quiz results and history',
      icon: '📝',
      action: () => navigate('/student/results'),
      permission: 'canViewProgress',
    },
    {
      id: 'testimonial',
      title: 'Write Testimonial',
      description: 'Share feedback about your experience',
      icon: '💬',
      action: () => navigate('/student/testimonial'),
      permission: null, // Always allowed
    },
    {
      id: 'support',
      title: 'Create Support Ticket',
      description: 'Need help? Contact support',
      icon: '🛠️',
      action: () => navigate('/student/support'),
      permission: 'canCreateTickets',
    },
    {
      id: 'trackTicket',
      title: 'Track Support Ticket',
      description: 'View your submitted support requests',
      icon: '📩',
      action: () => navigate('/student/support/tickets'),
      permission: 'canCreateTickets',
    },
    {
      id: 'badges',
      title: 'Badges & Shop',
      description: 'View earned badges and spend points',
      icon: '🏆',
      action: () => navigate('/student/badges'),
      permission: 'canAccessBadges',
    },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.map(item => ({
    ...item,
    disabled: item.permission && !isAllowed(item.permission)
  }));

  const statCards = [
    {
      id: 'points',
      title: 'Total Points',
      value: isAllowed('canAccessPoints') ? dashboardData.points : '🔒',
      icon: '⭐',
    },
    {
      id: 'level',
      title: 'Current Level',
      value: dashboardData.level,
      icon: '🎮',
    },
    {
      id: 'quizzes',
      title: 'Completed Quizzes',
      value: dashboardData.completedQuizzes,
      icon: '✅',
    },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleMenuClick = (item) => {
    if (item.disabled) {
      alert(`${item.title} has been disabled by your school administrator.`);
      return;
    }
    item.action();
  };

  return (
    <div style={styles.container}>
      {/* Announcement Banner */}
      <AnnouncementBanner userRole="student" />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>Play2Learn</span>
          </div>
          <div style={styles.userSection}>
            <span style={styles.welcomeText}>
              Welcome, <strong>{user?.name || 'Student'}</strong>!
            </span>
            <span style={styles.gradeTag}>{dashboardData.grade_level}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Stats Section */}
        <section style={styles.statsSection}>
          <div style={styles.levelCard}>
            <div style={styles.levelInfo}>
              Level {dashboardData.level} - {dashboardData.levelProgress.toFixed(0)}%
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${dashboardData.levelProgress}%`,
                }}
              />
            </div>
          </div>
          <div style={styles.statCardsRow}>
            {statCards.map((stat) => (
              <div
                key={stat.id}
                style={{
                  ...styles.statCard,
                  ...(hoveredStat === stat.id ? styles.statCardHover : {}),
                }}
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span style={styles.statIcon}>{stat.icon}</span>
                <span style={styles.statValue}>{stat.value}</span>
                <span style={styles.statTitle}>{stat.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Grid */}
        <section style={styles.menuSection}>
          <h2 style={styles.sectionTitle}>What would you like to do?</h2>
          <div style={styles.menuGrid}>
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...styles.menuCard,
                  ...(hoveredItem === item.id && !item.disabled ? styles.menuCardHover : {}),
                  ...(item.disabled ? styles.menuCardDisabled : {}),
                }}
              >
                <span style={styles.menuIcon}>{item.disabled ? '🔒' : item.icon}</span>
                <h3 style={{
                  ...styles.menuTitle,
                  ...(item.disabled ? styles.menuTitleDisabled : {})
                }}>
                  {item.title}
                </h3>
                <p style={{
                  ...styles.menuDescription,
                  ...(item.disabled ? styles.menuDescriptionDisabled : {})
                }}>
                  {item.disabled ? 'This feature has been disabled' : item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: 'white',
    fontSize: '18px',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '16px 0',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '20px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  welcomeText: {
    fontSize: '16px',
    color: '#555',
  },
  gradeTag: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  logoutButton: {
    padding: '8px 16px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    transition: 'all 0.2s',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  statsSection: {
    marginBottom: '32px',
  },
  levelCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '20px',
  },
  levelInfo: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  progressBar: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '6px',
    transition: 'width 0.5s ease',
  },
  statCardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
  statIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    display: 'block',
  },
  statTitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
    display: 'block',
  },
  menuSection: {
    marginTop: '16px',
  },
  sectionTitle: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  menuCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  menuCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
  menuCardDisabled: {
    background: 'rgba(200, 200, 200, 0.7)',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  menuIcon: {
    fontSize: '36px',
    display: 'block',
    marginBottom: '12px',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  menuTitleDisabled: {
    color: '#888',
  },
  menuDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4',
  },
  menuDescriptionDisabled: {
    color: '#999',
  },
  button: {
    padding: '12px 24px',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '16px',
  },
};
