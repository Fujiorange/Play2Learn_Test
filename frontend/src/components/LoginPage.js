import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize role to handle all variations - matches Yi Hong's format
  const normalizeRole = (role) => {
    if (!role) return role;
    const lower = role.toLowerCase().trim();
    
    // Platform admin variations
    if (lower.includes('platform') || lower === 'p2ladmin' || lower === 'p2l-admin') return 'platform-admin';
    
    // School admin variations - check for any form
    if (lower.includes('school') && lower.includes('admin')) return 'school-admin';
    if (lower === 'schooladmin' || lower === 'school-admin') return 'school-admin';
    
    // Others
    if (lower.includes('teacher')) return 'teacher';
    if (lower.includes('student')) return 'student';
    if (lower.includes('parent')) return 'parent';
    
    return lower;
  };

  const handleSubmit = async () => {
    setError('');

    if (!email || !password || !role) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Attempting login...');
      
      const result = await authService.login(email, password, role);

      console.log('📥 Login result:', result);

      if (result.success) {
        console.log('✅ Login successful!');
        console.log('👤 User role (raw):', result.user.role);
        
        // Get role and convert to lowercase for comparison
        const rawRole = (result.user.role || '').toLowerCase();
        
        console.log('🔀 Role lowercase:', rawRole);
        
        // Check for each role type - handle ALL variations
        if (rawRole.includes('platform') || rawRole === 'p2ladmin' || rawRole === 'p2l-admin') {
          console.log('➡️ Redirecting to platform-admin');
          navigate('/platform-admin');
        } else if (rawRole.includes('school') && rawRole.includes('admin')) {
          // This catches: "school admin", "school-admin", "schooladmin", "School Admin"
          console.log('➡️ Redirecting to school-admin');
          navigate('/school-admin');
        } else if (rawRole.includes('teacher')) {
          console.log('➡️ Redirecting to teacher');
          navigate('/teacher');
        } else if (rawRole.includes('student')) {
          console.log('➡️ Redirecting to student');
          navigate('/student');
        } else if (rawRole.includes('parent')) {
          console.log('➡️ Redirecting to parent');
          navigate('/parent');
        } else {
          console.log('⚠️ Unknown role:', rawRole);
          setError('Unknown user role: ' + result.user.role);
        }
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

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '40px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '32px',
    },
    logoIcon: {
      width: '50px',
      height: '50px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      textAlign: 'center',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '32px',
    },
    inputGroup: {
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
      borderRadius: '8px',
      fontSize: '15px',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '15px',
      background: 'white',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    passwordContainer: {
      position: 'relative',
    },
    showPassword: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '14px',
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      marginTop: '8px',
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    error: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    links: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '14px',
      color: '#6b7280',
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '600',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>Play2Learn</span>
        </div>

        <h1 style={styles.title}>Welcome Back!</h1>
        <p style={styles.subtitle}>Sign in to continue your learning journey</p>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <div style={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.showPassword}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>I am a...</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.select}
          >
            <option value="">Select your role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="school-admin">School Admin</option>
            <option value="platform-admin">Platform Admin</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={styles.links}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
