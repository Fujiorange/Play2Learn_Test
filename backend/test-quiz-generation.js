// Test Quiz Generation Service
const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');
const Quiz = require('./models/Quiz');
const { generateQuiz, checkGenerationAvailability } = require('./services/quizGenerationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive-learning';

async function testQuizGeneration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check availability
    console.log('\n📊 Test 1: Checking quiz generation availability...');
    for (let level = 1; level <= 10; level++) {
      const availability = await checkGenerationAvailability(level);
      console.log(`Level ${level}: ${availability.available ? '✅' : '❌'} (${availability.questionCount} questions available)`);
    }

    // Test 2: Try to generate a quiz for level 1
    console.log('\n🎯 Test 2: Generating quiz for level 1...');
    try {
      const quiz = await generateQuiz(1, null, 'test');
      console.log('✅ Quiz generated successfully!');
      console.log(`   - Title: ${quiz.title}`);
      console.log(`   - Questions: ${quiz.questions.length}`);
      console.log(`   - Quiz Level: ${quiz.quiz_level}`);
      console.log(`   - Auto-generated: ${quiz.is_auto_generated}`);
      console.log(`   - Unique Hash: ${quiz.unique_hash}`);
      console.log(`   - Generation Criteria: ${quiz.generation_criteria}`);
      
      // Show difficulty distribution
      const difficultyDist = {};
      quiz.questions.forEach(q => {
        difficultyDist[q.difficulty] = (difficultyDist[q.difficulty] || 0) + 1;
      });
      console.log(`   - Difficulty distribution:`, difficultyDist);
      
      // Check for duplicates
      const questionIds = quiz.questions.map(q => q.question_id.toString());
      const uniqueIds = [...new Set(questionIds)];
      const expectedCount = quiz.questions.length;
      console.log(`   - Unique questions: ${uniqueIds.length}/${expectedCount} ${uniqueIds.length === expectedCount ? '✅' : '❌'}`);
      
      // Test 3: Check question usage tracking
      console.log('\n📈 Test 3: Checking question usage tracking...');
      const sampleQuestion = await Question.findById(quiz.questions[0].question_id);
      console.log(`   - Sample question usage_count: ${sampleQuestion.usage_count}`);
      console.log(`   - Sample question last_used_timestamp: ${sampleQuestion.last_used_timestamp}`);
      
      // Clean up - delete test quiz
      await Quiz.findByIdAndDelete(quiz._id);
      console.log('\n🧹 Test quiz cleaned up');
      
    } catch (error) {
      console.log('❌ Failed to generate quiz:', error.message);
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
testQuizGeneration();
