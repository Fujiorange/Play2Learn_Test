import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    assignedClasses: [],
    assignedSubjects: [],
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        
        if (data.success && data.user) {
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            contact: data.user.contact || '',
            assignedClasses: data.user.assignedClasses || [],
            assignedSubjects: data.user.assignedSubjects || [],
          });
        } else {
          const user = authService.getCurrentUser();
          if (user) {
            setFormData({
              name: user.name || '',
              email: user.email || '',
              contact: user.contact || '',
              assignedClasses: user.assignedClasses || [],
              assignedSubjects: user.assignedSubjects || [],
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
        const user = authService.getCurrentUser();
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            contact: user.contact || '',
            assignedClasses: user.assignedClasses || [],
            assignedSubjects: user.assignedSubjects || [],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
        })
      });

      const data = await response.json();

      if (data.success) {
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => navigate('/teacher/profile'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server.' });
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' },
    inputDisabled: { background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' },
    infoBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' },
    classTag: { display: 'inline-block', padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '16px', fontSize: '13px', fontWeight: '500', marginRight: '8px', marginBottom: '8px' },
    subjectTag: { display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '16px', fontSize: '13px', fontWeight: '500', marginRight: '8px', marginBottom: '8px' },
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '16px' },
    saveBtn: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    cancelBtn: { flex: 1, padding: '12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    success: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
    hint: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading) return <div style={styles.loading}><div>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Profile</h1>
          <button style={styles.backBtn} onClick={() => navigate('/teacher/profile')}>← Back to Profile</button>
        </div>

        <div style={styles.infoBox}>
          <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>ℹ️ Only contact number can be updated. Other details are managed by School Admin.</p>
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
            <span style={styles.hint}>Contact School Admin to change name</span>
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
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Enter your phone number"
              disabled={saving}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Assigned Classes</label>
            <div>
              {formData.assignedClasses.length > 0 ? (
                formData.assignedClasses.map((cls, i) => <span key={i} style={styles.classTag}>{cls}</span>)
              ) : (
                <span style={{ color: '#6b7280', fontSize: '14px' }}>No classes assigned</span>
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Assigned Subjects</label>
            <div>
              {formData.assignedSubjects.length > 0 ? (
                formData.assignedSubjects.map((subj, i) => <span key={i} style={styles.subjectTag}>{subj}</span>)
              ) : (
                <span style={{ color: '#6b7280', fontSize: '14px' }}>No subjects assigned</span>
              )}
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" disabled={saving} style={{ ...styles.saveBtn, ...(saving ? styles.disabled : {}) }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/teacher/profile')} disabled={saving} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
