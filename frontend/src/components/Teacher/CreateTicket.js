import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    try {
      const user = authService.getCurrentUser();
      
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: formData.subject,
          category: formData.category,
          description: formData.description,
          priority: formData.priority
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Ticket created successfully!' });
        setSubject('');
        setDescription('');
        setPriority('medium');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create ticket' });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '700px', margin: '0 auto' },
    card: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' },
    label: { fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' },
    input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' },
    select: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' },
    textarea: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', minHeight: '150px', resize: 'vertical' },
    btn: { padding: '14px 24px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' },
    backBtn: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', marginBottom: '20px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        
        <div style={styles.card}>
          <h1 style={styles.title}>🎫 Create Support Ticket</h1>
          <p style={{ color: '#64748b' }}>Submit a request for assistance</p>

          {message.text && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginTop: '16px', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#16a34a' : '#dc2626' }}>
              {message.text}
            </div>
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div>
              <label style={styles.label}>Subject</label>
              <input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" />
            </div>

            <div>
              <label style={styles.label}>Priority</label>
              <select style={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please describe your issue in detail..." />
            </div>

            <button type="submit" style={{ ...styles.btn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
