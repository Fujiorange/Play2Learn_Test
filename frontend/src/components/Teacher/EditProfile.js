import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: '',
    organizationName: '',
    organizationType: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const currentUser = authService.getCurrentUser();
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          contact: currentUser.contact || '',
          gender: currentUser.gender || '',
          organizationName: currentUser.organization_name || '',
          organizationType: currentUser.organization_type || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      // Here you would call your API to update the profile
      // For now, we'll simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update localStorage
      const currentUser = authService.getCurrentUser();
      const updatedUser = {
        ...currentUser,
        name: formData.name,
        contact: formData.contact,
        gender: formData.gender,
        organization_name: formData.organizationName,
        organization_type: formData.organizationType,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/teacher/profile');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e5e7eb',
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
      transition: 'all 0.3s',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#10b981',
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      transition: 'all 0.3s',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
    },
    saveButton: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    cancelButton: {
      flex: 1,
      padding: '12px',
      background: '#e5e7eb',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '16px',
    },
    successMessage: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #34d399',
    },
    errorMessage: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #f87171',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    loadingText: {
      fontSize: '24px',
      color: '#6b7280',
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Profile</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate('/teacher/profile')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Profile
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

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={saving}
              style={{
                ...styles.input,
                ...(saving ? styles.disabled : {})
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Email (Read-only) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              style={{
                ...styles.input,
                background: '#f3f4f6',
                cursor: 'not-allowed',
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              Email cannot be changed
            </small>
          </div>

          {/* Contact Number */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Number</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="+60 12-345 6789"
              disabled={saving}
              style={{
                ...styles.input,
                ...(saving ? styles.disabled : {})
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Gender */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={saving}
              style={{
                ...styles.select,
                ...(saving ? styles.disabled : {})
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Organization Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Organization Name</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              disabled={saving}
              style={{
                ...styles.input,
                ...(saving ? styles.disabled : {})
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Organization Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Organization Type</label>
            <select
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              disabled={saving}
              style={{
                ...styles.select,
                ...(saving ? styles.disabled : {})
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="">Select type</option>
              <option value="school">School</option>
              <option value="university">University</option>
              <option value="training-center">Training Center</option>
              <option value="individual">Individual</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.disabled : {})
              }}
              onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !saving && (e.target.style.transform = 'translateY(0)')}
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/profile')}
              disabled={saving}
              style={{
                ...styles.cancelButton,
                ...(saving ? styles.disabled : {})
              }}
              onMouseEnter={(e) => !saving && (e.target.style.background = '#d1d5db')}
              onMouseLeave={(e) => !saving && (e.target.style.background = '#e5e7eb')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}