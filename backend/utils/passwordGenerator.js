// backend/utils/passwordGenerator.js
const crypto = require('crypto');

function generateTempPassword(userType) {
  // Create readable but secure password with 8 characters including special char
  // Format: [3-char prefix][4-hex chars][1-special char] = 8 characters total
  // Example: TEA2a4f!, STUb3c2@, SCHd1e5#, PAR3f8a*
  const prefix = userType.substring(0, 3).toUpperCase(); // TEA, STU, PAR, SCH
  const random = crypto.randomBytes(2).toString('hex'); // 4 random chars
  const specialChars = '!@#$%^&*';
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  return `${prefix}${random}${special}`;
}

module.exports = { generateTempPassword };