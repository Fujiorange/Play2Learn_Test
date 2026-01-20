// backend/utils/passwordGenerator.js
const crypto = require('crypto');

function generateTempPassword(userType) {
  // Create readable but secure password
  const prefix = userType.substring(0, 3).toUpperCase(); // TEA, STU, PAR
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex'); // 6 random chars
  const special = '!@#$'[Math.floor(Math.random() * 4)];
  
  return `${prefix}${year}${random}${special}`;
  // Example: STU2026a3f4b2!
}

module.exports = { generateTempPassword };