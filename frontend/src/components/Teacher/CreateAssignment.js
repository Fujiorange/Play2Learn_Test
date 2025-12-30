import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    subject: 'english',
    class: '',
    description: '',
    dueDate: '',
    totalMarks: 100,
    attachmentType: 'none',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMessage({ type: 'success', text: 'Assignment created successfully!' });
    setCreating(false);
    setTimeout(() => navigate('/teacher/assignments/submitted'), 2000);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit' },
    select: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', cursor: 'pointer' },
    textarea: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '120px', resize: 'vertical' },
    submitButton: { padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    successMessage: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Create Assignment</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>
        {message.text && <div style={{...styles.message, ...styles.successMessage}}>{message.text}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Assignment Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., Essay on Climate Change" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject *</label>
            <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required style={styles.select}>
              <option value="english">English</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="history">History</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Class *</label>
            <select value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})} required style={styles.select}>
              <option value="">Select class</option>
              <option value="Primary 5A">Primary 5A</option>
              <option value="Primary 5B">Primary 5B</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required placeholder="Describe the assignment requirements..." style={styles.textarea} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Due Date *</label>
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Total Marks *</label>
            <input type="number" value={formData.totalMarks} onChange={(e) => setFormData({...formData, totalMarks: e.target.value})} required min="1" style={styles.input} />
          </div>
          <button type="submit" disabled={creating} style={styles.submitButton}>
            {creating ? '📤 Creating...' : '📤 Create Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
}