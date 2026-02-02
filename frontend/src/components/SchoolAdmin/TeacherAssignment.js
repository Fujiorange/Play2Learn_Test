import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function TeacherAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education'];

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mongo/school-admin/teachers/assignments`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/school-admin/classes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const [teachersData, classesData] = await Promise.all([
        teachersRes.json(),
        classesRes.json()
      ]);

      if (teachersData.success) {
        setTeachers(teachersData.teachers || []);
      }

      if (classesData.success) {
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentModal = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClasses(teacher.assignedClasses || []);
    setSelectedSubjects(teacher.assignedSubjects || []);
    setAssignmentModal(true);
  };

  const toggleClass = (className) => {
    setSelectedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const saveAssignments = async () => {
    if (!selectedTeacher) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/school-admin/teachers/${selectedTeacher._id}/assignments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          classes: selectedClasses,
          subjects: selectedSubjects
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Assignments updated successfully!');
        setAssignmentModal(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to update assignments');
      }
    } catch (error) {
      console.error('Save assignments error:', error);
      setError('Failed to save assignments');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0,
    },
    backButton: {
      padding: '10px 20px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '500',
    },
    successAlert: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #34d399',
    },
    errorAlert: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #f87171',
    },
    teacherGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
    },
    teacherCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    teacherName: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
    },
    teacherEmail: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px',
    },
    assignmentSection: {
      marginBottom: '16px',
    },
    sectionLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '8px',
      textTransform: 'uppercase',
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    tag: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '500',
    },
    classTag: {
      background: '#dbeafe',
      color: '#1e40af',
    },
    subjectTag: {
      background: '#fef3c7',
      color: '#92400e',
    },
    noAssignment: {
      fontSize: '13px',
      color: '#9ca3af',
      fontStyle: 'italic',
    },
    editButton: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      marginTop: '16px',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    modalSubtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px',
    },
    checkboxSection: {
      marginBottom: '24px',
    },
    checkboxGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '8px',
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px',
      background: '#f9fafb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    checkboxItemSelected: {
      background: '#dbeafe',
    },
    modalActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    cancelButton: {
      flex: 1,
      padding: '12px',
      background: '#e5e7eb',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    saveButton: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      color: '#6b7280',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '24px', color: '#6b7280', fontWeight: '600' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👩‍🏫 Teacher Assignments</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Assign classes and subjects to teachers</p>
          </div>
          <button style={styles.backButton} onClick={() => navigate('/school-admin')}>
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={{...styles.alert, ...styles.errorAlert}}>
            {error}
            <button 
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        {success && (
          <div style={{...styles.alert, ...styles.successAlert}}>
            {success}
            <button 
              onClick={() => setSuccess('')}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        {teachers.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👩‍🏫</div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No teachers found</p>
            <p>Add teachers to your school to manage their assignments</p>
          </div>
        ) : (
          <div style={styles.teacherGrid}>
            {teachers.map(teacher => (
              <div key={teacher._id} style={styles.teacherCard}>
                <div style={styles.teacherName}>{teacher.name}</div>
                <div style={styles.teacherEmail}>{teacher.email}</div>

                <div style={styles.assignmentSection}>
                  <div style={styles.sectionLabel}>Assigned Classes</div>
                  <div style={styles.tagContainer}>
                    {teacher.assignedClasses?.length > 0 ? (
                      teacher.assignedClasses.map(cls => (
                        <span key={cls} style={{...styles.tag, ...styles.classTag}}>{cls}</span>
                      ))
                    ) : (
                      <span style={styles.noAssignment}>No classes assigned</span>
                    )}
                  </div>
                </div>

                <div style={styles.assignmentSection}>
                  <div style={styles.sectionLabel}>Assigned Subjects</div>
                  <div style={styles.tagContainer}>
                    {teacher.assignedSubjects?.length > 0 ? (
                      teacher.assignedSubjects.map(subj => (
                        <span key={subj} style={{...styles.tag, ...styles.subjectTag}}>{subj}</span>
                      ))
                    ) : (
                      <span style={styles.noAssignment}>No subjects assigned</span>
                    )}
                  </div>
                </div>

                <button
                  style={styles.editButton}
                  onClick={() => openAssignmentModal(teacher)}
                >
                  ✏️ Edit Assignments
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Assignment Modal */}
        {assignmentModal && selectedTeacher && (
          <div style={styles.modal} onClick={() => setAssignmentModal(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Edit Assignments for {selectedTeacher.name}</h2>
              <p style={styles.modalSubtitle}>Select classes and subjects to assign</p>

              <div style={styles.checkboxSection}>
                <div style={styles.sectionLabel}>Classes</div>
                <div style={styles.checkboxGrid}>
                  {classes.map(cls => (
                    <div
                      key={cls}
                      style={{
                        ...styles.checkboxItem,
                        ...(selectedClasses.includes(cls) ? styles.checkboxItemSelected : {})
                      }}
                      onClick={() => toggleClass(cls)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(cls)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{cls}</span>
                    </div>
                  ))}
                </div>
                {classes.length === 0 && (
                  <p style={styles.noAssignment}>No classes available. Add classes first.</p>
                )}
              </div>

              <div style={styles.checkboxSection}>
                <div style={styles.sectionLabel}>Subjects</div>
                <div style={styles.checkboxGrid}>
                  {subjects.map(subj => (
                    <div
                      key={subj}
                      style={{
                        ...styles.checkboxItem,
                        ...(selectedSubjects.includes(subj) ? styles.checkboxItemSelected : {})
                      }}
                      onClick={() => toggleSubject(subj)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subj)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{subj}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button style={styles.cancelButton} onClick={() => setAssignmentModal(false)}>
                  Cancel
                </button>
                <button style={styles.saveButton} onClick={saveAssignments}>
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
