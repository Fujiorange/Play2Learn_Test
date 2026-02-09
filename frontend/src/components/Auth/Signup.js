import React, { useState } from 'react';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    licenseNumber: '',
    schoolCode: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Signup data:', formData);
    alert('School registration submitted! Our team will verify your license and contact you shortly.');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>School Registration</h2>
        <p className="auth-subtitle">Register your school with your license details</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>School Name *</label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              required
              placeholder="Enter your school name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                placeholder="e.g., LIC-2024-001"
              />
            </div>

            <div className="form-group">
              <label>School Code *</label>
              <input
                type="text"
                name="schoolCode"
                value={formData.schoolCode}
                onChange={handleChange}
                required
                placeholder="e.g., SCH-001"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Administrator Name *</label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              required
              placeholder="Enter administrator's full name"
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter school email address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 8 characters"
                minLength="8"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary full-width">
            Register School
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <a href="/login" className="auth-link">Login here</a>
          </p>
          <p className="help-text">
            Need help? Contact <a href="mailto:support@eduadapt.com">support@eduadapt.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;