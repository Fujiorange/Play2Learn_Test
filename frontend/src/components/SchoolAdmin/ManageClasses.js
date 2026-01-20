import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock class data
const mockClasses = [
  { id: 1, name: "Class 1A", gradeLevel: "Primary 1", studentCount: 25 },
  { id: 2, name: "Class 1B", gradeLevel: "Primary 1", studentCount: 23 },
  { id: 3, name: "Class 2A", gradeLevel: "Primary 2", studentCount: 28 },
  { id: 4, name: "Class 3A", gradeLevel: "Primary 3", studentCount: 22 },
];

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', gradeLevel: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load classes (replace with API call)
    setClasses(mockClasses);
  }, []);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingClass(null);
    setFormData({ name: '', gradeLevel: '' });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, gradeLevel: cls.gradeLevel });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.gradeLevel) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/school-admin/classes', {
      //   method: editingClass ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editingClass ? { ...formData, id: editingClass.id } : formData)
      // });

      // TEMPORARY: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingClass) {
        // Update existing class
        setClasses(classes.map(c => c.id === editingClass.id 
          ? { ...c, name: formData.name, gradeLevel: formData.gradeLevel }
          : c
        ));
        setMessage({ type: 'success', text: 'Class updated successfully!' });
      } else {
        // Add new class
        const newClass = {
          id: Math.max(...classes.map(c => c.id)) + 1,
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          studentCount: 0,
        };
        setClasses([...classes, newClass]);
        setMessage({ type: 'success', text: 'Class created successfully!' });
      }

      setShowForm(false);
      setFormData({ name: '', gradeLevel: '' });
      setEditingClass(null);

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save class' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/school-admin/classes/${deleteConfirm.id}`, { method: 'DELETE' });

      // TEMPORARY: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setClasses(classes.filter(c => c.id !== deleteConfirm.id));
      setMessage({ type: 'success', text: `Class "${deleteConfirm.name}" deleted successfully` });
      setDeleteConfirm(null);

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete class' });
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
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' },
    searchInput: { flex: 1, minWidth: '250px', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', fontFamily: 'inherit' },
    addButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    actionButtons: { display: 'flex', gap: '8px' },
    editButton: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    deleteButton: { padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    formOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    formModal: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
    formTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    formGroup: { marginBottom: '20px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    formButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    submitButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
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
        <p style={styles.pageSubtitle}>View, create, edit, and delete classes.</p>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.topBar}>
            <input
              type="text"
              placeholder="Search by class name or grade level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button style={styles.addButton} onClick={handleAddClick}>
              + Add New Class
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Class Name</th>
                <th style={styles.th}>Grade Level</th>
                <th style={styles.th}>Students</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((cls) => (
                <tr key={cls.id}>
                  <td style={styles.td}><strong>{cls.name}</strong></td>
                  <td style={styles.td}>{cls.gradeLevel}</td>
                  <td style={styles.td}>{cls.studentCount}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button style={styles.editButton} onClick={() => handleEditClick(cls)}>
                        Edit
                      </button>
                      <button style={styles.deleteButton} onClick={() => setDeleteConfirm(cls)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClasses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              No classes found
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.formTitle}>{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Class 1A"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select grade level</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                </select>
              </div>

              <div style={styles.formButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Deletion</h2>
            <p style={styles.modalText}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.modalButtonCancel} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button style={styles.modalButtonConfirm} onClick={handleDelete}>
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}