import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ProvidePermission() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

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
      // REAL API CALL - Fetches from database!
      const result = await schoolAdminService.getUsers({
        gradeLevel: 'Primary 1',
        subject: 'Mathematics'
      });

      if (result.success) {
        // Filter out school-admin users (can't change their roles)
        const filteredUsers = (result.users || []).filter(u => u.role !== 'school-admin');
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

  const handleEditClick = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select a role' });
      return;
    }

    // SECURITY: Prevent changing to school-admin
    if (selectedRole === 'school-admin') {
      setMessage({ type: 'error', text: 'Cannot assign school-admin role' });
      return;
    }

    try {
      // REAL API CALL - Updates database!
      const result = await schoolAdminService.updateUserRole(editingUser.id, selectedRole);

      if (result.success) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
        setMessage({ type: 'success', text: `Role updated for ${editingUser.name}` });
        setEditingUser(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update role' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update role' });
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
    main: { maxWidth: '1200px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    searchInput: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit', marginBottom: '24px', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    roleBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block', background: '#dbeafe', color: '#1e40af' },
    editButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '24px' },
    modalButtons: { display: 'flex', gap: '12px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    securityNote: { fontSize: '13px', color: '#dc2626', marginTop: '8px', fontStyle: 'italic' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px' },
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
        <h1 style={styles.pageTitle}>Manage User Permissions</h1>
        <p style={styles.pageSubtitle}>Assign roles and permissions to Primary 1 Mathematics users.</p>

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
                    <th style={styles.th}>Current Role</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}><strong>{user.name}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={styles.roleBadge}>{user.role}</span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.editButton} onClick={() => handleEditClick(user)}>
                          Change Role
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

      {editingUser && (
        <div style={styles.modal} onClick={() => setEditingUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Change Role for {editingUser.name}</h2>
            <label style={styles.label}>Select Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={styles.select}>
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              {/* SECURITY: school-admin option removed - cannot promote to school-admin */}
            </select>
            <p style={styles.securityNote}>⚠️ School Admin role cannot be assigned for security reasons</p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setEditingUser(null)}>Cancel</button>
              <button style={styles.saveButton} onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}