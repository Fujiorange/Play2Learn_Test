import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function RemoveUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
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
        // Filter out school-admin users (they shouldn't be deletable)
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      // REAL API CALL - Deletes from database!
      const result = await schoolAdminService.deleteUser(deleteConfirm.id);

      if (result.success) {
        setUsers(users.filter(u => u.id !== deleteConfirm.id));
        setMessage({ type: 'success', text: `User "${deleteConfirm.name}" removed successfully` });
        setDeleteConfirm(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete user' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
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
    filterSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    deleteButton: { padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    modalText: { fontSize: '14px', color: '#6b7280', marginBottom: '24px' },
    modalButtons: { display: 'flex', gap: '12px' },
    modalButtonCancel: { flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    modalButtonConfirm: { flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
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
        <h1 style={styles.pageTitle}>Remove User</h1>
        <p style={styles.pageSubtitle}>Search and remove Primary 1 Mathematics user accounts.</p>

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
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="parent">Parents</option>
              </select>
            </div>
          </div>

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
                      <td style={styles.td}>{user.name}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{user.role}</td>
                      <td style={styles.td}>
                        <button style={styles.deleteButton} onClick={() => setDeleteConfirm(user)}>
                          Delete
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

      {deleteConfirm && (
        <div style={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Deletion</h2>
            <p style={styles.modalText}>
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.modalButtonCancel} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button style={styles.modalButtonConfirm} onClick={handleDelete}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}