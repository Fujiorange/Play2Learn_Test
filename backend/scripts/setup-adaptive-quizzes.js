#!/usr/bin/env node
/**
 * setup-adaptive-quizzes.js
 * 
 * Combined script that runs question distribution check and then regenerates quizzes.
 * Provides a complete setup flow for the pure adaptive quiz system.
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const { analyzeQuestionDistribution, connectDB: connectForAnalysis } = require('./check-question-distribution');
const { regenerateQuizzes, connectDB: connectForRegeneration } = require('./regenerate-adaptive-quizzes');

// Ask for user confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main setup flow
async function setupAdaptiveQuizzes() {
  console.log('\n🚀 ===== PURE ADAPTIVE QUIZ SYSTEM SETUP =====\n');
  console.log('This script will:');
  console.log('  1. Analyze your question bank distribution');
  console.log('  2. Show readiness for pure adaptive quiz system');
  console.log('  3. Regenerate Quiz documents with full question sets\n');

  try {
    // Step 1: Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn');
    console.log('✅ Connected to MongoDB\n');

    // Step 2: Run question distribution analysis
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: ANALYZING QUESTION BANK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const analysis = await analyzeQuestionDistribution();

    // Step 3: Ask for confirmation
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: REGENERATE QUIZZES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (analysis.insufficientCount > 0) {
      console.log('⚠️  WARNING: Some levels have insufficient questions.');
      console.log('   The quiz system may fall back to adjacent difficulty levels.');
      console.log('   Consider adding more questions before proceeding.\n');
    }

    const confirmed = await askConfirmation('Do you want to proceed with quiz regeneration? (y/n): ');
    
    if (!confirmed) {
      console.log('\n❌ Quiz regeneration cancelled by user');
      console.log('✅ Question bank analysis completed successfully');
      return { 
        success: false, 
        message: 'Regeneration cancelled, analysis completed',
        analysis 
      };
    }

    // Step 4: Regenerate quizzes
    console.log('\n🔄 Starting quiz regeneration...\n');
    const regenerationResult = await regenerateQuizzes();

    // Step 5: Final summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ SETUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (regenerationResult.success) {
      console.log('✅ Pure Adaptive Quiz System is now ready!');
      console.log('🎯 Features enabled:');
      console.log('   • Difficulty adjusts after every answer');
      console.log('   • Full question bank available (500+ questions)');
      console.log('   • No more "running out of questions"');
      console.log('   • Different questions for each student\n');
      
      console.log('📚 System Statistics:');
      console.log(`   • Total Active Questions: ${analysis.totalQuestions}`);
      console.log(`   • Ready Levels: ${analysis.readyCount}/10`);
      console.log(`   • Quizzes Regenerated: ${regenerationResult.stats.successCount}/10\n`);
    } else {
      console.log('⚠️  Setup completed with warnings');
      console.log('   Some quizzes may not be fully ready');
      console.log('   Review the messages above for details\n');
    }

    return {
      success: regenerationResult.success,
      analysis,
      regeneration: regenerationResult
    };

  } catch (error) {
    console.error('\n❌ Setup failed with error:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Main execution
async function main() {
  try {
    const result = await setupAdaptiveQuizzes();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { setupAdaptiveQuizzes };
