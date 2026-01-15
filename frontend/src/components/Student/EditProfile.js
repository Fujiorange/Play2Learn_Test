// Student EditProfile.js - FIXED with proper date formatting
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
    dateOfBirth: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Get current user from localStorage first
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          // Format date properly for input field
          let formattedDate = '';
          if (currentUser.date_of_birth) {
            // Check if date contains 'T' (ISO format) or is already YYYY-MM-DD
            if (currentUser.date_of_birth.includes('T')) {
              formattedDate = currentUser.date_of_birth.split('T')[0];
            } else {
              formattedDate = currentUser.date_of_birth;
            }
          }

          setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            contact: currentUser.contact || '',
            gender: currentUser.gender || '',
            dateOfBirth: formattedDate,
          });
        }

        // Also try to get fresh data from server
        const result = await authService.getCurrentUserFromServer();
        
        if (result.success && result.user) {
          // Format date properly for input field
          let formattedDate = '';
          if (result.user.date_of_birth) {
            if (result.user.date_of_birth.includes('T')) {
              formattedDate = result.user.date_of_birth.split('T')[0];
            } else {
              formattedDate = result.user.date_of_birth;
            }
          }

          setFormData({
            name: result.user.name || '',
            email: result.user.email || '',
            contact: result.user.contact || '',
            gender: result.user.gender || '',
            dateOfBirth: formattedDate,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mongo/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update localStorage with new data
        const currentUser = authService.getCurrentUser();
        const updatedUser = {
          ...currentUser,
          name: formData.name,
          contact: formData.contact,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        setTimeout(() => {
          navigate('/student/profile');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
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
    inputDisabled: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      background: '#f3f4f6',
      cursor: 'not-allowed',
      color: '#6b7280',
      fontFamily: 'inherit',
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
    helperText: {
      color: '#6b7280',
      fontSize: '12px',
      marginTop: '4px',
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
          <h1 style={styles.title}>✏️ Edit Profile</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate('/student/profile')}
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
              style={styles.inputDisabled}
            />
            <small style={styles.helperText}>
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

          {/* Date of Birth */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
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
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/profile')}
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