import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const MAX_BYTES = 5 * 1024 * 1024;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function UpdatePicture() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [currentPicture, setCurrentPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const canSubmit = useMemo(() => Boolean(selectedFile) && !uploading, [selectedFile, uploading]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    setCurrentPicture(user?.profile_picture ?? null);
    setLoading(false);
  }, [navigate]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) return setMessage({ type: 'error', text: 'File size must be less than 5MB' });
    if (!file.type.startsWith('image/')) return setMessage({ type: 'error', text: 'Please select a valid image file' });

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      const result = await authService.updateProfilePicture(dataUrl);
      if (!result?.success) return setMessage({ type: 'error', text: result?.error || 'Failed to update profile picture' });

      setCurrentPicture(result.user?.profile_picture ?? dataUrl);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setMessage({ type: '', text: '' });

    const result = await authService.updateProfilePicture(null);
    if (!result?.success) {
      setUploading(false);
      return setMessage({ type: 'error', text: result?.error || 'Failed to remove profile picture' });
    }

    setCurrentPicture(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    setUploading(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Update Profile Picture</h2>
          <button style={styles.backBtn} onClick={() => navigate('/student/profile')}>← Back</button>
        </div>

        {message.text ? (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        ) : null}

        <div style={styles.section}>
          <div style={styles.previewWrap}>
            <img
              alt="Profile"
              src={previewUrl || currentPicture || '/default-avatar.png'}
              style={styles.previewImg}
              onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
            />
          </div>

          <div style={styles.controls}>
            <input type="file" accept="image/*" onChange={handleFileChange} />

            <div style={styles.btnRow}>
              <button style={{ ...styles.primaryBtn, ...(canSubmit ? {} : styles.disabledBtn) }} onClick={handleUpload} disabled={!canSubmit}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>

              <button style={{ ...styles.dangerBtn, ...(uploading ? styles.disabledBtn : {}) }} onClick={handleRemove} disabled={uploading}>
                Remove
              </button>
            </div>

            <p style={styles.hint}>Max 5MB.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: 32, display: 'grid', placeItems: 'start center' },
  card: { width: 'min(900px, 100%)', background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { margin: 0, fontSize: 22 },
  backBtn: { border: 'none', background: '#6b7280', color: 'white', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' },
  message: { padding: 12, borderRadius: 12, marginBottom: 16, fontWeight: 600 },
  success: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
  error: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  section: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' },
  previewWrap: { width: 260, height: 260, borderRadius: 16, overflow: 'hidden', background: '#f3f4f6', display: 'grid', placeItems: 'center' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  controls: { display: 'grid', gap: 12 },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryBtn: { border: 'none', background: '#2563eb', color: 'white', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', minWidth: 120 },
  dangerBtn: { border: 'none', background: '#ef4444', color: 'white', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', minWidth: 120 },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  hint: { margin: 0, color: '#6b7280' },
};
