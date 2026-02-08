/**
 * Simple test to verify License model and routes work correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the License model
const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testLicenseModel() {
  try {
    console.log('='.repeat(60));
    console.log('License Model Test');
    console.log('='.repeat(60));
    console.log();

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');
    console.log();

    // Test 1: Create a license
    console.log('Test 1: Creating a new license...');
    const license1 = new License({
      type: 'starter',
      organization_name: 'Test Organization 1',
      teacher_limit: 50,
      student_limit: 500,
      price: 2500,
      is_active: true,
      notes: 'Test license created by test script'
    });

    await license1.save();
    console.log('✓ License 1 created successfully');
    console.log('  ID:', license1._id);
    console.log('  Type:', license1.type);
    console.log('  Organization:', license1.organization_name);
    console.log();

    // Test 2: Create another license with the SAME type (this should work!)
    console.log('Test 2: Creating another license with the SAME type...');
    const license2 = new License({
      type: 'starter', // Same type as license1
      organization_name: 'Test Organization 2',
      teacher_limit: 50,
      student_limit: 500,
      price: 2500,
      is_active: true,
      notes: 'Another license with same type - should work!'
    });

    await license2.save();
    console.log('✓ License 2 created successfully (same type as License 1)');
    console.log('  ID:', license2._id);
    console.log('  Type:', license2.type);
    console.log('  Organization:', license2.organization_name);
    console.log();
    console.log('✅ SUCCESS: Multiple licenses with same type can be created!');
    console.log();

    // Test 3: Query licenses
    console.log('Test 3: Querying all licenses...');
    const allLicenses = await License.find();
    console.log(`✓ Found ${allLicenses.length} license(s) in database`);
    console.log();

    // Test 4: Update a license
    console.log('Test 4: Updating a license...');
    license1.organization_name = 'Updated Organization Name';
    await license1.save();
    console.log('✓ License updated successfully');
    console.log('  New name:', license1.organization_name);
    console.log();

    // Cleanup: Delete test licenses
    console.log('Cleanup: Deleting test licenses...');
    await License.deleteOne({ _id: license1._id });
    await License.deleteOne({ _id: license2._id });
    console.log('✓ Test licenses deleted');
    console.log();

    console.log('='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 11000) {
      console.error('\n⚠️  E11000 Duplicate Key Error detected!');
      console.error('This means there is still a unique index on the "type" field.');
      console.error('Please run: node fix-license-indexes.js');
    }
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

// Run the test
testLicenseModel();
