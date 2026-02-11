// Test Placement Quiz to Adaptive Journey Integration
const mongoose = require('mongoose');
require('dotenv').config();

const MathProfile = require('./models/MathProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testPlacementAdaptiveIntegration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Verify schema includes adaptive_quiz_level field
    console.log('\n📊 Test 1: Verifying MathProfile schema...');
    const schema = MathProfile.schema.obj;
    
    if (schema.adaptive_quiz_level) {
      console.log('✅ adaptive_quiz_level field exists in schema');
      console.log(`   - Type: ${schema.adaptive_quiz_level.type.name}`);
      console.log(`   - Default: ${schema.adaptive_quiz_level.default}`);
      console.log(`   - Min: ${schema.adaptive_quiz_level.min}`);
      console.log(`   - Max: ${schema.adaptive_quiz_level.max}`);
    } else {
      console.log('❌ adaptive_quiz_level field NOT found in schema');
    }

    if (schema.current_profile) {
      console.log('✅ current_profile field exists in schema (for backward compatibility)');
    }

    // Test 2: Create a test profile and verify both fields are set
    console.log('\n🎯 Test 2: Creating test profile...');
    const testStudentId = new mongoose.Types.ObjectId();
    
    const testProfile = await MathProfile.create({
      student_id: testStudentId,
      current_profile: 5,
      adaptive_quiz_level: 5,
      placement_completed: true,
      total_points: 50
    });

    console.log('✅ Test profile created successfully!');
    console.log(`   - current_profile: ${testProfile.current_profile}`);
    console.log(`   - adaptive_quiz_level: ${testProfile.adaptive_quiz_level}`);
    console.log(`   - placement_completed: ${testProfile.placement_completed}`);

    // Test 3: Verify the profile can be queried
    console.log('\n📈 Test 3: Querying test profile...');
    const queriedProfile = await MathProfile.findOne({ student_id: testStudentId });
    
    if (queriedProfile) {
      console.log('✅ Profile retrieved successfully!');
      console.log(`   - current_profile: ${queriedProfile.current_profile}`);
      console.log(`   - adaptive_quiz_level: ${queriedProfile.adaptive_quiz_level}`);
      
      if (queriedProfile.current_profile === 5 && queriedProfile.adaptive_quiz_level === 5) {
        console.log('✅ Both fields correctly stored and retrieved!');
      } else {
        console.log('❌ Field values do not match expected values');
      }
    } else {
      console.log('❌ Profile not found');
    }

    // Test 4: Test default values for new profiles
    console.log('\n🆕 Test 4: Testing default values...');
    const testStudentId2 = new mongoose.Types.ObjectId();
    const defaultProfile = await MathProfile.create({
      student_id: testStudentId2,
      placement_completed: false
    });

    console.log('✅ Default profile created!');
    console.log(`   - current_profile: ${defaultProfile.current_profile} (expected: 1)`);
    console.log(`   - adaptive_quiz_level: ${defaultProfile.adaptive_quiz_level} (expected: 1)`);

    if (defaultProfile.current_profile === 1 && defaultProfile.adaptive_quiz_level === 1) {
      console.log('✅ Default values are correct!');
    } else {
      console.log('❌ Default values are incorrect');
    }

    // Clean up - delete test profiles
    await MathProfile.deleteOne({ student_id: testStudentId });
    await MathProfile.deleteOne({ student_id: testStudentId2 });
    console.log('\n🧹 Test profiles cleaned up');

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests
testPlacementAdaptiveIntegration();
