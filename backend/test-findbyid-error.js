// Test to see if findById throws with invalid ID
const mongoose = require('mongoose');

// Test invalid ID formats
const invalidIds = [
  undefined,
  null,
  '',
  'invalid',
  '123',
  'not-an-objectid'
];

console.log('Testing if mongoose.Types.ObjectId.isValid() catches invalid IDs:\n');

invalidIds.forEach(id => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  console.log(`ID: ${JSON.stringify(id)}, isValid: ${isValid}`);
});

console.log('\nNote: mongoose.Types.ObjectId.isValid() returns true for some strings that look like ObjectIds');
console.log('even if they don\'t exist in the database. It only checks format, not existence.');
