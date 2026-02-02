import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

export default function ManualAddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    gender: '',
    gradeLevel: 'Primary 1', 
    subject: 'Mathematics',   
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loadingLicense, setLoadingLicense] = useState(true);

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

    // Fetch license info on component mount
    fetchLicenseInfo();
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  // Check if role selection is disabled due to license limits
  const isRoleDisabled = (role) => {
    if (!licenseInfo) return false;
    if (role === 'teacher' && licenseInfo.teachers.limitReached) return true;
    if (role === 'student' && licenseInfo.students.limitReached) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
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
      // REAL API CALL - This will hit the database!
      const result = await schoolAdminService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        gender: formData.gender,
        gradeLevel: 'Primary 1',
        subject: 'Mathematics'
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'User created successfully!' });
        // Refresh license info after successful creation
        fetchLicenseInfo();
        setTimeout(() => {
          setFormData({ 
            name: '', 
            email: '', 
            password: '', 
            role: '', 
            gender: '', 
            gradeLevel: 'Primary 1', 
            subject: 'Mathematics' 
          });
          setMessage({ type: '', text: '' });
        }, 2000);
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
                Password<span style={styles.required}>*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Role<span style={styles.required}>*</span>
              </label>
              {(() => {
                // Pre-compute disabled states to avoid redundant calculations
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

            {formData.role === 'student' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Grade Level</label>
                  <input
                    type="text"
                    value="Primary 1"
                    disabled
                    style={styles.disabledInput}
                  />
                  <p style={styles.note}>Platform is currently scoped to Primary 1 only</p>
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
              </>
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