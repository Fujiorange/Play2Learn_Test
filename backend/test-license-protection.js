// backend/test-license-protection.js - Test license protection logic
const mongoose = require('mongoose');
require('dotenv').config();

const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testLicenseProtection() {
  try {
    console.log('🧪 Testing License Protection Logic\n');
    console.log('=' .repeat(50));
    
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if Free Trial license exists
    console.log('Test 1: Checking if Free Trial license exists');
    const freeTrial = await License.findOne({ name: 'Free Trial' });
    if (freeTrial) {
      console.log('✅ Free Trial license found');
      console.log(`   - ID: ${freeTrial._id}`);
      console.log(`   - Type: ${freeTrial.type}`);
      console.log(`   - Max Teachers: ${freeTrial.maxTeachers}`);
      console.log(`   - Max Students: ${freeTrial.maxStudents}`);
      console.log(`   - Max Classes: ${freeTrial.maxClasses}`);
      console.log(`   - Is Deletable: ${freeTrial.isDeletable}`);
      console.log(`   - Description: ${freeTrial.description}`);
      
      if (freeTrial.isDeletable === false) {
        console.log('✅ Free Trial is correctly protected from deletion');
      } else {
        console.log('❌ WARNING: Free Trial is NOT protected from deletion!');
      }
    } else {
      console.log('❌ Free Trial license NOT found');
      console.log('   Run: node init-trial-license.js to create it');
    }

    // Test 2: Check for multiple licenses of same type
    console.log('\n\nTest 2: Checking for multiple licenses of same type');
    const freeLicenses = await License.find({ type: 'free' });
    const paidLicenses = await License.find({ type: 'paid' });
    
    console.log(`✅ Found ${freeLicenses.length} free license(s):`);
    freeLicenses.forEach(l => console.log(`   - ${l.name}`));
    
    console.log(`✅ Found ${paidLicenses.length} paid license(s):`);
    paidLicenses.forEach(l => console.log(`   - ${l.name}`));
    
    if (freeLicenses.length > 1) {
      console.log('✅ Multiple free licenses exist (as expected)');
    }
    if (paidLicenses.length > 1) {
      console.log('✅ Multiple paid licenses exist (as expected)');
    }

    // Test 3: Check license name uniqueness
    console.log('\n\nTest 3: Checking license name uniqueness');
    const allLicenses = await License.find({});
    const names = allLicenses.map(l => l.name);
    const uniqueNames = new Set(names);
    
    if (names.length === uniqueNames.size) {
      console.log('✅ All license names are unique (as expected)');
      console.log(`   Total licenses: ${names.length}`);
    } else {
      console.log('❌ WARNING: Duplicate license names found!');
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Test 4: List all licenses
    console.log('\n\nTest 4: All licenses in database');
    console.log('-'.repeat(50));
    allLicenses.forEach(l => {
      const deletableIcon = l.isDeletable === false ? '🔒' : '🗑️';
      console.log(`${deletableIcon} ${l.name} (${l.type})`);
      console.log(`   Price: $${l.priceMonthly}/mo, $${l.priceYearly}/yr`);
      console.log(`   Limits: ${l.maxTeachers} teachers, ${l.maxStudents} students, ${l.maxClasses} classes`);
      console.log(`   Deletable: ${l.isDeletable !== false ? 'Yes' : 'No (Protected)'}`);
      console.log('');
    });

    console.log('=' .repeat(50));
    console.log('✅ All tests completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

testLicenseProtection();
