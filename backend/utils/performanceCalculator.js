/**
 * Performance Calculator for Adaptive Quiz System
 * 
 * Calculates performance scores and determines next quiz level based on:
 * - Correctness of answers
 * - Speed of answering (time bonus)
 * - Quiz difficulty level
 * 
 * Formula:
 * P = (Average of [correct? × (1 + speed_factor × (1 - time/max_time))]) × (1 + 0.2 × (difficulty - 1))
 */

// Configuration constants
const SPEED_FACTOR = 1.0; // Adjustable speed bonus multiplier
const MAX_TIME_PER_QUESTION = 90; // Maximum time per question in seconds
const MIN_QUIZ_LEVEL = 1;
const MAX_QUIZ_LEVEL = 10;

/**
 * Calculate performance score for a quiz attempt
 * 
 * @param {Array} answers - Array of answer objects with: { isCorrect, timeSpent, difficulty }
 * @param {Number} quizLevel - The difficulty level of the quiz (1-10)
 * @returns {Number} - Performance score (P)
 */
function calculatePerformanceScore(answers, quizLevel = 1) {
  if (!answers || answers.length === 0) {
    return 0;
  }

  // Calculate score for each question
  const questionScores = answers.map(answer => {
    // If answer is incorrect, score is 0
    if (!answer.isCorrect) {
      return 0;
    }

    // Base score for correct answer
    let score = 1;

    // Add speed bonus if timeSpent is provided
    if (answer.timeSpent !== undefined && answer.timeSpent !== null) {
      const timeRatio = Math.min(answer.timeSpent / MAX_TIME_PER_QUESTION, 1);
      const speedBonus = SPEED_FACTOR * (1 - timeRatio);
      score = score + speedBonus;
    }

    return score;
  });

  // Calculate average score
  const averageScore = questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length;

  // Apply difficulty multiplier based on quiz level
  // Map quiz level (1-10) to difficulty (1-5) for the formula
  // Mapping: Level 1→Diff 1, Levels 2-3→Diff 2, Levels 4-5→Diff 3, Levels 6-7→Diff 4, Levels 8-10→Diff 5
  const difficulty = Math.min(5, Math.ceil(quizLevel / 2));
  const difficultyMultiplier = 1 + 0.2 * (difficulty - 1);

  // Calculate final performance score
  const performanceScore = averageScore * difficultyMultiplier;

  return performanceScore;
}

/**
 * Determine the next quiz level based on performance score
 * 
 * Logic:
 * - If P ≤ 1.0 → go down 1 level (or repeat level 1)
 * - If 1.0 < P ≤ 1.7 → stay at current level
 * - If 1.7 < P ≤ 2.4 → go up 1 level
 * - If P > 2.4 → skip levels: next_level = current_level + 1 + floor((P - 2.4)/0.2)
 * - Cap levels between 1-10
 * 
 * @param {Number} performanceScore - Calculated performance score (P)
 * @param {Number} currentLevel - Current quiz level (1-10)
 * @returns {Number} - Next quiz level (1-10)
 */
function determineNextLevel(performanceScore, currentLevel) {
  let nextLevel;

  if (performanceScore <= 1.0) {
    // Go down 1 level, or stay at level 1
    nextLevel = Math.max(MIN_QUIZ_LEVEL, currentLevel - 1);
  } else if (performanceScore <= 1.7) {
    // Stay at current level
    nextLevel = currentLevel;
  } else if (performanceScore <= 2.4) {
    // Go up 1 level
    nextLevel = currentLevel + 1;
  } else {
    // Skip levels based on performance
    const skipAmount = Math.floor((performanceScore - 2.4) / 0.2);
    nextLevel = currentLevel + 1 + skipAmount;
  }

  // Cap between min and max levels
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
