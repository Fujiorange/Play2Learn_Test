import React, { useState } from 'react';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'school' // school or admin
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would typically send the data to your backend
    console.log('Login data:', formData);
    
    // For demo purposes - redirect based on user type
    if (formData.userType === 'admin') {
      alert('Redirecting to Admin Dashboard');
      // window.location.href = '/admin-dashboard';
    } else {
      alert('Redirecting to School Dashboard');
      // window.location.href = '/school-dashboard';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to EduAdapt</h2>
        <p className="auth-subtitle">Access your school or admin account</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>User Type</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="school">School Administrator</option>
              <option value="admin">Play2Learn Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <a href="/forgot-password" className="auth-link">Forgot Password?</a>
          </div>

          <button type="submit" className="btn btn-primary full-width">
            Login
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <a href="/signup" className="auth-link">Register your school</a>
          </p>
          <p className="help-text">
            Need your license details? Contact <a href="mailto:sales@eduadapt.com">sales@eduadapt.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;