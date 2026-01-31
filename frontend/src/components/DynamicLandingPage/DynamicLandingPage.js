// Dynamic Landing Page Component
// This component fetches and renders landing page blocks from the database
import React, { useState, useEffect } from 'react';
import './DynamicLandingPage.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

// Import static components as fallback
import Hero from '../Hero/Hero';
import Features from '../Feature/Features';
import About from '../About/About';
import Roadmap from '../Roadmap/Roadmap';
import Testimonials from '../Testimonials/Testimonials';
import Pricing from '../Pricing/Pricing';
import Contact from '../Contact/Contact';

const DynamicLandingPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingPageBlocks();
  }, []);

  const fetchLandingPageBlocks = async () => {
    try {
      const response = await fetch('/api/public/landing-page');
      const data = await response.json();
      
      if (data.success) {
        setBlocks(data.blocks || []);
      } else {
        setError('Failed to load landing page');
      }
    } catch (err) {
      console.error('Error fetching landing page:', err);
      setError('Error loading landing page');
    } finally {
      setLoading(false);
    }
  };

  // Render block based on type
  const renderBlock = (block, index) => {
    if (!block.is_visible) return null;

    const customData = block.custom_data || {};

    switch (block.type) {
      case 'hero':
        return (
          <section key={index} id="home" className="hero dynamic-hero">
            <div className="container">
              <div className="hero-content">
                <div className="hero-text">
                  <h1>{block.title || 'Welcome'}</h1>
                  <p>{block.content || ''}</p>
                </div>
                {block.image_url && (
                  <div className="hero-image">
                    <img src={block.image_url} alt={block.title || 'Hero section'} />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      
      case 'features':
        const features = customData.features || [];
        return (
          <section key={index} id="features" className="section features dynamic-features">
            <div className="container">
              <h2 className="section-title">{block.title || 'Features'}</h2>
              {features.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                  {features.map((feature, fIdx) => (
                    <div key={fIdx} style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon || '🎯'}</div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{feature.title}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>{feature.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="features-content">
                  <p>{block.content || ''}</p>
                </div>
              )}
            </div>
          </section>
        );
      
      case 'about':
        const stats = customData.stats || [];
        const goals = customData.goals || [];
        return (
          <section key={index} id="about" className="section about dynamic-about">
            <div className="container">
              <h2 className="section-title">{block.title || 'About Us'}</h2>
              <div className="about-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {customData.mission && (
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🎯 Mission</h3>
                    <p>{customData.mission}</p>
                  </div>
                )}
                {customData.vision && (
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>👁️ Vision</h3>
                    <p>{customData.vision}</p>
                  </div>
                )}
              </div>
              {goals.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Goals</h3>
                  <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', listStyle: 'none', padding: 0 }}>
                    {goals.map((goal, gIdx) => (
                      <li key={gIdx} style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px' }}>✓ {goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              {stats.length > 0 && (
                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  {stats.map((stat, sIdx) => (
                    <div key={sIdx} style={{ textAlign: 'center', padding: '16px', background: '#e0e7ff', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4338ca' }}>{stat.value}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {!customData.mission && !customData.vision && goals.length === 0 && stats.length === 0 && (
                <p>{block.content || ''}</p>
              )}
              {block.image_url && <img src={block.image_url} alt={block.title || 'About section'} />}
            </div>
          </section>
        );

      case 'roadmap':
        const steps = customData.steps || [];
        return (
          <section key={index} id="roadmap" className="section roadmap dynamic-roadmap">
            <div className="container">
              <h2 className="section-title">{block.title || 'Roadmap'}</h2>
              {steps.length > 0 ? (
                <div style={{ marginTop: '32px', position: 'relative', paddingLeft: '40px' }}>
                  {steps.map((step, sIdx) => (
                    <div key={sIdx} style={{ 
                      marginBottom: '32px', 
                      position: 'relative',
                      paddingLeft: '40px',
                      borderLeft: sIdx < steps.length - 1 ? '2px solid #e5e7eb' : 'none'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: '-20px', 
                        top: '0',
                        width: '40px', 
                        height: '40px', 
                        background: '#3b82f6', 
                        color: 'white', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {step.step || sIdx + 1}
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{step.title}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>{step.description}</p>
                      {step.duration && (
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 12px', 
                          background: '#dbeafe', 
                          color: '#1e40af', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ⏱️ {step.duration}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '24px' }}>
                  {block.content || 'Roadmap steps will appear here'}
                </p>
              )}
            </div>
          </section>
        );
      
      case 'testimonials':
        const testimonials = customData.testimonials || [];
        return (
          <section key={index} id="testimonials" className="section testimonials dynamic-testimonials">
            <div className="container">
              <h2 className="section-title">{block.title || 'Testimonials'}</h2>
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>{block.content}</p>
              {testimonials.length > 0 ? (
                <div className="testimonials-grid">
                  {testimonials.map((testimonial, tIdx) => (
                    <div key={tIdx} className="testimonial-card">
                      <blockquote className="testimonial-quote">
                        {testimonial.image && (
                          <img 
                            src={testimonial.image} 
                            alt={`Portrait of ${testimonial.name}`} 
                            className="testimonial-image" 
                          />
                        )}
                        <p>"{testimonial.quote}"</p>
                        <cite className="testimonial-cite">
                          <strong>{testimonial.name}</strong>
                          {testimonial.role && `, ${testimonial.role}`}
                        </cite>
                      </blockquote>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ color: '#6b7280' }}>
                    💡 Testimonials are managed dynamically from student and parent submissions.
                    <br/>Use the filter system above to approve and display testimonials on the landing page.
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      
      case 'pricing':
        const plans = customData.plans || [];
        return (
          <section key={index} id="pricing" className="section pricing dynamic-pricing">
            <div className="container">
              <h2 className="section-title">{block.title || 'Pricing'}</h2>
              {block.content && <p className="pricing-subtitle">{block.content}</p>}
              {plans.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                  {plans.map((plan, pIdx) => (
                    <div key={pIdx} style={{ 
                      padding: '32px 24px', 
                      background: plan.popular ? '#eff6ff' : '#f9fafb', 
                      borderRadius: '12px',
                      border: plan.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      position: 'relative'
                    }}>
                      {plan.popular && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '-12px', 
                          left: '50%', 
                          transform: 'translateX(-50%)', 
                          background: '#3b82f6', 
                          color: 'white', 
                          padding: '4px 16px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Most Popular
                        </div>
                      )}
                      <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>{plan.name}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{plan.description}</p>
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: '800', color: '#111827' }}>${plan.price?.monthly || 0}</span>
                        <span style={{ fontSize: '16px', color: '#6b7280' }}>/month</span>
                        {plan.price?.yearly && (() => {
                          const savings = plan.price.monthly * 12 - plan.price.yearly;
                          return (
                            <div style={{ fontSize: '14px', color: '#059669', marginTop: '4px' }}>
                              {savings > 0 ? (
                                <>or ${plan.price.yearly}/year (save ${savings.toFixed(0)})</>
                              ) : (
                                <>or ${plan.price.yearly}/year</>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#374151' }}>Up to {plan.teachers} teachers</div>
                        <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>Up to {plan.students} students</div>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        );
      
      case 'contact':
        const contactMethods = customData.contactMethods || [];
        const faqs = customData.faqs || [];
        return (
          <section key={index} id="contact" className="section contact dynamic-contact">
            <div className="container">
              <h2 className="section-title">{block.title || 'Contact Us'}</h2>
              {contactMethods.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  {contactMethods.map((method, mIdx) => (
                    <div key={mIdx} style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{method.icon}</div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>{method.title}</h3>
                      {method.details && method.details.map((detail, dIdx) => (
                        <div key={dIdx} style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{detail}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {faqs.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>Frequently Asked Questions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
                    {faqs.map((faq, fIdx) => (
                      <div key={fIdx} style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>Q: {faq.question}</h4>
                        <p style={{ fontSize: '14px', color: '#374151' }}>A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contactMethods.length === 0 && faqs.length === 0 && (
                <p>{block.content || ''}</p>
              )}
            </div>
          </section>
        );
      
      case 'footer':
        return (
          <footer key={index} className="footer dynamic-footer">
            <div className="container">
              <p>{block.content || ''}</p>
            </div>
          </footer>
        );
      
      default:
        return null;
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="dynamic-landing-page">
        <Header />
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If error or no blocks, show static fallback
  if (error || !blocks || blocks.length === 0) {
    return (
      <>
        <Header />
        <Hero />
        <Features />
        <About />
        <Roadmap />
        <Testimonials />
        <Pricing />
        <Contact />
        <Footer />
      </>
    );
  }

  // Render dynamic blocks
  return (
    <div className="dynamic-landing-page">
      <Header />
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default DynamicLandingPage;
