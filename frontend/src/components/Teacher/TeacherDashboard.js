import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mongo/teacher/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
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
    welcomeText: {
      color: '#4a5568',
      fontSize: '14px',
    },
    logoutBtn: {
      padding: '8px 20px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    content: {
      padding: '32px 40px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    welcomeSection: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '16px',
      padding: '32px',
      color: 'white',
      marginBottom: '32px',
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
      padding: '24px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    statIcon: { fontSize: '32px', marginBottom: '10px' },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' },
    statLabel: { color: '#6b7280', fontSize: '14px', margin: 0 },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px',
    },
    section: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #e2e8f0',
    },
    sectionIcon: { fontSize: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#2d3748', margin: 0 },
    menuList: { listStyle: 'none', padding: 0, margin: 0 },
    menuItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      borderRadius: '10px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: '#f7fafc',
    },
    menuItemHover: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
    },
    arrow: { fontSize: '14px' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentUser = authService.getCurrentUser();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>P2L</div>
          <span style={styles.logoText}>Play2Learn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={styles.welcomeText}>Welcome, {currentUser?.name || 'Teacher'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div style={styles.content}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Teacher Dashboard</h1>
          <p style={styles.welcomeSubtitle}>Primary 1 Mathematics - Manage your classes and students</p>
        </div>

        {/* Stats Cards */}
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
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <p style={styles.statValue}>{dashboardData?.active_quizzes || 0}</p>
            <p style={styles.statLabel}>Active Quizzes</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <p style={styles.statValue}>{dashboardData?.average_score?.toFixed(0) || 0}%</p>
            <p style={styles.statLabel}>Avg. Score</p>
          </div>
        </div>

        {/* Menu Sections */}
        <div style={styles.sectionsGrid}>
          {/* Profile Management */}
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
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'edit-profile' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('edit-profile')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/profile/edit')}>
                <span>Update Profile Details</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'update-picture' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('update-picture')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/profile/picture')}>
                <span>Update Profile Picture</span><span style={styles.arrow}>→</span>
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
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'view-students' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('view-students')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/students')}>
                <span>View Classes & Students</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'performance' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('performance')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/students/performance')}>
                <span>View Student Performance</span><span style={styles.arrow}>→</span>
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

          {/* Quiz Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎯</span>
              <h2 style={styles.sectionTitle}>Quiz Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'launch-quiz' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('launch-quiz')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/quiz-assignment')}>
                <span>Launch Adaptive Quiz</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'view-quizzes' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('view-quizzes')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/quiz-assignment')}>
                <span>View Launched Quizzes</span><span style={styles.arrow}>→</span>
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
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'create-feedback' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('create-feedback')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/feedback/create')}>
                <span>Create Feedback</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'view-feedback' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('view-feedback')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/feedback/view')}>
                <span>View Feedback History</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'chat' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('chat')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/chat')}>
                <span>Chat with Parents</span><span style={styles.arrow}>→</span>
              </li>
              <li style={{ ...styles.menuItem, ...(hoveredItem === 'testimonial' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('testimonial')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/teacher/testimonial')}>
                <span>Write Testimonial</span><span style={styles.arrow}>→</span>
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
      </div>
    </div>
  );
}
