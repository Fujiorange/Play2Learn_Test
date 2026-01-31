// frontend/src/pages/Parent/ParentDashboard.js - WITH SKILL MATRIX OPTION
// ✅ UPDATED: Added "📊 View Skill Matrix" button in Child Management section
// ✅ No stat cards (from file 16) + new skill matrix navigation

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';
import ChildSelector from '../../components/ChildSelector';

export default function ParentDashboard() {
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Parent and children data
  const [parentData, setParentData] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Selected child's data
  const [childStats, setChildStats] = useState(null);
  const [childActivities, setChildActivities] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load dashboard data on mount
  useEffect(() => {
    const loadDashboard = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      const currentUser = authService.getCurrentUser();
      if (currentUser.role !== 'Parent') {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      try {
        // Fetch parent dashboard data
        const dashboardResult = await parentService.getDashboard();
        
        if (dashboardResult.success) {
          setParentData(dashboardResult.parent);
          setLinkedStudents(dashboardResult.parent.linkedStudents || []);
          
          // Auto-select first child (defaultChild from backend)
          if (dashboardResult.defaultChild) {
            setSelectedChild(dashboardResult.defaultChild);
            // Load stats for default child
            await loadChildStats(dashboardResult.defaultChild.studentId);
          }
        } else {
          console.error('Failed to load dashboard:', dashboardResult.error);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  // Load selected child's stats
  const loadChildStats = async (studentId) => {
    setStatsLoading(true);
    
    try {
      // Fetch child stats
      const statsResult = await parentService.getChildStats(studentId);
      if (statsResult.success) {
        setChildStats(statsResult.stats);
      }

      // Fetch child activities
      const activitiesResult = await parentService.getChildActivities(studentId, 5);
      if (activitiesResult.success) {
        setChildActivities(activitiesResult.activities || []);
      }
    } catch (error) {
      console.error('Error loading child stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle child selection change
  const handleChildChange = async (newChild) => {
    setSelectedChild(newChild);
    await loadChildStats(newChild.studentId);
    
    // Save to sessionStorage for persistence
    sessionStorage.setItem('selectedChildId', newChild.studentId);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleMenuClick = (path) => {
    // Pass selected child context to other pages
    navigate(path, { state: { child: selectedChild } });
  };

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
    childSelectorWrapper: { marginBottom: '32px' },
    activitiesCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '32px' },
    activitiesTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    activityItem: { padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #10b981' },
    activityTitle: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
    activityDetails: { fontSize: '12px', color: '#6b7280' },
    sectionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
    section: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    sectionIcon: { fontSize: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0 },
    menuList: { listStyle: 'none', padding: 0, margin: 0 },
    menuItem: { padding: '12px 16px', marginBottom: '8px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500', color: '#374151' },
    menuItemHover: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', transform: 'translateX(4px)' },
    arrow: { fontSize: '16px', opacity: 0.6 },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    emptyIcon: { fontSize: '64px', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    emptyText: { fontSize: '15px', color: '#6b7280' }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading dashboard...</div>
      </div>
    );
  }

  // No children linked case
  if (!linkedStudents || linkedStudents.length === 0) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>P</div>
              <span style={styles.logoText}>Play2Learn</span>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user?.name}</p>
                <p style={styles.userRole}>Parent</p>
              </div>
              <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>
        
        <main style={styles.main}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👨‍👩‍👧‍👦</div>
            <h2 style={styles.emptyTitle}>No Children Linked</h2>
            <p style={styles.emptyText}>
              Contact your school administrator to link your children to this account.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>Play2Learn</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user?.name}</p>
              <p style={styles.userRole}>Parent</p>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={styles.welcomeSubtitle}>
            Track {linkedStudents.length > 1 ? "your children's" : "your child's"} learning progress and performance.
          </p>
        </div>

        {/* Child Selector Dropdown */}
        <div style={styles.childSelectorWrapper}>
          <ChildSelector
            children={linkedStudents}
            selectedChild={selectedChild}
            onChange={handleChildChange}
          />
        </div>

        {/* 
        ========================================
        STAT CARDS REMOVED (from file 16)
        ========================================
        */}

        {/* Recent Activities - KEPT AS IS */}
        {selectedChild && !statsLoading && childActivities.length > 0 && (
          <div style={styles.activitiesCard}>
            <h2 style={styles.activitiesTitle}>
              🎯 Recent Activities - {selectedChild.studentName}
            </h2>
            {childActivities.map((activity, index) => (
              <div key={index} style={styles.activityItem}>
                <div style={styles.activityTitle}>
                  {activity.icon} {activity.title}
                </div>
                <div style={styles.activityDetails}>
                  {activity.description} • {parentService.formatDate(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}

        {statsLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading {selectedChild?.studentName}'s data...
          </div>
        )}

        {/* Quick Actions & Support Sections - WITH SKILL MATRIX ADDED */}
        <div style={styles.sectionsGrid}>
          {/* Child Management - UPDATED WITH SKILL MATRIX */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>👨‍👩‍👧‍👦</span>
              <h2 style={styles.sectionTitle}>Child Management</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'children' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('children')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/children')}
              >
                <span>View All Children</span>
                <span style={styles.arrow}>→</span>
              </li>
              {/* NEW: Skill Matrix Option */}
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'skills' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('skills')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/children/skills')}
              >
                <span>📊 View Skill Matrix</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'performance' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('performance')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/children/performance')}
              >
                <span>📈 View Performance</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'progress' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('progress')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/children/progress')}
              >
                <span>🎯 View Progress</span>
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
                style={{ ...styles.menuItem, ...(hoveredItem === 'announcements' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('announcements')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/announcements')}
              >
                <span>📢 School Announcements</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'chat' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('chat')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/chat')}
              >
                <span>Chat with Teachers</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'testimonial' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('testimonial')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/testimonial')}
              >
                <span>Write Testimonial</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>⚙️</span>
              <h2 style={styles.sectionTitle}>Account & Support</h2>
            </div>
            <ul style={styles.menuList}>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'profile' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/profile')}
              >
                <span>My Profile</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'support' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('support')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/support/create')}
              >
                <span>Create Support Ticket</span>
                <span style={styles.arrow}>→</span>
              </li>
              <li
                style={{ ...styles.menuItem, ...(hoveredItem === 'track' ? styles.menuItemHover : {}) }}
                onMouseEnter={() => setHoveredItem('track')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuClick('/parent/support/track')}
              >
                <span>Track Tickets</span>
                <span style={styles.arrow}>→</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}