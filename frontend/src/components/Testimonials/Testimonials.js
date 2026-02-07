import React, { useState, useEffect } from 'react';
import './Testimonial.css';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/testimonials/published`);
      const data = await response.json();
      
      if (data.success) {
        setTestimonials(data.testimonials || []);
      } else {
        setError('Failed to load testimonials');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const getSentimentBadgeClass = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'sentiment-badge positive';
      case 'negative':
        return 'sentiment-badge negative';
      case 'neutral':
      default:
        return 'sentiment-badge neutral';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const getUserTypeDisplay = (role) => {
    // Map role to friendly display names
    const roleMap = {
      'Student': 'Student',
      'Parent': 'Parent',
      'Teacher': 'Teacher'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <section id="testimonials" className="section testimonials">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <p>Loading testimonials...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="testimonials" className="section testimonials">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="section testimonials">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <p>No testimonials available yet. Be the first to share your experience!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="section testimonials">
      <div className="container">
        <h2 className="section-title">Success Stories</h2>
        <p>Hear what our users say about Play2Learn.</p>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="rating">{renderStars(testimonial.rating)}</div>
              <p className="testimonial-text">"{testimonial.message}"</p>
              <div className="user-info">
                <strong>{testimonial.name}</strong>
                <span className="user-type">{getUserTypeDisplay(testimonial.role)}</span>
                <span className="date">{formatDate(testimonial.date)}</span>
              </div>
              {testimonial.sentiment && (
                <div className={getSentimentBadgeClass(testimonial.sentiment)}>
                  {testimonial.sentiment.charAt(0).toUpperCase() + testimonial.sentiment.slice(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;