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
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Use teacherService which handles user_id extraction and field mapping
      const result = await teacherService.createSupportTicket(formData);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Support ticket #${result.ticketId} created successfully! We will get back to you soon.` 
        });
        
        // Reset form
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
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to create support ticket' 
        });
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to create support ticket. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
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
    textarea: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' },
    submitButton: { padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
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
          <h1 style={styles.title}>🎫 Create Support Ticket</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>
        {message.text && <div style={{...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)}}>{message.text}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Category *</label>
            <select 
              value={formData.category} 
              onChange={(e) => {
                const category = e.target.value;
                const routeTo = category === 'school' ? 'school' : 'website';
                setFormData({...formData, category, routeTo});
              }} 
              required 
              disabled={submitting}
              style={styles.select}
            >
              <option value="website">Website-Related Problem</option>
              <option value="school">School-Related Problem</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject *</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required disabled={submitting} placeholder="Brief description of the issue" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required disabled={submitting} placeholder="Please provide detailed information about your issue..." style={styles.textarea} />
          </div>
          <button type="submit" disabled={submitting} style={{...styles.submitButton, opacity: submitting ? 0.7 : 1}}>
            {submitting ? '📤 Submitting...' : '📤 Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}