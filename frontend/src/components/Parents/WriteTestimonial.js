// frontend/src/pages/Parent/WriteTestimonial.js - COMPLETE VERSION
// ✅ Actually saves to database via API
// ✅ Updated to use createTestimonial() method
// ✅ Consistent with student testimonial flow

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function WriteTestimonial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [testimonialText, setTestimonialText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    message: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const user = authService.getCurrentUser();
      setDisplayName(user.name);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // ✅ Using createTestimonial() for better error handling and logging
      const result = await parentService.createTestimonial(formData);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Thank you for your testimonial! It will be reviewed before being published.' 
        });
        
        // Clear form
        setFormData({
          rating: 5,
          title: '',
          message: ''
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/parent');
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to submit testimonial. Please try again.' 
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to submit testimonial. Please try again.' 
      });
      setSubmitting(false);
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await parentService.createTestimonial({
        rating,
        message: testimonialText,
        title,
        displayName,
      });

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          navigate('/parent');
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit testimonial');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit testimonial. Please try again.');
      setSubmitting(false);
    }
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
    input: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit' },
    ratingContainer: { display: 'flex', gap: '8px', marginBottom: '8px' },
    star: { fontSize: '36px', cursor: 'pointer', transition: 'transform 0.2s' },
    textarea: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' },
    checkboxContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
    checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
    checkboxLabel: { fontSize: '14px', color: '#374151' },
    submitButton: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' },
    successMessage: { textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    errorMessage: { padding: '12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '8px', marginBottom: '16px' },
    textarea: { width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', minHeight: '200px', resize: 'vertical' },
    ratingContainer: { display: 'flex', gap: '8px', marginTop: '8px' },
    star: { fontSize: '36px', cursor: 'pointer', transition: 'transform 0.2s', userSelect: 'none' },
    submitButton: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' },
    message: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', marginBottom: '16px' },
    successMessage: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    infoBox: { background: '#dbeafe', border: '1px solid #60a5fa', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#1e40af' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>✏️ Write a Testimonial</h1>
          <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Great platform for learning!"
                style={styles.input}
                disabled={submitting}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>How would you rate your experience? *</label>
              <div style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{...styles.star, color: (hoverRating || rating) >= star ? '#fbbf24' : '#e5e7eb', transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)'}} onClick={() => !submitting && setRating(star)} onMouseEnter={() => !submitting && setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>
                    ★
        {message.text && (
          <div style={{
            ...styles.message, 
            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message.text}
          </div>
        )}

        <div style={styles.infoBox}>
          <strong>ℹ️ Note:</strong> Your testimonial will be reviewed by our team before being published on the website.
        </div>

        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Rating *</label>
              <div style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    style={{
                      ...styles.star,
                      color: star <= formData.rating ? '#f59e0b' : '#d1d5db'
                    }}
                    onClick={() => !submitting && handleRatingClick(star)}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    ⭐
                  </span>
                ))}
                <span style={{ marginLeft: '16px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  {formData.rating} / 5
                </span>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Testimonial *</label>
              <textarea value={testimonialText} onChange={(e) => setTestimonialText(e.target.value)} placeholder="Share your experience with Play2Learn platform and how it has helped your child's education..." style={styles.textarea} required disabled={submitting} />
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                {testimonialText.length} characters (minimum 20)
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                required
                disabled={submitting}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.checkboxContainer}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={styles.checkbox} id="publicCheck" disabled={submitting} />
                <label htmlFor="publicCheck" style={styles.checkboxLabel}>
                  Allow this testimonial to be displayed publicly (visible after admin approval)
                </label>
              </div>
            </div>

            <button type="submit" style={{...styles.submitButton, opacity: submitting ? 0.7 : 1}} disabled={submitting} onMouseEnter={(e) => !submitting && (e.target.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              {submitting ? 'Submitting...' : 'Submit Testimonial'}
              <label style={styles.label}>Title *</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g., Great platform for my child's learning" 
                style={styles.input} 
                required 
                disabled={submitting}
                maxLength={100}
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                {formData.title.length}/100 characters
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Testimonial *</label>
              <textarea 
                name="message" 
                value={formData.message} 
                onChange={handleChange} 
                placeholder="Share your experience with Play2Learn..." 
                style={styles.textarea} 
                required 
                disabled={submitting}
                maxLength={1000}
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                {formData.message.length}/1000 characters
              </small>
            </div>

            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }} 
              disabled={submitting}
              onMouseEnter={(e) => !submitting && (e.target.style.transform = 'translateY(-2px)')} 
              onMouseLeave={(e) => !submitting && (e.target.style.transform = 'translateY(0)')}
            >
              {submitting ? '⏳ Submitting...' : '📤 Submit Testimonial'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}