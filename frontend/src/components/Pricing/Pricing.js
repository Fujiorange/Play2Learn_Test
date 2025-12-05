import React, { useState } from 'react';
import './Pricing.css';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('yearly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small schools and institutions',
      price: {
        yearly: 2500,
        monthly: 250
      },
      teachers: 50,
      students: 500,
      features: [
        'Basic adaptive learning paths',
        'Standard analytics dashboard',
        'Email support',
        'Basic incentive system',
        'Up to 10 subjects'
      ],
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for medium-sized schools and districts',
      price: {
        yearly: 5000,
        monthly: 520
      },
      teachers: 100,
      students: 1000,
      features: [
        'Advanced adaptive algorithms',
        'Comprehensive analytics',
        'Priority support',
        'Full incentive system with gamification',
        'Unlimited subjects',
        'Parent portal access',
        'Custom assessments'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large institutions and school networks',
      price: {
        yearly: 10000,
        monthly: 1050
      },
      teachers: 250,
      students: 2500,
      features: [
        'AI-powered personalization',
        'Advanced predictive analytics',
        '24/7 dedicated support',
        'Custom incentive programs',
        'API access',
        'White-label options',
        'Onboarding assistance',
        'Custom integration'
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <h2 className="section-title">Subscription Plans</h2>
        <p className="pricing-subtitle">Flexible licensing options for schools of all sizes</p>
        
        <div className="billing-toggle">
          <button 
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly (Save up to 20%)
          </button>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>

              <div className="plan-price">
                <span className="currency">SGD</span>
                <span className="amount">
                  {billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                </span>
                <span className="period">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>

              <div className="license-info">
                <p><strong>{plan.teachers}</strong> Teacher Licenses</p>
                <p><strong>{plan.students}</strong> Student Licenses</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>✓ {feature}</li>
                ))}
              </ul>

              <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} full-width`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <p>All plans include: Secure cloud hosting, regular updates, mobile access, and basic training</p>
          <p>Need a custom plan? <a href="#contact">Contact us for enterprise solutions</a></p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;