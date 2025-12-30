import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function CreateSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.subject || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      navigate('/parent/support/track');
    }, 2000);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '800px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    formCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    formGroup: { marginBottom: '24px' },
    label: { display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    select: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', background: 'white' },
    input: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit' },
    textarea: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' },
    priorityOptions: { display: 'flex', gap: '12px', marginTop: '8px' },
    priorityButton: { flex: 1, padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
    submitButton: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' },
    successMessage: { textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.successMessage}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎫</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>Ticket Created!</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>Your support ticket has been submitted successfully.</p>
            <p style={{ color: '#6b7280' }}>Redirecting to ticket tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎫 Create Support Ticket</h1>
          <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
        </div>

        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.select} required>
                <option value="">Select a category</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account & Billing</option>
                <option value="academic">Academic Concern</option>
                <option value="teacher">Teacher Communication</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Priority Level *</label>
              <div style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map(priority => (
                  <button key={priority} type="button" onClick={() => setFormData({...formData, priority})} style={{...styles.priorityButton, borderColor: formData.priority === priority ? '#10b981' : '#e5e7eb', background: formData.priority === priority ? '#d1fae5' : 'white', color: formData.priority === priority ? '#065f46' : '#374151'}}>
                    {priority === 'low' && '🟢'} {priority === 'medium' && '🟡'} {priority === 'high' && '🔴'} {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject *</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Brief description of the issue" style={styles.input} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Please provide detailed information about your issue or request..." style={styles.textarea} required />
            </div>

            <button type="submit" style={styles.submitButton} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}