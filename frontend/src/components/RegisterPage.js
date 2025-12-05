import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
    gender: '',
    organizationName: '',
    organizationType: '',
    businessRegistrationNumber: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [buttonHovered, setButtonHovered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    // Students and parents don't need business registration numbers
    // (Teachers and admins are created by the system, not through registration)
    
    if (!formData.name || !formData.email || !formData.password || !formData.contact || 
        !formData.gender || !formData.organizationName || !formData.organizationType || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register(formData);

      if (result.success) {
        // Don't auto-login, just show success message
        setSuccess(true);
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
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
      overflowY: 'auto',
      maxHeight: '90vh',
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
    successMessage: {
      marginTop: '15px',
      padding: '12px 16px',
      background: '#f0fdf4',
      border: '2px solid #86efac',
      borderRadius: '10px',
      color: '#166534',
      fontSize: '14px',
      fontWeight: '500',
    },
    loginLink: {
      marginTop: '20px',
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center',
    },
    link: {
      color: '#10b981',
      fontWeight: '600',
      textDecoration: 'none',
      cursor: 'pointer',
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
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.registerSection}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <div style={styles.logoText}>Play2Learn</div>
          </div>

          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Join Play2Learn and start your learning adventure today!
          </p>

          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                placeholder="E.g., John Smith"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(focusedField === 'name' ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setFocusedField('contact')}
                onBlur={() => setFocusedField('')}
                placeholder="E.g., +65 9123 4567"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(focusedField === 'contact' ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onFocus={() => setFocusedField('gender')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
                style={{
                  ...styles.select,
                  ...(focusedField === 'gender' ? styles.inputFocus : {}),
                }}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Organization / School Name</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setFocusedField('organizationName')}
                onBlur={() => setFocusedField('')}
                placeholder="E.g., ABC Tuition Center, XYZ Primary School"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(focusedField === 'organizationName' ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Organization Type</label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                onFocus={() => setFocusedField('organizationType')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
                style={{
                  ...styles.select,
                  ...(focusedField === 'organizationType' ? styles.inputFocus : {}),
                }}
              >
                <option value="">Select organization type</option>
                <option value="tuition-center">Tuition Center</option>
                <option value="government-school">Government School</option>
                <option value="private-school">Private School</option>
                <option value="business">Other Business</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
                style={{
                  ...styles.select,
                  ...(focusedField === 'role' ? styles.inputFocus : {}),
                }}
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Create a password"
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
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Confirm your password"
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            {success && (
              <div style={styles.successMessage}>
                ✅ Account created successfully! Redirecting to login page...
              </div>
            )}

            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <p style={styles.loginLink}>
              Already have an account?{' '}
              <Link to="/login" style={styles.link}>Log in</Link>
            </p>
          </div>
        </div>

        <div style={styles.infoSection}>
          <h2 style={styles.infoTitle}>
            Join our community 🌟
          </h2>

          <div>
            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Access thousands of interactive lessons</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Personalized learning paths for every student</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Track progress and earn rewards</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Connect with teachers and parents seamlessly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}