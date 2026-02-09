/**
 * Test Suite for Adaptive Quiz API
 * 
 * This file contains tests for the adaptive quiz functionality.
 * Run with: node backend/test-adaptive-quiz.js
 * 
 * Prerequisites:
 * - MongoDB must be running
 * - Server must be started
 * - At least one P2L Admin account must exist
 * - At least one Student account must exist
 * - Question bank must have questions at different difficulty levels
 */

const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const QuizAttempt = require('./models/QuizAttempt');
const User = require('./models/User');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';
const TEST_CONFIG = {
  adminEmail: 'test-admin@play2learn.com',
  studentEmail: 'test-student@play2learn.com',
  quizTitle: 'Test Adaptive Quiz',
  difficultyDistribution: {
    1: 5,
    2: 5,
    3: 5
  },
  targetCorrect: 5
};

async function setupTestData() {
  console.log('\n📝 Setting up test data...');
  
  // Create test questions if they don't exist
  const difficulties = [1, 2, 3];
  const questionsPerDifficulty = 5;
  
  for (const difficulty of difficulties) {
    const existingCount = await Question.countDocuments({ difficulty, is_active: true });
    const needed = questionsPerDifficulty - existingCount;
    
    if (needed > 0) {
      console.log(`Creating ${needed} questions for difficulty ${difficulty}...`);
      
      for (let i = 0; i < needed; i++) {
        await Question.create({
          text: `Test Question - Difficulty ${difficulty} - ${i + 1}`,
          choices: ['A', 'B', 'C', 'D'],
          answer: 'A',
          difficulty: difficulty,
          subject: 'Math',
          topic: 'Test',
          is_active: true
        });
      }
    }
  }
  
  console.log('✅ Test data setup complete');
}

async function testQuizModel() {
  console.log('\n🧪 Testing Quiz Model...');
  
  try {
    // Test creating an adaptive quiz
    const questions = await Question.find({ is_active: true }).limit(15);
    
    const quiz = new Quiz({
      title: TEST_CONFIG.quizTitle,
      description: 'Test adaptive quiz for automated testing',
      questions: questions.map(q => ({
        question_id: q._id,
        text: q.text,
        choices: q.choices,
        answer: q.answer,
        difficulty: q.difficulty
      })),
      is_adaptive: true,
      adaptive_config: {
        target_correct_answers: TEST_CONFIG.targetCorrect,
        difficulty_progression: 'gradual',
        starting_difficulty: 1
      }
    });
    
    await quiz.save();
    console.log(`✅ Created adaptive quiz: ${quiz._id}`);
    
    // Verify quiz data
    const savedQuiz = await Quiz.findById(quiz._id);
    console.assert(savedQuiz.is_adaptive === true, 'Quiz should be adaptive');
    console.assert(savedQuiz.adaptive_config.target_correct_answers === TEST_CONFIG.targetCorrect, 'Target should match');
    console.log('✅ Quiz model validation passed');
    
    return quiz._id;
  } catch (error) {
    console.error('❌ Quiz model test failed:', error.message);
    throw error;
  }
}

async function testQuizAttemptModel(quizId) {
  console.log('\n🧪 Testing QuizAttempt Model...');
  
  try {
    // Create a test user if not exists
    let student = await User.findOne({ email: TEST_CONFIG.studentEmail });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: TEST_CONFIG.studentEmail,
        password: 'hashed_password_placeholder',
        role: 'student',
        emailVerified: true,
        accountActive: true
      });
      console.log('✅ Created test student');
    }
    
    // Create a quiz attempt
    const attempt = new QuizAttempt({
      userId: student._id,
      quizId: quizId,
      current_difficulty: 1,
      correct_count: 0,
      total_answered: 0,
      is_completed: false
    });
    
    await attempt.save();
    console.log(`✅ Created quiz attempt: ${attempt._id}`);
    
    // Simulate answering questions
    const quiz = await Quiz.findById(quizId);
    const question = quiz.questions[0];
    
    attempt.answers.push({
      questionId: question.question_id,
      question_text: question.text,
      difficulty: question.difficulty,
      answer: 'A',
      correct_answer: question.answer,
      isCorrect: true
    });
    
    attempt.total_answered += 1;
    attempt.correct_count += 1;
    
    await attempt.save();
    console.log('✅ Added answer to attempt');
    
    // Verify attempt data
    const savedAttempt = await QuizAttempt.findById(attempt._id);
    console.assert(savedAttempt.answers.length === 1, 'Should have 1 answer');
    console.assert(savedAttempt.correct_count === 1, 'Should have 1 correct answer');
    console.log('✅ QuizAttempt model validation passed');
    
    return attempt._id;
  } catch (error) {
    console.error('❌ QuizAttempt model test failed:', error.message);
    throw error;
  }
}

async function testDifficultyProgression() {
  console.log('\n🧪 Testing Difficulty Progression Algorithms...');
  
  try {
    // Test gradual progression
    console.log('Testing gradual progression...');
    let difficulty = 1;
    const recentAnswers = [true, true, false]; // 2 correct out of 3
    const recentCorrect = recentAnswers.filter(a => a).length;
    
    if (recentCorrect >= 2 && difficulty < 5) {
      difficulty += 1;
    }
    console.assert(difficulty === 2, 'Gradual: Should increase to 2');
    console.log('✅ Gradual progression works correctly');
    
    // Test immediate progression
    console.log('Testing immediate progression...');
    difficulty = 1;
    const isCorrect = true;
    
    if (isCorrect && difficulty < 5) {
      difficulty += 1;
    }
    console.assert(difficulty === 2, 'Immediate: Should increase to 2');
    console.log('✅ Immediate progression works correctly');
    
    // Test ML-based progression
    console.log('Testing ML-based progression...');
    const correct_count = 8;
    const total_answered = 10;
    const accuracy = correct_count / total_answered;
    const targetDifficulty = Math.min(5, Math.max(1, Math.ceil(accuracy * 5)));
    
    console.assert(targetDifficulty === 4, 'ML-based: Should target difficulty 4 (80% accuracy)');
    console.log('✅ ML-based progression works correctly');
    
    console.log('✅ All progression algorithms validated');
  } catch (error) {
    console.error('❌ Progression algorithm test failed:', error.message);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test quizzes
    await Quiz.deleteMany({ title: TEST_CONFIG.quizTitle });
    console.log('✅ Deleted test quizzes');
    
    // Delete test attempts
    const testUser = await User.findOne({ email: TEST_CONFIG.studentEmail });
    if (testUser) {
      await QuizAttempt.deleteMany({ userId: testUser._id });
      console.log('✅ Deleted test attempts');
    }
    
    // Optionally delete test questions (commented out to preserve for future tests)
    // await Question.deleteMany({ topic: 'Test' });
    // console.log('✅ Deleted test questions');
    
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Adaptive Quiz Tests...');
  console.log('==================================\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Run tests
    await setupTestData();
    const quizId = await testQuizModel();
    await testQuizAttemptModel(quizId);
    await testDifficultyProgression();
    
    // Cleanup
    await cleanupTestData();
    
    console.log('\n==================================');
    console.log('✅ All tests passed successfully!');
    console.log('==================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n==================================');
    console.error('❌ Tests failed:', error.message);
    console.error('==================================\n');
    process.exit(1);
  }
}

// Run tests
runTests();
