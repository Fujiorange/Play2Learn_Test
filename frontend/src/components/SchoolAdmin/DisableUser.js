import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function DisableUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role?.toLowerCase() !== 'school-admin') {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [navigate]);
  
  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getUsers({});

      if (result.success) {
        // Filter out admin users, map to consistent format
        const filteredUsers = (result.users || [])
          .filter(u => !['school-admin', 'p2ladmin', 'p2l-admin'].includes(u.role?.toLowerCase()))
          .map(u => ({
            ...u,
            id: u._id || u.id,  // Ensure id is available
            isActive: u.accountActive !== false  // Default to true if not set
          }));
        setUsers(filteredUsers);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load users' });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = async (user) => {
    const userId = user._id || user.id;
    if (!userId) {
      setMessage({ type: 'error', text: 'Invalid user ID' });
      return;
    }

    try {
      const newStatus = !user.isActive;
      const result = await schoolAdminService.updateUserStatus(userId, newStatus);

      if (result.success) {
        setUsers(users.map(u => {
          const uId = u._id || u.id;
          return uId === userId ? { ...u, isActive: newStatus } : u;
        }));
        setMessage({ 
          type: 'success', 
          text: `${user.name} has been ${newStatus ? 'enabled' : 'disabled'}` 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update user status' });
      }
    } catch (err) {
      console.error('Toggle error:', err);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    main: { maxWidth: '1400px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { color: '#6b7280', marginBottom: '24px' },
    searchBox: { marginBottom: '24px' },
    searchInput: { width: '100%', maxWidth: '400px', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' },
    message: { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    userList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    userCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '600', color: 'white' },
    userDetails: {},
    userName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 },
    userEmail: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' },
    userMeta: { fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' },
    toggleContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
    statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    activeBadge: { background: '#d1fae5', color: '#065f46' },
    disabledBadge: { background: '#fee2e2', color: '#991b1b' },
    toggleButton: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    enableButton: { background: '#10b981', color: 'white' },
    disableButton: { background: '#ef4444', color: 'white' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    emptyState: { textAlign: 'center', padding: '48px', color: '#6b7280' },
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'student': return '#3b82f6';
      case 'teacher': return '#10b981';
      case 'parent': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading users...</div>
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
          <button style={styles.backButton} onClick={() => navigate('/school-admin')}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>👤 Enable/Disable Users</h1>
        <p style={styles.pageSubtitle}>Manage user access to the platform</p>

        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No users found</p>
          </div>
        ) : (
          <div style={styles.userList}>
            {filteredUsers.map((user) => (
              <div key={user._id || user.id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  <div style={{ ...styles.avatar, background: getRoleColor(user.role) }}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={styles.userDetails}>
                    <p style={styles.userName}>{user.name}</p>
                    <p style={styles.userEmail}>{user.email}</p>
                    <p style={styles.userMeta}>
                      {user.role} {user.class ? `• ${user.class}` : ''}
                    </p>
                  </div>
                </div>
                <div style={styles.toggleContainer}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(user.isActive ? styles.activeBadge : styles.disabledBadge)
                  }}>
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggle(user)}
                    style={{
                      ...styles.toggleButton,
                      ...(user.isActive ? styles.disableButton : styles.enableButton)
                    }}
                  >
                    {user.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
