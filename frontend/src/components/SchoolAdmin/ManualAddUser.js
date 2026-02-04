import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

// Generate random password using crypto API for better security
const generateRandomPassword = (userType) => {
  // Ensure userType has at least 3 characters, default to 'USR'
  const prefix = (userType && userType.length >= 3) 
    ? userType.substring(0, 3).toUpperCase() 
    : 'USR';
  
  // Use crypto API for secure random generation
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  const random = array[0].toString(16).substring(0, 4);
  
  const specialChars = '!@#$%^&*';
  const specialIndex = array[1] % specialChars.length;
  const special = specialChars[specialIndex];
  
  return `${prefix}${random}${special}`;
};

// Convert dd/mm/yyyy to ISO date string with proper validation
const parseDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
  
  // Validate the date is actually valid (e.g., not Feb 31)
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null; // Invalid date (e.g., Feb 30)
  }
  
  return date.toISOString();
};

export default function ManualAddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    salutation: '',
    gender: '',
    gradeLevel: 'Primary 1', 
    subject: 'Mathematics',
    classId: '',
    contact: '',
    date_of_birth: '',
    // Parent fields
    parentName: '',
    parentEmail: '',
    createParent: false,
    linkedStudents: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loadingLicense, setLoadingLicense] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordViewed, setPasswordViewed] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

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

    // Fetch license info and classes on component mount
    fetchLicenseInfo();
    fetchClasses();
    fetchStudents();
  }, [navigate]);

  const fetchLicenseInfo = async () => {
    setLoadingLicense(true);
    try {
      const result = await schoolAdminService.getSchoolInfo();
      if (result.success) {
        setLicenseInfo(result.license);
      } else {
        console.error('Failed to fetch license info:', result.error);
      }
    } catch (error) {
      console.error('Error fetching license info:', error);
    } finally {
      setLoadingLicense(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const result = await schoolAdminService.getClasses();
      if (result.success) {
        setClasses(result.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Get students without parents for parent creation
      const result = await schoolAdminService.getStudentsWithoutParent();
      if (result.success) {
        setStudents(result.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    setMessage({ type: '', text: '' });
  };

  const handleStudentLinking = (studentId) => {
    setFormData(prev => ({
      ...prev,
      linkedStudents: prev.linkedStudents.includes(studentId)
        ? prev.linkedStudents.filter(id => id !== studentId)
        : [...prev.linkedStudents, studentId]
    }));
  };

  // Check if role selection is disabled due to license limits
  const isRoleDisabled = (role) => {
    if (!licenseInfo) return false;
    if (role === 'teacher' && licenseInfo.teachers.limitReached) return true;
    if (role === 'student' && licenseInfo.students.limitReached) return true;
    return false;
  };

  const handleGeneratePassword = () => {
    const rolePrefix = formData.role || 'user';
    const newPassword = generateRandomPassword(rolePrefix);
    setGeneratedPassword(newPassword);
    setShowPassword(false);
    setPasswordViewed(false);
  };

  const handleViewPassword = () => {
    setShowPassword(true);
    setPasswordViewed(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Check license limits before submission
    if (licenseInfo) {
      if (formData.role === 'teacher' && licenseInfo.teachers.limitReached) {
        setMessage({ 
          type: 'error', 
          text: `Teacher limit reached (${licenseInfo.teachers.current}/${licenseInfo.teachers.limit}). Please upgrade your plan to add more teachers.` 
        });
        return;
      }
      if (formData.role === 'student' && licenseInfo.students.limitReached) {
        setMessage({ 
          type: 'error', 
          text: `Student limit reached (${licenseInfo.students.current}/${licenseInfo.students.limit}). Please upgrade your plan to add more students.` 
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Auto-generate password if not already generated
      const rolePrefix = formData.role || 'user';
      const password = generatedPassword || generateRandomPassword(rolePrefix);
      if (!generatedPassword) {
        setGeneratedPassword(password);
      }

      // Parse date from dd/mm/yyyy format
      const parsedDOB = parseDateDDMMYYYY(formData.date_of_birth);

      // Prepare user data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: password,
        role: formData.role,
        gender: formData.gender,
        gradeLevel: formData.role === 'student' ? formData.gradeLevel : null,
        subject: 'Mathematics',
        salutation: (formData.role === 'teacher' || formData.role === 'parent') ? formData.salutation : undefined,
        contact: formData.contact || undefined,
        date_of_birth: parsedDOB || undefined,
      };

      // Add class assignment for students and teachers
      if (formData.classId && (formData.role === 'student' || formData.role === 'teacher')) {
        userData.class = formData.classId;
      }

      // Add linked students for parents
      if (formData.role === 'parent' && formData.linkedStudents.length > 0) {
        userData.linkedStudents = formData.linkedStudents;
      }

      // Create the main user
      const result = await schoolAdminService.createUser(userData);

      if (result.success) {
        // Use the tempPassword from backend response (backend generates and stores the password)
        const backendTempPassword = result.user.tempPassword;
        setGeneratedPassword(backendTempPassword); // Update displayed password to match backend
        
        setCreatedUser({
          ...result.user,
          tempPassword: backendTempPassword
        });
        
        // If creating a student with parent info, create or link the parent
        if (formData.role === 'student' && formData.createParent && formData.parentName && formData.parentEmail) {
          const parentResult = await schoolAdminService.createOrLinkParent({
            parentName: formData.parentName,
            parentEmail: formData.parentEmail,
            studentId: result.user.id
          });
          
          if (parentResult.success) {
            if (parentResult.isExisting) {
              // Existing parent - student was linked
              setCreatedUser({
                ...result.user,
                tempPassword: backendTempPassword,
                parentLinked: true,
                parentEmail: formData.parentEmail,
                parentName: parentResult.parent.name
              });
              setMessage({ 
                type: 'success', 
                text: `Student created successfully! Linked to existing parent account: ${formData.parentEmail}` 
              });
            } else {
              // New parent created - show temp password
              setCreatedUser({
                ...result.user,
                tempPassword: backendTempPassword,
                parentCreated: true,
                parentEmail: formData.parentEmail,
                parentTempPassword: parentResult.parent.tempPassword
              });
              setMessage({ 
                type: 'success', 
                text: `Student and parent created successfully! Parent email: ${formData.parentEmail}` 
              });
            }
          } else {
            setMessage({ 
              type: 'success', 
              text: `Student created successfully! However, parent creation failed: ${parentResult.error}` 
            });
          }
        } else {
          setMessage({ type: 'success', text: 'User created successfully!' });
        }
        
        // Refresh license info after successful creation
        fetchLicenseInfo();
        fetchStudents();
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

  const handleCreateAnother = () => {
    setFormData({ 
      name: '', 
      email: '', 
      role: '', 
      salutation: '',
      gender: '', 
      gradeLevel: 'Primary 1', 
      subject: 'Mathematics',
      classId: '',
      contact: '',
      date_of_birth: '',
      parentName: '',
      parentEmail: '',
      createParent: false,
      linkedStudents: [],
    });
    setGeneratedPassword('');
    setShowPassword(false);
    setPasswordViewed(false);
    setCreatedUser(null);
    setMessage({ type: '', text: '' });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    main: { maxWidth: '700px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    formGroup: { marginBottom: '20px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    required: { color: '#ef4444', marginLeft: '3px' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box' },
    disabledInput: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#e5e7eb', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'not-allowed', color: '#6b757d' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '24px' },
    submitButton: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
    cancelButton: { flex: 1, padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
    message: { marginTop: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    note: { fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' },
    licenseCard: { background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
    licenseTitle: { fontSize: '16px', fontWeight: '700', color: '#0369a1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    licenseGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    licenseItem: { background: 'white', padding: '12px', borderRadius: '8px' },
    licenseLabel: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    licenseValue: { fontSize: '18px', fontWeight: '700' },
    limitReached: { color: '#dc2626' },
    limitOk: { color: '#16a34a' },
    warningBanner: { background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '14px' },
    passwordSection: { background: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
    passwordDisplay: { background: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    generateButton: { padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
    viewButton: { padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    checkboxContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
    multiSelect: { border: '2px solid #e5e7eb', borderRadius: '8px', padding: '8px', maxHeight: '150px', overflow: 'auto', background: '#f9fafb' },
    checkboxItem: { display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderRadius: '4px' },
    successCard: { background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
    successTitle: { fontSize: '18px', fontWeight: '700', color: '#16a34a', marginBottom: '16px' },
    credentialsBox: { background: 'white', border: '2px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    credentialsLabel: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    credentialsValue: { fontSize: '16px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' },
  };

  // If user was just created, show success screen
  if (createdUser) {
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
          <div style={styles.successCard}>
            <div style={styles.successTitle}>✅ User Created Successfully!</div>
            <p style={{ marginBottom: '16px', color: '#374151' }}>
              Please save these credentials. The password can only be viewed once.
            </p>
            
            <div style={styles.credentialsBox}>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Name</div>
                <div style={styles.credentialsValue}>{createdUser.name}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Email</div>
                <div style={styles.credentialsValue}>{createdUser.email}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Role</div>
                <div style={styles.credentialsValue}>{createdUser.role}</div>
              </div>
              <div>
                <div style={styles.credentialsLabel}>Temporary Password</div>
                <div style={{ ...styles.credentialsValue, color: '#dc2626' }}>
                  {createdUser.tempPassword}
                </div>
              </div>
            </div>
            
            {/* Show parent credentials if parent was created */}
            {createdUser.parentCreated && (
              <>
                <div style={{ margin: '24px 0', borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
                  <div style={{ ...styles.successTitle, fontSize: '18px', marginBottom: '12px' }}>
                    <span aria-hidden="true">👨‍👩‍👧 </span>Parent Account Also Created
                  </div>
                  <p style={{ marginBottom: '16px', color: '#374151', fontSize: '14px' }}>
                    Parent credentials for monitoring student progress:
                  </p>
                </div>
                
                <div style={styles.credentialsBox}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.credentialsLabel}>Parent Email</div>
                    <div style={styles.credentialsValue}>{createdUser.parentEmail}</div>
                  </div>
                  <div>
                    <div style={styles.credentialsLabel}>Parent Temporary Password</div>
                    <div style={{ ...styles.credentialsValue, color: '#dc2626' }}>
                      {createdUser.parentTempPassword}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Show message if student was linked to existing parent */}
            {createdUser.parentLinked && (
              <>
                <div style={{ margin: '24px 0', borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
                  <div style={{ ...styles.successTitle, fontSize: '18px', marginBottom: '12px', color: '#2563eb' }}>
                    <span aria-hidden="true">🔗 </span>Linked to Existing Parent Account
                  </div>
                  <p style={{ marginBottom: '16px', color: '#374151', fontSize: '14px' }}>
                    This student has been linked to an existing parent account:
                  </p>
                </div>
                
                <div style={{ ...styles.credentialsBox, background: '#f0f9ff', border: '2px solid #bfdbfe' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.credentialsLabel}>Parent Name</div>
                    <div style={styles.credentialsValue}>{createdUser.parentName}</div>
                  </div>
                  <div>
                    <div style={styles.credentialsLabel}>Parent Email</div>
                    <div style={styles.credentialsValue}>{createdUser.parentEmail}</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#2563eb', marginTop: '8px' }}>
                  ℹ️ The parent already has an account. No new credentials were generated.
                </p>
              </>
            )}
            
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              ⚠️ Please share these credentials securely with the user. They will be prompted to change their password on first login.
            </p>
            
            <div style={styles.buttonGroup}>
              <button 
                style={styles.cancelButton}
                onClick={() => navigate('/school-admin')}
              >
                Back to Dashboard
              </button>
              <button 
                style={styles.submitButton}
                onClick={handleCreateAnother}
              >
                Create Another User
              </button>
            </div>
          </div>
        </main>
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
        <h1 style={styles.pageTitle}>Add New User</h1>
        <p style={styles.pageSubtitle}>
          Create a new account for students, teachers, or parents. Platform scope: Primary 1 Mathematics only.
        </p>

        {/* License Information Card */}
        {!loadingLicense && licenseInfo && (
          <div style={styles.licenseCard}>
            <div style={styles.licenseTitle}>
              📋 License Status ({licenseInfo.plan.charAt(0).toUpperCase() + licenseInfo.plan.slice(1)} Plan)
            </div>
            <div style={styles.licenseGrid}>
              <div style={styles.licenseItem}>
                <div style={styles.licenseLabel}>Teachers</div>
                <div style={{
                  ...styles.licenseValue,
                  ...(licenseInfo.teachers.limitReached ? styles.limitReached : styles.limitOk)
                }}>
                  {licenseInfo.teachers.current} / {licenseInfo.teachers.limit}
                  {licenseInfo.teachers.limitReached && ' ⚠️'}
                </div>
                <div style={styles.licenseLabel}>
                  {licenseInfo.teachers.available > 0 
                    ? `${licenseInfo.teachers.available} slots available` 
                    : 'No slots available'}
                </div>
              </div>
              <div style={styles.licenseItem}>
                <div style={styles.licenseLabel}>Students</div>
                <div style={{
                  ...styles.licenseValue,
                  ...(licenseInfo.students.limitReached ? styles.limitReached : styles.limitOk)
                }}>
                  {licenseInfo.students.current} / {licenseInfo.students.limit}
                  {licenseInfo.students.limitReached && ' ⚠️'}
                </div>
                <div style={styles.licenseLabel}>
                  {licenseInfo.students.available > 0 
                    ? `${licenseInfo.students.available} slots available` 
                    : 'No slots available'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning banner if any limit is reached */}
        {licenseInfo && (licenseInfo.teachers.limitReached || licenseInfo.students.limitReached) && (
          <div style={styles.warningBanner}>
            ⚠️ {licenseInfo.teachers.limitReached && licenseInfo.students.limitReached 
              ? 'Both teacher and student limits have been reached.' 
              : licenseInfo.teachers.limitReached 
                ? 'Teacher limit has been reached.' 
                : 'Student limit has been reached.'
            } Contact your administrator to upgrade your plan.
          </div>
        )}

        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Full Name<span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email<span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Role<span style={styles.required}>*</span>
              </label>
              {(() => {
                const studentDisabled = isRoleDisabled('student');
                const teacherDisabled = isRoleDisabled('teacher');
                const currentRoleDisabled = formData.role && isRoleDisabled(formData.role);
                
                return (
                  <>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={loading}
                      style={styles.select}
                    >
                      <option value="">Select role</option>
                      <option value="student" disabled={studentDisabled}>
                        Student {studentDisabled ? '(Limit Reached)' : ''}
                      </option>
                      <option value="teacher" disabled={teacherDisabled}>
                        Teacher {teacherDisabled ? '(Limit Reached)' : ''}
                      </option>
                      <option value="parent">Parent</option>
                    </select>
                    {currentRoleDisabled && (
                      <p style={{ ...styles.note, color: '#dc2626' }}>
                        ⚠️ This role has reached its license limit. Please upgrade your plan.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            {(formData.role === 'teacher' || formData.role === 'parent') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Salutation</label>
                <select
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.select}
                >
                  <option value="">Select salutation</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                  <option value="Mdm">Mdm</option>
                </select>
              </div>
            )}

            {/* Password Generation Section */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Password
              </label>
              <div style={styles.passwordSection}>
                <div style={styles.passwordDisplay}>
                  <span>
                    {generatedPassword 
                      ? (showPassword ? generatedPassword : '••••••••') 
                      : 'Will be auto-generated on create'}
                  </span>
                </div>
                <div>
                  <button 
                    type="button" 
                    style={styles.generateButton}
                    onClick={handleGeneratePassword}
                    disabled={loading}
                  >
                    🔄 Preview Password
                  </button>
                  {generatedPassword && !passwordViewed && (
                    <button 
                      type="button" 
                      style={styles.viewButton}
                      onClick={handleViewPassword}
                      disabled={loading}
                    >
                      👁️ View Once
                    </button>
                  )}
                  {passwordViewed && (
                    <span style={{ marginLeft: '12px', color: '#6b7280', fontSize: '13px' }}>
                      ✓ Password viewed
                    </span>
                  )}
                </div>
                <p style={{ ...styles.note, marginTop: '12px' }}>
                  Password will be auto-generated when you click "Create User". You can preview it first if you'd like.
                </p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                style={styles.select}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth (dd/mm/yyyy)</label>
              <input
                type="text"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                placeholder="dd/mm/yyyy"
                disabled={loading}
                style={styles.input}
                pattern="\d{2}/\d{2}/\d{4}"
              />
              <p style={styles.note}>Format: dd/mm/yyyy (e.g., 15/03/2015)</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Number</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="e.g., +65 9123 4567"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* Class Assignment for Students and Teachers */}
            {(formData.role === 'student' || formData.role === 'teacher') && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign to Class</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.select}
                >
                  <option value="">Select class (optional)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.grade}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && (
                  <p style={styles.note}>No classes available. Create a class first in Class Management.</p>
                )}
              </div>
            )}

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Grade Level</label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleChange}
                    disabled={loading}
                    style={styles.select}
                  >
                    <option value="Primary 1">Primary 1</option>
                    <option value="Primary 2" disabled>Primary 2 (coming soon)</option>
                    <option value="Primary 3" disabled>Primary 3 (coming soon)</option>
                    <option value="Primary 4" disabled>Primary 4 (coming soon)</option>
                    <option value="Primary 5" disabled>Primary 5 (coming soon)</option>
                    <option value="Primary 6" disabled>Primary 6 (coming soon)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <input
                    type="text"
                    value="Mathematics"
                    disabled
                    style={styles.disabledInput}
                  />
                  <p style={styles.note}>Platform is currently scoped to Mathematics only</p>
                </div>

                {/* Parent Creation Option */}
                <div style={styles.formGroup}>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      name="createParent"
                      checked={formData.createParent}
                      onChange={handleChange}
                      style={styles.checkbox}
                      disabled={loading}
                    />
                    <label style={{ ...styles.label, marginBottom: 0 }}>
                      Create parent account for this student
                    </label>
                  </div>
                  
                  {formData.createParent && (
                    <>
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        placeholder="Parent's full name"
                        disabled={loading}
                        style={{ ...styles.input, marginBottom: '8px' }}
                      />
                      <input
                        type="email"
                        name="parentEmail"
                        value={formData.parentEmail}
                        onChange={handleChange}
                        placeholder="Parent's email"
                        disabled={loading}
                        style={styles.input}
                      />
                      <p style={styles.note}>
                        A parent account will be created and linked to this student automatically.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Parent-specific fields - Link to existing students */}
            {formData.role === 'parent' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Link to Students</label>
                <div style={styles.multiSelect}>
                  {students.length === 0 ? (
                    <p style={{ padding: '8px', color: '#6b7280' }}>
                      No students available to link. All students are already assigned to a parent, or there are no students in your school yet.
                    </p>
                  ) : (
                    students.map(student => (
                      <div
                        key={student.id}
                        style={styles.checkboxItem}
                        onClick={() => handleStudentLinking(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.linkedStudents.includes(student.id)}
                          readOnly
                          style={{ marginRight: '8px' }}
                        />
                        <span>{student.name} ({student.email})</span>
                      </div>
                    ))
                  )}
                </div>
                <p style={styles.note}>
                  Select students to link to this parent account. Only students without an assigned parent are shown. One child can only be assigned to one parent.
                </p>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => navigate('/school-admin')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>

            {message.text && (
              <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage) }}>
                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
