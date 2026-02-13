import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { validatePassword } from '../utils/passwordValidator';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    referralSource: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [buttonHovered, setButtonHovered] = useState(false);
  
  // PIN verification state
  const [showPINVerification, setShowPINVerification] = useState(false);
  const [pin, setPIN] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [resendingPIN, setResendingPIN] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [focusedPINIndex, setFocusedPINIndex] = useState(-1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Timer effect for PIN expiration
  useEffect(() => {
    if (showPINVerification && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showPINVerification, timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle PIN input
  const handlePINChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow digits
    
    const newPIN = [...pin];
    newPIN[index] = value;
    setPIN(newPIN);
    setPinError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle PIN backspace
  const handlePINKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Verify PIN
  const handleVerifyPIN = async () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 6) {
      setPinError('Please enter all 6 digits');
      return;
    }

    if (timeLeft <= 0) {
      setPinError('PIN has expired. Please request a new one.');
      return;
    }

    setVerifying(true);
    setPinError('');

    try {
      const result = await authService.verifyPIN(formData.email, pinValue);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setPinError(result.error || 'Invalid PIN. Please try again.');
        setPIN(['', '', '', '', '', '']);
        setFocusedPINIndex(0);
        const firstInput = document.getElementById('pin-0');
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      setPinError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Resend PIN
  const handleResendPIN = async () => {
    setResendingPIN(true);
    setPinError('');
    setResendSuccess(false);

    try {
      const result = await authService.resendPIN(formData.email);
      
      if (result.success) {
        setTimeLeft(15 * 60); // Reset timer to 15 minutes
        setPIN(['', '', '', '', '', '']);
        setResendSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setPinError(result.error || 'Failed to resend PIN');
      }
    } catch (err) {
      setPinError('Failed to resend PIN. Please try again.');
    } finally {
      setResendingPIN(false);
    }
  };

  // Email validation function
  const isValidEmail = (email) => {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    // Email format validation
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Institution name is required
    if (!formData.institutionName) {
      setError('Institution/Organization name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(formData.password, formData.email);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]); // Show first error
      return;
    }

    setLoading(true);

    try {
      // Register as institute admin - now sends PIN
      const result = await authService.registerSchoolAdmin({
        email: formData.email,
        password: formData.password,
        institutionName: formData.institutionName,
        referralSource: formData.referralSource || null
      });

      if (result.success) {
        // Show PIN verification screen
        setShowPINVerification(true);
        setTimeLeft(15 * 60); // Start 15-minute timer
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
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
      cursor: 'pointer',
      transition: 'opacity 0.3s',
    },
    logoHover: {
      opacity: 0.7,
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    trialBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    inputFocus: {
      outline: 'none',
      borderColor: '#10b981',
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
    select: {
      width: '100%',
      padding: '12px 40px 12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '15px',
      transition: 'all 0.3s',
      background: '#f9fafb',
      color: '#1f2937',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 16px center',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginTop: '10px',
      fontFamily: 'inherit',
      opacity: loading ? 0.7 : 1,
    },
    pinContainer: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    pinInput: {
      width: '50px',
      height: '60px',
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      background: '#f9fafb',
      color: '#1f2937',
      transition: 'all 0.3s',
      fontFamily: 'monospace',
    },
    pinInputFocus: {
      borderColor: '#10b981',
      background: 'white',
      outline: 'none',
    },
    timerBox: {
      textAlign: 'center',
      padding: '12px',
      background: '#fef3c7',
      border: '2px solid #fbbf24',
      borderRadius: '10px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#92400e',
    },
    resendButton: {
      background: 'transparent',
      border: '2px solid #10b981',
      color: '#10b981',
      padding: '12px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      width: '100%',
      marginTop: '10px',
      fontFamily: 'inherit',
    },
    verificationTitle: {
      fontSize: '24px',
      color: '#1f2937',
      marginBottom: '12px',
      fontWeight: '700',
      textAlign: 'center',
    },
    verificationSubtitle: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '30px',
      textAlign: 'center',
      lineHeight: '1.5',
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
    passwordHint: {
      marginTop: '8px',
      padding: '8px 12px',
      background: '#f0f9ff',
      border: '1px solid #bfdbfe',
      borderRadius: '6px',
      fontSize: '12px',
      color: '#1e40af',
      lineHeight: '1.5',
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
    infoMessage: {
      marginTop: '15px',
      padding: '12px 16px',
      background: '#eff6ff',
      border: '2px solid #bfdbfe',
      borderRadius: '10px',
      color: '#1e40af',
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
      color: '#10b981',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.3s',
    },
    infoSection: {
      flex: '1',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '60px 50px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    infoTitle: {
      fontSize: '28px',
      color: '#1f2937',
      marginBottom: '30px',
      fontWeight: '700',
      margin: '0 0 30px 0',
    },
    feature: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '20px',
      fontSize: '15px',
      color: '#374151',
      lineHeight: '1.6',
    },
    star: {
      fontSize: '18px',
      flexShrink: '0',
      marginTop: '2px',
    },
    tabContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      background: '#f3f4f6',
      padding: '4px',
      borderRadius: '10px',
    },
    tab: {
      flex: 1,
      padding: '10px',
      border: 'none',
      background: 'transparent',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      color: '#6b7280',
      fontFamily: 'inherit',
    },
    tabActive: {
      background: 'white',
      color: '#10b981',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.registerSection}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>P</div>
              <span style={styles.logoText}>Play2Learn</span>
            </div>
          </Link>

          <div style={styles.trialBadge}>
            ✨ FREE TRIAL
          </div>

          <h1 style={styles.title}>
            {showPINVerification ? 'Verify Your Email' : 'Start Your Journey!'}
          </h1>
          <p style={styles.subtitle}>
            {showPINVerification 
              ? `We've sent a 6-digit PIN to ${formData.email}. Please enter it below.`
              : 'Register your institute and get started with a free trial account.'
            }
          </p>

          {!showPINVerification ? (
            <div>
              {/* Registration Form */}
              <div style={styles.formGroup}>
              <label style={styles.label}>
                Institution/Organization Name<span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setFocusedField('institutionName')}
                onBlur={() => setFocusedField('')}
                placeholder="Your school or organization name"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(focusedField === 'institutionName' ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email Address<span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder="you@example.com"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(focusedField === 'email' ? styles.inputFocus : {}),
                }}
              />
            </div>

            {/* Referral Source */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                How did you hear about us?
              </label>
              <select
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                onFocus={() => setFocusedField('referralSource')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
                style={{
                  ...styles.select,
                  ...(focusedField === 'referralSource' ? styles.inputFocus : {}),
                }}
              >
                <option value="">Select an option (optional)</option>
                <option value="search-engine">Search Engine (Google, Bing, etc.)</option>
                <option value="social-media">Social Media</option>
                <option value="friend-referral">Friend or Colleague</option>
                <option value="advertisement">Advertisement</option>
                <option value="conference-event">Conference or Event</option>
                <option value="blog-article">Blog or Article</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Password<span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'password' ? styles.inputFocus : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
              <div style={styles.passwordHint}>
                💡 Password must: be 8+ characters, include at least 2 types (uppercase, lowercase, numbers, special chars), avoid common passwords and sequential/repeated characters
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Confirm Password<span style={styles.required}>*</span>
              </label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Re-enter password"
                  disabled={loading}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'confirmPassword' ? styles.inputFocus : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              onMouseEnter={() => setButtonHovered(true)}
              onMouseLeave={() => setButtonHovered(false)}
              disabled={loading}
              style={{
                ...styles.button,
                transform: buttonHovered && !loading ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: buttonHovered && !loading ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 0 0 rgba(16, 185, 129, 0)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending PIN...' : 'Start Free Trial'}
            </button>

            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <p style={styles.loginLink}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={styles.link}
                onMouseEnter={(e) => e.target.style.color = '#059669'}
                onMouseLeave={(e) => e.target.style.color = '#10b981'}
              >
                Log in
              </Link>
            </p>
          </div>
          ) : (
            <div>
              {/* PIN Verification Screen */}
              {timeLeft > 0 ? (
                <div style={styles.timerBox}>
                  ⏰ PIN expires in: {formatTime(timeLeft)}
                </div>
              ) : (
                <div style={styles.errorMessage}>
                  ⚠️ PIN has expired. Please click "Resend PIN" to get a new one.
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Enter 6-Digit PIN</label>
                <div style={styles.pinContainer}>
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePINChange(index, e.target.value)}
                      onKeyDown={(e) => handlePINKeyDown(index, e)}
                      onFocus={() => setFocusedPINIndex(index)}
                      onBlur={() => setFocusedPINIndex(-1)}
                      disabled={verifying || timeLeft <= 0}
                      style={{
                        ...styles.pinInput,
                        ...(focusedPINIndex === index ? styles.pinInputFocus : {}),
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyPIN}
                disabled={verifying || pin.join('').length !== 6 || timeLeft <= 0}
                style={{
                  ...styles.button,
                  cursor: (verifying || pin.join('').length !== 6) ? 'not-allowed' : 'pointer',
                  opacity: (verifying || pin.join('').length !== 6) ? 0.5 : 1,
                }}
              >
                {verifying ? 'Verifying...' : 'Verify PIN'}
              </button>

              <button
                onClick={handleResendPIN}
                disabled={resendingPIN}
                style={{
                  ...styles.resendButton,
                  cursor: resendingPIN ? 'not-allowed' : 'pointer',
                  opacity: resendingPIN ? 0.5 : 1,
                }}
              >
                {resendingPIN ? 'Sending...' : '📧 Resend PIN'}
              </button>

              {resendSuccess && (
                <div style={styles.infoMessage}>
                  ✉️ New PIN sent to your email! Please check your inbox.
                </div>
              )}

              {success && (
                <div style={styles.successMessage}>
                  ✅ Email verified! Your institute has been registered. Redirecting to login...
                </div>
              )}

              {pinError && (
                <div style={styles.errorMessage}>
                  ⚠️ {pinError}
                </div>
              )}

              <p style={styles.loginLink}>
                <button
                  onClick={() => {
                    setShowPINVerification(false);
                    setPIN(['', '', '', '', '', '']);
                    setPinError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#10b981',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    padding: 0,
                  }}
                >
                  ← Back to registration
                </button>
              </p>
            </div>
          )}
        </div>

        <div style={styles.infoSection}>
          <h2 style={styles.infoTitle}>
            Level up your learning 🎓
          </h2>

          <div>
            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Track progress in real time</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Gamified quests for English, Math & Science</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Rewards that keep you motivated</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Join a community of learners</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>100% free trial - no credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}