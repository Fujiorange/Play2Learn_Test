// WriteTestimonial.js - UPDATED with real backend connection
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function WriteTestimonial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    rating: 5,
    testimonial: '',
    displayName: '',
    allowPublic: true,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const user = authService.getCurrentUser();
      setFormData(prev => ({ ...prev, displayName: user.name }));
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // REAL API CALL - Save testimonial to database
      const result = await studentService.createTestimonial(formData);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Thank you! Your testimonial has been submitted successfully.' 
        });
        
        setTimeout(() => navigate('/student'), 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to submit testimonial' 
        });
      }
    } catch (error) {
      console.error('Submit testimonial error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to submit testimonial. Please try again.' 
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
    textarea: { padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' },
    ratingContainer: { display: 'flex', gap: '8px', fontSize: '32px' },
    star: { cursor: 'pointer', transition: 'transform 0.2s', userSelect: 'none' },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px' },
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
          <h1 style={styles.title}>⭐ Write a Review</h1>
          <button style={styles.backButton} onClick={() => navigate('/student')}>← Back to Dashboard</button>
        </div>
        
        {message.text && (
          <div style={{...styles.message, ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)}}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}
        
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              required 
              disabled={submitting}
              placeholder="e.g., Great learning experience!" 
              style={styles.input} 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Rating *</label>
            <div style={styles.ratingContainer}>
              {[1,2,3,4,5].map(star => (
                <span 
                  key={star} 
                  style={styles.star} 
                  onClick={() => !submitting && setFormData({...formData, rating: star})}
                  onMouseEnter={(e) => !submitting && (e.target.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {star <= formData.rating ? '⭐' : '☆'}
                </span>
              ))}
              <span style={{ fontSize: '16px', alignSelf: 'center', marginLeft: '12px', color: '#6b7280' }}>
                {formData.rating} / 5
              </span>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Review *</label>
            <textarea 
              value={formData.testimonial} 
              onChange={(e) => setFormData({...formData, testimonial: e.target.value})} 
              required 
              disabled={submitting}
              placeholder="Share your experience with Play2Learn..." 
              style={styles.textarea} 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Display Name *</label>
            <input 
              type="text" 
              value={formData.displayName} 
              onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
              required 
              disabled={submitting}
              style={styles.input} 
            />
          </div>
          
          <div style={styles.checkbox}>
            <input 
              type="checkbox" 
              checked={formData.allowPublic} 
              onChange={(e) => setFormData({...formData, allowPublic: e.target.checked})} 
              disabled={submitting}
            />
            <label style={{ cursor: 'pointer' }}>
              Allow this testimonial to be displayed publicly on our website
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={submitting} 
            style={{...styles.submitButton, opacity: submitting ? 0.7 : 1}}
          >
            {submitting ? '📤 Submitting to Database...' : '📤 Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}