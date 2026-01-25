/**
 * Test Question Statistics Endpoint
 * 
 * This script tests the new question statistics endpoint
 */

const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function testQuestionStats() {
  console.log('🧪 Testing Question Statistics...');
  console.log('==================================\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Count questions by difficulty
    console.log('📊 Question Statistics:');
    console.log('----------------------');
    
    const stats = {};
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const count = await Question.countDocuments({ 
        difficulty, 
        is_active: true 
      });
      stats[difficulty] = count;
      console.log(`Difficulty ${difficulty}: ${count} active questions`);
    }
    
    const totalActive = await Question.countDocuments({ is_active: true });
    const totalInactive = await Question.countDocuments({ is_active: false });
    const total = totalActive + totalInactive;
    
    console.log('----------------------');
    console.log(`Total Active: ${totalActive}`);
    console.log(`Total Inactive: ${totalInactive}`);
    console.log(`Total: ${total}\n`);
    
    if (totalActive === 0) {
      console.log('⚠️  WARNING: No active questions found!');
      console.log('   Run: node backend/seed-questions.js to add sample questions\n');
    } else {
      console.log('✅ Questions available for quiz creation\n');
    }
    
    // Test quiz creation scenario
    console.log('🎯 Testing Quiz Creation Scenario:');
    console.log('----------------------------------');
    const requiredDistribution = { 1: 10, 2: 10, 3: 10 };
    
    let canCreateQuiz = true;
    const missingQuestions = [];
    
    for (const [diff, count] of Object.entries(requiredDistribution)) {
      const available = stats[diff] || 0;
      const status = available >= count ? '✓' : '✗';
      console.log(`${status} Difficulty ${diff}: need ${count}, have ${available}`);
      
      if (available < count) {
        canCreateQuiz = false;
        missingQuestions.push({
          difficulty: diff,
          needed: count,
          available: available,
          missing: count - available
        });
      }
    }
    
    console.log('');
    if (canCreateQuiz) {
      console.log('✅ Can create quiz with distribution: ', requiredDistribution);
    } else {
      console.log('❌ Cannot create quiz. Missing questions:');
      missingQuestions.forEach(m => {
        console.log(`   Difficulty ${m.difficulty}: need ${m.needed}, have ${m.available} (missing ${m.missing})`);
      });
    }
    
    console.log('\n==================================');
    console.log('✅ Test completed!');
    console.log('==================================\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n==================================');
    console.error('❌ Test failed:', error.message);
    console.error('==================================\n');
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message);
    }
    process.exit(1);
  }
}

// Run test
testQuestionStats();
