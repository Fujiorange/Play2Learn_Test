// Test Quiz Duplicate Prevention and Deletion
const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');
const Quiz = require('./models/Quiz');
const { generateQuiz, checkGenerationAvailability } = require('./services/quizGenerationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive-learning';

async function testDuplicatePrevention() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if we can generate a quiz
    console.log('\n📊 Test 1: Checking quiz generation availability for level 1...');
    const availability = await checkGenerationAvailability(1);
    console.log(`Level 1: ${availability.available ? '✅' : '❌'} (${availability.questionCount}/40 questions)`);

    if (!availability.available) {
      console.log('❌ Cannot run tests - insufficient questions');
      return;
    }

    // Test 2: Generate first quiz
    console.log('\n🎯 Test 2: Generating first quiz for level 1...');
    try {
      const quiz1 = await generateQuiz(1, null, 'test', false);
      console.log('✅ First quiz generated successfully!');
      console.log(`   - ID: ${quiz1._id}`);
      console.log(`   - Title: ${quiz1.title}`);
      console.log(`   - Questions: ${quiz1.questions.length}`);
      console.log(`   - Auto-generated: ${quiz1.is_auto_generated}`);

      // Test 3: Try to generate duplicate (should fail)
      console.log('\n🎯 Test 3: Attempting to generate duplicate quiz for level 1...');
      try {
        const quiz2 = await generateQuiz(1, null, 'test', false);
        console.log('❌ FAIL: Duplicate quiz was created when it should have been prevented!');
      } catch (error) {
        console.log('✅ SUCCESS: Duplicate prevented as expected');
        console.log(`   - Error message: ${error.message}`);
      }

      // Test 4: Force generation (should succeed)
      console.log('\n🎯 Test 4: Force generating quiz for level 1 (skipDuplicateCheck=true)...');
      try {
        const quiz3 = await generateQuiz(1, null, 'test-force', true);
        console.log('✅ Force generation succeeded!');
        console.log(`   - ID: ${quiz3._id}`);
        console.log(`   - Title: ${quiz3.title}`);
        
        // Clean up the force-generated quiz
        await Quiz.findByIdAndDelete(quiz3._id);
        console.log('   - Force-generated quiz cleaned up');
      } catch (error) {
        console.log('❌ FAIL: Force generation failed:', error.message);
      }

      // Test 5: Delete the quiz
      console.log('\n🎯 Test 5: Deleting auto-generated quiz...');
      const deleteResult = await Quiz.findByIdAndDelete(quiz1._id);
      if (deleteResult) {
        console.log('✅ Auto-generated quiz deleted successfully!');
      } else {
        console.log('❌ FAIL: Quiz deletion failed');
      }

      // Test 6: Verify quiz is deleted
      console.log('\n🎯 Test 6: Verifying quiz is deleted...');
      const deletedQuiz = await Quiz.findById(quiz1._id);
      if (!deletedQuiz) {
        console.log('✅ Quiz confirmed deleted from database');
      } else {
        console.log('❌ FAIL: Quiz still exists in database');
      }

      // Test 7: Generate new quiz after deletion
      console.log('\n🎯 Test 7: Generating new quiz after deletion...');
      try {
        const quiz4 = await generateQuiz(1, null, 'test-after-delete', false);
        console.log('✅ New quiz generated successfully after deletion!');
        console.log(`   - ID: ${quiz4._id}`);
        console.log(`   - Title: ${quiz4.title}`);
        
        // Final cleanup
        await Quiz.findByIdAndDelete(quiz4._id);
        console.log('   - Test quiz cleaned up');
      } catch (error) {
        console.log('❌ FAIL: Generation after deletion failed:', error.message);
      }

    } catch (error) {
      console.log('❌ Failed to generate first quiz:', error.message);
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests
testDuplicatePrevention();
