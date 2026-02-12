// backend/utils/passwordGenerator.js
const crypto = require('crypto');

/**
 * Common weak passwords to avoid
 */
const COMMON_PASSWORDS = [
  'password', 'password123', 'password1', '12345678', '123456789', '12345',
  'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome', 'admin', 'admin123'
];

/**
 * Check if password contains sequential characters
 */
function hasSequentialChars(password) {
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
}

/**
 * Check if password has repeated characters
 */
function hasRepeatedChars(password) {
  // Check for 3 or more consecutive identical characters
  const repeatedPattern = /(.)\1{2,}/;
  return repeatedPattern.test(password);
}

/**
 * Count character types in password
 */
function countCharacterTypes(password) {
  let types = 0;
  if (/[a-z]/.test(password)) types++; // Lowercase
  if (/[A-Z]/.test(password)) types++; // Uppercase
  if (/[0-9]/.test(password)) types++; // Numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) types++; // Special chars
  return types;
}

/**
 * Validate password against medium security requirements
 */
function validatePassword(password) {
  if (!password || password.length < 8) return false;
  if (countCharacterTypes(password) < 2) return false;
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) return false;
  if (hasSequentialChars(password)) return false;
  if (hasRepeatedChars(password)) return false;
  return true;
}

/**
 * Generate a strong temporary password that meets security requirements
 * @param {number} length - Desired password length (default 12)
 * @returns {string} - Generated secure password
 */
function generateStrongPassword(length = 12) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O for clarity
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Removed l for clarity
  const numbers = '23456789'; // Removed 0, 1 for clarity
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least 2 character types by including one from each major category
  let password = '';
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password
  password = password.split('').sort(() => crypto.randomInt(0, 2) - 1).join('');
  
  // Validate and regenerate if needed (rare case)
  if (!validatePassword(password)) {
    return generateStrongPassword(length);
  }
  
  return password;
}

/**
 * Generate temporary password for user creation
 * Legacy function maintained for compatibility
 * @param {string} userType - Type of user (teacher, student, etc.)
 * @returns {string} - Generated secure password
 */
function generateTempPassword(userType) {
  // Use the new strong password generator
  return generateStrongPassword(12);
}

module.exports = { 
  generateTempPassword,
  generateStrongPassword,
  validatePassword
};