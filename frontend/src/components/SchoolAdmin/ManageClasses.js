import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [formData, setFormData] = useState({ name: '', teacherId: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

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
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [classesResult, teachersResult, studentsResult] = await Promise.all([
        schoolAdminService.getClasses(),
        schoolAdminService.getUsers({ role: 'teacher' }),
        schoolAdminService.getUsers({ role: 'student' })
      ]);

      if (classesResult.success) {
        setClasses(classesResult.classes || []);
      }
      if (teachersResult.success) {
        setTeachers(teachersResult.users || []);
      }
      if (studentsResult.success) {
        setAllStudents(studentsResult.users || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    setSaving(true);
    try {
      const result = await schoolAdminService.createClass({
        name: formData.name.trim(),
        grade: 'Primary 1',
        subject: 'Mathematics',
        teacherId: formData.teacherId || null
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Class created successfully!' });
        setShowAddModal(false);
        setFormData({ name: '', teacherId: '' });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create class' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create class' });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({ 
      name: cls.name, 
      teacherId: cls.teacherId || '' 
    });
    setShowEditModal(true);
  };

  const openStudentsModal = (cls) => {
    setSelectedClass(cls);
    const students = allStudents.filter(s => s.class === cls.name);
    setClassStudents(students);
    setShowStudentsModal(true);
  };

  const handleUpdateClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    setSaving(true);
    try {
      const result = await schoolAdminService.updateClass(selectedClass._id, {
        name: formData.name.trim(),
        teacherId: formData.teacherId || null
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Class updated successfully!' });
        setShowEditModal(false);
        setSelectedClass(null);
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update class' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update class' });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemoveTeacher = async (cls) => {
    if (!window.confirm(`Remove teacher "${cls.teacherName}" from class "${cls.name}"?`)) {
      return;
    }

    try {
      const result = await schoolAdminService.updateClass(cls._id, {
        teacherId: null
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Teacher removed from class!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove teacher' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove teacher' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    setSaving(true);
    try {
      const result = await schoolAdminService.deleteClass(selectedClass._id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Class deleted successfully!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete class' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete class' });
    } finally {
      setSaving(false);
    }
    setShowDeleteModal(false);
    setSelectedClass(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Add student to class
  const handleAddStudentToClass = async (studentId) => {
    try {
      const result = await schoolAdminService.updateUser(studentId, {
        class: selectedClass.name
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Student added to class!' });
        await loadData();
        // Refresh modal students
        setTimeout(() => {
          const updatedStudents = allStudents.map(s => 
            s._id === studentId ? { ...s, class: selectedClass.name } : s
          );
          setClassStudents(updatedStudents.filter(s => s.class === selectedClass.name));
        }, 100);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add student' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add student' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Remove student from class
  const handleRemoveStudentFromClass = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;

    try {
      const result = await schoolAdminService.updateUser(studentId, {
        class: null
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Student removed from class!' });
        await loadData();
        setClassStudents(prev => prev.filter(s => s._id !== studentId));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove student' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove student' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Get students not in this class for adding
  const availableStudents = allStudents.filter(s => 
    s.class !== selectedClass?.name &&
    (studentSearch === '' || 
     s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
     s.email?.toLowerCase().includes(studentSearch.toLowerCase()))
  );

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
    card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    addButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' },
    td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block', background: '#dbeafe', color: '#1e40af' },
    teacherBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    teacherAssigned: { background: '#d1fae5', color: '#065f46' },
    teacherNone: { background: '#fee2e2', color: '#991b1b' },
    actionBtn: { padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginRight: '8px' },
    editBtn: { background: '#dbeafe', color: '#1e40af' },
    studentsBtn: { background: '#f3e8ff', color: '#7c3aed' },
    deleteBtn: { background: '#fee2e2', color: '#dc2626' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px' },
    disabledInput: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#e5e7eb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px', cursor: 'not-allowed', color: '#6b7280' },
    modalButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    dangerButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    note: { fontSize: '13px', color: '#6b7280', marginTop: '-12px', marginBottom: '16px', fontStyle: 'italic' },
    emptyState: { textAlign: 'center', padding: '60px', color: '#9ca3af' },
    studentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' },
    addStudentBtn: { padding: '4px 12px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
    removeStudentBtn: { padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' }}>
        <div style={{ fontSize: '24px', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

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
        <h1 style={styles.pageTitle}>📚 Manage Classes</h1>
        <p style={styles.pageSubtitle}>Create classes, assign teachers, and manage students</p>

        <div style={styles.card}>
          {message.text && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div style={styles.headerRow}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              All Classes ({classes.length})
            </h3>
            <button style={styles.addButton} onClick={() => { setFormData({ name: '', teacherId: '' }); setShowAddModal(true); }}>
              + Add New Class
            </button>
          </div>

          {classes.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
              <p style={{ fontSize: '16px' }}>No classes found</p>
              <p>Click "Add New Class" to create your first class</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Class Name</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Students</th>
                  <th style={styles.th}>Teacher</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls._id || cls.id}>
                    <td style={styles.td}><strong>{cls.name}</strong></td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{cls.grade || 'Primary 1'}</span>
                    </td>
                    <td style={styles.td}>{cls.subject || 'Mathematics'}</td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '600', color: '#7c3aed' }}>{cls.studentCount || 0}</span>
                    </td>
                    <td style={styles.td}>
                      {cls.teacherId && cls.teacherName ? (
                        <span style={{ ...styles.teacherBadge, ...styles.teacherAssigned }}>
                          👩‍🏫 {cls.teacherName}
                          <button
                            onClick={() => handleRemoveTeacher(cls)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0', marginLeft: '4px' }}
                            title="Remove teacher"
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <span style={{ ...styles.teacherBadge, ...styles.teacherNone }}>
                          ❌ Not assigned
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.studentsBtn }} 
                        onClick={() => openStudentsModal(cls)}
                      >
                        👥 Students
                      </button>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.editBtn }} 
                        onClick={() => openEditModal(cls)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }} 
                        onClick={() => { setSelectedClass(cls); setShowDeleteModal(true); }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Card */}
        <div style={{ ...styles.card, marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>📊 Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>{classes.length}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Classes</div>
            </div>
            <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e40af' }}>
                {classes.filter(c => c.teacherId).length}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>With Teachers</div>
            </div>
            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#92400e' }}>
                {classes.filter(c => !c.teacherId).length}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Need Teachers</div>
            </div>
            <div style={{ padding: '16px', background: '#f3e8ff', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#7c3aed' }}>
                {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Students</div>
            </div>
            <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>
                {allStudents.filter(s => !s.class).length}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Unassigned</div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Class Modal */}
      {showAddModal && (
        <div style={styles.modal} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>➕ Add New Class</h2>
            
            <label style={styles.label}>Class Name *</label>
            <input
              type="text"
              placeholder="e.g., 1A, P1-Math-A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
            />

            <label style={styles.label}>Assign Teacher (Optional)</label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              style={styles.select}
            >
              <option value="">-- No Teacher --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>

            <label style={styles.label}>Grade Level</label>
            <input type="text" value="Primary 1" disabled style={styles.disabledInput} />
            <p style={styles.note}>Platform is scoped to Primary 1 Mathematics</p>

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowAddModal(false)} disabled={saving}>
                Cancel
              </button>
              <button style={styles.saveButton} onClick={handleAddClass} disabled={saving}>
                {saving ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <div style={styles.modal} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>✏️ Edit Class</h2>
            
            <label style={styles.label}>Class Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
            />

            <label style={styles.label}>Assign Teacher</label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              style={styles.select}
            >
              <option value="">-- No Teacher (Remove) --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                  {t._id === selectedClass.teacherId ? ' ✓ Current' : ''}
                </option>
              ))}
            </select>
            <p style={styles.note}>
              {selectedClass.teacherName 
                ? `Currently assigned: ${selectedClass.teacherName}` 
                : 'No teacher currently assigned'}
            </p>

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowEditModal(false)} disabled={saving}>
                Cancel
              </button>
              <button style={styles.saveButton} onClick={handleUpdateClass} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Management Modal */}
      {showStudentsModal && selectedClass && (
        <div style={styles.modal} onClick={() => setShowStudentsModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👥 Students in "{selectedClass.name}"</h2>
            
            {/* Current Students */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>
                Current Students ({classStudents.length})
              </h4>
              {classStudents.length === 0 ? (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No students in this class yet</p>
              ) : (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {classStudents.map(student => (
                    <div key={student._id} style={styles.studentItem}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{student.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{student.email}</div>
                      </div>
                      <button 
                        style={styles.removeStudentBtn}
                        onClick={() => handleRemoveStudentFromClass(student._id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Students */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Add Students</h4>
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ ...styles.input, marginBottom: '12px' }}
              />
              
              {availableStudents.length === 0 ? (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No available students to add</p>
              ) : (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {availableStudents.slice(0, 20).map(student => (
                    <div key={student._id} style={styles.studentItem}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{student.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {student.email}
                          {student.class && <span> (Currently in: {student.class})</span>}
                        </div>
                      </div>
                      <button 
                        style={styles.addStudentBtn}
                        onClick={() => handleAddStudentToClass(student._id)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                  {availableStudents.length > 20 && (
                    <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                      Showing first 20 results. Use search to find more.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={styles.modalButtons}>
              <button 
                style={{ ...styles.cancelButton, flex: 'none', padding: '12px 24px' }} 
                onClick={() => { setShowStudentsModal(false); setStudentSearch(''); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClass && (
        <div style={styles.modal} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🗑️ Delete Class</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedClass.name}"</strong>?
              {selectedClass.studentCount > 0 && (
                <span style={{ display: 'block', marginTop: '8px', color: '#dc2626' }}>
                  ⚠️ This class has {selectedClass.studentCount} students assigned!
                </span>
              )}
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowDeleteModal(false)} disabled={saving}>
                Cancel
              </button>
              <button style={styles.dangerButton} onClick={handleDeleteClass} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
