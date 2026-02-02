import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ChangePassword from './Auth/ChangePassword';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Helper function to normalize and route based on role
  const navigateByRole = (role) => {
    const normalizedRole = role.toLowerCase().replace(/[\s-]/g, '');
    
    const roleRoutes = {
      'platformadmin': '/platform-admin',
      'p2ladmin': '/platform-admin',
      'schooladmin': '/school-admin',
      'teacher': '/teacher',
      'student': '/student',
      'parent': '/parent'
    };
    
    const route = roleRoutes[normalizedRole];
    if (route) {
      navigate(route);
    } else {
      console.log('⚠️ Unknown role:', role);
      navigate('/login');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Attempting login...');
      
      const result = await authService.login(email, password);

      console.log('📥 Login result:', result);

      if (result.success) {
        console.log('✅ Login successful!');
        console.log('👤 User role:', result.user.role);
        
        // Check if password change is required
        if (result.user.requirePasswordChange) {
          console.log('🔒 Password change required');
          setShowPasswordChange(true);
          setLoading(false);
          return;
        }
        
        navigateByRole(result.user.role);
      } else {
        console.log('❌ Login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    const user = authService.getCurrentUser();
    if (user) {
      setShowPasswordChange(false);
      navigateByRole(user.role);
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
    loginSection: {
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
    formGroup: {
      marginBottom: '24px',
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
    registerLink: {
      marginTop: '20px',
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center',
    },
    helpSection: {
      marginTop: '25px',
      padding: '20px',
      background: '#f0f9ff',
      borderRadius: '12px',
      border: '2px solid #bfdbfe',
    },
    helpTitle: {
      fontSize: '15px',
      color: '#1e40af',
      margin: '0 0 12px 0',
      fontWeight: '600',
    },
    helpText: {
      fontSize: '13px',
      color: '#1e40af',
      margin: '6px 0',
      lineHeight: '1.5',
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

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Show password change modal if needed
  if (showPasswordChange) {
    return (
      <ChangePassword 
        requireChange={true}
        onSuccess={handlePasswordChangeSuccess}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.loginSection}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>P</div>
              <div style={styles.logoText}>Play2Learn</div>
            </div>
          </Link>

          <h1 style={styles.title}>Welcome back!</h1>
          <p style={styles.subtitle}>
            Sign in with your email and password to access your account.
          </p>

          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                disabled={loading}
                style={{
                  ...styles.input,
                  ...(emailFocused ? styles.inputFocus : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{
                    ...styles.input,
                    ...(passwordFocused ? styles.inputFocus : {}),
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
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            {/* Forgot Password Help */}
            <div style={styles.helpSection}>
              <p style={styles.helpTitle}>
                🔐 Forgot your password?
              </p>
              <p style={styles.helpText}>
                <strong>Teachers, Students, Parents:</strong> Contact your School Administrator
              </p>
              <p style={styles.helpText}>
                <strong>School Admins:</strong> Contact Platform Support
              </p>
            </div>

            <p style={styles.registerLink}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>Sign up</Link>
            </p>
          </div>
        </div>

        <div style={styles.infoSection}>
          <h2 style={styles.infoTitle}>
            Level up your classroom 🎓
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
              <span>Rewards that keep students motivated</span>
            </div>

            <div style={styles.feature}>
              <span style={styles.star}>⭐</span>
              <span>Parents, teachers & admins on one platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
