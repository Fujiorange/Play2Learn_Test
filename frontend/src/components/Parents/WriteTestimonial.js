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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }
    if (testimonialText.trim().length < 20) {
      alert('Please write at least 20 characters');
      return;
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
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.successMessage}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>Testimonial Submitted!</h2>
            <p style={{ color: '#6b7280' }}>Thank you for your feedback. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>✍️ Write Testimonial</h1>
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
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {rating === 0 ? 'Click to rate' : `${rating} out of 5 stars`}
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
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}