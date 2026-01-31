import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

export default function ManualAddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    gender: '',
    gradeLevel: 'Primary 1',
    class: '',
    subject: 'Mathematics',
    classes: [],          // For teachers - multiple classes
    linkedStudents: []    // For parents - multiple children
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role?.toLowerCase() !== 'school-admin') { navigate('/login'); return; }
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      // Load dashboard stats for license info
      const statsResult = await schoolAdminService.getDashboardStats();
      if (statsResult.success && statsResult.license) {
        setLicenseInfo(statsResult.license);
      }
      
      // Load available classes
      const classesResult = await schoolAdminService.getClasses();
      if (classesResult.success) {
        setAvailableClasses(classesResult.classes || []);
      }
      
      // Load students (for parent linking)
      const usersResult = await schoolAdminService.getUsers({ role: 'student' });
      if (usersResult.success) {
        setAvailableStudents(usersResult.users || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage({ type: '', text: '' });
  };

  const handleClassToggle = (className) => {
    const newClasses = formData.classes.includes(className)
      ? formData.classes.filter(c => c !== className)
      : [...formData.classes, className];
    setFormData({ ...formData, classes: newClasses });
  };

  const handleStudentToggle = (studentId) => {
    const newLinked = formData.linkedStudents.includes(studentId)
      ? formData.linkedStudents.filter(s => s !== studentId)
      : [...formData.linkedStudents, studentId];
    setFormData({ ...formData, linkedStudents: newLinked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Validate teacher has classes
    if (formData.role === 'teacher' && formData.classes.length === 0) {
      setMessage({ type: 'error', text: 'Teacher must be assigned to at least one class' });
      return;
    }

    // Validate parent has linked students
    if (formData.role === 'parent' && formData.linkedStudents.length === 0) {
      setMessage({ type: 'error', text: 'Parent must be linked to at least one student' });
      return;
    }

    // Check license limits
    if (licenseInfo) {
      if (formData.role === 'teacher' && licenseInfo.currentTeachers >= licenseInfo.teacherLimit) {
        setMessage({ type: 'error', text: `Teacher license limit reached (${licenseInfo.currentTeachers}/${licenseInfo.teacherLimit})` });
        return;
      }
      if (formData.role === 'student' && licenseInfo.currentStudents >= licenseInfo.studentLimit) {
        setMessage({ type: 'error', text: `Student license limit reached (${licenseInfo.currentStudents}/${licenseInfo.studentLimit})` });
        return;
      }
    }

    setLoading(true);

    try {
      const result = await schoolAdminService.createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        gender: formData.gender,
        gradeLevel: formData.gradeLevel,
        class: formData.class,
        subject: formData.subject,
        classes: formData.role === 'teacher' ? formData.classes : undefined,
        linkedStudents: formData.role === 'parent' ? formData.linkedStudents : undefined
      });

      if (result.success) {
        const tempPwd = result.tempPassword ? ` Temporary password: ${result.tempPassword}` : '';
        setMessage({ type: 'success', text: `User created successfully!${tempPwd}` });
        
        // Refresh license info
        loadInitialData();
        
        setTimeout(() => {
          setFormData({
            name: '', email: '', role: '', gender: '', gradeLevel: 'Primary 1',
            class: '', subject: 'Mathematics', classes: [], linkedStudents: []
          });
        }, 5000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create user' });
      }
    } catch (err) {
      console.error('Create user error:', err);
      setMessage({ type: 'error', text: 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main">
        <h1 className="sa-page-title">👤 Add New User</h1>
        <p className="sa-page-subtitle">Create a new student, teacher, or parent account</p>

        {/* License Info Card */}
        {licenseInfo && (
          <div className="sa-card sa-mb-4" style={{ background: '#f0f9ff', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e40af' }}>📋 License: {licenseInfo.plan?.toUpperCase() || 'STARTER'}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  Teachers: {licenseInfo.currentTeachers}/{licenseInfo.teacherLimit} • 
                  Students: {licenseInfo.currentStudents}/{licenseInfo.studentLimit}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: licenseInfo.currentTeachers >= licenseInfo.teacherLimit ? '#dc2626' : '#16a34a' }}>
                    {licenseInfo.teacherLimit - licenseInfo.currentTeachers}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Teachers left</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: licenseInfo.currentStudents >= licenseInfo.studentLimit ? '#dc2626' : '#16a34a' }}>
                    {licenseInfo.studentLimit - licenseInfo.currentStudents}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Students left</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        <div className="sa-card">
          <form onSubmit={handleSubmit}>
            <div className="sa-form-group">
              <label className="sa-label">Full Name *</label>
              <input type="text" name="name" className="sa-input" value={formData.name} onChange={handleChange} placeholder="Enter full name" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Email *</label>
              <input type="email" name="email" className="sa-input" value={formData.email} onChange={handleChange} placeholder="Enter email address" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Role *</label>
              <select name="role" className="sa-select" value={formData.role} onChange={handleChange}>
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Gender</label>
              <select name="gender" className="sa-select" value={formData.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div className="sa-form-group">
                  <label className="sa-label">Grade Level</label>
                  <select name="gradeLevel" className="sa-select" value={formData.gradeLevel} onChange={handleChange}>
                    <option value="Primary 1">Primary 1</option>
                  </select>
                </div>
                <div className="sa-form-group">
                  <label className="sa-label">Class</label>
                  <select name="class" className="sa-select" value={formData.class} onChange={handleChange}>
                    <option value="">Select class</option>
                    {availableClasses.map(cls => (
                      <option key={cls._id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {formData.role === 'teacher' && (
              <div className="sa-form-group">
                <label className="sa-label">Assign Classes * (Select at least one)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {availableClasses.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>No classes available. Create classes first.</p>
                  ) : (
                    availableClasses.map(cls => (
                      <button
                        key={cls._id}
                        type="button"
                        onClick={() => handleClassToggle(cls.name)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: formData.classes.includes(cls.name) ? '2px solid #10b981' : '2px solid #e5e7eb',
                          background: formData.classes.includes(cls.name) ? '#d1fae5' : 'white',
                          cursor: 'pointer',
                          fontWeight: formData.classes.includes(cls.name) ? '600' : '400'
                        }}
                      >
                        {formData.classes.includes(cls.name) ? '✓ ' : ''}{cls.name}
                      </button>
                    ))
                  )}
                </div>
                {formData.classes.length > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#059669' }}>
                    Selected: {formData.classes.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Parent-specific fields */}
            {formData.role === 'parent' && (
              <div className="sa-form-group">
                <label className="sa-label">Link Children * (Select at least one)</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginTop: '8px' }}>
                  {availableStudents.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No students available. Create students first.</p>
                  ) : (
                    availableStudents.map(student => (
                      <div
                        key={student._id}
                        onClick={() => handleStudentToggle(student._id)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          background: formData.linkedStudents.includes(student._id) ? '#d1fae5' : '#f9fafb',
                          border: formData.linkedStudents.includes(student._id) ? '2px solid #10b981' : '2px solid transparent',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500' }}>{student.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{student.email} • {student.class || 'No class'}</div>
                        </div>
                        {formData.linkedStudents.includes(student._id) && (
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {formData.linkedStudents.length > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#059669' }}>
                    Selected: {formData.linkedStudents.length} child(ren)
                  </p>
                )}
              </div>
            )}

            <button type="submit" className="sa-button-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
