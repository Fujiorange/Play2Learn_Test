/**
 * Check Questions in Database
 * 
 * This script checks the current state of questions in the database
 * and provides guidance on what needs to be done
 */

const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function checkQuestions() {
  console.log('🔍 Checking Question Bank Status...');
  console.log('=====================================\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Get all questions (including inactive)
    const allQuestions = await Question.find({});
    const activeQuestions = await Question.find({ is_active: true });
    const inactiveQuestions = await Question.find({ is_active: false });
    
    console.log('📊 Overall Statistics:');
    console.log('----------------------');
    console.log(`Total Questions: ${allQuestions.length}`);
    console.log(`Active Questions: ${activeQuestions.length}`);
    console.log(`Inactive Questions: ${inactiveQuestions.length}\n`);
    
    if (allQuestions.length === 0) {
      console.log('❌ NO QUESTIONS FOUND IN DATABASE!');
      console.log('\n📝 To add questions, you can:');
      console.log('   1. Run the seed script: node backend/seed-questions.js');
      console.log('   2. Add questions via the P2L Admin UI');
      console.log('   3. Upload questions via CSV\n');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    // Check active questions by difficulty
    console.log('📊 Active Questions by Difficulty:');
    console.log('-----------------------------------');
    const statsByDifficulty = {};
    for (let i = 1; i <= 5; i++) {
      const count = await Question.countDocuments({ 
        difficulty: i, 
        is_active: true 
      });
      statsByDifficulty[i] = count;
      const icon = count > 0 ? '✓' : '✗';
      console.log(`${icon} Difficulty ${i}: ${count} questions`);
    }
    
    // Check for questions without difficulty
    const noDifficulty = await Question.countDocuments({ 
      $or: [
        { difficulty: { $exists: false } },
        { difficulty: null },
        { difficulty: { $lt: 1 } },
        { difficulty: { $gt: 5 } }
      ]
    });
    
    if (noDifficulty > 0) {
      console.log(`\n⚠️  WARNING: ${noDifficulty} questions have invalid difficulty levels!`);
      console.log('   These questions will not be used in adaptive quizzes.');
    }
    
    // Show sample questions
    console.log('\n📝 Sample Questions:');
    console.log('--------------------');
    const samples = await Question.find({ is_active: true })
      .limit(3)
      .select('text difficulty is_active subject');
    
    if (samples.length > 0) {
      samples.forEach((q, idx) => {
        console.log(`${idx + 1}. [Diff ${q.difficulty}] ${q.text.substring(0, 60)}${q.text.length > 60 ? '...' : ''}`);
      });
    }
    
    // Check if quiz creation would work
    console.log('\n🎯 Quiz Creation Readiness:');
    console.log('---------------------------');
    
    // Check common quiz distributions
    const distributions = [
      { name: 'Basic (10 questions, difficulty 1-3)', dist: { 1: 3, 2: 4, 3: 3 } },
      { name: 'Medium (15 questions, difficulty 2-4)', dist: { 2: 5, 3: 5, 4: 5 } },
      { name: 'Advanced (20 questions, difficulty 3-5)', dist: { 3: 7, 4: 7, 5: 6 } }
    ];
    
    let canCreateAny = false;
    distributions.forEach(scenario => {
      let canCreate = true;
      let missing = [];
      
      for (const [diff, count] of Object.entries(scenario.dist)) {
        const available = statsByDifficulty[diff] || 0;
        if (available < count) {
          canCreate = false;
          missing.push(`D${diff}:${available}/${count}`);
        }
      }
      
      const status = canCreate ? '✓' : '✗';
      const missingStr = missing.length > 0 ? ` (Missing: ${missing.join(', ')})` : '';
      console.log(`${status} ${scenario.name}${missingStr}`);
      
      if (canCreate) canCreateAny = true;
    });
    
    console.log('\n=====================================');
    if (canCreateAny) {
      console.log('✅ You have enough questions to create adaptive quizzes!');
      console.log('   Visit the P2L Admin dashboard to create your quiz.');
    } else if (activeQuestions.length > 0) {
      console.log('⚠️  You have questions, but not enough for standard distributions.');
      console.log('   Options:');
      console.log('   1. Add more questions at specific difficulty levels');
      console.log('   2. Adjust your quiz distribution to match available questions');
      console.log('   3. Run: node backend/seed-questions.js to add sample questions');
    } else {
      console.log('❌ No active questions available for quiz creation.');
      console.log('   All questions are marked as inactive.');
      console.log('   You need to activate questions or add new ones.');
    }
    console.log('=====================================\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n=====================================');
    console.error('❌ Error:', error.message);
    console.error('=====================================\n');
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
    process.exit(1);
  }
}

// Run check
checkQuestions();
