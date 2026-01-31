import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

// Mock data - Primary 1 Mathematics classes only
const mockClasses = [
  { id: 1, name: "P1-Math-A", grade: "Primary 1", subject: "Mathematics", students: 15, teacher: "Ms. Diana Lim" },
  { id: 2, name: "P1-Math-B", grade: "Primary 1", subject: "Mathematics", students: 18, teacher: "Mr. Ethan Tan" },
  { id: 3, name: "P1-Math-C", grade: "Primary 1", subject: "Mathematics", students: 12, teacher: "Mrs. Sarah Wong" },
];

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

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

    loadClasses();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      // TODO: Uncomment when backend is ready
      // const token = authService.getToken();
      // const response = await fetch('http://localhost:5000/api/mongo/school-admin/classes?grade=Primary 1&subject=Mathematics', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      // const data = await response.json();
      // setClasses(data.classes || []);

      // MOCK DATA - Primary 1 Mathematics only
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    try {
      // TODO: Uncomment when backend is ready
      // const token = authService.getToken();
      // const response = await fetch('http://localhost:5000/api/mongo/school-admin/classes', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     name: newClassName,
      //     grade: 'Primary 1',
      //     subject: 'Mathematics'
      //   })
      // });
      // const result = await response.json();
      // 
      // if (result.success) {
      //   setClasses([...classes, result.class]);
      //   setMessage({ type: 'success', text: 'Class created successfully!' });
      //   setNewClassName('');
      //   setShowAddModal(false);
      // } else {
      //   setMessage({ type: 'error', text: result.error || 'Failed to create class' });
      // }

      // MOCK SUCCESS - Remove when API is connected
      const newClass = {
        id: classes.length + 1,
        name: newClassName,
        grade: 'Primary 1',
        subject: 'Mathematics',
        students: 0,
        teacher: 'Not assigned'
      };
      setClasses([...classes, newClass]);
      setMessage({ type: 'success', text: 'Class created successfully!' });
      setNewClassName('');
      setShowAddModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error creating class:', error);
      setMessage({ type: 'error', text: 'Failed to create class' });
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
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    addButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block', background: '#dbeafe', color: '#1e40af' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '24px' },
    disabledInput: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#e5e7eb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '24px', cursor: 'not-allowed', color: '#6b7280' },
    modalButtons: { display: 'flex', gap: '12px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    note: { fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' },
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
        <h1 style={styles.pageTitle}>Manage Classes</h1>
        <p style={styles.pageSubtitle}>View and manage Primary 1 Mathematics classes.</p>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.headerRow}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              All Classes
            </h3>
            <button style={styles.addButton} onClick={() => setShowAddModal(true)}>
              + Add New Class
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Class Name</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Students</th>
                <th style={styles.th}>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td style={styles.td}><strong>{cls.name}</strong></td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{cls.grade}</span>
                  </td>
                  <td style={styles.td}>{cls.subject}</td>
                  <td style={styles.td}>{cls.students}</td>
                  <td style={styles.td}>{cls.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {classes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              No classes found
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Add New Class</h2>
            
            <label style={styles.label}>Class Name *</label>
            <input
              type="text"
              placeholder="e.g., P1-Math-D"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Grade Level</label>
            <input
              type="text"
              value="Primary 1"
              disabled
              style={styles.disabledInput}
            />
            <p style={styles.note}>Platform is currently scoped to Primary 1 only</p>

            <label style={styles.label}>Subject</label>
            <input
              type="text"
              value="Mathematics"
              disabled
              style={styles.disabledInput}
            />
            <p style={styles.note}>Platform is currently scoped to Mathematics only</p>

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button style={styles.saveButton} onClick={handleAddClass}>
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}