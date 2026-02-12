/**
 * Test script for performance calculator
 * Run with: node test-performance-calculator.js
 */

const {
  calculatePerformanceScore,
  determineNextLevel,
  calculateAverageTime,
  calculateTotalTime,
  getPerformanceRating,
  MAX_TIME_PER_QUESTION
} = require('./utils/performanceCalculator');

console.log('🧪 Testing Performance Calculator\n');

// Test Case 1: Perfect score with fast answers (all correct, all under 30 seconds)
console.log('Test Case 1: Perfect Score - Fast Answers');
console.log('Scenario: 20 correct answers, avg 25 seconds each, quiz level 1');
const testCase1 = Array(20).fill(null).map(() => ({
  isCorrect: true,
  timeSpent: 25
}));
const score1 = calculatePerformanceScore(testCase1, 1);
const nextLevel1 = determineNextLevel(score1, 1);
const avgTime1 = calculateAverageTime(testCase1);
const rating1 = getPerformanceRating(score1);
console.log(`  Performance Score: ${score1.toFixed(2)}`);
console.log(`  Rating: ${rating1}`);
console.log(`  Current Level: 1 → Next Level: ${nextLevel1}`);
console.log(`  Average Time: ${avgTime1.toFixed(1)}s`);
console.log(`  Expected: Score > 2.4, Next Level should be 4+\n`);

// Test Case 2: Average performance
console.log('Test Case 2: Average Performance');
console.log('Scenario: 15/20 correct, avg 45 seconds each, quiz level 3');
const testCase2 = [
  ...Array(15).fill(null).map(() => ({ isCorrect: true, timeSpent: 45 })),
  ...Array(5).fill(null).map(() => ({ isCorrect: false, timeSpent: 60 }))
];
const score2 = calculatePerformanceScore(testCase2, 3);
const nextLevel2 = determineNextLevel(score2, 3);
const avgTime2 = calculateAverageTime(testCase2);
const rating2 = getPerformanceRating(score2);
console.log(`  Performance Score: ${score2.toFixed(2)}`);
console.log(`  Rating: ${rating2}`);
console.log(`  Current Level: 3 → Next Level: ${nextLevel2}`);
console.log(`  Average Time: ${avgTime2.toFixed(1)}s`);
console.log(`  Expected: Score between 1.0-1.7, Next Level should be 3-4\n`);

// Test Case 3: Poor performance
console.log('Test Case 3: Poor Performance');
console.log('Scenario: 8/20 correct, slow answers (70s avg), quiz level 5');
const testCase3 = [
  ...Array(8).fill(null).map(() => ({ isCorrect: true, timeSpent: 70 })),
  ...Array(12).fill(null).map(() => ({ isCorrect: false, timeSpent: 80 }))
];
const score3 = calculatePerformanceScore(testCase3, 5);
const nextLevel3 = determineNextLevel(score3, 5);
const avgTime3 = calculateAverageTime(testCase3);
const rating3 = getPerformanceRating(score3);
console.log(`  Performance Score: ${score3.toFixed(2)}`);
console.log(`  Rating: ${rating3}`);
console.log(`  Current Level: 5 → Next Level: ${nextLevel3}`);
console.log(`  Average Time: ${avgTime3.toFixed(1)}s`);
console.log(`  Expected: Score ≤ 1.0, Next Level should be 4\n`);

// Test Case 4: Edge case - Level 1 poor performance
console.log('Test Case 4: Edge Case - Level 1 Cannot Go Below');
console.log('Scenario: 5/20 correct, level 1');
const testCase4 = [
  ...Array(5).fill(null).map(() => ({ isCorrect: true, timeSpent: 60 })),
  ...Array(15).fill(null).map(() => ({ isCorrect: false, timeSpent: 70 }))
];
const score4 = calculatePerformanceScore(testCase4, 1);
const nextLevel4 = determineNextLevel(score4, 1);
const rating4 = getPerformanceRating(score4);
console.log(`  Performance Score: ${score4.toFixed(2)}`);
console.log(`  Rating: ${rating4}`);
console.log(`  Current Level: 1 → Next Level: ${nextLevel4}`);
console.log(`  Expected: Next Level should stay at 1 (cannot go below)\n`);

// Test Case 5: Edge case - Level 10 excellent performance
console.log('Test Case 5: Edge Case - Level 10 Cannot Go Above');
console.log('Scenario: 20/20 correct, very fast, level 10');
const testCase5 = Array(20).fill(null).map(() => ({
  isCorrect: true,
  timeSpent: 15
}));
const score5 = calculatePerformanceScore(testCase5, 10);
const nextLevel5 = determineNextLevel(score5, 10);
const rating5 = getPerformanceRating(score5);
console.log(`  Performance Score: ${score5.toFixed(2)}`);
console.log(`  Rating: ${rating5}`);
console.log(`  Current Level: 10 → Next Level: ${nextLevel5}`);
console.log(`  Expected: Next Level should stay at 10 (cannot go above)\n`);

// Test Case 6: Mixed speed performance
console.log('Test Case 6: Mixed Speed Performance');
console.log('Scenario: 18/20 correct, varied times, level 6');
const testCase6 = [
  ...Array(10).fill(null).map(() => ({ isCorrect: true, timeSpent: 20 })), // Fast
  ...Array(8).fill(null).map(() => ({ isCorrect: true, timeSpent: 70 })),  // Slow
  ...Array(2).fill(null).map(() => ({ isCorrect: false, timeSpent: 50 }))
];
const score6 = calculatePerformanceScore(testCase6, 6);
const nextLevel6 = determineNextLevel(score6, 6);
const totalTime6 = calculateTotalTime(testCase6);
const avgTime6 = calculateAverageTime(testCase6);
const rating6 = getPerformanceRating(score6);
console.log(`  Performance Score: ${score6.toFixed(2)}`);
console.log(`  Rating: ${rating6}`);
console.log(`  Current Level: 6 → Next Level: ${nextLevel6}`);
console.log(`  Total Time: ${Math.floor(totalTime6 / 60)}m ${totalTime6 % 60}s`);
console.log(`  Average Time: ${avgTime6.toFixed(1)}s`);
console.log(`  Expected: Score between 1.7-2.4, Next Level should be 7\n`);

// Test the formula breakdown for understanding
console.log('📊 Formula Breakdown Example:');
console.log('Formula: P = (Avg of [correct × (1 + speed_factor × (1 - time/max_time))]) × (1 + 0.2 × (difficulty - 1))');
console.log('\nExample: 1 correct answer, 30 seconds, level 5');
const timeRatio = 30 / MAX_TIME_PER_QUESTION;
const speedBonus = 1.0 * (1 - timeRatio);
const questionScore = 1 + speedBonus;
const difficulty = Math.min(5, Math.ceil(5 / 2)); // level 5 maps to difficulty 3
const difficultyMultiplier = 1 + 0.2 * (difficulty - 1);
const finalScore = questionScore * difficultyMultiplier;
console.log(`  Time ratio: ${timeRatio.toFixed(2)} (${30}s / ${MAX_TIME_PER_QUESTION}s)`);
console.log(`  Speed bonus: ${speedBonus.toFixed(2)}`);
console.log(`  Question score: ${questionScore.toFixed(2)}`);
console.log(`  Quiz difficulty (mapped): ${difficulty}`);
console.log(`  Difficulty multiplier: ${difficultyMultiplier.toFixed(2)}`);
console.log(`  Final score: ${finalScore.toFixed(2)}`);

console.log('\n✅ All tests completed!');
console.log('\nLevel Decision Logic:');
console.log('  P ≤ 1.0: Go down 1 level (or stay at 1)');
console.log('  1.0 < P ≤ 1.7: Stay at current level');
console.log('  1.7 < P ≤ 2.4: Go up 1 level');
console.log('  P > 2.4: Skip levels (current + 1 + floor((P - 2.4) / 0.2))');
console.log('  Levels capped between 1-10');
