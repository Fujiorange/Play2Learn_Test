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

  // Available permissions that can be toggled
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
        const filteredUsers = (result.users || []).filter(u => 
          !['school-admin', 'p2l-admin', 'p2ladmin'].includes(u.role?.toLowerCase())
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
    // Load existing permissions or set defaults
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
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await schoolAdminService.updateUser(editingUser._id || editingUser.id, {
        permissions
      });

      if (result.success) {
        setUsers(users.map(u => 
          (u._id || u.id) === (editingUser._id || editingUser.id) 
            ? { ...u, permissions } 
            : u
        ));
        setMessage({ type: 'success', text: `Permissions updated for ${editingUser.name}` });
        setEditingUser(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update permissions' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update permissions' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPermission = async (permission, value) => {
    if (!window.confirm(`Set "${permission}" to ${value ? 'enabled' : 'disabled'} for all ${filterRole === 'all' ? 'users' : filterRole + 's'}?`)) {
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      for (const user of filteredUsers) {
        const newPermissions = { ...(user.permissions || {}), [permission]: value };
        const result = await schoolAdminService.updateUser(user._id || user.id, { permissions: newPermissions });
        if (result.success) successCount++;
      }
      
      setMessage({ type: 'success', text: `Updated ${successCount} users` });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to bulk update' });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionStatus = (user) => {
    const perms = user.permissions || {};
    const enabled = Object.values(perms).filter(v => v === true).length;
    const total = availablePermissions.length;
    if (enabled === total) return { text: 'Full Access', color: '#16a34a', bg: '#f0fdf4' };
    if (enabled === 0) return { text: 'No Access', color: '#dc2626', bg: '#fef2f2' };
    return { text: `${enabled}/${total} Features`, color: '#d97706', bg: '#fef3c7' };
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
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    filterRow: { display: 'flex', gap: '16px', marginBottom: '24px' },
    searchInput: { flex: 1, padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit' },
    filterSelect: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit', minWidth: '150px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    roleBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    editButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    modalSubtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '24px' },
    permissionItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' },
    permissionInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    permissionIcon: { fontSize: '24px' },
    permissionLabel: { fontWeight: '600', color: '#1f2937' },
    permissionDesc: { fontSize: '13px', color: '#6b7280' },
    toggle: { position: 'relative', width: '50px', height: '26px', borderRadius: '13px', cursor: 'pointer', transition: 'background 0.2s' },
    toggleCircle: { position: 'absolute', top: '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
    modalButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
  };

  const getRoleBadgeStyle = (role) => {
    const colors = {
      student: { bg: '#dbeafe', color: '#1e40af' },
      teacher: { bg: '#f3e8ff', color: '#7c3aed' },
      parent: { bg: '#fef3c7', color: '#92400e' }
    };
    return colors[role?.toLowerCase()] || colors.student;
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
        <h1 style={styles.pageTitle}>🔐 Manage Permissions</h1>
        <p style={styles.pageSubtitle}>Enable or disable features for students, teachers, and parents</p>

        {/* Bulk Actions Card */}
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button 
              onClick={() => handleBulkPermission('canAccessShop', false)}
              style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
              disabled={saving}
            >
              🛒 Disable Shop for {filterRole === 'all' ? 'All' : filterRole + 's'}
            </button>
            <button 
              onClick={() => handleBulkPermission('canAccessShop', true)}
              style={{ padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
              disabled={saving}
            >
              🛒 Enable Shop for {filterRole === 'all' ? 'All' : filterRole + 's'}
            </button>
            <button 
              onClick={() => handleBulkPermission('canAccessBadges', false)}
              style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
              disabled={saving}
            >
              🏆 Disable Badges
            </button>
            <button 
              onClick={() => handleBulkPermission('canAccessBadges', true)}
              style={{ padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
              disabled={saving}
            >
              🏆 Enable Badges
            </button>
          </div>
        </div>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading users...</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Access Level</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const status = getPermissionStatus(user);
                    const roleStyle = getRoleBadgeStyle(user.role);
                    return (
                      <tr key={user._id || user.id}>
                        <td style={styles.td}><strong>{user.name}</strong></td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.roleBadge, background: status.bg, color: status.color }}>
                            {status.text}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.editButton} onClick={() => handleEditClick(user)}>
                            ⚙️ Configure
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

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div style={styles.modal} onClick={() => setEditingUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>⚙️ Permissions for {editingUser.name}</h2>
            <p style={styles.modalSubtitle}>{editingUser.email} • {editingUser.role}</p>

            {availablePermissions.map(perm => (
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
                    background: permissions[perm.key] ? '#10b981' : '#d1d5db' 
                  }}
                  onClick={() => handlePermissionToggle(perm.key)}
                >
                  <div style={{ 
                    ...styles.toggleCircle, 
                    left: permissions[perm.key] ? '27px' : '3px' 
                  }} />
                </div>
              </div>
            ))}

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setEditingUser(null)} disabled={saving}>
                Cancel
              </button>
              <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
