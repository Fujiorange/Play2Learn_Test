import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function UpdatePicture() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPicture, setCurrentPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const user = authService.getCurrentUser();
      setCurrentPicture(user.profile_picture);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockUrl = URL.createObjectURL(selectedFile);
    const user = authService.getCurrentUser();
    const updatedUser = { ...user, profile_picture: mockUrl };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentPicture(mockUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    setUploading(false);
  };

  const handleRemove = async () => {
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = authService.getCurrentUser();
    const updatedUser = { ...user, profile_picture: null };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentPicture(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    setUploading(false);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    previewSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' },
    previewCircle: { width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #e5e7eb', marginBottom: '16px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholderIcon: { fontSize: '80px', color: '#d1d5db' },
    uploadSection: { padding: '32px', border: '2px dashed #d1d5db', borderRadius: '12px', textAlign: 'center', marginBottom: '24px', cursor: 'pointer', transition: 'all 0.3s' },
    fileInput: { display: 'none' },
    buttonGroup: { display: 'flex', gap: '12px' },
    uploadButton: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    removeButton: { flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    successMessage: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Update Profile Picture</h1>
          <button style={styles.backButton} onClick={() => navigate('/student/profile')}>← Back to Profile</button>
        </div>

        {message.text && (
          <div style={{...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)}}>
            {message.text}
          </div>
        )}

        <div style={styles.previewSection}>
          <div style={styles.previewCircle}>
            {(previewUrl || currentPicture) ? (
              <img src={previewUrl || currentPicture} alt="Profile" style={styles.previewImage} />
            ) : (
              <span style={styles.placeholderIcon}>👤</span>
            )}
          </div>
        </div>

        <div style={styles.uploadSection} onClick={() => document.getElementById('fileInput').click()} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Click to upload a photo</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>PNG, JPG, GIF up to 5MB</p>
          <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{...styles.uploadButton, opacity: (!selectedFile || uploading) ? 0.5 : 1}}>
            {uploading ? '⏳ Uploading...' : '📤 Upload Picture'}
          </button>
          <button onClick={handleRemove} disabled={!currentPicture || uploading} style={{...styles.removeButton, opacity: (!currentPicture || uploading) ? 0.5 : 1}}>
            🗑️ Remove Picture
          </button>
        </div>
      </div>
    </div>
  );
}