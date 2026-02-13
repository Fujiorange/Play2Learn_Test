// backend/utils/pinGenerator.js
const crypto = require('crypto');

/**
 * Generates a cryptographically secure random 6-digit PIN
 * @returns {string} A 6-digit PIN as a string
 */
function generateSixDigitPIN() {
  // Use crypto.randomInt for cryptographically secure random number
  // Range: 100000 to 999999 (inclusive)
  const pin = crypto.randomInt(100000, 1000000).toString();
  return pin;
}

module.exports = {
  generateSixDigitPIN
};
