import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function StudentManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingParent, setViewingParent] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordViewed, setPasswordViewed] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Link Parent Modal State
  const [linkParentStudent, setLinkParentStudent] = useState(null);
  const [linkedParent, setLinkedParent] = useState(null);
  const [availableParents, setAvailableParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [savingParent, setSavingParent] = useState(false);
  const [loadingParentData, setLoadingParentData] = useState(false);

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

    loadStudents();
  }, [navigate]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getUsers({ role: 'Student' });
      if (result.success) {
        setStudents(result.users || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load students' });
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const handleViewParentProfile = async (parent) => {
    if (parent && parent.parentId) {
      try {
        const result = await schoolAdminService.getUserDetails(parent.parentId);
        if (result.success) {
          setViewingParent(result.user);
          setSelectedStudent(null);
        } else {
          setMessage({ type: 'error', text: 'Failed to load parent profile' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load parent profile' });
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
        setStudents(students.filter(s => s.id !== deleteConfirm.id));
        setMessage({ type: 'success', text: `Student "${deleteConfirm.name}" deleted successfully` });
        setDeleteConfirm(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete student' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete student' });
    } finally {
      setDeleting(false);
    }
  };

  // Link Parent Modal Functions
  const handleOpenLinkParent = async (student) => {
    setLinkParentStudent(student);
    setLoadingParentData(true);
    try {
      const result = await schoolAdminService.getStudentParent(student.id);
      if (result.success) {
        setLinkedParent(result.linkedParent);
        setAvailableParents(result.availableParents || []);
        // Initialize selected parent with currently linked one
        setSelectedParentId(result.linkedParent ? result.linkedParent.id : null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load parent data' });
        setLinkParentStudent(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load parent data' });
      setLinkParentStudent(null);
    } finally {
      setLoadingParentData(false);
    }
  };

  const handleSelectParent = (parentId) => {
    setSelectedParentId(parentId === selectedParentId ? null : parentId);
  };

  const handleSaveParent = async () => {
    if (!linkParentStudent) return;
    setSavingParent(true);
    try {
      const result = await schoolAdminService.updateStudentParent(linkParentStudent.id, selectedParentId);
      if (result.success) {
        setMessage({ type: 'success', text: selectedParentId ? 'Parent linked successfully' : 'Parent unlinked successfully' });
        setLinkParentStudent(null);
        // Reload students to reflect changes
        loadStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update parent link' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update parent link' });
    } finally {
      setSavingParent(false);
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
    viewButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
    linkParentButton: { padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
    resetButton: { padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalContentWide: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
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
    // Link Parent Modal Styles
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', marginTop: '16px' },
    parentList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' },
    parentItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px', cursor: 'pointer' },
    parentItemSelected: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#dbeafe', borderRadius: '6px', cursor: 'pointer', border: '2px solid #3b82f6' },
    radio: { width: '18px', height: '18px', cursor: 'pointer' },
    parentInfo: { flex: 1 },
    parentName: { fontWeight: '600', fontSize: '14px', color: '#1f2937' },
    parentDetails: { fontSize: '12px', color: '#6b7280' },
    emptyList: { textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' },
    currentParentBadge: { marginLeft: '8px', padding: '2px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
    unlinkOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#fef2f2', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px' },
    unlinkOptionSelected: { border: '2px solid #ef4444' },
    unlinkOptionUnselected: { border: '1px solid #fecaca' },
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
        <h1 style={styles.pageTitle}>🎓 Student Management</h1>
        <p style={styles.pageSubtitle}>View and manage all students in your school.</p>

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
            <div style={styles.loadingText}>Loading students...</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Grade Level</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td style={styles.td}><strong>{student.name}</strong></td>
                      <td style={styles.td}>{student.email}</td>
                      <td style={styles.td}>{student.className || 'Not assigned'}</td>
                      <td style={styles.td}>{student.gradeLevel || 'N/A'}</td>
                      <td style={styles.td}>
                        <button style={styles.viewButton} onClick={() => setSelectedStudent(student)}>
                          View
                        </button>
                        <button style={styles.linkParentButton} onClick={() => handleOpenLinkParent(student)}>
                          👨‍👩‍👧 Link Parent
                        </button>
                        <button style={styles.resetButton} onClick={() => setResetPasswordUser(student)}>
                          Reset Password
                        </button>
                        <button style={styles.deleteButton} onClick={() => setDeleteConfirm(student)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No students found
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* View Student Details Modal */}
      {selectedStudent && (
        <div style={styles.modal} onClick={() => setSelectedStudent(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🎓 Student Details</h2>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name:</span>
              <span style={styles.detailValue}>{selectedStudent.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{selectedStudent.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Class:</span>
              <span style={styles.detailValue}>{selectedStudent.className || 'Not assigned'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Linked Parent:</span>
              <span style={styles.detailValue}>
                {selectedStudent.linkedParent ? (
                  <button 
                    style={styles.linkButton} 
                    onClick={() => handleViewParentProfile(selectedStudent.linkedParent)}
                  >
                    {selectedStudent.linkedParent.parentName} ({selectedStudent.linkedParent.parentEmail})
                  </button>
                ) : 'No parent linked'}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Contact No.:</span>
              <span style={styles.detailValue}>{selectedStudent.contact || 'N/A'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Date of Birth:</span>
              <span style={styles.detailValue}>{formatDate(selectedStudent.date_of_birth)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Grade Level:</span>
              <span style={styles.detailValue}>{selectedStudent.gradeLevel || 'N/A'}</span>
            </div>
            
            <button style={styles.closeButton} onClick={() => setSelectedStudent(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Parent Profile Modal (from student details) */}
      {viewingParent && (
        <div style={styles.modal} onClick={() => setViewingParent(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👨‍👩‍👧 Parent Details</h2>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name:</span>
              <span style={styles.detailValue}>{viewingParent.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <span style={styles.detailValue}>{viewingParent.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Contact No.:</span>
              <span style={styles.detailValue}>{viewingParent.contact || 'N/A'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Date of Birth:</span>
              <span style={styles.detailValue}>{formatDate(viewingParent.date_of_birth)}</span>
            </div>
            {viewingParent.linkedStudents && viewingParent.linkedStudents.length > 0 && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Linked Children:</span>
                <span style={styles.detailValue}>
                  {viewingParent.linkedStudents.map((child, idx) => (
                    <div key={idx}>{child.name} ({child.email})</div>
                  ))}
                </span>
              </div>
            )}
            
            <button style={styles.closeButton} onClick={() => setViewingParent(null)}>
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
              ⚠️ This action cannot be undone. The student will be removed from their assigned class.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button 
                style={{ ...styles.deleteConfirmButton, opacity: deleting ? 0.7 : 1 }} 
                onClick={handleDeleteUser}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Parent Modal */}
      {linkParentStudent && (
        <div style={styles.modal} onClick={() => setLinkParentStudent(null)}>
          <div style={styles.modalContentWide} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👨‍👩‍👧 Link Parent to {linkParentStudent.name}</h2>
            
            {loadingParentData ? (
              <div style={styles.loadingText}>Loading parent data...</div>
            ) : (
              <>
                <p style={styles.infoText}>
                  Select a parent to link to this student. Each student can only be linked to one parent.
                </p>

                {linkedParent && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={styles.sectionTitle}>📋 Currently Linked Parent</div>
                    <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '8px', border: '2px solid #10b981' }}>
                      <div style={styles.parentName}>{linkedParent.name}</div>
                      <div style={styles.parentDetails}>{linkedParent.email}</div>
                    </div>
                  </div>
                )}

                <div style={styles.sectionTitle}>👨‍👩‍👧 Available Parents</div>
                
                {/* Option to unlink */}
                {linkedParent && (
                  <div 
                    style={{ ...styles.unlinkOption, ...(selectedParentId === null ? styles.unlinkOptionSelected : styles.unlinkOptionUnselected) }}
                    onClick={() => setSelectedParentId(null)}
                  >
                    <input 
                      type="radio"
                      checked={selectedParentId === null}
                      onChange={() => {}}
                      style={styles.radio}
                    />
                    <div style={styles.parentInfo}>
                      <div style={{ ...styles.parentName, color: '#dc2626' }}>❌ Unlink Parent</div>
                      <div style={styles.parentDetails}>Remove parent link from this student</div>
                    </div>
                  </div>
                )}

                <div style={styles.parentList}>
                  {availableParents.length === 0 ? (
                    <div style={styles.emptyList}>No parents available in the school</div>
                  ) : (
                    availableParents.map(parent => (
                      <div 
                        key={parent.id}
                        style={selectedParentId === parent.id ? styles.parentItemSelected : styles.parentItem}
                        onClick={() => handleSelectParent(parent.id)}
                      >
                        <input 
                          type="radio"
                          checked={selectedParentId === parent.id}
                          onChange={() => {}}
                          style={styles.radio}
                        />
                        <div style={styles.parentInfo}>
                          <div style={styles.parentName}>
                            {parent.name}
                            {linkedParent && linkedParent.id === parent.id && (
                              <span style={styles.currentParentBadge}>Current</span>
                            )}
                          </div>
                          <div style={styles.parentDetails}>
                            {parent.email} {parent.contact && parent.contact !== 'N/A' ? `• ${parent.contact}` : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.modalButtons}>
                  <button style={styles.cancelButton} onClick={() => setLinkParentStudent(null)}>
                    Cancel
                  </button>
                  <button 
                    style={{ ...styles.saveButtonGreen, opacity: savingParent ? 0.7 : 1 }}
                    onClick={handleSaveParent}
                    disabled={savingParent}
                  >
                    {savingParent ? 'Saving...' : '✓ Save Changes'}
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
