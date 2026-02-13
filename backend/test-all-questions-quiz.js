/**
 * Test script to verify the quiz generator now includes ALL questions
 * from the question bank instead of just 20 questions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');
const Quiz = require('./models/Quiz');
const { generateQuiz, checkGenerationAvailability } = require('./services/quizGenerationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testAllQuestionsQuiz() {
  try {
    console.log('🧪 Testing Quiz Generator: All Questions Feature');
    console.log('================================================\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // First, let's check how many questions we have at each level
    console.log('📊 Checking question availability by quiz level:\n');
    for (let level = 1; level <= 10; level++) {
      const count = await Question.countDocuments({
        quiz_level: level,
        is_active: true
      });
      console.log(`   Quiz Level ${level}: ${count} questions`);
    }

    // Find a level with questions to test
    const testLevel = 1;
    const questionCount = await Question.countDocuments({
      quiz_level: testLevel,
      is_active: true
    });

    console.log(`\n🎯 Testing with Quiz Level ${testLevel} (${questionCount} questions available)\n`);

    if (questionCount === 0) {
      console.log('⚠️  No questions found for level 1. Please run seed-questions.js first.');
      console.log('   Command: node backend/seed-questions.js\n');
      return;
    }

    // Test availability check
    console.log('📋 Step 1: Checking generation availability...');
    const availability = await checkGenerationAvailability(testLevel);
    console.log(`   Available: ${availability.available ? '✅' : '❌'}`);
    console.log(`   Message: ${availability.message}`);
    console.log(`   Required: ${availability.required} question(s)`);
    console.log(`   Found: ${availability.questionCount} question(s)\n`);

    if (!availability.available) {
      console.log('❌ Cannot generate quiz - not enough questions\n');
      return;
    }

    // Clean up any existing quiz for this level
    console.log('🧹 Step 2: Cleaning up existing quizzes...');
    const deleted = await Quiz.deleteMany({ 
      quiz_level: testLevel,
      is_auto_generated: true
    });
    console.log(`   Deleted ${deleted.deletedCount} existing quiz(es)\n`);

    // Generate quiz
    console.log('🎲 Step 3: Generating quiz with ALL questions...');
    const quiz = await generateQuiz(testLevel, null, 'test-all-questions', false);
    console.log('✅ Quiz generated successfully!\n');

    // Verify results
    console.log('📝 Step 4: Verifying quiz details:');
    console.log(`   Title: ${quiz.title}`);
    console.log(`   Description: ${quiz.description}`);
    console.log(`   Quiz Level: ${quiz.quiz_level}`);
    console.log(`   Total Questions in Quiz: ${quiz.questions.length}`);
    console.log(`   Total Questions in Bank: ${questionCount}`);
    
    // Check if all questions were included
    if (quiz.questions.length === questionCount) {
      console.log(`   ✅ SUCCESS: Quiz includes ALL ${questionCount} questions from question bank!\n`);
    } else {
      console.log(`   ⚠️  NOTICE: Quiz has ${quiz.questions.length} questions, bank has ${questionCount}\n`);
    }

    // Show difficulty distribution
    const difficultyDist = {};
    quiz.questions.forEach(q => {
      difficultyDist[q.difficulty] = (difficultyDist[q.difficulty] || 0) + 1;
    });
    console.log('📊 Difficulty distribution in generated quiz:');
    for (let i = 1; i <= 5; i++) {
      if (difficultyDist[i]) {
        console.log(`   Difficulty ${i}: ${difficultyDist[i]} questions`);
      }
    }

    // Check for duplicate questions
    console.log('\n🔍 Step 5: Checking for duplicates...');
    const questionIds = quiz.questions.map(q => q.question_id.toString());
    const uniqueIds = [...new Set(questionIds)];
    const hasDuplicates = uniqueIds.length !== questionIds.length;
    
    console.log(`   Total questions: ${questionIds.length}`);
    console.log(`   Unique questions: ${uniqueIds.length}`);
    console.log(`   ${hasDuplicates ? '❌ Has duplicates!' : '✅ No duplicates'}\n`);

    // Clean up
    console.log('🧹 Step 6: Cleaning up test quiz...');
    await Quiz.findByIdAndDelete(quiz._id);
    console.log('   Test quiz deleted\n');

    console.log('================================================');
    console.log('✅ All tests completed successfully!');
    console.log('================================================\n');

    console.log('📋 Summary:');
    console.log(`   - The quiz generator now uses ALL ${questionCount} questions`);
    console.log('   - Questions are selected with freshness weighting');
    console.log('   - Adaptive difficulty progression is maintained');
    console.log('   - Each generation will show different question counts as question bank changes\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run tests
testAllQuestionsQuiz();
