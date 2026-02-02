import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

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

        // ✅ FIXED: Load dashboard data from MongoDB
        const dashData = await studentService.getDashboard();
        console.log('📊 Dashboard data loaded:', dashData);

        if (dashData.success) {
          // Accept both shapes:
          // - Preferred backend: dashData.dashboard (totalPoints, completedQuizzes, currentProfile)
          // - Compat layer: dashData.data (points, quizzesTaken, level)
          const dashboardInfo = dashData.dashboard || dashData.data || {};

          const points = dashboardInfo.totalPoints ?? dashboardInfo.points ?? 0;

          const completedQuizzes =
            dashboardInfo.completedQuizzes ?? dashboardInfo.quizzesTaken ?? 0;

          const level =
            dashboardInfo.level ?? dashboardInfo.currentProfile ?? 1;

          const gradeLevel = dashboardInfo.gradeLevel ?? 'Primary 1';

          // Fetch leaderboard to get user's rank
          let userRank = '#-';
          try {
            const leaderboardData = await studentService.getLeaderboard();
            if (leaderboardData.success && leaderboardData.leaderboard) {
              const currentUserRank = leaderboardData.leaderboard.find(
                (entry) => entry.isCurrentUser
              );
              if (currentUserRank) {
                userRank = `#${currentUserRank.rank}`;
              }
            }
          } catch (leaderboardError) {
            console.warn('⚠️ Could not fetch leaderboard:', leaderboardError);
          }

          setDashboardData({
            points,
            level,
            levelProgress: ((points % 500) / 500) * 100,
            achievements: dashboardInfo.achievements?.length || 0,
            rank: userRank,
            completedQuizzes,
            grade_level: gradeLevel,
          });
          console.log('✅ Dashboard data set successfully');
        } else {
          console.error('❌ Failed to load dashboard:', dashData.error);
          // Set default values
          setDashboardData({
            points: 0,
            level: 1,
            levelProgress: 0,
            achievements: 0,
            rank: '#-',
            completedQuizzes: 0,
            grade_level: 'Primary 1',
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setDashboardData({
          points: 0,
          level: 1,
          levelProgress: 0,
          achievements: 0,
          rank: '#-',
          completedQuizzes: 0,
          grade_level: 'Primary 1',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div style={styles.errorContainer}>
        <h2>Unable to load dashboard</h2>
        <p>Please try refreshing the page.</p>
        <button style={styles.button} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }

  // ✅ FIXED: Removed duplicate Skill Matrix entry
  const menuItems = [
    // 1️⃣ My Profile
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and update your profile',
      icon: '👤',
      action: () => navigate('/student/profile'),
    },
    // 2️⃣ Adaptive Quizzes
    {
      id: 'adaptive-quiz',
      title: 'Adaptive Quizzes',
      description: 'Try quizzes that adapt to your skill level',
      icon: '🎲',
      action: () => navigate('/student/adaptive-quizzes'),
    },
    // 3️⃣ Skill Matrix (KEPT THIS ONE)
    {
      id: 'skills',
      title: 'Skill Matrix',
      description: 'See your unlocked math skills',
      icon: '📊',
      action: () => navigate('/student/skills'),
    },
    // 4️⃣ View Results
    {
      id: 'results',
      title: 'View Results',
      description: 'Review your quiz results and history',
      icon: '📝',
      action: () => navigate('/student/results'),
    },
    // 5️⃣ Track Progress
    {
      id: 'progress',
      title: 'Track Progress',
      description: 'View your learning progress and stats',
      icon: '📈',
      action: () => navigate('/student/progress'),
    },
    // 6️⃣ Leaderboard
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See how you rank against classmates',
      icon: '🏆',
      action: () => navigate('/student/leaderboard'),
    },
    // ❌ REMOVED: Duplicate Skill Matrix was here (line 182-188)
    // 7️⃣ Attempt Quiz
    {
      id: 'quiz',
      title: 'Attempt Quiz',
      description: 'Take a quiz to earn points & level up',
      icon: '🎯',
      action: () => navigate('/student/quiz/attempt'),
    },
    // 8️⃣ School Announcements
    {
      id: 'announcements',
      title: 'School Announcements',
      description: 'View important school updates',
      icon: '📢',
      action: () => navigate('/student/announcements'),
    },
    // 7.5️⃣ News & Updates
    {
      id: 'news',
      title: 'News & Updates',
      description: 'View system news and broadcast messages',
      icon: '📰',
      action: () => navigate('/student/news'),
    },
    // 8️⃣ Write Testimonial
    {
      id: 'testimonial',
      title: 'Write Testimonial',
      description: 'Share feedback about your experience',
      icon: '💬',
      action: () => navigate('/student/testimonial'),
    },
    // 🔟 Create Support Ticket
    {
      id: 'support',
      title: 'Create Support Ticket',
      description: 'Need help? Contact support',
      icon: '🛠️',
      action: () => navigate('/student/support'),
    },
    // 1️⃣1️⃣ Track Support Ticket
    {
      id: 'trackTicket',
      title: 'Track Support Ticket',
      description: 'View your submitted support requests',
      icon: '📩',
      action: () => navigate('/student/support/tickets'),
    },
    // 1️⃣2️⃣ Reward Shop
    {
      id: 'shop',
      title: 'Reward Shop',
      description: 'Spend your points on cool rewards',
      icon: '🛒',
      action: () => navigate('/student/shop'),
    },
    // 1️⃣3️⃣ Badges & Shop
    {
      id: 'badges',
      title: 'Badges & Shop',
      description: 'View earned badges and spend points',
      icon: '🏆',
      action: () => navigate('/student/badges'),
    },
  ];

  const statCards = [
    {
      id: 'points',
      title: 'Total Points',
      value: dashboardData.points,
      icon: '⭐',
    },
    {
      id: 'level',
      title: 'Current Level',
      value: dashboardData.level,
      icon: '🎯',
    },
    {
      id: 'achievements',
      title: 'Achievements',
      value: dashboardData.achievements,
      icon: '🏅',
    },
    {
      id: 'rank',
      title: 'Leaderboard Rank',
      value: dashboardData.rank,
      icon: '🏆',
    },
    {
      id: 'quizzes',
      title: 'Completed Quizzes',
      value: dashboardData.completedQuizzes,
      icon: '📝',
    },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>P</div>
          <h1 style={styles.logoText}>Play2Learn</h1>
        </div>
        <div style={styles.userArea}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name || 'Student'}</span>
            <span style={styles.userRole}>{user.role || 'Student'}</span>
          </div>
          <button
            style={styles.logoutButton}
            onClick={() => {
              authService.logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>
            Welcome back, {user.name?.split(' ')[0] || 'Student'}! 🎮
          </h2>
          <p style={styles.gradeLevel}>{dashboardData.grade_level}</p>
          <div style={styles.progressContainer}>
            <div style={styles.progressText}>
              Level {dashboardData.level} - {dashboardData.levelProgress.toFixed(0)}
              % to Level {dashboardData.level + 1}
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${dashboardData.levelProgress}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div style={styles.statsGrid}>
          {statCards.map((stat) => (
            <div
              key={stat.id}
              style={{
                ...styles.statCard,
                ...(hoveredStat === stat.id ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={styles.statIcon}>{stat.icon}</div>
              <div style={styles.statTitle}>{stat.title}</div>
              <div style={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={styles.menuGrid}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.menuItem,
                ...(hoveredItem === item.id ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={item.action}
            >
              <div style={styles.menuIcon}>{item.icon}</div>
              <div style={styles.menuContent}>
                <h3 style={styles.menuTitle}>{item.title}</h3>
                <p style={styles.menuDescription}>{item.description}</p>
              </div>
              <div style={styles.arrow}>→</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    backgroundColor: '#fff',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: { margin: 0, fontSize: '20px', color: '#111827' },
  userArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontWeight: 'bold', color: '#111827' },
  userRole: { fontSize: '12px', color: '#6b7280' },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
  welcomeCard: {
    backgroundColor: '#10b981',
    color: '#fff',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  welcomeTitle: { margin: 0, fontSize: '28px', fontWeight: 'bold' },
  gradeLevel: { marginTop: '8px', marginBottom: '10px', opacity: 0.95 },
  progressContainer: { marginTop: '10px' },
  progressText: { fontSize: '14px', marginBottom: '8px' },
  progressBar: {
    height: '10px',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    textAlign: 'center',
    cursor: 'default',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  statIcon: { fontSize: '26px', marginBottom: '8px' },
  statTitle: { color: '#6b7280', fontSize: '13px' },
  statValue: { fontSize: '26px', fontWeight: 'bold', marginTop: '6px' },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  menuIcon: { fontSize: '26px', marginRight: '12px' },
  menuContent: { flex: 1 },
  menuTitle: { margin: 0, color: '#111827' },
  menuDescription: { margin: '6px 0 0', color: '#6b7280', fontSize: '13px' },
  arrow: { fontSize: '18px', color: '#9ca3af' },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingSpinner: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #10b981',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { marginTop: '15px', color: '#6b7280' },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '20px',
    textAlign: 'center',
  },
  button: {
    marginTop: '14px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};