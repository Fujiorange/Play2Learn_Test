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
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const csvFileInputRef = React.useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Primary 1',
    subjects: ['Mathematics'],
    teachers: [],
    students: []
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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
         schoolAdminService.getAvailableStudents(true)
       ]);
      
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      }
      if (studentsResult.success) {
       // include only unassigned or currently assigned students
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
       grade: cls.grade,
       subjects: cls.subjects || ['Mathematics'],
       teachers: cls.teacherList ? cls.teacherList.map(t => t._id) : [],
       students: cls.studentList ? cls.studentList.map(s => s._id) : []
     });
     // Refresh both teachers and students to include currently assigned ones
     try {
       const [teachersResult, studentsResult] = await Promise.all([
         schoolAdminService.getAvailableTeachers(cls.id),
         schoolAdminService.getAvailableStudents(true, cls.id)
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

  const handleTeacherSelection = (teacherId) => {
    setFormData(prev => ({
      ...prev,
      teachers: prev.teachers.includes(teacherId)
        ? prev.teachers.filter(id => id !== teacherId)
        : [...prev.teachers, teacherId]
    }));
  };

  const handleStudentSelection = (studentId) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter(id => id !== studentId)
        : [...prev.students, studentId]
    }));
  };

  const handleSubjectSelection = (subject) => {
    // Only allow Mathematics for now
    if (subject !== 'Mathematics') {
      setMessage({ type: 'error', text: 'Only Mathematics is enabled for now' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const downloadCSVTemplate = () => {
    // CSV Template with class metadata in first row and users in subsequent rows
    const csvTemplate = `ClassName,Grade,Subject,Name,Email,Role,Gender,LinkedStudentEmail
Primary 1A,Primary 1,Mathematics,,,,,
,,,John Teacher,john.teacher@school.com,Teacher,male,
,,,Mary Student,mary.student@school.com,Student,female,
,,,Jane Parent,jane.parent@email.com,Parent,female,mary.student@school.com`;

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_creation_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please upload a CSV file' });
        setCsvFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        setCsvFile(null);
        return;
      }
      setCsvFile(selectedFile);
      setMessage({ type: '', text: '' });
      setUploadResult(null);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setUploadResult(null);

    try {
      const response = await schoolAdminService.bulkUploadClass(csvFile);

      if (response.success) {
        setUploadResult(response);
        const totalCreated = response.usersCreated.teachers + response.usersCreated.students + response.usersCreated.parents;
        const totalAssigned = response.usersAssigned.teachers + response.usersAssigned.parents;
        let message = `Class "${response.className}" created successfully! ${totalCreated} new users created`;
        if (totalAssigned > 0) {
          message += ` and ${totalAssigned} existing users assigned`;
        }
        message += '.';
        setMessage({ type: 'success', text: message });
        setCsvFile(null);
        // Reset file input using ref
        if (csvFileInputRef.current) {
          csvFileInputRef.current.value = '';
        }
        
        // Reload classes and users
        loadClasses();
        loadTeachersAndStudents();
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowCSVUploadModal(false);
          setUploadResult(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
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
    // CSV Upload Modal Styles
    infoBox: { background: '#f0f9ff', border: '2px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#1e40af' },
    infoTitle: { fontWeight: '700', marginBottom: '8px' },
    infoList: { margin: '8px 0 0 20px', paddingLeft: '0' },
    fileInput: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    fileInfo: { marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontSize: '14px', fontWeight: '500' },
    templateButton: { width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', marginBottom: '24px' },
    successBox: { marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '8px', color: '#16a34a' },
    successTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '12px' },
    successStats: { fontSize: '14px', marginBottom: '4px' },
    errorList: { fontSize: '13px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto' },
    errorItem: { padding: '4px 0', borderBottom: '1px solid #fecaca' },
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
    </div>
  );

  const renderCSVUploadModal = () => (
    <div style={styles.modal} onClick={() => setShowCSVUploadModal(false)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>📤 Create Class via CSV Upload</h2>
        
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>📋 CSV Format Requirements:</div>
          <ul style={styles.infoList}>
            <li><strong>First Row:</strong> Class metadata (ClassName, Grade, Subject)</li>
            <li><strong>Subsequent Rows:</strong> Users (Name, Email, Role, Gender, LinkedStudentEmail)</li>
            <li><strong>Grade:</strong> Only "Primary 1" is enabled</li>
            <li><strong>Subject:</strong> Only "Mathematics" is enabled</li>
            <li><strong>Roles:</strong> Teacher, Student, Parent</li>
            <li><strong>Teachers:</strong> Will be auto-assigned to class (can teach multiple classes)</li>
            <li><strong>Students:</strong> Must have unique email, assigned to single class only</li>
            <li><strong>Parents:</strong> Require LinkedStudentEmail to link with student</li>
          </ul>
        </div>

        <button
          style={styles.templateButton}
          onClick={downloadCSVTemplate}
          onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
        >
          📥 Download CSV Template
        </button>

        <label style={styles.label}>Select CSV File</label>
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVFileChange}
          style={styles.fileInput}
          disabled={uploading}
        />
        {csvFile && (
          <div style={styles.fileInfo}>
            ✅ {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
          </div>
        )}

        {uploadResult && uploadResult.success && (
          <div style={styles.successBox}>
            <div style={styles.successTitle}>✅ Upload Complete!</div>
            <div style={styles.successStats}>🏫 Class: {uploadResult.className}</div>
            <div style={styles.successStats}>👨‍🏫 Teachers Created: {uploadResult.usersCreated.teachers}</div>
            <div style={styles.successStats}>👩‍🎓 Students Created: {uploadResult.usersCreated.students}</div>
            <div style={styles.successStats}>👪 Parents Created: {uploadResult.usersCreated.parents}</div>
            {uploadResult.usersAssigned.teachers > 0 && (
              <div style={styles.successStats}>🔗 Existing Teachers Assigned: {uploadResult.usersAssigned.teachers}</div>
            )}
            {uploadResult.usersAssigned.parents > 0 && (
              <div style={styles.successStats}>🔗 Existing Parents Linked: {uploadResult.usersAssigned.parents}</div>
            )}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div style={styles.errorList}>
                <strong>⚠️ Errors:</strong>
                {uploadResult.errors.map((err, idx) => (
                  <div key={idx} style={styles.errorItem}>
                    Row {err.row}: {err.email} - {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={styles.modalButtons}>
          <button 
            style={styles.cancelButton} 
            onClick={() => {
              setShowCSVUploadModal(false);
              setCsvFile(null);
              setUploadResult(null);
            }}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            style={{
              ...styles.saveButton,
              opacity: uploading || !csvFile ? 0.7 : 1,
              cursor: uploading || !csvFile ? 'not-allowed' : 'pointer'
            }}
            onClick={handleCSVUpload}
            disabled={uploading || !csvFile}
          >
            {uploading ? 'Uploading...' : 'Upload & Create Class'}
          </button>
        </div>
      </div>
    </div>
  );

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
        <p style={styles.pageSubtitle}>Create and manage classes. Assign teachers and students to each class.</p>

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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                style={{ ...styles.addButton, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }} 
                onClick={() => setShowCSVUploadModal(true)}
              >
                📤 Upload CSV
              </button>
              <button style={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
                + Add New Class
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingSpinner}>Loading classes...</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Class Name</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Students</th>
                    <th style={styles.th}>Teacher(s)</th>
                    <th style={styles.th}>Actions</th>
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
                      <td style={styles.td}>
                        <button 
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          onClick={() => openEditModal(cls)}
                        >
                          Edit
                        </button>
                        <button 
                          style={{ ...styles.actionButton, ...styles.deleteButton }}
                          onClick={() => openDeleteModal(cls)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {classes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No classes found. Click "Add New Class" to create one.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showAddModal && renderModal(false)}
      {showEditModal && renderModal(true)}
      {showCSVUploadModal && renderCSVUploadModal()}

      {showDeleteModal && selectedClass && (
        <div style={styles.modal} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Delete Class</h2>
            <p style={{ marginBottom: '24px', color: '#374151' }}>
              Are you sure you want to delete the class "<strong>{selectedClass.name}</strong>"? 
              This will unassign all {selectedClass.students} students and teachers from this class.
              This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton} 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.dangerButton} 
                onClick={handleDeleteClass}
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
