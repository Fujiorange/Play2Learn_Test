/**
 * RegisterAdminPage Component
 * 
 * Provides a registration form for creating new Play2Learn (P2L) admin users.
 * Features:
 * - Email and password input fields with validation
 * - Client-side validation for email format and password strength
 * - Password visibility toggle
 * - Secure password hashing (handled by backend)
 * - Responsive design consistent with existing UI patterns
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerP2LAdmin } from '../services/p2lAdminService';

export default function RegisterAdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Validates email format using RFC 5322 simplified regex
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validates password strength
   * Requirements: min 8 chars, at least one letter, one number, one special char
   */
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('at least one letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('at least one special character');
    }
    
    return errors;
  };

  /**
   * Validates form inputs and displays real-time feedback
   */
  const validateForm = () => {
    const errors = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handles form submission
   * Validates inputs, calls API, and redirects on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Attempting admin registration...');
      
      const result = await registerP2LAdmin({ email, password });

      console.log('📥 Registration result:', result);

      if (result.success) {
        console.log('✅ Admin registration successful!');
        setSuccess(true);
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        console.log('❌ Registration failed:', result.error);
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Enter key press for form submission
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)',
    },
    card: {
      display: 'flex',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      maxWidth: '1100px',
      width: '100%',
    },
    registerSection: {
      flex: '1',
      padding: '60px 50px',
      maxWidth: '500px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '40px',
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
    },
    title: {
      fontSize: '32px',
      color: '#1f2937',
      marginBottom: '12px',
      fontWeight: '700',
      margin: '0 0 12px 0',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '15px',
      marginBottom: '40px',
      lineHeight: '1.5',
    },
    adminBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      marginBottom: '20px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
    },
    required: {
      color: '#ef4444',
      marginLeft: '3px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'all 0.3s',
      background: '#f9fafb',
      color: '#1f2937',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#3b82f6',
      background: 'white',
    },
    passwordWrapper: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#9ca3af',
      fontSize: '18px',
      padding: '0',
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s',
      marginTop: '10px',
      fontFamily: 'inherit',
      opacity: loading ? 0.7 : 1,
    },
    errorMessage: {
      marginTop: '15px',
      padding: '12px 16px',
      background: '#fef2f2',
      border: '2px solid #fecaca',
      borderRadius: '10px',
      color: '#dc2626',
      fontSize: '14px',
      fontWeight: '500',
    },
    fieldError: {
      marginTop: '6px',
      color: '#ef4444',
      fontSize: '13px',
      fontWeight: '500',
    },
    successMessage: {
      marginTop: '15px',
      padding: '12px 16px',
      background: '#f0fdf4',
      border: '2px solid #bbf7d0',
      borderRadius: '10px',
      color: '#16a34a',
      fontSize: '14px',
      fontWeight: '500',
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '25px',
      fontSize: '14px',
      color: '#6b7280',
    },
    link: {
      color: '#3b82f6',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.3s',
    },
    infoSection: {
      flex: '1',
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      padding: '60px 50px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    infoTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e3a8a',
      marginBottom: '20px',
    },
    infoList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      color: '#1e40af',
      fontSize: '15px',
      lineHeight: '1.6',
    },
    checkIcon: {
      color: '#3b82f6',
      fontSize: '20px',
      marginTop: '2px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Registration Form Section */}
        <div style={styles.registerSection}>
          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P2L</div>
            <div style={styles.logoText}>Play2Learn</div>
          </div>

          {/* Admin Badge */}
          <div style={styles.adminBadge}>
            ⚡ Admin Registration
          </div>

          {/* Title */}
          <h1 style={styles.title}>Create Admin Account</h1>
          <p style={styles.subtitle}>
            Register as a Play2Learn platform administrator
          </p>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email Address<span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors({...validationErrors, email: ''});
                }}
                onKeyPress={handleKeyPress}
                style={{
                  ...styles.input,
                  ...(validationErrors.email ? styles.inputError : {})
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = validationErrors.email ? '#ef4444' : '#e5e7eb'}
                placeholder="admin@example.com"
                disabled={loading}
              />
              {validationErrors.email && (
                <div style={styles.fieldError}>{validationErrors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Password<span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors({...validationErrors, password: ''});
                  }}
                  onKeyPress={handleKeyPress}
                  style={{
                    ...styles.input,
                    ...(validationErrors.password ? styles.inputError : {})
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.password ? '#ef4444' : '#e5e7eb'}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <div style={styles.fieldError}>{validationErrors.password}</div>
              )}
              <div style={{ ...styles.fieldError, color: '#6b7280', marginTop: '6px' }}>
                Min 8 characters, 1 letter, 1 number, 1 special character
              </div>
            </div>

            {/* Confirm Password Field */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Confirm Password<span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationErrors({...validationErrors, confirmPassword: ''});
                  }}
                  onKeyPress={handleKeyPress}
                  style={{
                    ...styles.input,
                    ...(validationErrors.confirmPassword ? styles.inputError : {})
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.confirmPassword ? '#ef4444' : '#e5e7eb'}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  disabled={loading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div style={styles.fieldError}>{validationErrors.confirmPassword}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={styles.button}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>

            {/* Error Message */}
            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div style={styles.successMessage}>
                ✅ Admin account created successfully! Redirecting to login...
              </div>
            )}
          </form>

          {/* Login Link */}
          <div style={styles.loginLink}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div style={styles.infoSection}>
          <h2 style={styles.infoTitle}>Admin Features</h2>
          <ul style={styles.infoList}>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Manage schools and licensing plans</span>
            </li>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Create and manage school administrators</span>
            </li>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Build and maintain question banks</span>
            </li>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Design adaptive quizzes and assessments</span>
            </li>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Customize landing page content</span>
            </li>
            <li style={styles.infoItem}>
              <span style={styles.checkIcon}>✓</span>
              <span>Monitor system health and performance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
