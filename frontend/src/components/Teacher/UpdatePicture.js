import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function UpdatePicture() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPicture, setCurrentPicture] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const currentUser = authService.getCurrentUser();
        setCurrentPicture(currentUser.profile_picture || null);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setSelectedFile(file);
      setMessage({ type: '', text: '' });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Here you would upload to your server
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update localStorage with new picture URL
      const currentUser = authService.getCurrentUser();
      const updatedUser = {
        ...currentUser,
        profile_picture: preview, // In real app, this would be the uploaded URL
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      setCurrentPicture(preview);
      
      // Clear selection after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
      }, 2000);
    } catch (error) {
      console.error('Error uploading picture:', error);
      setMessage({ type: 'error', text: 'Failed to upload picture. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setUploading(true);
    try {
      // Update localStorage
      const currentUser = authService.getCurrentUser();
      const updatedUser = {
        ...currentUser,
        profile_picture: null,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setCurrentPicture(null);
      setPreview(null);
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove picture. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
      padding: '32px',
    },
    content: {
      maxWidth: '600px',
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
    pictureContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '32px',
    },
    pictureWrapper: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '4px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
    },
    picture: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    placeholderIcon: {
      fontSize: '80px',
      color: '#9ca3af',
    },
    uploadSection: {
      width: '100%',
      padding: '32px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      textAlign: 'center',
      background: '#f9fafb',
      marginBottom: '24px',
    },
    uploadIcon: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    uploadText: {
      fontSize: '16px',
      color: '#4b5563',
      marginBottom: '8px',
    },
    uploadHint: {
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '16px',
    },
    fileInput: {
      display: 'none',
    },
    selectButton: {
      padding: '10px 24px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
    },
    uploadButton: {
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
    removeButton: {
      flex: 1,
      padding: '12px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
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
          <h1 style={styles.title}>Update Profile Picture</h1>
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

        {/* Current/Preview Picture */}
        <div style={styles.pictureContainer}>
          <div style={styles.pictureWrapper}>
            {(preview || currentPicture) ? (
              <img 
                src={preview || currentPicture} 
                alt="Profile" 
                style={styles.picture}
              />
            ) : (
              <div style={styles.placeholderIcon}>👤</div>
            )}
          </div>
          {preview && (
            <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
              ✓ New picture selected
            </p>
          )}
        </div>

        {/* Upload Section */}
        <div style={styles.uploadSection}>
          <div style={styles.uploadIcon}>📸</div>
          <p style={styles.uploadText}>
            {selectedFile ? selectedFile.name : 'Choose a profile picture'}
          </p>
          <p style={styles.uploadHint}>
            JPG, PNG or GIF (Max size: 5MB)
          </p>
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
            disabled={uploading}
          />
          <label htmlFor="fileInput">
            <button
              type="button"
              onClick={() => document.getElementById('fileInput').click()}
              disabled={uploading}
              style={{
                ...styles.selectButton,
                ...(uploading ? styles.disabled : {})
              }}
              onMouseEnter={(e) => !uploading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !uploading && (e.target.style.transform = 'translateY(0)')}
            >
              📁 Select File
            </button>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              ...styles.uploadButton,
              ...(!selectedFile || uploading ? styles.disabled : {})
            }}
            onMouseEnter={(e) => selectedFile && !uploading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => selectedFile && !uploading && (e.target.style.transform = 'translateY(0)')}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Picture'}
          </button>
          {currentPicture && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              style={{
                ...styles.removeButton,
                ...(uploading ? styles.disabled : {})
              }}
              onMouseEnter={(e) => !uploading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !uploading && (e.target.style.transform = 'translateY(0)')}
            >
              🗑️ Remove Picture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}