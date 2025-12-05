import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Revolutionizing Education Through Adaptive Learning</h1>
            <p>Personalized learning paths powered by AI with incentive-driven engagement to maximize student success and teacher effectiveness.</p>
          </div>
          <div className="hero-image">
            <div className="placeholder-image">
              <span>Platform Dashboard Preview</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;