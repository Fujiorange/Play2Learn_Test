// backend/utils/passwordGenerator.js
const crypto = require('crypto');

function generateTempPassword(userType) {
  // Create readable but secure password with 8 characters including special char
  const prefix = userType.substring(0, 3).toUpperCase(); // TEA, STU, PAR, SCH
  const random = crypto.randomBytes(2).toString('hex'); // 4 random chars
  const specialChars = '!@#$%^&*';
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  return `${prefix}${random}${special}`;
  // Example: STU2a4f!, TEAb3c2@, SCHd1e5#
}

module.exports = { generateTempPassword };