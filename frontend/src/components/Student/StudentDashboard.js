import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

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
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s',
      cursor: 'pointer',
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
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
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      transition: 'width 0.3s',
    },
  };

  const handleMenuClick = (section, item) => {
    console.log(`Navigating to: ${section} - ${item}`);
    
    // Navigation logic based on section and item
    switch(section) {
      case 'profile':
        if (item === 'view') {
          navigate('/student/profile');
        } else if (item === 'update') {
          navigate('/student/profile/edit');
        } else if (item === 'picture') {
          navigate('/student/profile/picture');
        }
        break;
      
      case 'progress':
        if (item === 'results') {
          navigate('/student/results');
        } else if (item === 'track') {
          navigate('/student/progress');
        } else if (item === 'leaderboard') {
          navigate('/student/leaderboard');
        } else if (item === 'matrix') {
          navigate('/student/skills');
        } else if (item === 'subjects') {
          navigate('/student/subjects');
        }
        break;
      
      case 'quiz':
        if (item === 'attempt-quiz') {
          navigate('/student/quiz/attempt');
        } else if (item === 'attempt-assignment') {
          navigate('/student/assignment/attempt');
        } else if (item === 'view-result') {
          navigate('/student/results');
        } else if (item === 'history') {
          navigate('/student/results/history');
        }
        break;
      
      case 'communication':
        if (item === 'testimonial') {
          navigate('/student/testimonial');
        }
        break;
      
      case 'support':
        if (item === 'create') {
          navigate('/student/support/create');
        } else if (item === 'track') {
          navigate('/student/support/track');
        }
        break;
      
      default:
        console.log('No route defined for:', section, item);
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
              <p style={styles.userName}>{user.name || 'Student'}</p>
              <p style={styles.userRole}>
                {dashboardData?.grade_level && dashboardData.grade_level !== 'Not Set' 
                  ? dashboardData.grade_level 
                  : 'Student'}
              </p>
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
          <h1 style={styles.welcomeTitle}>Welcome back, {user.name?.split(' ')[0] || 'Student'}! 🎮</h1>
          <p style={styles.welcomeSubtitle}>
            Ready to level up your skills? Let's continue your learning adventure!
          </p>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${dashboardData?.levelProgress || 0}%`}}></div>
          </div>
          <p style={{fontSize: '12px', marginTop: '8px', opacity: 0.9}}>
            Level {dashboardData?.level || 1} - {dashboardData?.levelProgress || 0}% to Level {(dashboardData?.level || 1) + 1}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div
            style={{
              ...styles.statCard,
              ...(hoveredStat === 'points' ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat('points')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={styles.statIcon}>⭐</div>
            <p style={styles.statLabel}>Total Points</p>
            <p style={styles.statValue}>{(dashboardData?.points || 0).toLocaleString()}</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              ...(hoveredStat === 'level' ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat('level')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={styles.statIcon}>🎯</div>
            <p style={styles.statLabel}>Current Level</p>
            <p style={styles.statValue}>{dashboardData?.level || 1}</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              ...(hoveredStat === 'achievements' ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat('achievements')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={styles.statIcon}>🏆</div>
            <p style={styles.statLabel}>Achievements</p>
            <p style={styles.statValue}>{dashboardData?.achievements || 0}</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              ...(hoveredStat === 'rank' ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat('rank')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={styles.statIcon}>📊</div>
            <p style={styles.statLabel}>Class Rank</p>
            <p style={styles.statValue}>#{dashboardData?.rank || '-'}</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              ...(hoveredStat === 'quizzes' ? styles.statCardHover : {}),
            }}
            onMouseEnter={() => setHoveredStat('quizzes')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div style={styles.statIcon}>📝</div>
            <p style={styles.statLabel}>Completed Quizzes</p>
            <p style={styles.statValue}>{dashboardData?.completedQuizzes || 0}</p>
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

          {/* Learning Progress */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📚</span>
              <h2 style={styles.sectionTitle}>Learning Progress</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'view-results' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('view-results')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('progress', 'results')}
              >
                <span>View Results</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'track-progress' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('track-progress')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('progress', 'track')}
              >
                <span>Track Progress</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'leaderboard' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('leaderboard')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('progress', 'leaderboard')}
              >
                <span>View Leaderboard & Achievements</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'skill-matrix' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('skill-matrix')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('progress', 'matrix')}
              >
                <span>Display Skill Matrix</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'subject-info' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('subject-info')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('progress', 'subjects')}
              >
                <span>View Detailed Subject Info</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Quizzes & Assignments */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📝</span>
              <h2 style={styles.sectionTitle}>Quizzes & Assignments</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'attempt-quiz' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('attempt-quiz')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('quiz', 'attempt-quiz')}
              >
                <span>Attempt Quiz</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'attempt-assignment' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('attempt-assignment')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('quiz', 'attempt-assignment')}
              >
                <span>Attempt Assignment</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{
                  ...styles.menuItem,
                  ...(hoveredItem === 'result-history' ? styles.menuItemHover : {}),
                }}
                onMouseEnter={() => setHoveredItem('result-history')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('quiz', 'history')}
              >
                <span>View Result History</span>
                <span style={styles.arrow}>→</span>
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