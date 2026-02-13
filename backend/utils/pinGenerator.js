// backend/utils/pinGenerator.js

/**
 * Generates a random 6-digit PIN
 * @returns {string} A 6-digit PIN as a string
 */
function generateSixDigitPIN() {
  // Generate a random number between 100000 and 999999
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

module.exports = {
  generateSixDigitPIN
};
