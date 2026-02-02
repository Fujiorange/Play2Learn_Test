import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordViewed, setPasswordViewed] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

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

    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // REAL API CALL - Fetches from database!
      const result = await schoolAdminService.getUsers({
        gradeLevel: 'Primary 1',
        subject: 'Mathematics'
      });

      if (result.success) {
        // Filter out school-admin users
        const filteredUsers = (result.users || []).filter(u => u.role !== 'school-admin' && u.role !== 'School Admin');
        setUsers(filteredUsers);
      } else {
        console.error('Failed to load users:', result.error);
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
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReset = async () => {
    setResetting(true);
    try {
      // REAL API CALL - Resets password and generates new temp password!
      const result = await schoolAdminService.resetUserPassword(selectedUser.id);

      if (result.success) {
        setResetResult({
          tempPassword: result.tempPassword,
          name: result.name || selectedUser.name,
          email: result.email || selectedUser.email
        });
        setShowPassword(false);
        setPasswordViewed(false);
        setMessage({ type: 'success', text: `Password reset successfully for ${selectedUser.name}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reset password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    } finally {
      setResetting(false);
    }
  };

  const handleViewPassword = () => {
    setShowPassword(true);
    setPasswordViewed(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setResetResult(null);
    setShowPassword(false);
    setPasswordViewed(false);
    // Clear success message after a delay
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '24px' },
    modalButtons: { display: 'flex', gap: '12px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px' },
    // New styles for password display
    successCard: { background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '16px' },
    successTitle: { fontSize: '18px', fontWeight: '700', color: '#16a34a', marginBottom: '16px' },
    credentialsBox: { background: 'white', border: '2px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    credentialsLabel: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    credentialsValue: { fontSize: '16px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' },
    passwordSection: { background: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    passwordDisplay: { background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    viewButton: { padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    warningText: { fontSize: '13px', color: '#dc2626', marginBottom: '16px', fontWeight: '500' },
    infoText: { fontSize: '13px', color: '#6b7280', marginBottom: '16px' },
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
        <p style={styles.pageSubtitle}>Search for a user and reset their password. A new temporary password will be generated automatically.</p>

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
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}><strong>{user.name}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{user.role}</td>
                      <td style={styles.td}>
                        <button style={styles.resetButton} onClick={() => setSelectedUser(user)}>
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
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

      {/* Confirmation Modal (before reset) */}
      {selectedUser && !resetResult && (
        <div style={styles.modal} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Reset Password for {selectedUser.name}</h2>
            <p style={styles.infoText}>
              This will generate a new temporary password for <strong>{selectedUser.email}</strong>.
            </p>
            <p style={styles.warningText}>
              ⚠️ The user will be required to change their password on first login.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setSelectedUser(null)}>Cancel</button>
              <button 
                style={{ ...styles.saveButton, opacity: resetting ? 0.7 : 1 }} 
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (after reset - showing temp password) */}
      {selectedUser && resetResult && (
        <div style={styles.modal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successCard}>
              <div style={styles.successTitle}>✅ Password Reset Successfully!</div>
              <p style={{ marginBottom: '16px', color: '#374151' }}>
                Please save these credentials. The password can only be viewed once.
              </p>
              
              <div style={styles.credentialsBox}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={styles.credentialsLabel}>Name</div>
                  <div style={styles.credentialsValue}>{resetResult.name}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={styles.credentialsLabel}>Email</div>
                  <div style={styles.credentialsValue}>{resetResult.email}</div>
                </div>
                <div>
                  <div style={styles.credentialsLabel}>New Temporary Password</div>
                  <div style={styles.passwordSection}>
                    <div style={styles.passwordDisplay}>
                      <span>
                        {showPassword ? resetResult.tempPassword : '••••••••'}
                      </span>
                      {!passwordViewed && (
                        <button style={styles.viewButton} onClick={handleViewPassword}>
                          👁️ View Once
                        </button>
                      )}
                      {passwordViewed && (
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>✓ Viewed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                ⚠️ Please share these credentials securely with the user. They will be prompted to change their password on first login.
              </p>
            </div>
            
            <div style={styles.modalButtons}>
              <button style={styles.saveButton} onClick={handleCloseModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
