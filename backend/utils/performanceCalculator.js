/**
 * Performance Calculator for Adaptive Quiz System
 * 
 * Calculates performance scores and determines next quiz level based on:
 * - Accuracy (correct answers ratio)
 * - Speed of answering (time bonus)
 * - Quiz difficulty level
 * 
 * New Formula:
 * accuracy = correct_answers / total_questions
 * time_factor = max(0, 1 - (time / max_time))
 * speed_bonus = speed_factor × time_factor
 * base_score = accuracy × (1 + speed_bonus)
 * difficulty_multiplier = 1 + 0.2 × (difficulty - 1)
 * P = base_score × difficulty_multiplier
 */

// Configuration constants
const SPEED_FACTOR = 0.5; // Adjustable coefficient for speed bonus
const MAX_TIME_PER_QUESTION = 90; // Maximum time per question in seconds
const MIN_QUIZ_LEVEL = 1;
const MAX_QUIZ_LEVEL = 10;

/**
 * Calculate performance score for a quiz attempt
 * 
 * @param {Array} correct - Array of booleans indicating correct answers
 * @param {Number} time - Total time taken in seconds
 * @param {Number} max_time - Maximum allowed time for quiz
 * @param {Number} difficulty - Quiz difficulty level (1-10)
 * @returns {Number} - Performance score (P)
 */
function calculatePerformanceScore(correct, time, max_time, difficulty) {
  if (!correct || correct.length === 0) {
    return 0;
  }

  // Calculate accuracy
  const correctAnswers = correct.filter(Boolean).length;
  const totalQuestions = correct.length;
  const accuracy = correctAnswers / totalQuestions;

  // Calculate time factor and speed bonus
  const time_factor = Math.max(0, 1 - (time / max_time));
  const speed_bonus = SPEED_FACTOR * time_factor;

  // Calculate base score
  const base_score = accuracy * (1 + speed_bonus);

  // Apply difficulty multiplier
  const difficulty_multiplier = 1 + 0.2 * (difficulty - 1);

  // Calculate final performance score
  const P = base_score * difficulty_multiplier;

  return P;
}

/**
 * Legacy function for backward compatibility
 * Converts old answer format to new format
 * 
 * @param {Array} answers - Array of answer objects with: { isCorrect, timeSpent }
 * @param {Number} quizLevel - The difficulty level of the quiz (1-10)
 * @returns {Number} - Performance score (P)
 */
function calculatePerformanceScoreLegacy(answers, quizLevel = 1) {
  if (!answers || answers.length === 0) {
    return 0;
  }

  // Convert to new format
  const correct = answers.map(a => a.isCorrect);
  const totalTime = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const max_time = answers.length * MAX_TIME_PER_QUESTION;

  return calculatePerformanceScore(correct, totalTime, max_time, quizLevel);
}

/**
 * Determine the next quiz level based on performance score
 * 
 * Logic with 2-level skip cap enforcement:
 * - If P ≤ 1.0 → go down 1 level (minimum level 1)
 * - If 1.0 < P ≤ 1.7 → stay at current level
 * - If 1.7 < P ≤ 2.4 → go up 1 level
 * - If P > 2.4 → skip levels with MAX 2-level cap
 * 
 * CRITICAL: Student cannot jump more than 2 levels from current position
 * Example: Level 1 → Max Level 3, Level 2 → Max Level 4, etc.
 * 
 * @param {Number} performanceScore - Calculated performance score (P)
 * @param {Number} currentLevel - Current quiz level (1-10)
 * @returns {Number} - Next quiz level (1-10)
 */
function determineNextLevel(performanceScore, currentLevel) {
  let nextLevel = currentLevel;

  if (performanceScore <= 1.0) {
    // Go down 1 level (minimum level 1)
    nextLevel = Math.max(MIN_QUIZ_LEVEL, currentLevel - 1);
  } else if (performanceScore <= 1.7) {
    // Stay at current level
    nextLevel = currentLevel;
  } else if (performanceScore <= 2.4) {
    // Go up 1 level
    nextLevel = Math.min(MAX_QUIZ_LEVEL, currentLevel + 1);
  } else {
    // Skip levels with MAX 2-level skip cap
    // P = 2.5: extra = 0, skip = 1 level up
    // P = 2.7: extra = 1, skip = 2 levels up
    // P >= 2.8: extra >= 2, skip = 2 levels up (capped)
    const extra_levels = Math.floor((performanceScore - 2.4) / 0.2);
    const skip_amount = Math.min(2, extra_levels + 1); // Start at +1, cap at +2
    nextLevel = Math.min(MAX_QUIZ_LEVEL, currentLevel + skip_amount);
  }

  // ENSURE: Student cannot jump more than 2 levels from their current position
  const maxAllowedLevel = Math.min(MAX_QUIZ_LEVEL, currentLevel + 2);
  nextLevel = Math.min(nextLevel, maxAllowedLevel);

  // Final boundary check
  nextLevel = Math.min(MAX_QUIZ_LEVEL, Math.max(MIN_QUIZ_LEVEL, nextLevel));

  return nextLevel;
}

/**
 * Calculate average time spent per question
 * 
 * @param {Array} answers - Array of answer objects with timeSpent field
 * @returns {Number} - Average time in seconds
 */
function calculateAverageTime(answers) {
  if (!answers || answers.length === 0) {
    return 0;
  }

  const timesWithData = answers.filter(a => a.timeSpent !== undefined && a.timeSpent !== null);
  
  if (timesWithData.length === 0) {
    return 0;
  }

  const totalTime = timesWithData.reduce((sum, answer) => sum + answer.timeSpent, 0);
  return totalTime / timesWithData.length;
}

/**
 * Calculate total time spent on quiz
 * 
 * @param {Array} answers - Array of answer objects with timeSpent field
 * @returns {Number} - Total time in seconds
 */
function calculateTotalTime(answers) {
  if (!answers || answers.length === 0) {
    return 0;
  }

  return answers.reduce((sum, answer) => {
    if (answer.timeSpent !== undefined && answer.timeSpent !== null) {
      return sum + answer.timeSpent;
    }
    return sum;
  }, 0);
}

/**
 * Get a performance rating label based on score
 * 
 * @param {Number} performanceScore - Performance score
 * @returns {String} - Rating label
 */
function getPerformanceRating(performanceScore) {
  if (performanceScore <= 1.0) {
    return 'Needs Improvement';
  } else if (performanceScore <= 1.7) {
    return 'Good';
  } else if (performanceScore <= 2.4) {
    return 'Very Good';
  } else {
    return 'Excellent';
  }
}

module.exports = {
  calculatePerformanceScore,
  calculatePerformanceScoreLegacy,
  determineNextLevel,
  calculateAverageTime,
  calculateTotalTime,
  getPerformanceRating,
  // Export constants for testing and configuration
  SPEED_FACTOR,
  MAX_TIME_PER_QUESTION,
  MIN_QUIZ_LEVEL,
  MAX_QUIZ_LEVEL
};
