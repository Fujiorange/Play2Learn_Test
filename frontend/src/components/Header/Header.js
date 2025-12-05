import React, { useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="logo">
            <h2>Play2Learn</h2>
          </div>
          
          <div className="nav-actions">
            <button 
                className="btn btn-outline"
                onClick={() => window.location.href = '/login'}
            >
                Login
            </button>
            <button 
                className="btn btn-primary"
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            >
                View Plans
            </button>
        </div>
        
          <ul className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#roadmap">Roadmap</a></li>
            <li><a href="#testimonials">Success Stories</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn btn-primary">Get Started</button>
          </div>

          <div 
            className="hamburger" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;