import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({ name: '', contact: '', gender: '', date_of_birth: '' });

  const canSave = useMemo(() => form.name.trim().length > 0 && !saving, [form.name, saving]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    setForm({
      name: user?.name ?? '',
      contact: user?.contact ?? '',
      gender: user?.gender ?? '',
      date_of_birth: toInputDate(user?.date_of_birth),
    });
    setLoading(false);
  }, [navigate]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      name: form.name.trim(),
      contact: form.contact || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth ? new Date(form.date_of_birth).toISOString() : null,
    };

    const result = await authService.updateProfile(payload);
    if (!result?.success) {
      setSaving(false);
      return setMessage({ type: 'error', text: result?.error || 'Failed to update profile' });
    }

    setMessage({ type: 'success', text: 'Profile updated!' });
    setSaving(false);
    setTimeout(() => navigate('/student/profile'), 600);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Profile</h2>
          <button style={styles.backBtn} onClick={() => navigate('/student/profile')}>← Back</button>
        </div>

        {message.text ? (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        ) : null}

        <form onSubmit={handleSave} style={styles.form}>
          <label style={styles.label}>
            Name
            <input name="name" value={form.name} onChange={onChange} style={styles.input} required />
          </label>

          <label style={styles.label}>
            Contact
            <input name="contact" value={form.contact} onChange={onChange} style={styles.input} />
          </label>

          <label style={styles.label}>
            Gender
            <select name="gender" value={form.gender} onChange={onChange} style={styles.input}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>

          <label style={styles.label}>
            Date of Birth
            <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={onChange} style={styles.input} />
          </label>

          <div style={styles.actions}>
            <button type="submit" style={{ ...styles.primaryBtn, ...(canSave ? {} : styles.disabledBtn) }} disabled={!canSave}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
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
  form: { display: 'grid', gap: 14 },
  label: { display: 'grid', gap: 6, fontWeight: 700, color: '#111827' },
  input: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, outline: 'none' },
  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: 6 },
  primaryBtn: { border: 'none', background: '#2563eb', color: 'white', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', minWidth: 120, fontWeight: 700 },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
};
