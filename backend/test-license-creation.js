// Test script to verify license creation functionality
const mongoose = require('mongoose');
require('dotenv').config();

const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testLicenseCreation() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test license
    console.log('\n📝 Test 1: Creating a test license...');
    const testLicense = new License({
      name: 'Test License',
      type: 'starter',
      priceMonthly: 100,
      priceYearly: 1000,
      maxTeachers: 10,
      maxStudents: 100,
      maxClasses: 5,
      description: 'Test license for validation',
      isActive: true
    });

    await testLicense.save();
    console.log('✅ Test license created successfully:', testLicense.name);

    // Test 2: Verify maxClasses field exists
    console.log('\n📝 Test 2: Verifying maxClasses field...');
    if (testLicense.maxClasses !== undefined) {
      console.log('✅ maxClasses field exists:', testLicense.maxClasses);
    } else {
      console.log('❌ maxClasses field is missing!');
    }

    // Test 3: Try to create another license with same type (should succeed now)
    console.log('\n📝 Test 3: Creating another license with same type...');
    const testLicense2 = new License({
      name: 'Another Starter License',
      type: 'starter',
      priceMonthly: 150,
      priceYearly: 1500,
      maxTeachers: 15,
      maxStudents: 150,
      maxClasses: 8,
      description: 'Another test license',
      isActive: true
    });

    await testLicense2.save();
    console.log('✅ Second license with same type created successfully');

    // Test 4: List all licenses
    console.log('\n📝 Test 4: Listing all licenses...');
    const allLicenses = await License.find({});
    console.log(`✅ Found ${allLicenses.length} licenses in database:`);
    allLicenses.forEach(l => {
      console.log(`   - ${l.name} (${l.type}): ${l.maxTeachers} teachers, ${l.maxStudents} students, ${l.maxClasses} classes`);
    });

    // Cleanup: Delete test licenses
    console.log('\n🗑️  Cleaning up test licenses...');
    await License.deleteMany({ name: { $regex: /^Test License|^Another Starter/ } });
    console.log('✅ Test licenses deleted');

    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

testLicenseCreation();
