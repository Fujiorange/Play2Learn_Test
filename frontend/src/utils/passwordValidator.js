/**
 * Password Validation Utility
 * 
 * Implements medium-level password security requirements:
 * - Minimum 8-12 characters
 * - At least 2 character types (uppercase, lowercase, numbers, special chars)
 * - No common passwords
 * - No sequential or repeated characters
 * - Cannot contain username/email
 */

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password123', 'password1', '12345678', '123456789', '12345',
  'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome', 'admin', 'admin123',
  'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football', 'iloveyou',
  'trustno1', 'starwars', 'computer', 'solo', 'pepper', 'cheese', 'maverick',
  'mustang', 'jordan', 'superman', 'harley', 'batman', 'thomas', 'tigger',
  '123123', '1234', '696969', 'shadow', 'ashley', 'bailey', 'passw0rd'
];

/**
 * Check if password contains sequential characters
 * @param {string} password - Password to check
 * @returns {boolean} - True if sequential characters found
 */
const hasSequentialChars = (password) => {
  const sequences = [
    '0123456789', 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '9876543210', 'zyxwvutsrqponmlkjihgfedcba', 'ZYXWVUTSRQPONMLKJIHGFEDCBA'
  ];
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const substring = seq.substring(i, i + 4);
      if (password.includes(substring)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Check if password has repeated characters
 * @param {string} password - Password to check
 * @returns {boolean} - True if repeated characters found (3 or more consecutive)
 */
const hasRepeatedChars = (password) => {
  // Check for 3 or more consecutive identical characters
  const repeatedPattern = /(.)\1{2,}/;
  if (repeatedPattern.test(password)) {
    return true;
  }
  
  // Check for repeated sequences like "123123" or "abcabc"
  for (let i = 2; i <= 4; i++) {
    for (let j = 0; j <= password.length - i * 2; j++) {
      const substring = password.substring(j, j + i);
      const next = password.substring(j + i, j + i * 2);
      if (substring === next) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if password contains username or email
 * @param {string} password - Password to check
 * @param {string} identifier - Username or email to check against
 * @returns {boolean} - True if password contains identifier
 */
const containsIdentifier = (password, identifier) => {
  if (!identifier) return false;
  
  const lowerPassword = password.toLowerCase();
  const lowerIdentifier = identifier.toLowerCase();
  
  // Check if password contains the full identifier
  if (lowerPassword.includes(lowerIdentifier)) {
    return true;
  }
  
  // Check if password contains email username part
  if (lowerIdentifier.includes('@')) {
    const emailUsername = lowerIdentifier.split('@')[0];
    if (emailUsername.length >= 3 && lowerPassword.includes(emailUsername)) {
      return true;
    }
  }
  
  // Check if password contains significant parts (3+ chars) of identifier
  if (lowerIdentifier.length >= 3) {
    for (let i = 0; i <= lowerIdentifier.length - 3; i++) {
      const substring = lowerIdentifier.substring(i, i + 3);
      if (lowerPassword.includes(substring)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Count character types in password
 * @param {string} password - Password to analyze
 * @returns {number} - Number of different character types (0-4)
 */
const countCharacterTypes = (password) => {
  let types = 0;
  
  if (/[a-z]/.test(password)) types++; // Lowercase
  if (/[A-Z]/.test(password)) types++; // Uppercase
  if (/[0-9]/.test(password)) types++; // Numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) types++; // Special chars
  
  return types;
};

/**
 * Validate password against medium security requirements
 * @param {string} password - Password to validate
 * @param {string} identifier - Optional username/email to check against
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validatePassword = (password, identifier = '') => {
  const errors = [];
  
  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check character type diversity (at least 2 types)
  const charTypes = countCharacterTypes(password);
  if (charTypes < 2) {
    errors.push('Password must include at least 2 of: uppercase letters, lowercase letters, numbers, special characters');
  }
  
  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    errors.push('This is a commonly used password. Please choose a stronger password');
  }
  
  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password cannot contain sequential characters (e.g., 12345, abcde)');
  }
  
  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Password cannot contain repeated characters or patterns (e.g., aaa, 123123)');
  }
  
  // Check if password contains username/email
  if (identifier && containsIdentifier(password, identifier)) {
    errors.push('Password cannot contain your username or email');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Generate a strong password that meets all requirements
 * @param {number} length - Desired password length (default 12)
 * @returns {string} - Generated password
 */
export const generateStrongPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O for clarity
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Removed l for clarity
  const numbers = '23456789'; // Removed 0, 1 for clarity
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least 2 character types
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  // Validate generated password
  const validation = validatePassword(password);
  if (!validation.valid) {
    // Regenerate if somehow invalid
    return generateStrongPassword(length);
  }
  
  return password;
};

/**
 * Get password strength level
 * @param {string} password - Password to analyze
 * @returns {string} - 'weak', 'medium', or 'strong'
 */
export const getPasswordStrength = (password) => {
  if (!password) return 'weak';
  
  const validation = validatePassword(password);
  if (!validation.valid) return 'weak';
  
  const charTypes = countCharacterTypes(password);
  const length = password.length;
  
  // Strong: 12+ chars, 3+ types
  if (length >= 12 && charTypes >= 3) return 'strong';
  
  // Medium: 8+ chars, 2+ types
  if (length >= 8 && charTypes >= 2) return 'medium';
  
  return 'weak';
};

/**
 * Get user-friendly password requirements text
 * @returns {string[]} - Array of requirement strings
 */
export const getPasswordRequirements = () => {
  return [
    'At least 8 characters long',
    'Include at least 2 of: uppercase letters, lowercase letters, numbers, special characters (!@#$%^&*)',
    'No common passwords (like password123, qwerty)',
    'No sequential characters (like 12345, abcde)',
    'No repeated characters or patterns (like aaa, 123123)',
    'Cannot contain your username or email'
  ];
};

export default {
  validatePassword,
  generateStrongPassword,
  getPasswordStrength,
  getPasswordRequirements
};
