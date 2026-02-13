#!/usr/bin/env node
/**
 * check-question-distribution.js
 * 
 * Analyzes the question bank distribution across all 10 quiz levels and 5 difficulty levels.
 * Provides insights on whether each level is ready for pure adaptive quiz system.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Question = require('../models/Question');

// Status thresholds
const EXCELLENT_THRESHOLD = 10; // 10+ questions per difficulty = Excellent
const GOOD_THRESHOLD = 7;       // 7-9 questions per difficulty = Good
const WARNING_THRESHOLD = 4;    // 4-6 questions per difficulty = Warning
// Less than 4 = Insufficient

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

// Get status indicator based on question count
function getStatusIndicator(count) {
  if (count >= EXCELLENT_THRESHOLD) {
    return { icon: '✅', label: 'EXCELLENT', color: '\x1b[32m' }; // Green
  } else if (count >= GOOD_THRESHOLD) {
    return { icon: '✅', label: 'GOOD', color: '\x1b[32m' }; // Green
  } else if (count >= WARNING_THRESHOLD) {
    return { icon: '⚠️', label: 'WARNING', color: '\x1b[33m' }; // Yellow
  } else {
    return { icon: '❌', label: 'INSUFFICIENT', color: '\x1b[31m' }; // Red
  }
}

// Get overall level status based on minimum difficulty count
function getLevelStatus(diffCounts) {
  const minCount = Math.min(...Object.values(diffCounts));
  const totalCount = Object.values(diffCounts).reduce((sum, count) => sum + count, 0);
  
  if (minCount >= EXCELLENT_THRESHOLD && totalCount >= 50) {
    return { icon: '✅', label: 'EXCELLENT', color: '\x1b[32m', message: '✅ Perfect for pure adaptive quiz!' };
  } else if (minCount >= GOOD_THRESHOLD && totalCount >= 35) {
    return { icon: '✅', label: 'GOOD', color: '\x1b[32m', message: '✅ Ready for pure adaptive quiz!' };
  } else if (minCount >= WARNING_THRESHOLD && totalCount >= 20) {
    return { icon: '⚠️', label: 'WARNING', color: '\x1b[33m', message: '⚠️ May work but could have limited variety' };
  } else {
    return { icon: '❌', label: 'INSUFFICIENT', color: '\x1b[31m', message: '❌ Not enough questions for pure adaptive' };
  }
}

// Reset console color
const RESET = '\x1b[0m';

// Main analysis function
async function analyzeQuestionDistribution() {
  console.log('\n📊 ===== QUESTION BANK DISTRIBUTION ANALYSIS =====\n');

  // Get total active questions
  const totalQuestions = await Question.countDocuments({ is_active: true });
  console.log(`Total Active Questions: ${totalQuestions}\n`);

  const levelStats = [];
  let readyCount = 0;
  let warningCount = 0;
  let insufficientCount = 0;

  // Analyze each quiz level (1-10)
  for (let level = 1; level <= 10; level++) {
    // Get all active questions for this level
    const levelQuestions = await Question.find({
      quiz_level: level,
      is_active: true
    }).lean();

    const totalForLevel = levelQuestions.length;

    // Count by difficulty
    const diffCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    levelQuestions.forEach(q => {
      const diff = q.difficulty || 3;
      if (diffCounts[diff] !== undefined) {
        diffCounts[diff]++;
      }
    });

    // Count by topic (top 3)
    const topicCounts = {};
    levelQuestions.forEach(q => {
      const topic = q.topic || 'General';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => `${topic} (${count})`)
      .join(', ');

    const levelStatus = getLevelStatus(diffCounts);

    // Count levels by status
    if (levelStatus.label === 'EXCELLENT' || levelStatus.label === 'GOOD') {
      readyCount++;
    } else if (levelStatus.label === 'WARNING') {
      warningCount++;
    } else {
      insufficientCount++;
    }

    // Print level analysis
    console.log(`📋 Level ${level}: ${totalForLevel} total questions`);
    console.log(`   Difficulty Distribution:`);
    console.log(`   ├─ Diff 1 (Easiest):   ${String(diffCounts[1]).padStart(3)} questions ${getStatusIndicator(diffCounts[1]).icon}`);
    console.log(`   ├─ Diff 2 (Easy):      ${String(diffCounts[2]).padStart(3)} questions ${getStatusIndicator(diffCounts[2]).icon}`);
    console.log(`   ├─ Diff 3 (Medium):    ${String(diffCounts[3]).padStart(3)} questions ${getStatusIndicator(diffCounts[3]).icon}`);
    console.log(`   ├─ Diff 4 (Hard):      ${String(diffCounts[4]).padStart(3)} questions ${getStatusIndicator(diffCounts[4]).icon}`);
    console.log(`   └─ Diff 5 (Hardest):   ${String(diffCounts[5]).padStart(3)} questions ${getStatusIndicator(diffCounts[5]).icon}`);
    
    if (topTopics) {
      console.log(`   Top Topics: ${topTopics}`);
    }
    
    console.log(`   Status: ${levelStatus.color}${levelStatus.icon} ${levelStatus.label}${RESET}`);
    console.log(`   ${levelStatus.message}\n`);

    levelStats.push({
      level,
      total: totalForLevel,
      diffCounts,
      status: levelStatus.label,
      topTopics
    });
  }

  // Print overall summary
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 OVERALL SUMMARY\n');
  console.log(`Total Levels: 10`);
  console.log(`\x1b[32m✅ Ready for Pure Adaptive: ${readyCount} levels${RESET}`);
  console.log(`\x1b[33m⚠️  Limited Variety: ${warningCount} levels${RESET}`);
  console.log(`\x1b[31m❌ Insufficient Questions: ${insufficientCount} levels${RESET}\n`);

  if (readyCount >= 8) {
    console.log('\x1b[32m✨ EXCELLENT: Most levels are ready for pure adaptive quiz system!${RESET}');
  } else if (readyCount >= 5) {
    console.log('\x1b[33m⚠️  FAIR: Some levels may need more questions for optimal variety${RESET}');
  } else {
    console.log('\x1b[31m❌ INSUFFICIENT: Many levels need more questions before enabling pure adaptive${RESET}');
  }

  console.log('\n💡 Recommendations:');
  console.log('   • Pure adaptive works best with 10+ questions per difficulty level');
  console.log('   • Minimum 4 questions per difficulty to avoid excessive reuse');
  console.log('   • Each level should have 40-60 questions total for best variety\n');

  return { levelStats, readyCount, warningCount, insufficientCount, totalQuestions };
}

// Main execution
async function main() {
  try {
    await connectDB();
    await analyzeQuestionDistribution();
  } catch (error) {
    console.error('❌ Error during analysis:', error);
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

module.exports = { analyzeQuestionDistribution, connectDB };
