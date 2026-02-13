#!/usr/bin/env node
/**
 * regenerate-adaptive-quizzes.js
 * 
 * Pulls ALL questions from question bank and regenerates Quiz documents
 * with full question sets for pure adaptive quiz system.
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import models
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

// Parse command line arguments
const args = process.argv.slice(2);
const skipConfirmation = args.includes('--yes') || args.includes('-y');
const levelArg = args.find(arg => arg.startsWith('--levels='));
const specificLevels = levelArg ? levelArg.split('=')[1].split(',').map(l => parseInt(l.trim())) : null;

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

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

// Regenerate quizzes
async function regenerateQuizzes() {
  console.log('\n🔄 ===== REGENERATING ADAPTIVE QUIZZES =====\n');

  const levelsToProcess = specificLevels || Array.from({ length: 10 }, (_, i) => i + 1);
  
  if (specificLevels) {
    console.log(`📋 Processing specific levels: ${specificLevels.join(', ')}`);
  } else {
    console.log('📋 Processing all 10 quiz levels');
  }

  if (!skipConfirmation) {
    console.log('\n⚠️  WARNING: This will replace existing Quiz documents with new question sets.');
    console.log('   Existing quiz attempts will continue to work (backward compatible).');
    console.log('   You may want to backup your Quiz collection first.\n');
    
    const confirmed = await askConfirmation('Do you want to proceed? (y/n): ');
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user');
      return { success: false, message: 'Cancelled by user' };
    }

    console.log('');
  }

  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  const results = [];

  for (const quizLevel of levelsToProcess) {
    try {
      console.log(`\n📝 Processing Level ${quizLevel}...`);

      // Get ALL active questions for this level
      const allQuestions = await Question.find({
        quiz_level: quizLevel,
        is_active: true
      }).lean();

      if (allQuestions.length === 0) {
        console.log(`   ⚠️  WARNING: No questions found for level ${quizLevel}`);
        warningCount++;
        results.push({
          level: quizLevel,
          status: 'warning',
          count: 0,
          message: 'No questions found'
        });
        continue;
      }

      // Check difficulty distribution
      const diffCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allQuestions.forEach(q => {
        const diff = q.difficulty || 3;
        if (diffCounts[diff] !== undefined) {
          diffCounts[diff]++;
        }
      });

      const minDiffCount = Math.min(...Object.values(diffCounts));
      if (minDiffCount < 4) {
        console.log(`   ⚠️  WARNING: Some difficulty levels have fewer than 4 questions`);
        console.log(`   Difficulty counts: ${JSON.stringify(diffCounts)}`);
      }

      // Format questions for Quiz document
      const quizQuestions = allQuestions.map(q => ({
        question_id: q._id,
        text: q.text,
        choices: q.choices || [],
        answer: q.answer,
        difficulty: q.difficulty || 3,
        topic: q.topic || 'General',
        _id: new mongoose.Types.ObjectId()
      }));

      // Update or create Quiz document
      const quizData = {
        title: `Level ${quizLevel} Adaptive Quiz`,
        description: `Pure adaptive quiz for level ${quizLevel} with ${quizQuestions.length} questions`,
        quiz_type: 'adaptive',
        quiz_level: quizLevel,
        questions: quizQuestions,
        is_adaptive: true,
        is_active: true,
        is_auto_generated: true,
        generation_criteria: 'full_question_bank',
        adaptive_config: {
          target_correct_answers: 20,
          difficulty_progression: 'immediate', // Pure adaptive mode
          starting_difficulty: 1
        },
        updatedAt: new Date()
      };

      const result = await Quiz.findOneAndUpdate(
        { 
          quiz_type: 'adaptive', 
          quiz_level: quizLevel 
        },
        { $set: quizData },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`   ✅ SUCCESS: Level ${quizLevel} quiz updated`);
      console.log(`   📊 Total questions: ${quizQuestions.length}`);
      console.log(`   📈 Difficulty distribution: ${JSON.stringify(diffCounts)}`);
      
      successCount++;
      results.push({
        level: quizLevel,
        status: 'success',
        count: quizQuestions.length,
        diffCounts,
        quizId: result._id
      });

    } catch (error) {
      console.error(`   ❌ ERROR: Failed to process level ${quizLevel}:`, error.message);
      errorCount++;
      results.push({
        level: quizLevel,
        status: 'error',
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 REGENERATION SUMMARY\n');
  console.log(`Total Levels Processed: ${levelsToProcess.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}\n`);

  if (successCount === levelsToProcess.length) {
    console.log('✨ ALL QUIZZES REGENERATED SUCCESSFULLY!');
    console.log('🎯 Pure adaptive quiz system is now ready to use.');
  } else if (successCount > 0) {
    console.log('⚠️  Some quizzes were regenerated, but there were issues with others.');
    console.log('   Check the warnings and errors above for details.');
  } else {
    console.log('❌ No quizzes were successfully regenerated.');
    console.log('   Please check your question bank and try again.');
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Test the adaptive quiz flow with a student account');
  console.log('   2. Verify different questions are served each time');
  console.log('   3. Monitor for any "running out of questions" errors\n');

  return {
    success: successCount > 0,
    results,
    stats: { successCount, warningCount, errorCount }
  };
}

// Main execution
async function main() {
  try {
    await connectDB();
    await regenerateQuizzes();
  } catch (error) {
    console.error('❌ Fatal error during regeneration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { regenerateQuizzes, connectDB };
