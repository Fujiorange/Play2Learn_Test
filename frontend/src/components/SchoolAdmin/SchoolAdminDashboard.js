import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // REAL API CALL - Fetches from database!
      const result = await schoolAdminService.getDashboardStats();

      if (result.success) {
        setDashboardData({
          total_students: result.total_students || 0,
          total_classes: result.total_classes || 0,
          total_teachers: result.total_teachers || 0,
          total_parents: result.total_parents || 0,
        });
      } else {
        console.error('Failed to load dashboard stats:', result.error);
        setDashboardData({
          total_students: 0,
          total_classes: 0,
          total_teachers: 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData({
        total_students: 0,
        total_classes: 0,
        total_teachers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
        <div style={{ fontSize: '24px', color: '#6b7280', fontWeight: '600' }}>Loading...</div>
      </div>
    );
  }

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
    userInfo: { textAlign: 'right' },
    userName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 },
    userRole: { fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' },
    logoutBtn: { padding: '8px 20px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    main: { maxWidth: '1400px', margin: '0 auto', padding: '32px' },
    welcomeSection: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '32px' },
    welcomeTitle: { fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
    welcomeSubtitle: { fontSize: '16px', opacity: 0.9, margin: 0 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    statIcon: { fontSize: '32px', marginBottom: '8px' },
    statLabel: { fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: '500' },
    statValue: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 },
    sectionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
    section: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    sectionIcon: { fontSize: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 },
    menuList: { listStyle: 'none', padding: 0, margin: 0 },
    menuItem: { padding: '12px 16px', marginBottom: '8px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500', color: '#374151' },
    menuItemHover: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', transform: 'translateX(4px)' },
    arrow: { fontSize: '16px', opacity: 0.6 },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>Play2Learn - Primary 1 Mathematics</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.name}</p>
              <p style={styles.userRole}>School Admin</p>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome back, {user.name?.split(' ')[0]}! 👋</h1>
          <p style={styles.welcomeSubtitle}>Manage your Primary 1 Mathematics adaptive learning platform.</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎓</div>
            <p style={styles.statLabel}>Total Students</p>
            <p style={styles.statValue}>{loading ? '...' : dashboardData?.total_students || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <p style={styles.statLabel}>Total Classes</p>
            <p style={styles.statValue}>{loading ? '...' : dashboardData?.total_classes || 0}</p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👨‍🏫</div>
            <p style={styles.statLabel}>Total Teachers</p>
            <p style={styles.statValue}>{loading ? '...' : dashboardData?.total_teachers || 0}</p>
          </div>
        </div>

        <div style={styles.sectionsGrid}>
          {/* Account Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🔐</span>
              <h2 style={styles.sectionTitle}>Account Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'manual-add' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('manual-add')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/users/manual-add')}
              >
                <span>Add User (Single)</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'bulk-upload' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('bulk-upload')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/users/bulk-upload')}
              >
                <span>Upload CSV (Bulk)</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'pending-credentials' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('pending-credentials')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/users/pending-credentials')}
              >
                <span>📧 Send Credentials</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Role Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>👥</span>
              <h2 style={styles.sectionTitle}>Role Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'teacher-management' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('teacher-management')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/teachers')}
              >
                <span>👨‍🏫 Teacher Management</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'student-management' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('student-management')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/students')}
              >
                <span>🎓 Student Management</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'parent-management' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('parent-management')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/parents')}
              >
                <span>👨‍👩‍👧 Parent Management</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Class Management */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🏫</span>
              <h2 style={styles.sectionTitle}>Class Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'manage-classes' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('manage-classes')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/classes/manage')}
              >
                <span>Manage Classes</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'teacher-assignments' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('teacher-assignments')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/teachers/assignments')}
              >
                <span>👩‍🏫 Teacher Assignments</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Gamification */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎮</span>
              <h2 style={styles.sectionTitle}>Gamification</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'badges' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('badges')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/badges')}
              >
                <span>🏆 Manage Badges</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'points' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('points')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/school-admin/points')}
              >
                <span>💰 Points & Shop</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}