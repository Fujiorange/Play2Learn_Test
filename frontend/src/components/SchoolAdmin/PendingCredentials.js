import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function PendingCredentials() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

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
      const result = await schoolAdminService.getUsersWithPendingCredentials();
      if (result.success) {
        setUsers(result.users || []);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || (user.role || '').toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleSendCredentials = async (user) => {
    setSendingId(user.id);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await schoolAdminService.sendUserCredentials(user.id);
      if (result.success) {
        setMessage({ type: 'success', text: `Credentials sent successfully to ${user.email}` });
        // Remove the user from the list since credentials are now sent
        setUsers(users.filter(u => u.id !== user.id));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send credentials' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send credentials' });
    } finally {
      setSendingId(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    main: { maxWidth: '1200px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    filterSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    sendButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    sendButtonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px' },
    emptyState: { textAlign: 'center', padding: '60px 40px' },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    emptyTitle: { fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    emptySubtitle: { fontSize: '14px', color: '#6b7280' },
    passwordDisplay: { fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
    infoBanner: { background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' },
    infoIcon: { fontSize: '20px', flexShrink: 0 },
    infoText: { fontSize: '14px', color: '#1e40af' },
    roleBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
    teacherBadge: { background: '#dbeafe', color: '#1e40af' },
    studentBadge: { background: '#fef3c7', color: '#92400e' },
    parentBadge: { background: '#d1fae5', color: '#065f46' },
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Teacher': return { ...styles.roleBadge, ...styles.teacherBadge };
      case 'Student': return { ...styles.roleBadge, ...styles.studentBadge };
      case 'Parent': return { ...styles.roleBadge, ...styles.parentBadge };
      default: return styles.roleBadge;
    }
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
        <h1 style={styles.pageTitle}>📧 Pending Credentials</h1>
        <p style={styles.pageSubtitle}>
          View users with pending login credentials and send them their account details via email.
        </p>

        <div style={styles.infoBanner}>
          <span style={styles.infoIcon}>ℹ️</span>
          <div style={styles.infoText}>
            <strong>How it works:</strong> When you create a user account, a temporary password is generated and stored. 
            Use this page to send the login credentials via email to users. Once sent, the temporary password is cleared 
            for security, and users will be prompted to change their password on first login.
          </div>
        </div>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.filterSection}>
            <div>
              <label style={styles.label}>Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Filter by Role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={styles.select}>
                <option value="all">All Roles</option>
                <option value="Teacher">Teachers</option>
                <option value="Student">Students</option>
                <option value="Parent">Parents</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingText}>Loading users with pending credentials...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✅</div>
              <div style={styles.emptyTitle}>All credentials have been sent!</div>
              <div style={styles.emptySubtitle}>
                {users.length === 0 
                  ? "There are no users with pending credentials. New users' credentials will appear here."
                  : "No users match your search criteria."}
              </div>
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Temp Password</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}><strong>{user.name}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.passwordDisplay}>{user.tempPassword}</span>
                      </td>
                      <td style={styles.td}>{formatDate(user.createdAt)}</td>
                      <td style={styles.td}>
                        <button 
                          style={{ 
                            ...styles.sendButton, 
                            ...(sendingId === user.id ? styles.sendButtonDisabled : {}) 
                          }}
                          onClick={() => handleSendCredentials(user)}
                          disabled={sendingId === user.id}
                        >
                          {sendingId === user.id ? (
                            <>⏳ Sending...</>
                          ) : (
                            <>📤 Send Email</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
                Showing {filteredUsers.length} of {users.length} users with pending credentials
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
