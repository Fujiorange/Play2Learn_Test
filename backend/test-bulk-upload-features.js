// Test script for CSV Bulk Upload and Auto Quiz Generation features
const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');
const QuizGenerationTracking = require('./models/QuizGenerationTracking');
const { 
  checkAllCombinationsForGeneration,
  autoGenerateQuizzes 
} = require('./services/quizGenerationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testFeatures() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check question counts by combination
    console.log('\n📊 Test 1: Checking question counts by Grade/Subject/QuizLevel...');
    const combinations = await checkAllCombinationsForGeneration();
    console.log(`Found ${combinations.length} unique combinations`);
    
    // Show first 5 combinations
    console.log('\nTop 5 combinations:');
    combinations.slice(0, 5).forEach(combo => {
      console.log(`  - Grade: ${combo.grade}, Subject: ${combo.subject}, Level: ${combo.quizLevel}`);
      console.log(`    Questions: ${combo.questionCount}, Can Generate: ${combo.canGenerate ? '✅' : '❌'}`);
    });
    
    // Test 2: Check which combinations can auto-generate
    const eligibleForGeneration = combinations.filter(c => c.canGenerate && c.autoGenerationEnabled);
    console.log(`\n✅ ${eligibleForGeneration.length} combinations eligible for auto-generation`);
    
    if (eligibleForGeneration.length > 0) {
      console.log('\nEligible combinations:');
      eligibleForGeneration.forEach(combo => {
        console.log(`  - ${combo.grade} / ${combo.subject} / Level ${combo.quizLevel} (${combo.questionCount} questions)`);
      });
      
      // Test 3: Run auto-generation (commented out to avoid actually generating)
      // Uncomment the following lines to test actual quiz generation
      /*
      console.log('\n🎲 Test 3: Running auto-generation...');
      const results = await autoGenerateQuizzes();
      console.log('Generation results:', results);
      */
      
      console.log('\n⚠️  Auto-generation test skipped (uncomment in test script to run)');
    } else {
      console.log('\n⚠️  No combinations eligible for auto-generation');
      console.log('Make sure you have at least 40 questions with matching Grade, Subject, and QuizLevel');
    }
    
    // Test 4: Check models are properly defined
    console.log('\n📦 Test 4: Checking models...');
    const BulkUploadSession = require('./models/BulkUploadSession');
    const PendingCredential = require('./models/PendingCredential');
    
    console.log('  ✅ BulkUploadSession model loaded');
    console.log('  ✅ PendingCredential model loaded');
    console.log('  ✅ QuizGenerationTracking model loaded');
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testFeatures();
