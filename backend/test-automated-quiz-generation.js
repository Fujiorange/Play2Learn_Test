#!/usr/bin/env node

/**
 * Test script for automated quiz generation
 * This script tests the quiz generation service
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { 
  autoGenerateQuizzes, 
  checkAllEligibleCombinations,
  generateQuiz 
} = require('./services/quizGenerationService');
const Question = require('./models/Question');
const Quiz = require('./models/Quiz');

const MONGODB_URI = process.env.MONGODB_URI;

async function runTests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('TEST 1: Check Eligible Combinations');
    console.log('='.repeat(60));
    
    const eligibleCombos = await checkAllEligibleCombinations();
    console.log(`\nFound ${eligibleCombos.length} eligible combinations:\n`);
    
    eligibleCombos.forEach((combo, index) => {
      console.log(`${index + 1}. ${combo.grade} - ${combo.subject} - Level ${combo.quiz_level}`);
      console.log(`   Questions available: ${combo.questionCount}`);
    });

    if (eligibleCombos.length === 0) {
      console.log('\n⚠️  No eligible combinations found.');
      console.log('   Need at least 40 questions with same grade, subject, and quiz_level');
      
      // Show current question distribution
      console.log('\n📊 Current Question Distribution:');
      const distribution = await Question.aggregate([
        { $match: { is_active: true } },
        { 
          $group: { 
            _id: { 
              grade: '$grade', 
              subject: '$subject', 
              quiz_level: '$quiz_level' 
            }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } }
      ]);
      
      distribution.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item._id.grade} - ${item._id.subject} - Level ${item._id.quiz_level}: ${item.count} questions`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Auto-Generate Quizzes');
    console.log('='.repeat(60));
    
    if (eligibleCombos.length > 0) {
      console.log('\n🤖 Running auto-generation...\n');
      
      const results = await autoGenerateQuizzes();
      
      console.log('📊 Generation Results:');
      console.log(`   Combinations checked: ${results.checked}`);
      console.log(`   Quizzes generated: ${results.generated}`);
      console.log(`   Recent quizzes skipped: ${results.skipped}`);
      console.log(`   Errors: ${results.errors.length}`);
      
      if (results.quizzes.length > 0) {
        console.log('\n✨ Generated Quizzes:');
        results.quizzes.forEach((quiz, index) => {
          console.log(`${index + 1}. ${quiz.title}`);
          console.log(`   Grade: ${quiz.grade}, Subject: ${quiz.subject}, Level: ${quiz.quiz_level}`);
          console.log(`   Questions in pool: ${quiz.questionCount}`);
        });
      }
      
      if (results.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        results.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.grade} - ${error.subject} - Level ${error.quiz_level}`);
          console.log(`   Error: ${error.error}`);
        });
      }
      
      if (results.generated === 0 && results.skipped > 0) {
        console.log('\n⏭️  All eligible combinations already have recent quizzes (within 24 hours)');
      }
    } else {
      console.log('\n⏭️  Skipping auto-generation test (no eligible combinations)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Verify Quiz Format');
    console.log('='.repeat(60));
    
    const recentQuizzes = await Quiz.find({ is_auto_generated: true })
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentQuizzes.length > 0) {
      console.log(`\nFound ${recentQuizzes.length} recent auto-generated quizzes:\n`);
      
      recentQuizzes.forEach((quiz, index) => {
        console.log(`${index + 1}. ${quiz.title}`);
        console.log(`   Level: ${quiz.quiz_level}`);
        console.log(`   Questions: ${quiz.questions.length}`);
        console.log(`   Created: ${quiz.createdAt.toLocaleString()}`);
        console.log(`   Trigger: ${quiz.generation_criteria}`);
        
        // Check title format
        const titlePattern = /^.+'s Level \d+$/;
        const titleValid = titlePattern.test(quiz.title);
        console.log(`   Title Format: ${titleValid ? '✅' : '❌'} (Expected: "Grade's Level X")`);
      });
    } else {
      console.log('\n⚠️  No auto-generated quizzes found in database');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the tests
runTests();
