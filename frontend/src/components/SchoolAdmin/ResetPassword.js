import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') {
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
        // Filter out admin users
        const filteredUsers = (result.users || []).filter(u => 
          !['school-admin', 'p2ladmin', 'p2l-admin'].includes(u.role?.toLowerCase())
        );
        setUsers(filteredUsers);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load users' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReset = async (user) => {
    // FIX: Use _id or id
    const userId = user._id || user.id;
    if (!userId) {
      setMessage({ type: 'error', text: 'Invalid user ID' });
      return;
    }

    if (!window.confirm(`Reset password for ${user.name}? A temporary password will be generated.`)) {
      return;
    }

    setResetting(userId);
    try {
      const result = await schoolAdminService.resetUserPassword(userId);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Password reset for ${user.name}. Temporary password: ${result.tempPassword}` 
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reset password' });
      }
    } catch (err) {
      console.error('Reset error:', err);
      setMessage({ type: 'error', text: 'Failed to reset password' });
    } finally {
      setResetting(null);
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
    main: { maxWidth: '1000px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    searchInput: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit', marginBottom: '24px', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    resetButton: { padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    resetButtonDisabled: { padding: '6px 12px', background: '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px' },
    roleBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
  };

  const getRoleBadgeStyle = (role) => {
    const colors = {
      student: { background: '#dbeafe', color: '#1d4ed8' },
      teacher: { background: '#fef3c7', color: '#d97706' },
      parent: { background: '#f3e8ff', color: '#7c3aed' },
    };
    return colors[role?.toLowerCase()] || { background: '#f3f4f6', color: '#6b7280' };
  };

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
        <h1 style={styles.pageTitle}>Reset User Password</h1>
        <p style={styles.pageSubtitle}>Click reset to generate a temporary password for any user.</p>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          {loading ? (
            <div style={styles.loadingText}>Loading users...</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userId = user._id || user.id;
                    return (
                      <tr key={userId}>
                        <td style={styles.td}><strong>{user.name}</strong></td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            style={resetting === userId ? styles.resetButtonDisabled : styles.resetButton} 
                            onClick={() => handleReset(user)}
                            disabled={resetting === userId}
                          >
                            {resetting === userId ? 'Resetting...' : 'Reset Password'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No users found
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
