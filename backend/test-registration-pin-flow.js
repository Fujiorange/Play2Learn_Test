// backend/test-registration-pin-flow.js
// Test script for email verification PIN flow

const mongoose = require('mongoose');
require('dotenv').config();

const RegistrationPIN = require('./models/RegistrationPIN');
const { generateSixDigitPIN } = require('./utils/pinGenerator');
const { sendVerificationPIN } = require('./services/emailService');

async function testPINGeneration() {
  console.log('\n📝 Testing PIN Generation...');
  
  // Generate 10 PINs to verify they're all 6 digits
  const pins = [];
  for (let i = 0; i < 10; i++) {
    const pin = generateSixDigitPIN();
    pins.push(pin);
    console.log(`  PIN ${i + 1}: ${pin} (Length: ${pin.length})`);
  }
  
  // Verify all are 6 digits
  const allValid = pins.every(pin => pin.length === 6 && /^\d{6}$/.test(pin));
  if (allValid) {
    console.log('✅ All PINs are valid 6-digit numbers');
  } else {
    console.log('❌ Some PINs are invalid');
  }
}

async function testRegistrationPINModel() {
  console.log('\n📝 Testing RegistrationPIN Model...');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Create a test registration PIN
    const testEmail = 'test@example.com';
    const testPIN = generateSixDigitPIN();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const testRecord = new RegistrationPIN({
      email: testEmail,
      pin: testPIN,
      registrationData: {
        institutionName: 'Test School',
        password: 'hashedPasswordHere',
        referralSource: 'test'
      },
      expiresAt: expiresAt
    });
    
    await testRecord.save();
    console.log(`✅ Created test registration record for ${testEmail}`);
    console.log(`   PIN: ${testPIN}`);
    console.log(`   Expires at: ${expiresAt.toISOString()}`);
    
    // Verify record can be retrieved
    const retrieved = await RegistrationPIN.findOne({ email: testEmail });
    if (retrieved) {
      console.log('✅ Successfully retrieved record from database');
      console.log(`   Email: ${retrieved.email}`);
      console.log(`   PIN: ${retrieved.pin}`);
      console.log(`   Is Expired: ${retrieved.isExpired()}`);
    }
    
    // Clean up test record
    await RegistrationPIN.deleteOne({ email: testEmail });
    console.log('✅ Cleaned up test record');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error testing RegistrationPIN model:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

async function testEmailSending() {
  console.log('\n📝 Testing Email Sending...');
  console.log('⚠️  This will send a real email if SMTP is configured');
  console.log('⚠️  Skipping actual email send in test mode');
  console.log('   To test email sending, set TEST_EMAIL environment variable and uncomment the code below');
  
  // Uncomment to test actual email sending:
  /*
  const testEmail = process.env.TEST_EMAIL;
  if (testEmail) {
    const pin = generateSixDigitPIN();
    const result = await sendVerificationPIN(testEmail, pin, 'Test Institution');
    if (result.success) {
      console.log(`✅ Email sent successfully to ${testEmail}`);
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log(`❌ Email failed: ${result.error}`);
    }
  } else {
    console.log('⚠️  Set TEST_EMAIL environment variable to test email sending');
  }
  */
}

async function runTests() {
  console.log('🧪 Starting Registration PIN Flow Tests\n');
  console.log('='.repeat(60));
  
  await testPINGeneration();
  await testRegistrationPINModel();
  await testEmailSending();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
