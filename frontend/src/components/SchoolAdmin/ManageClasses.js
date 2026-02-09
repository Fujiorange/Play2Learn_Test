import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

const GRADES = [
  { value: 'Primary 1', enabled: true },
  { value: 'Primary 2', enabled: false },
  { value: 'Primary 3', enabled: false },
  { value: 'Primary 4', enabled: false },
  { value: 'Primary 5', enabled: false },
  { value: 'Primary 6', enabled: false }
];
const SUBJECTS = [
  { value: 'Mathematics', enabled: true },
  { value: 'Science', enabled: false },
  { value: 'English', enabled: false }
];

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Primary 1',
    subjects: ['Mathematics'],
    teachers: [],
    students: []
  });

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

    loadClasses();
    loadTeachersAndStudents();
  }, [navigate]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getClasses();
      if (result.success) {
        setClasses(result.classes || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load classes' });
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  const loadTeachersAndStudents = async () => {
    try {
      const [teachersResult, studentsResult] = await Promise.all([
        schoolAdminService.getAvailableTeachers(),
        schoolAdminService.getAvailableStudents(false) // Get ALL students
      ]);
      
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.students || []);
      }
    } catch (error) {
      console.error('Error loading teachers/students:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: 'Primary 1',
      subjects: ['Mathematics'],
      teachers: [],
      students: []
    });
  };

  const handleAddClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    try {
      const result = await schoolAdminService.createClass(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class created successfully!' });
        setShowAddModal(false);
        resetForm();
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create class' });
      }
    } catch (error) {
      console.error('Error creating class:', error);
      setMessage({ type: 'error', text: 'Failed to create class' });
    }
  };

  const handleEditClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    try {
      const result = await schoolAdminService.updateClass(selectedClass.id, formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class updated successfully!' });
        setShowEditModal(false);
        setSelectedClass(null);
        resetForm();
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update class' });
      }
    } catch (error) {
      console.error('Error updating class:', error);
      setMessage({ type: 'error', text: 'Failed to update class' });
    }
  };

  const handleDeleteClass = async () => {
    try {
      const result = await schoolAdminService.deleteClass(selectedClass.id);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class deleted successfully!' });
        setShowDeleteModal(false);
        setSelectedClass(null);
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete class' });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      setMessage({ type: 'error', text: 'Failed to delete class' });
    }
  };

  const openEditModal = async (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade || 'Primary 1',
      subjects: cls.subjects || ['Mathematics'],
      teachers: cls.teachers?.map(t => t.id || t._id) || [],
      students: cls.students?.map(s => s.id || s._id) || []
    });
    
    // Refresh teachers and students
    try {
      const [teachersResult, studentsResult] = await Promise.all([
        schoolAdminService.getAvailableTeachers(cls.id),
        schoolAdminService.getAvailableStudents(false, cls.id)
      ]);
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.students || []);
      }
    } catch (err) {
      console.error('Error refreshing teachers/students for edit:', err);
    }
    
    setShowEditModal(true);
  };

  const openDeleteModal = (cls) => {
    setSelectedClass(cls);
    setShowDeleteModal(true);
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
    actionButton: { padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', border: 'none' },
    editButton: { background: '#fef3c7', color: '#92400e' },
    deleteButton: { background: '#fee2e2', color: '#dc2626' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
    modalContentWide: { background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px', cursor: 'pointer' },
    multiSelect: { border: '2px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginBottom: '16px', maxHeight: '150px', overflow: 'auto', background: '#f9fafb' },
    checkboxItem: { display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderRadius: '4px' },
    checkboxItemHover: { background: '#e5e7eb' },
    checkbox: { marginRight: '8px' },
    modalButtons: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelButton: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    saveButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    dangerButton: { flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    note: { fontSize: '13px', color: '#6b7280', marginTop: '-8px', marginBottom: '16px', fontStyle: 'italic' },
    disabledSubject: { opacity: 0.5, cursor: 'not-allowed' },
    loadingSpinner: { textAlign: 'center', padding: '40px', color: '#6b7280' },
    // Two-column layout styles for edit mode
    twoColumnContainer: { display: 'flex', gap: '16px', marginBottom: '16px' },
    studentColumn: { flex: 1, display: 'flex', flexDirection: 'column' },
    columnHeader: { background: '#dbeafe', border: '2px solid #3b82f6', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '10px 12px', fontWeight: '600', fontSize: '14px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' },
    columnHeaderAvailable: { background: '#f0fdf4', border: '2px solid #10b981', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '10px 12px', fontWeight: '600', fontSize: '14px', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' },
    columnHeaderIcon: { fontSize: '16px' },
    multiSelectColumn: { border: '2px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '8px', flex: 1, maxHeight: '200px', overflow: 'auto', background: '#f9fafb' },
    checkboxItemInClass: { display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: '#dbeafe', marginBottom: '4px', border: '1px solid #93c5fd' },
    checkboxItemAvailable: { display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderRadius: '4px', background: '#ffffff', marginBottom: '4px', border: '1px solid #e5e7eb' },
    removeIcon: { marginLeft: 'auto', color: '#dc2626', fontWeight: 'bold', fontSize: '12px' },
    addIcon: { marginLeft: 'auto', color: '#10b981', fontWeight: 'bold', fontSize: '16px' },
  };

  const renderModal = (isEdit = false) => (
    <div style={styles.modal} onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}>
      <div style={isEdit ? styles.modalContentWide : styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>{isEdit ? 'Edit Class' : 'Add New Class'}</h2>
        
        <label style={styles.label}>Class Name *</label>
        <input
          type="text"
          placeholder="e.g., P1-Math-A"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={styles.input}
        />

        <label style={styles.label}>Grade Level *</label>
        <select
          value={formData.grade}
          onChange={(e) => {
            const selectedGrade = GRADES.find(g => g.value === e.target.value);
            if (selectedGrade && selectedGrade.enabled) {
              setFormData({ ...formData, grade: e.target.value });
            }
          }}
          style={styles.select}
        >
          {GRADES.map(grade => (
            <option 
              key={grade.value} 
              value={grade.value}
              disabled={!grade.enabled}
            >
              {grade.value} {!grade.enabled && '(Coming Soon)'}
            </option>
          ))}
        </select>
        <p style={styles.note}>Only Primary 1 is enabled for now</p>

        <label style={styles.label}>Subjects</label>
        <div style={styles.multiSelect}>
          {SUBJECTS.map(subject => (
            <div
              key={subject.value}
              style={{
                ...styles.checkboxItem,
                ...(subject.enabled ? {} : styles.disabledSubject)
              }}
              onClick={() => subject.enabled && handleSubjectSelection(subject.value)}
            >
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject.value)}
                readOnly
                disabled={!subject.enabled}
                style={styles.checkbox}
              />
              <span>{subject.value} {!subject.enabled && '(Coming Soon)'}</span>
            </div>
          ))}
        </div>
        <p style={styles.note}>Only Mathematics is enabled for now</p>

        <label style={styles.label}>Assign Teachers</label>
        <div style={styles.multiSelect}>
          {teachers.length === 0 ? (
            <p style={{ padding: '8px', color: '#6b7280' }}>No teachers available</p>
          ) : (
            teachers.map(teacher => (
              <div
                key={teacher.id}
                style={styles.checkboxItem}
                onClick={() => handleTeacherSelection(teacher.id)}
              >
                <input
                  type="checkbox"
                  checked={formData.teachers.includes(teacher.id)}
                  readOnly
                  style={styles.checkbox}
                />
                <span>{teacher.name} ({teacher.email})</span>
              </div>
            ))
          )}
        </div>

        <label style={styles.label}>Assign Students</label>
        {isEdit ? (
          /* Two-column layout for edit mode: Students in Class vs Available Students */
          (() => {
            const studentsInClass = students.filter(s => formData.students.includes(s.id));
            const availableStudents = students.filter(s => !formData.students.includes(s.id));
            return (
              <div style={styles.twoColumnContainer}>
                {/* Left Column: Students Currently in Class */}
                <div style={styles.studentColumn}>
                  <div style={styles.columnHeader}>
                    <span style={styles.columnHeaderIcon}>✅</span>
                    <span>Students in Class ({studentsInClass.length})</span>
                  </div>
                  <div style={styles.multiSelectColumn}>
                    {studentsInClass.length === 0 ? (
                      <p style={{ padding: '8px', color: '#6b7280', textAlign: 'center' }}>No students assigned yet</p>
                    ) : (
                      studentsInClass.map(student => (
                        <div
                          key={student.id}
                          style={styles.checkboxItemInClass}
                          onClick={() => handleStudentSelection(student.id)}
                          title="Click to remove from class"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            style={styles.checkbox}
                          />
                          <span>{student.name} ({student.email})</span>
                          <span style={styles.removeIcon}>✕</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Right Column: Available Students */}
                <div style={styles.studentColumn}>
                  <div style={styles.columnHeaderAvailable}>
                    <span style={styles.columnHeaderIcon}>➕</span>
                    <span>Available Students ({availableStudents.length})</span>
                  </div>
                  <div style={styles.multiSelectColumn}>
                    {availableStudents.length === 0 ? (
                      <p style={{ padding: '8px', color: '#6b7280', textAlign: 'center' }}>No students available</p>
                    ) : (
                      availableStudents.map(student => (
                        <div
                          key={student.id}
                          style={styles.checkboxItemAvailable}
                          onClick={() => handleStudentSelection(student.id)}
                          title="Click to add to class"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            readOnly
                            style={styles.checkbox}
                          />
                          <span>{student.name} ({student.email})</span>
                          <span style={styles.addIcon}>+</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* Single list for add mode */
          <div style={styles.multiSelect}>
            {students.length === 0 ? (
              <p style={{ padding: '8px', color: '#6b7280' }}>No students available</p>
            ) : (
              students.map(student => (
                <div
                  key={student.id}
                  style={styles.checkboxItem}
                  onClick={() => handleStudentSelection(student.id)}
                >
                  <input
                    type="checkbox"
                    checked={formData.students.includes(student.id)}
                    readOnly
                    style={styles.checkbox}
                  />
                  <span>{student.name} ({student.email})</span>
                </div>
              ))
            )}
          </div>
        )}

        <div style={styles.modalButtons}>
          <button 
            style={styles.cancelButton} 
            onClick={() => {
              isEdit ? setShowEditModal(false) : setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </button>
          <button 
            style={styles.saveButton} 
            onClick={isEdit ? handleEditClass : handleAddClass}
          >
            {isEdit ? 'Update Class' : 'Create Class'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        
        {message.text && (
          <div style={{ ...styles.message, background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#dc2626' }}>
            {message.text}
          </div>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>📚 Class Management</h1>
          <button style={styles.addBtn} onClick={() => { resetForm(); setShowAddModal(true); }}>+ Add Class</button>
        </div>

        {classes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No classes yet</p>
            <p>Create your first class to get started</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {classes.map(cls => (
              <div key={cls.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{cls.name}</h3>
                <p style={styles.cardInfo}>📊 Grade: {cls.grade || 'Primary 1'}</p>
                <p style={styles.cardInfo}>📖 Subject: {cls.subjects?.join(', ') || 'Mathematics'}</p>
                <p style={styles.cardInfo}>👨‍🏫 Teachers: {cls.teachers?.length || 0}</p>
                <p style={styles.cardInfo}>👥 Students: {cls.students?.length || 0}</p>
                <div style={styles.cardActions}>
                  <button style={styles.editBtn} onClick={() => openEditModal(cls)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => openDeleteModal(cls)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Add New Class</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name *</label>
                <input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., 1A" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Grade</label>
                <select style={{...styles.input}} value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  {GRADES.map(g => <option key={g.value} value={g.value} disabled={!g.enabled}>{g.value}{!g.enabled ? ' (Coming Soon)' : ''}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teachers</label>
                <select multiple style={styles.select} value={formData.teachers} onChange={e => setFormData({...formData, teachers: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Students</label>
                <select multiple style={styles.select} value={formData.students} onChange={e => setFormData({...formData, students: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email}){s.currentClass ? ` - Currently: ${s.currentClass}` : ''}</option>)}
                </select>
              </div>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleAddClass}>Create Class</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Edit Class</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name *</label>
                <input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Grade</label>
                <select style={{...styles.input}} value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  {GRADES.map(g => <option key={g.value} value={g.value} disabled={!g.enabled}>{g.value}{!g.enabled ? ' (Coming Soon)' : ''}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teachers</label>
                <select multiple style={styles.select} value={formData.teachers} onChange={e => setFormData({...formData, teachers: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Students</label>
                <select multiple style={styles.select} value={formData.students} onChange={e => setFormData({...formData, students: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email}){s.currentClass ? ` - Currently: ${s.currentClass}` : ''}</option>)}
                </select>
              </div>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEditClass}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Delete Class</h2>
              <p>Are you sure you want to delete <strong>{selectedClass?.name}</strong>?</p>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>This will unassign all teachers and students from this class.</p>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button style={{...styles.submitBtn, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}} onClick={handleDeleteClass}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
