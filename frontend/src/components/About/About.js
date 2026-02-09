import React from 'react';
import './About.css';

const About = () => {
  return (
    <section id="about" className="section about">
      <div className="container">
        <h2 className="section-title">About Play2Learn</h2>
        <div className="about-content">
          <div className="about-text">
            <div className="mission-vision">
              <div className="mv-item">
                <h3>🎯 Our Mission</h3>
                <p>To transform education by providing adaptive learning solutions that personalize education for every student while empowering teachers with intelligent tools and insights.</p>
              </div>
              <div className="mv-item">
                <h3>👁️ Our Vision</h3>
                <p>A world where every learner achieves their full potential through personalized, engaging, and effective educational experiences powered by cutting-edge technology.</p>
              </div>
              <div className="mv-item">
                <h3>🎯 Our Goals</h3>
                <ul>
                  <li>Increase student engagement by 70% through incentive-driven learning</li>
                  <li>Improve learning outcomes by 50% through adaptive personalization</li>
                  <li>Reduce teacher workload by 40% with AI-powered assistance</li>
                  <li>Reach 1 million students within 3 years</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="about-stats">
            <div className="stat">
              <h3>50+</h3>
              <p>Schools Partnered</p>
            </div>
            <div className="stat">
              <h3>10,000+</h3>
              <p>Active Students</p>
            </div>
            <div className="stat">
              <h3>95%</h3>
              <p>Satisfaction Rate</p>
            </div>
            <div className="stat">
              <h3>40%</h3>
              <p>Improvement in Results</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;