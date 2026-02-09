/**
 * Payment Validation Test Suite
 * Tests the payment validation logic for the license upgrade feature
 */

// Simulated validation functions (extracted from the implementation)

function validateCardNumber(cardNumber) {
  const errors = {};
  const cardNumberClean = cardNumber.replace(/\s/g, '');
  
  if (!cardNumberClean) {
    errors.cardNumber = 'Card number is required';
  } else if (cardNumberClean.length !== 16) {
    errors.cardNumber = 'Card number must be 16 digits';
  } else if (!/^\d{16}$/.test(cardNumberClean)) {
    errors.cardNumber = 'Card number must contain only digits';
  }
  
  return errors;
}

function validateExpiryDate(expiryDate) {
  const errors = {};
  
  if (!expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    errors.expiryDate = 'Expiry date must be in MM/YY format';
  } else {
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = currentCentury + yearNum;
    
    if (monthNum < 1 || monthNum > 12) {
      errors.expiryDate = 'Invalid month (must be 01-12)';
    } else {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      
      if (fullYear < currentYear || (fullYear === currentYear && monthNum < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }
  }
  
  return errors;
}

function validateCVV(cvv) {
  const errors = {};
  
  if (!cvv) {
    errors.cvv = 'CVV is required';
  } else if (cvv.length !== 3) {
    errors.cvv = 'CVV must be 3 digits';
  } else if (!/^\d{3}$/.test(cvv)) {
    errors.cvv = 'CVV must contain only digits';
  }
  
  return errors;
}

// Test Cases
const tests = [
  // Card Number Tests
  {
    name: 'Valid card number',
    input: { cardNumber: '1234567890123456' },
    validator: validateCardNumber,
    expected: {}
  },
  {
    name: 'Valid card number with spaces',
    input: { cardNumber: '1234 5678 9012 3456' },
    validator: validateCardNumber,
    expected: {}
  },
  {
    name: 'Invalid card number - too short',
    input: { cardNumber: '123' },
    validator: validateCardNumber,
    expected: { cardNumber: 'Card number must be 16 digits' }
  },
  {
    name: 'Invalid card number - contains letters',
    input: { cardNumber: 'abcd1234567890ab' },
    validator: validateCardNumber,
    expected: { cardNumber: 'Card number must contain only digits' }
  },
  {
    name: 'Invalid card number - empty',
    input: { cardNumber: '' },
    validator: validateCardNumber,
    expected: { cardNumber: 'Card number is required' }
  },
  
  // Expiry Date Tests
  {
    name: 'Valid expiry date - future',
    input: { expiryDate: '12/30' },
    validator: validateExpiryDate,
    expected: {}
  },
  {
    name: 'Invalid expiry date - wrong format',
    input: { expiryDate: '1230' },
    validator: validateExpiryDate,
    expected: { expiryDate: 'Expiry date must be in MM/YY format' }
  },
  {
    name: 'Invalid expiry date - invalid month',
    input: { expiryDate: '13/25' },
    validator: validateExpiryDate,
    expected: { expiryDate: 'Invalid month (must be 01-12)' }
  },
  {
    name: 'Invalid expiry date - month 00',
    input: { expiryDate: '00/25' },
    validator: validateExpiryDate,
    expected: { expiryDate: 'Invalid month (must be 01-12)' }
  },
  {
    name: 'Invalid expiry date - expired',
    input: { expiryDate: '01/20' },
    validator: validateExpiryDate,
    expected: { expiryDate: 'Card has expired' }
  },
  {
    name: 'Invalid expiry date - empty',
    input: { expiryDate: '' },
    validator: validateExpiryDate,
    expected: { expiryDate: 'Expiry date is required' }
  },
  
  // CVV Tests
  {
    name: 'Valid CVV',
    input: { cvv: '123' },
    validator: validateCVV,
    expected: {}
  },
  {
    name: 'Invalid CVV - too short',
    input: { cvv: '12' },
    validator: validateCVV,
    expected: { cvv: 'CVV must be 3 digits' }
  },
  {
    name: 'Invalid CVV - too long',
    input: { cvv: '1234' },
    validator: validateCVV,
    expected: { cvv: 'CVV must be 3 digits' }
  },
  {
    name: 'Invalid CVV - contains letters',
    input: { cvv: 'abc' },
    validator: validateCVV,
    expected: { cvv: 'CVV must contain only digits' }
  },
  {
    name: 'Invalid CVV - empty',
    input: { cvv: '' },
    validator: validateCVV,
    expected: { cvv: 'CVV is required' }
  }
];

// Run Tests
console.log('🧪 Running Payment Validation Tests...\n');

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = test.validator(test.input[Object.keys(test.input)[0]]);
  const resultKeys = Object.keys(result);
  const expectedKeys = Object.keys(test.expected);
  
  const isPass = resultKeys.length === expectedKeys.length &&
                 resultKeys.every(key => result[key] === test.expected[key]);
  
  if (isPass) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Expected:`, test.expected);
    console.log(`   Got:`, result);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Total Tests: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
