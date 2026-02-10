import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import teacherService from '../../services/teacherService';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    category: 'website',
    priority: 'normal',
    routeTo: 'website',
    subject: '',
    description: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Validate using formData (not separate state variables)
    if (!formData.subject.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Please fill in subject and description' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await teacherService.createSupportTicket(formData);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Support ticket #${result.ticketId} created successfully!` 
        });
        
        setTimeout(() => {
          setFormData({ 
            category: 'website', 
            priority: 'normal', 
            routeTo: 'website', 
            subject: '', 
            description: '' 
          });
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create support ticket' });
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      setMessage({ type: 'error', text: 'Failed to create support ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '700px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    card: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' },
    select: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' },
    textarea: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit' },
    submitBtn: { padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    success: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
  };

  if (loading) return <div style={styles.loading}><div>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎫 Create Support Ticket</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>Submit a ticket for technical support or feedback</p>
        </div>

        {message.text && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
            {message.text}
          </div>
        )}

        <div style={styles.card}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.select}>
                <option value="website">Website Issue</option>
                <option value="technical">Technical Problem</option>
                <option value="account">Account Issue</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={styles.select}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject *</label>
              <input 
                name="subject"
                style={styles.input} 
                value={formData.subject} 
                onChange={handleChange} 
                placeholder="Brief description of your issue" 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea 
                name="description"
                style={styles.textarea} 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Please describe your issue in detail..." 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{ ...styles.submitBtn, ...(submitting ? styles.disabled : {}) }}
            >
              {submitting ? 'Submitting...' : '📤 Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
