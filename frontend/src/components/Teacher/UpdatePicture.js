import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function UpdatePicture() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPicture, setCurrentPicture] = useState(null);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    setCurrentPicture(user?.profile_picture || null);
    setLoading(false);
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, GIF)' });
        return;
      }
      // Limit to 2MB to avoid base64 issues
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 2MB' });
        return;
      }
      setSelectedFile(file);
      setMessage({ type: '', text: '' });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to read file' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Uploading picture, preview length:', preview.length);
      
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile/picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile_picture: preview })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (data.success) {
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, profile_picture: preview };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        setCurrentPicture(preview);
        setTimeout(() => {
          setSelectedFile(null);
          setPreview(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your profile picture?')) return;

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile/picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile_picture: null })
      });

      const data = await response.json();

      if (data.success) {
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, profile_picture: null };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentPicture(null);
        setPreview(null);
        setSelectedFile(null);
        setMessage({ type: 'success', text: 'Picture removed!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to remove picture' });
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '500px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    pictureSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '24px' },
    pictureWrapper: { width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
    picture: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholder: { fontSize: '60px', color: '#9ca3af' },
    uploadBox: { width: '100%', padding: '24px', border: '2px dashed #d1d5db', borderRadius: '12px', textAlign: 'center', background: '#f9fafb', marginBottom: '20px' },
    fileInput: { display: 'none' },
    selectBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    buttonGroup: { display: 'flex', gap: '12px' },
    uploadBtn: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    removeBtn: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px', wordBreak: 'break-word' },
    success: { background: '#d1fae5', color: '#065f46' },
    error: { background: '#fee2e2', color: '#991b1b' },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
    hint: { fontSize: '13px', color: '#6b7280', marginTop: '8px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading) return <div style={styles.loading}><div>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📸 Update Picture</h1>
          <button style={styles.backBtn} onClick={() => navigate('/teacher/profile')}>← Back</button>
        </div>

        {message.text && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        )}

        <div style={styles.pictureSection}>
          <div style={styles.pictureWrapper}>
            {(preview || currentPicture) ? (
              <img src={preview || currentPicture} alt="Profile" style={styles.picture} />
            ) : (
              <div style={styles.placeholder}>👤</div>
            )}
          </div>
          {preview && <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '500', margin: 0 }}>✓ New picture selected</p>}
        </div>

        <div style={styles.uploadBox}>
          <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '12px' }}>
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose a profile picture'}
          </p>
          <input type="file" id="fileInput" accept="image/*" onChange={handleFileSelect} style={styles.fileInput} disabled={uploading} />
          <button type="button" onClick={() => document.getElementById('fileInput').click()} disabled={uploading} style={{ ...styles.selectBtn, ...(uploading ? styles.disabled : {}) }}>
            📁 Select File
          </button>
          <p style={styles.hint}>JPG, PNG or GIF • Max 2MB</p>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{ ...styles.uploadBtn, ...(!selectedFile || uploading ? styles.disabled : {}) }}>
            {uploading ? '⏳ Uploading...' : '📤 Upload'}
          </button>
          {currentPicture && (
            <button onClick={handleRemove} disabled={uploading} style={{ ...styles.removeBtn, ...(uploading ? styles.disabled : {}) }}>
              🗑️ Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
