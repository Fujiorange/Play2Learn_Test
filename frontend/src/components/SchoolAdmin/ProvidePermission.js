import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ProvidePermission() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availablePermissions = [
    { key: 'canAccessPoints', label: 'Access Points System', description: 'View and earn points', icon: '⭐' },
    { key: 'canAccessBadges', label: 'Access Badges', description: 'View and earn badges', icon: '🏆' },
    { key: 'canAccessShop', label: 'Access Shop', description: 'View and purchase from shop', icon: '🛒' },
    { key: 'canAccessLeaderboard', label: 'Access Leaderboard', description: 'View class/school leaderboard', icon: '📊' },
    { key: 'canTakeQuizzes', label: 'Take Quizzes', description: 'Ability to take quizzes', icon: '📝' },
    { key: 'canViewProgress', label: 'View Progress', description: 'See own progress tracking', icon: '📈' },
    { key: 'canCreateTickets', label: 'Create Support Tickets', description: 'Submit support requests', icon: '🎫' },
  ];

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const currentUser = authService.getCurrentUser();
    // Handle both "school-admin" and "School Admin" formats
    if (!currentUser.role?.toLowerCase().includes('school')) {
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
        const filteredUsers = (result.users || []).filter(u => 
          !u.role?.toLowerCase().includes('school') &&
          !u.role?.toLowerCase().includes('p2l') &&
          !u.role?.toLowerCase().includes('platform')
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role?.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleEditClick = (user) => {
    setEditingUser(user);
    setPermissions(user.permissions || {
      canAccessPoints: true,
      canAccessBadges: true,
      canAccessShop: true,
      canAccessLeaderboard: true,
      canTakeQuizzes: true,
      canViewProgress: true,
      canCreateTickets: true
    });
    setMessage({ type: '', text: '' });
  };

  const handlePermissionToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const userId = editingUser._id || editingUser.id;
      const result = await schoolAdminService.updateUser(userId, { permissions });
      if (result.success) {
        setUsers(users.map(u => 
          (u._id || u.id) === userId ? { ...u, permissions } : u
        ));
        setMessage({ type: 'success', text: `Permissions updated for ${editingUser.name}` });
        setEditingUser(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  // BULK ENABLE ALL PERMISSIONS
  const handleEnableAllPermissions = async () => {
    const targetUsers = filteredUsers;
    if (targetUsers.length === 0) {
      setMessage({ type: 'error', text: 'No users to update' });
      return;
    }
    
    if (!window.confirm(`Enable ALL permissions for ${targetUsers.length} ${filterRole === 'all' ? '' : filterRole} users?`)) {
      return;
    }

    setLoading(true);
    const allEnabled = {
      canAccessPoints: true,
      canAccessBadges: true,
      canAccessShop: true,
      canAccessLeaderboard: true,
      canTakeQuizzes: true,
      canViewProgress: true,
      canCreateTickets: true
    };

    let successCount = 0;
    for (const user of targetUsers) {
      try {
        const userId = user._id || user.id;
        const result = await schoolAdminService.updateUser(userId, { permissions: allEnabled });
        if (result.success) successCount++;
      } catch (e) { console.error('Failed for user:', user.email); }
    }

    await loadUsers();
    setMessage({ type: 'success', text: `Enabled all permissions for ${successCount}/${targetUsers.length} users` });
    setLoading(false);
  };

  // BULK DISABLE ALL PERMISSIONS
  const handleDisableAllPermissions = async () => {
    const targetUsers = filteredUsers;
    if (targetUsers.length === 0) {
      setMessage({ type: 'error', text: 'No users to update' });
      return;
    }
    
    if (!window.confirm(`Disable ALL permissions for ${targetUsers.length} ${filterRole === 'all' ? '' : filterRole} users? They will lose access to features.`)) {
      return;
    }

    setLoading(true);
    const allDisabled = {
      canAccessPoints: false,
      canAccessBadges: false,
      canAccessShop: false,
      canAccessLeaderboard: false,
      canTakeQuizzes: false,
      canViewProgress: false,
      canCreateTickets: false
    };

    let successCount = 0;
    for (const user of targetUsers) {
      try {
        const userId = user._id || user.id;
        const result = await schoolAdminService.updateUser(userId, { permissions: allDisabled });
        if (result.success) successCount++;
      } catch (e) { console.error('Failed for user:', user.email); }
    }

    await loadUsers();
    setMessage({ type: 'success', text: `Disabled all permissions for ${successCount}/${targetUsers.length} users` });
    setLoading(false);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    main: { maxWidth: '1400px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    filterSection: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' },
    input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minWidth: '200px' },
    select: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minWidth: '150px' },
    bulkButtons: { display: 'flex', gap: '12px', marginLeft: 'auto' },
    enableAllBtn: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    disableAllBtn: { padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    editButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    modalSubtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '24px' },
    permissionItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' },
    permissionInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    permissionIcon: { fontSize: '24px' },
    permissionLabel: { fontWeight: '600', color: '#1f2937' },
    permissionDesc: { fontSize: '13px', color: '#6b7280' },
    toggle: { width: '48px', height: '26px', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' },
    toggleEnabled: { background: '#10b981' },
    toggleDisabled: { background: '#d1d5db' },
    toggleKnob: { width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
    modalButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelBtn: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    saveBtn: { flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    roleBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280' },
  };

  const getRoleBadgeStyle = (role) => {
    const colors = {
      student: { background: '#dbeafe', color: '#1d4ed8' },
      teacher: { background: '#fef3c7', color: '#d97706' },
      parent: { background: '#f3e8ff', color: '#7c3aed' },
    };
    return colors[role?.toLowerCase()] || { background: '#f3f4f6', color: '#6b7280' };
  };

  const getPermissionStatus = (user) => {
    if (!user.permissions) return '⚪ Default';
    const perms = Object.values(user.permissions);
    const enabled = perms.filter(p => p === true).length;
    if (enabled === perms.length) return '🟢 All Enabled';
    if (enabled === 0) return '🔴 All Disabled';
    return `🟡 ${enabled}/${perms.length} Enabled`;
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
        <p style={styles.pageSubtitle}>Control what features each user can access.</p>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.filterSection}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={styles.select}>
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
            </select>
            <div style={styles.bulkButtons}>
              <button style={styles.enableAllBtn} onClick={handleEnableAllPermissions} disabled={loading}>
                ✅ Enable All ({filteredUsers.length})
              </button>
              <button style={styles.disableAllBtn} onClick={handleDisableAllPermissions} disabled={loading}>
                🚫 Disable All ({filteredUsers.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingText}>Loading users...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Permission Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const uniqueKey = user._id || user.id || user.email;
                  return (
                    <tr key={uniqueKey}>
                      <td style={styles.td}><strong>{user.name}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>{getPermissionStatus(user)}</td>
                      <td style={styles.td}>
                        <button style={styles.editButton} onClick={() => handleEditClick(user)}>
                          ⚙️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {filteredUsers.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              No users found
            </div>
          )}
        </div>
      </main>

      {editingUser && (
        <div style={styles.modal} onClick={() => setEditingUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Edit Permissions: {editingUser.name}</h2>
            <p style={styles.modalSubtitle}>{editingUser.email} • {editingUser.role}</p>

            {availablePermissions.map((perm) => (
              <div key={perm.key} style={styles.permissionItem}>
                <div style={styles.permissionInfo}>
                  <span style={styles.permissionIcon}>{perm.icon}</span>
                  <div>
                    <div style={styles.permissionLabel}>{perm.label}</div>
                    <div style={styles.permissionDesc}>{perm.description}</div>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.toggle,
                    ...(permissions[perm.key] ? styles.toggleEnabled : styles.toggleDisabled)
                  }}
                  onClick={() => handlePermissionToggle(perm.key)}
                >
                  <div style={{ ...styles.toggleKnob, left: permissions[perm.key] ? '24px' : '2px' }} />
                </div>
              </div>
            ))}

            <div style={styles.modalButtons}>
              <button style={styles.cancelBtn} onClick={() => setEditingUser(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
