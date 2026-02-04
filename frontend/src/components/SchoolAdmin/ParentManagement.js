import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ParentManagement() {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [viewingChild, setViewingChild] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordViewed, setPasswordViewed] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Manage Children Modal State
  const [manageChildrenParent, setManageChildrenParent] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [savingChildren, setSavingChildren] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  
  // Sorting State
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

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

    loadParents();
  }, [navigate]);

  const loadParents = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getUsers({ role: 'Parent' });
      if (result.success) {
        setParents(result.users || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load parents' });
      }
    } catch (error) {
      console.error('Error loading parents:', error);
      setMessage({ type: 'error', text: 'Failed to load parents' });
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort parents
  const sortedParents = [...filteredParents].sort((a, b) => {
    let aValue, bValue;
    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
        break;
      case 'linkedStudents':
        aValue = a.linkedStudents ? a.linkedStudents.length : 0;
        bValue = b.linkedStudents ? b.linkedStudents.length : 0;
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const handleViewChildProfile = async (child) => {
    if (child && child.studentId) {
      try {
        const result = await schoolAdminService.getUserDetails(child.studentId);
        if (result.success) {
          setViewingChild(result.user);
          setSelectedParent(null);
        } else {
          setMessage({ type: 'error', text: 'Failed to load child profile' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load child profile' });
      }
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const result = await schoolAdminService.resetUserPassword(resetPasswordUser.id);
      if (result.success) {
        setResetResult({
          tempPassword: result.tempPassword,
          name: result.name || resetPasswordUser.name,
          email: result.email || resetPasswordUser.email
        });
        setShowPassword(false);
        setPasswordViewed(false);
        setMessage({ type: 'success', text: `Password reset successfully for ${resetPasswordUser.name}` });
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

  const handleCloseResetModal = () => {
    setResetPasswordUser(null);
    setResetResult(null);
    setShowPassword(false);
    setPasswordViewed(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const result = await schoolAdminService.deleteUser(deleteConfirm.id);
      if (result.success) {
        setParents(parents.filter(p => p.id !== deleteConfirm.id));
        setMessage({ type: 'success', text: `Parent "${deleteConfirm.name}" deleted successfully` });
        setDeleteConfirm(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete parent' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete parent' });
    } finally {
      setDeleting(false);
    }
  };

  const getLinkedChildrenCount = (parent) => {
    return parent.linkedStudents ? parent.linkedStudents.length : 0;
  };

  // Manage Children Modal Functions
  const handleOpenManageChildren = async (parent) => {
    setManageChildrenParent(parent);
    setLoadingChildren(true);
    try {
      const result = await schoolAdminService.getParentStudents(parent.id);
      if (result.success) {
        setLinkedStudents(result.linkedStudents || []);
        setAvailableStudents(result.availableStudents || []);
        // Initialize selected students with currently linked ones
        setSelectedStudentIds((result.linkedStudents || []).map(s => s.id));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load children data' });
        setManageChildrenParent(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load children data' });
      setManageChildrenParent(null);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveChildren = async () => {
    if (!manageChildrenParent) return;
    setSavingChildren(true);
    try {
      const result = await schoolAdminService.updateParentStudents(manageChildrenParent.id, selectedStudentIds);
      if (result.success) {
        setMessage({ type: 'success', text: 'Children updated successfully' });
        setManageChildrenParent(null);
        // Reload parents to reflect changes
        loadParents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update children' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update children' });
    } finally {
      setSavingChildren(false);
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
    thSortable: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', userSelect: 'none' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    viewButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
    manageChildrenButton: { padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
    resetButton: { padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalContentWide: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    detailRow: { display: 'flex', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' },
    detailLabel: { width: '140px', fontSize: '14px', fontWeight: '600', color: '#6b7280' },
    detailValue: { flex: 1, fontSize: '14px', color: '#1f2937' },
    linkButton: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: 0 },
    closeButton: { width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    loadingText: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '16px' },
    modalButtons: { display: 'flex', gap: '12px', marginTop: '16px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButtonGreen: { flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    deleteButton: { padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' },
    deleteConfirmButton: { flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    successCard: { background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '16px' },
    successTitle: { fontSize: '18px', fontWeight: '700', color: '#16a34a', marginBottom: '16px' },
    credentialsBox: { background: 'white', border: '2px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    credentialsLabel: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    credentialsValue: { fontSize: '16px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' },
    passwordSection: { background: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    passwordDisplay: { background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    viewPasswordButton: { padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    warningText: { fontSize: '13px', color: '#dc2626', marginBottom: '16px', fontWeight: '500' },
    infoText: { fontSize: '13px', color: '#6b7280', marginBottom: '16px' },
    childItem: { display: 'block', marginBottom: '8px' },
    // Manage Children Modal Styles
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', marginTop: '16px' },
    studentList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' },
    studentItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px', cursor: 'pointer' },
    studentItemSelected: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#dbeafe', borderRadius: '6px', cursor: 'pointer', border: '2px solid #3b82f6' },
    checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
    studentInfo: { flex: 1 },
    studentName: { fontWeight: '600', fontSize: '14px', color: '#1f2937' },
    studentDetails: { fontSize: '12px', color: '#6b7280' },
    emptyList: { textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' },
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
        <h1 style={styles.pageTitle}>👨‍👩‍👧 Parent Management</h1>
        <p style={styles.pageSubtitle}>View and manage all parents in your school.</p>

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
            <div style={styles.loadingText}>Loading parents...</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thSortable} onClick={() => handleSort('name')}>Name{getSortIndicator('name')}</th>
                    <th style={styles.thSortable} onClick={() => handleSort('email')}>Email{getSortIndicator('email')}</th>
                    <th style={styles.thSortable} onClick={() => handleSort('linkedStudents')}>Linked Children{getSortIndicator('linkedStudents')}</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParents.map((parent) => (
                    <tr key={parent.id}>
                      <td style={styles.td}>
                        <strong>{parent.name}</strong>
                        {getLinkedChildrenCount(parent) === 0 && (
                          <span 
                            style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 'bold' }} 
                            title="No linked students"
                            aria-label="Warning: No linked students"
                            role="img"
                          >⚠️</span>
                        )}
                      </td>
                      <td style={styles.td}>{parent.email}</td>
                      <td style={styles.td}>
                        {getLinkedChildrenCount(parent) === 0 ? (
                          <span 
                            style={{ color: '#ef4444', fontWeight: '600' }}
                            role="alert"
                            aria-live="polite"
                          >
                            ⚠️ No children linked
                          </span>
                        ) : (
                          `${getLinkedChildrenCount(parent)} child(ren)`
                        )}
                      </td>
                      <td style={styles.td}>
                        <button style={styles.viewButton} onClick={() => setSelectedParent(parent)}>
                          View
                        </button>
                        <button style={styles.manageChildrenButton} onClick={() => handleOpenManageChildren(parent)}>
                          👨‍👧 Manage Children
                        </button>
                        <button style={styles.resetButton} onClick={() => setResetPasswordUser(parent)}>
                          Reset Password
                        </button>
                        <button style={styles.deleteButton} onClick={() => setDeleteConfirm(parent)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sortedParents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No parents found
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* View Parent Details Modal */}
      {selectedParent && (
        <div style={styles.modal} onClick={() => setSelectedParent(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👨‍👩‍👧 Parent Details</h2>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name:</span>
              <span style={styles.detailValue}>{selectedParent.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{selectedParent.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Linked Children:</span>
              <span style={styles.detailValue}>
                {selectedParent.linkedStudents && selectedParent.linkedStudents.length > 0 ? (
                  selectedParent.linkedStudents.map((child, idx) => (
                    <button 
                      key={idx}
                      style={{...styles.linkButton, ...styles.childItem}}
                      onClick={() => handleViewChildProfile(child)}
                    >
                      {child.name} ({child.email})
                    </button>
                  ))
                ) : 'No children linked'}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Contact No.:</span>
              <span style={styles.detailValue}>{selectedParent.contact || 'N/A'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Date of Birth:</span>
              <span style={styles.detailValue}>{formatDate(selectedParent.date_of_birth)}</span>
            </div>
            
            <button style={styles.closeButton} onClick={() => setSelectedParent(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Child Profile Modal (from parent details) */}
      {viewingChild && (
        <div style={styles.modal} onClick={() => setViewingChild(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🎓 Student Details</h2>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name:</span>
              <span style={styles.detailValue}>{viewingChild.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{viewingChild.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Class:</span>
              <span style={styles.detailValue}>{viewingChild.className || 'Not assigned'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Grade Level:</span>
              <span style={styles.detailValue}>{viewingChild.gradeLevel || 'N/A'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Contact No.:</span>
              <span style={styles.detailValue}>{viewingChild.contact || 'N/A'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Date of Birth:</span>
              <span style={styles.detailValue}>{formatDate(viewingChild.date_of_birth)}</span>
            </div>
            
            <button style={styles.closeButton} onClick={() => setViewingChild(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {resetPasswordUser && !resetResult && (
        <div style={styles.modal} onClick={() => setResetPasswordUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Reset Password for {resetPasswordUser.name}</h2>
            <p style={styles.infoText}>
              This will generate a new temporary password for <strong>{resetPasswordUser.email}</strong>.
            </p>
            <p style={styles.warningText}>
              ⚠️ The user will be required to change their password on first login.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setResetPasswordUser(null)}>Cancel</button>
              <button 
                style={{ ...styles.saveButton, opacity: resetting ? 0.7 : 1 }} 
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Result Modal */}
      {resetPasswordUser && resetResult && (
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
                        <button style={styles.viewPasswordButton} onClick={handleViewPassword}>
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
            
            <button style={{ ...styles.closeButton, background: '#10b981', color: 'white' }} onClick={handleCloseResetModal}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>⚠️ Confirm Deletion</h2>
            <p style={styles.infoText}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <p style={styles.warningText}>
              ⚠️ This action cannot be undone. The parent will be unlinked from their children.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button 
                style={{ ...styles.deleteConfirmButton, opacity: deleting ? 0.7 : 1 }} 
                onClick={handleDeleteUser}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Parent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Children Modal */}
      {manageChildrenParent && (
        <div style={styles.modal} onClick={() => setManageChildrenParent(null)}>
          <div style={styles.modalContentWide} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👨‍👧 Manage Children for {manageChildrenParent.name}</h2>
            
            {loadingChildren ? (
              <div style={styles.loadingText}>Loading children data...</div>
            ) : (
              <>
                <p style={styles.infoText}>
                  Select the students to link to this parent. A parent can have multiple children linked.
                </p>

                <div style={styles.sectionTitle}>📋 Select Students to Link ({selectedStudentIds.length} selected)</div>
                <div style={styles.studentList}>
                  {linkedStudents.length === 0 && availableStudents.length === 0 ? (
                    <div style={styles.emptyList}>No students available in the school</div>
                  ) : (
                    [...linkedStudents, ...availableStudents].map(student => (
                      <div 
                        key={student.id}
                        style={selectedStudentIds.includes(student.id) ? styles.studentItemSelected : styles.studentItem}
                        onClick={() => handleToggleStudent(student.id)}
                      >
                        <input 
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => {}}
                          style={styles.checkbox}
                        />
                        <div style={styles.studentInfo}>
                          <div style={styles.studentName}>{student.name}</div>
                          <div style={styles.studentDetails}>
                            {student.email} • {student.className} • {student.gradeLevel}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.modalButtons}>
                  <button style={styles.cancelButton} onClick={() => setManageChildrenParent(null)}>
                    Cancel
                  </button>
                  <button 
                    style={{ ...styles.saveButtonGreen, opacity: savingChildren ? 0.7 : 1 }}
                    onClick={handleSaveChildren}
                    disabled={savingChildren}
                  >
                    {savingChildren ? 'Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
