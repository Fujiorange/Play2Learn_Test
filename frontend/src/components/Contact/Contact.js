import React from 'react';
import './Contact.css';

const Contact = () => {
  const faqs = [
    {
      question: 'How long does implementation take?',
      answer: 'Typically 2-4 weeks depending on school size. We provide full onboarding support.'
    },
    {
      question: 'Can we integrate with our existing LMS?',
      answer: 'Yes, we support integration with most popular Learning Management Systems including Moodle, Canvas, and Google Classroom.'
    },
    {
      question: 'What kind of training do you provide?',
      answer: 'We offer comprehensive training for teachers and administrators, including documentation, and ongoing support.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'No, unfortunately we do not provide free trial.'
    },
    {
      question: 'How do you ensure data privacy and security?',
      answer: 'We are compliant with major data protection regulations including GDPR and COPPA. All data is encrypted and stored securely.'
    }
  ];

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <h2 className="section-title">Contact & Support</h2>
        
        <div className="contact-content">
          <div className="contact-info">
            <h3>Get in Touch</h3>
            <p>Reach out to us for demonstrations, pricing inquiries, or technical support.</p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email</h4>
                  <p>hello@Play2Learn.com</p>
                  <p>support@Play2Learn.com</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Phone</h4>
                  <p>+65 6123 4567 (Sales)</p>
                  <p>+65 6123 4568 (Support)</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Office</h4>
                  <p>123 Innovation Drive</p>
                  <p>Singapore 138543</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">🕒</div>
                <div className="contact-details">
                  <h4>Support Hours</h4>
                  <p>Monday - Friday: 9AM - 6PM SGT</p>
                </div>
              </div>
            </div>
          </div>

          <div className="support-info">
            <h3>Quick Support</h3>
            <div className="support-options">
              <div className="support-option">
                <h4>📋 Sales Inquiry</h4>
                <p>Contact our sales team for pricing and demonstrations</p>
                <a href="mailto:sales@Play2Learn.com" className="support-link">
                  sales@Play2Learn.com
                </a>
              </div>

              <div className="support-option">
                <h4>🔧 Technical Support</h4>
                <p>Get help with technical issues and platform questions</p>
                <a href="mailto:support@Play2Learn.com" className="support-link">
                  support@Play2Learn.com
                </a>
              </div>

              <div className="support-option">
                <h4>🏫 School Partnerships</h4>
                <p>Discuss institutional partnerships and bulk licensing</p>
                <a href="mailto:partnerships@Play2Learn.com" className="support-link">
                  partnerships@Play2Learn.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;