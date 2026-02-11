/**
 * Password Validator Tests
 * 
 * Tests for medium-level password validation utility
 */

import { 
  validatePassword, 
  generateStrongPassword, 
  getPasswordStrength,
  getPasswordRequirements 
} from './passwordValidator';

describe('Password Validator', () => {
  
  describe('validatePassword', () => {
    
    test('rejects passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
    
    test('rejects passwords with less than 2 character types', () => {
      const result = validatePassword('abcdefgh');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('accepts password with lowercase and numbers', () => {
      const result = validatePassword('testpass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('accepts password with uppercase and special chars', () => {
      const result = validatePassword('PASSWORD!@#');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('rejects common passwords', () => {
      const commonPasswords = ['password123', 'qwerty', 'admin123'];
      commonPasswords.forEach(pwd => {
        const result = validatePassword(pwd);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('commonly used'))).toBe(true);
      });
    });
    
    test('rejects passwords with sequential numbers', () => {
      const result = validatePassword('Test12345');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sequential'))).toBe(true);
    });
    
    test('rejects passwords with sequential letters', () => {
      const result = validatePassword('Testabcde');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sequential'))).toBe(true);
    });
    
    test('rejects passwords with repeated characters', () => {
      const result = validatePassword('Testaaa11');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('repeated'))).toBe(true);
    });
    
    test('rejects passwords containing username', () => {
      const result = validatePassword('john1234', 'john@example.com');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('username or email'))).toBe(true);
    });
    
    test('rejects passwords containing email username part', () => {
      const result = validatePassword('admin123test', 'admin@example.com');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('username or email'))).toBe(true);
    });
    
    test('accepts strong valid password', () => {
      const result = validatePassword('MyP@ssw0rd', 'user@example.com');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('accepts password with multiple character types', () => {
      const result = validatePassword('Str0ng!Pass');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    test('handles empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('handles null/undefined password', () => {
      const result = validatePassword(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateStrongPassword', () => {
    
    test('generates password of requested length', () => {
      const password = generateStrongPassword(12);
      expect(password.length).toBe(12);
    });
    
    test('generated password passes validation', () => {
      const password = generateStrongPassword();
      const validation = validatePassword(password);
      expect(validation.valid).toBe(true);
    });
    
    test('generated passwords are unique', () => {
      const passwords = new Set();
      for (let i = 0; i < 10; i++) {
        passwords.add(generateStrongPassword());
      }
      expect(passwords.size).toBe(10);
    });
    
    test('generates different passwords on each call', () => {
      const pwd1 = generateStrongPassword();
      const pwd2 = generateStrongPassword();
      expect(pwd1).not.toBe(pwd2);
    });
  });
  
  describe('getPasswordStrength', () => {
    
    test('returns weak for short passwords', () => {
      expect(getPasswordStrength('Pass1')).toBe('weak');
    });
    
    test('returns weak for invalid passwords', () => {
      expect(getPasswordStrength('password123')).toBe('weak');
    });
    
    test('returns medium for 8+ char password with 2 types', () => {
      expect(getPasswordStrength('testpass123')).toBe('medium');
    });
    
    test('returns strong for 12+ char password with 3+ types', () => {
      expect(getPasswordStrength('MyStr0ng!Pass')).toBe('strong');
    });
    
    test('returns weak for empty password', () => {
      expect(getPasswordStrength('')).toBe('weak');
    });
  });
  
  describe('getPasswordRequirements', () => {
    
    test('returns array of requirement strings', () => {
      const requirements = getPasswordRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });
    
    test('requirements include length requirement', () => {
      const requirements = getPasswordRequirements();
      expect(requirements.some(r => r.includes('8 characters'))).toBe(true);
    });
    
    test('requirements include character type requirement', () => {
      const requirements = getPasswordRequirements();
      expect(requirements.some(r => r.includes('uppercase'))).toBe(true);
    });
  });
});
