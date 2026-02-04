import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { getSchools, createSingleSchoolAdmin } from '../../services/p2lAdminService';

export default function ManualAddSchoolAdmin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    schoolId: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'Platform Admin' && currentUser.role !== 'p2ladmin') {
      navigate('/login');
      return;
    }

    // Fetch schools on component mount
    fetchSchools();
  }, [navigate]);

  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await getSchools();
      if (response.data) {
        setSchools(response.data);
      } else if (Array.isArray(response)) {
        setSchools(response);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setMessage({ type: 'error', text: 'Failed to load schools' });
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.schoolId) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);

    try {
      const adminData = {
        name: formData.name,
        email: formData.email,
        contact: formData.contact || undefined,
      };

      const result = await createSingleSchoolAdmin(formData.schoolId, adminData);

      if (result.success || (result.created && result.created.length > 0)) {
        // Get the created admin from response
        const created = result.created && result.created.length > 0 ? result.created[0] : null;
        
        if (created) {
          // Use the tempPassword from the backend response
          setCreatedAdmin({
            id: created.id,
            name: created.name,
            email: created.email,
            tempPassword: created.tempPassword,
            schoolName: schools.find(s => s._id === formData.schoolId)?.organization_name || 'Unknown School'
          });
          setMessage({ type: 'success', text: 'School Admin created successfully!' });
        } else {
          setMessage({ type: 'error', text: 'Admin created but no details returned' });
        }
      } else {
        const errorMsg = result.error || (result.errors && result.errors.length > 0 ? result.errors[0].error : 'Failed to create school admin');
        setMessage({ type: 'error', text: errorMsg });
      }

    } catch (err) {
      console.error('Create school admin error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to create school admin' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setFormData({ 
      name: '', 
      email: '', 
      contact: '',
      schoolId: '',
    });
    setCreatedAdmin(null);
    setMessage({ type: '', text: '' });
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    header: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 0' },
    headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' },
    logoText: { fontSize: '20px', fontWeight: '700', color: '#1f2937' },
    backButton: { padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    main: { maxWidth: '700px', margin: '0 auto', padding: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    pageSubtitle: { fontSize: '15px', color: '#6b7280', marginBottom: '32px' },
    card: { background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    formGroup: { marginBottom: '20px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    required: { color: '#ef4444', marginLeft: '3px' },
    input: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', fontFamily: 'inherit', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' },
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '24px' },
    submitButton: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
    cancelButton: { flex: 1, padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
    message: { marginTop: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
    successMessage: { background: '#f0fdf4', border: '2px solid #bbf7d0', color: '#16a34a' },
    errorMessage: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626' },
    note: { fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' },
    successCard: { background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
    successTitle: { fontSize: '18px', fontWeight: '700', color: '#16a34a', marginBottom: '16px' },
    credentialsBox: { background: 'white', border: '2px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
    credentialsLabel: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
    credentialsValue: { fontSize: '16px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' },
    infoCard: { background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
    infoTitle: { fontSize: '16px', fontWeight: '700', color: '#0369a1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  };

  // If admin was just created, show success screen
  if (createdAdmin) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>P</div>
              <span style={styles.logoText}>Play2Learn Admin</span>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/p2ladmin/school-admins')}>
              ← Back to School Admin Management
            </button>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.successCard}>
            <div style={styles.successTitle}>✅ School Admin Created Successfully!</div>
            <p style={{ marginBottom: '16px', color: '#374151' }}>
              Please save these credentials. The password can only be viewed once.
            </p>
            
            <div style={styles.credentialsBox}>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Name</div>
                <div style={styles.credentialsValue}>{createdAdmin.name}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Email</div>
                <div style={styles.credentialsValue}>{createdAdmin.email}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>School</div>
                <div style={styles.credentialsValue}>{createdAdmin.schoolName}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={styles.credentialsLabel}>Role</div>
                <div style={styles.credentialsValue}>School Admin</div>
              </div>
              <div>
                <div style={styles.credentialsLabel}>Temporary Password</div>
                <div style={{ ...styles.credentialsValue, color: '#dc2626' }}>
                  {createdAdmin.tempPassword}
                </div>
              </div>
            </div>
            
            <div style={{ background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                📧 A welcome email with credentials has been sent to the school admin.
              </p>
            </div>
            
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              ⚠️ Please save these credentials securely. The school admin will be prompted to change their password on first login.
            </p>
            
            <div style={styles.buttonGroup}>
              <button 
                style={styles.cancelButton}
                onClick={() => navigate('/p2ladmin/school-admins')}
              >
                Back to School Admin Management
              </button>
              <button 
                style={styles.submitButton}
                onClick={handleCreateAnother}
              >
                Create Another School Admin
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
            <span style={styles.logoText}>Play2Learn Admin</span>
          </div>
          <button style={styles.backButton} onClick={() => navigate('/p2ladmin/school-admins')}>
            ← Back to School Admin Management
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Add New School Admin</h1>
        <p style={styles.pageSubtitle}>
          Create a new School Admin account. A temporary password will be generated and shown once.
        </p>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoTitle}>
            ℹ️ Account Creation Info
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e3a5f' }}>
            <li>A temporary password will be automatically generated</li>
            <li>The password will be shown only once after creation</li>
            <li>A welcome email will be sent to the school admin with their credentials</li>
            <li>The school admin will be required to change their password on first login</li>
          </ul>
        </div>

        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                School<span style={styles.required}>*</span>
              </label>
              {loadingSchools ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Loading schools...</p>
              ) : (
                <select
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.select}
                >
                  <option value="">Select a school</option>
                  {schools.map(school => (
                    <option key={school._id} value={school._id}>
                      {school.organization_name}
                    </option>
                  ))}
                </select>
              )}
              {schools.length === 0 && !loadingSchools && (
                <p style={styles.note}>No schools available. Create a school first in School Management.</p>
              )}
            </div>

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
                placeholder="admin@school.edu"
                disabled={loading}
                style={styles.input}
              />
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
              <p style={styles.note}>Optional - for administrative purposes only</p>
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => navigate('/p2ladmin/school-admins')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1 }}
                disabled={loading || schools.length === 0}
              >
                {loading ? 'Creating...' : 'Create School Admin'}
              </button>
            </div>

            {message.text && (
              <div style={{
                ...styles.message,
                ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
              }}>
                {message.text}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
