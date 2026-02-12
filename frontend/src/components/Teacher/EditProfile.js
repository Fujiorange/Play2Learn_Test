import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [contactError, setContactError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    assignedClasses: [],
    assignedSubjects: [],
  });

  const getToken = () => localStorage.getItem('token');

  // Validate: 8 digits
  const validateContact = (value) => {
    if (!value || value.trim() === '') return '';
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length === 8) return '';
    return 'Must be 8 digits phone number';
  };

  const handleContactChange = (e) => {
    const value = e.target.value.replace(/[^\d\s\-+]/g, '');
    setFormData(prev => ({ ...prev, contact: value }));
    setContactError(validateContact(value));
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) { navigate('/login'); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            contact: data.user.contact || '',
            assignedClasses: data.user.assignedClasses || [],
            assignedSubjects: data.user.assignedSubjects || [],
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateContact(formData.contact);
    if (error) { setContactError(error); setMessage({ type: 'error', text: error }); return; }
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: formData.contact })
      });
      const data = await res.json();
      if (data.success) {
        const user = authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify({ ...user, contact: formData.contact }));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => navigate('/teacher'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (e) { setMessage({ type: 'error', text: 'Connection error' }); }
    finally { setSaving(false); }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', width: '100%', boxSizing: 'border-box' },
    inputError: { borderColor: '#ef4444' },
    inputDisabled: { background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' },
    errorText: { color: '#ef4444', fontSize: '13px', marginTop: '4px' },
    hintText: { color: '#6b7280', fontSize: '12px', marginTop: '4px' },
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '8px' },
    saveBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    cancelBtn: { flex: 1, padding: '14px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    success: { background: '#d1fae5', color: '#065f46' },
    error: { background: '#fee2e2', color: '#991b1b' },
    disabled: { opacity: 0.5, cursor: 'not-allowed' },
    infoBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' },
  };

  if (loading) return <div style={styles.container}><div style={styles.content}>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>✏️ Edit Profile</h1>
          <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>

        <div style={styles.infoBox}>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
            ℹ️ Only contact number can be updated. For other changes, contact School Admin.
          </p>
        </div>

        {message.text && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input type="text" value={formData.name} disabled style={{ ...styles.input, ...styles.inputDisabled }} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input type="email" value={formData.email} disabled style={{ ...styles.input, ...styles.inputDisabled }} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Number ✏️</label>
            <input
              type="tel"
              value={formData.contact}
              onChange={handleContactChange}
              placeholder="e.g., 91234567 or +6591234567"
              disabled={saving}
              style={{ ...styles.input, ...(contactError ? styles.inputError : {}) }}
            />
            {contactError ? (
              <span style={styles.errorText}>⚠️ {contactError}</span>
            ) : (
              <span style={styles.hintText}>Enter a 8 digit phone number</span>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" disabled={saving || !!contactError} style={{ ...styles.saveBtn, ...((saving || contactError) ? styles.disabled : {}) }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/teacher')} disabled={saving} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
