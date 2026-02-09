import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function CreateFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    recipientType: 'student',
    studentId: '',
    subject: '',
    category: 'academic',
    message: '',
    priority: 'normal',
  });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Fetch students from API
        const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/students`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Feedback sent successfully!' });
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            recipientType: 'student',
            studentId: '',
            subject: '',
            category: 'academic',
            message: '',
            priority: 'normal',
          });
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send feedback. Please try again.' });
      }
    } catch (error) {
      console.error('Send feedback error:', error);
      setMessage({ type: 'error', text: 'Failed to send feedback. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', transition: 'all 0.3s', fontFamily: 'inherit' },
    select: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', transition: 'all 0.3s', cursor: 'pointer', fontFamily: 'inherit' },
    textarea: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', transition: 'all 0.3s', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' },
    submitButton: { padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    successMessage: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>💬 Create Feedback</h1>
          <button style={styles.backButton} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>

        {message.text && (
          <div style={{...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)}}>
            {message.text}
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Recipient Type *</label>
            <select name="recipientType" value={formData.recipientType} onChange={handleChange} required disabled={sending} style={styles.select}>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select {formData.recipientType === 'student' ? 'Student' : 'Parent'} *</label>
            <select name="studentId" value={formData.studentId} onChange={handleChange} required disabled={sending} style={styles.select}>
              <option value="">-- Select --</option>
              {students.map(student => (
                <option key={student._id} value={student._id}>{student.name} ({student.class})</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Subject *</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} required disabled={sending} placeholder="e.g., Great progress in Mathematics" style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required disabled={sending} style={styles.select}>
              <option value="academic">Academic Performance</option>
              <option value="behavior">Behavior</option>
              <option value="attendance">Attendance</option>
              <option value="participation">Class Participation</option>
              <option value="general">General</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} disabled={sending} style={styles.select}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Message *</label>
            <textarea name="message" value={formData.message} onChange={handleChange} required disabled={sending} placeholder="Write your feedback message here..." style={styles.textarea} />
          </div>

          <button type="submit" disabled={sending} style={{...styles.submitButton, ...(sending ? styles.disabled : {})}}>
            {sending ? '📤 Sending...' : '📤 Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}