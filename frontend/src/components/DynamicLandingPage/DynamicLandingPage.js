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
                <div className="features-grid">
                  {features.map((feature, fIdx) => (
                    <div key={fIdx} className="feature-card">
                      <div className="feature-icon">{feature.icon || '🎯'}</div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
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
              <div className="about-content">
                <div className="about-text">
                  <div className="mission-vision">
                    {customData.mission && (
                      <div className="mv-item">
                        <h3>🎯 Our Mission</h3>
                        <p>{customData.mission}</p>
                      </div>
                    )}
                    {customData.vision && (
                      <div className="mv-item">
                        <h3>👁️ Our Vision</h3>
                        <p>{customData.vision}</p>
                      </div>
                    )}
                    {goals.length > 0 && (
                      <div className="mv-item">
                        <h3>🎯 Our Goals</h3>
                        <ul>
                          {goals.map((goal, gIdx) => (
                            <li key={gIdx}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {stats.length > 0 && (
                  <div className="about-stats">
                    {stats.map((stat, sIdx) => (
                      <div key={sIdx} className="stat">
                        <h3>{stat.value}</h3>
                        <p>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!customData.mission && !customData.vision && goals.length === 0 && stats.length === 0 && (
                  <p>{block.content || ''}</p>
                )}
                {block.image_url && <img src={block.image_url} alt={block.title || 'About section'} />}
              </div>
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
                <div className="roadmap-timeline">
                  {steps.map((step, sIdx) => (
                    <div key={sIdx} className="timeline-item">
                      <div className="timeline-marker">{step.step}</div>
                      <div className="timeline-content">
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                        {step.duration && <span className="timeline-duration">{step.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{block.content || ''}</p>
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
              {block.content && <p>{block.content}</p>}
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
              ) : null}
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
                <div className="pricing-grid">
                  {plans.map((plan, pIdx) => (
                    <div key={pIdx} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                      {plan.popular && <div className="popular-badge">Most Popular</div>}
                      <div className="plan-header">
                        <h3>{plan.name}</h3>
                        <p>{plan.description}</p>
                      </div>
                      <div className="plan-price">
                        <span className="price-amount">${plan.price?.monthly || 0}</span>
                        <span className="price-period">/month</span>
                        {plan.price?.yearly && (
                          <div className="price-yearly">
                            or ${plan.price.yearly}/year
                          </div>
                        )}
                      </div>
                      <div className="plan-capacity">
                        <p>Up to {plan.teachers} teachers</p>
                        <p>Up to {plan.students} students</p>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="plan-features">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx}>{feature}</li>
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
              <div className="contact-content">
                {contactMethods.length > 0 && (
                  <div className="contact-info">
                    <h3>Get in Touch</h3>
                    <div className="contact-methods">
                      {contactMethods.map((method, mIdx) => (
                        <div key={mIdx} className="contact-method">
                          <div className="contact-icon">{method.icon}</div>
                          <div className="contact-details">
                            <h4>{method.title}</h4>
                            {method.details && method.details.map((detail, dIdx) => (
                              <p key={dIdx}>{detail}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {faqs.length > 0 && (
                  <div className="support-info">
                    <h3>Frequently Asked Questions</h3>
                    <div className="faqs">
                      {faqs.map((faq, fIdx) => (
                        <div key={fIdx} className="faq-item">
                          <h4>{faq.question}</h4>
                          <p>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {contactMethods.length === 0 && faqs.length === 0 && (
                  <p>{block.content || ''}</p>
                )}
              </div>
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
