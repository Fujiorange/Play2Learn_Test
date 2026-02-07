const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

/**
 * Auto-generate all quiz levels (0-20) with 40 questions each
 * Questions are selected from the question bank filtered by:
 * - quiz_level matches target quiz level
 * - Subject = 'Mathematics'
 * - Variety of difficulty_level (1-10)
 */
async function autoGenerateAllQuizzes() {
  const results = {
    success: [],
    warnings: [],
    errors: []
  };

  console.log('Starting automated quiz generation for all levels (0-20)...');

  for (let level = 0; level <= 20; level++) {
    try {
      const result = await generateQuizForLevel(level);
      
      if (result.success) {
        results.success.push({
          level,
          quizId: result.quizId,
          questionCount: result.questionCount
        });
        console.log(`✓ Quiz level ${level} generated successfully with ${result.questionCount} questions`);
      } else {
        results.warnings.push({
          level,
          message: result.message,
          questionCount: result.questionCount
        });
        console.warn(`⚠ Quiz level ${level}: ${result.message}`);
      }
    } catch (error) {
      results.errors.push({
        level,
        error: error.message
      });
      console.error(`✗ Failed to generate quiz level ${level}:`, error.message);
    }
  }

  console.log('\n=== Quiz Generation Summary ===');
  console.log(`Successfully generated: ${results.success.length} quizzes`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Errors: ${results.errors.length}`);

  return results;
}

/**
 * Generate a single quiz for a specific level
 * @param {number} level - Quiz level (0-20)
 * @returns {object} Result object with success status and details
 */
async function generateQuizForLevel(level) {
  const QUESTIONS_PER_QUIZ = 40;
  const SUBJECT = 'Mathematics';

  // Find all active questions for this quiz level
  const availableQuestions = await Question.find({
    quiz_level: level,
    subject: SUBJECT,
    is_active: true
  }).lean();

  // Check if we have enough questions
  if (availableQuestions.length < QUESTIONS_PER_QUIZ) {
    console.warn(`Insufficient questions for quiz level ${level}. Found: ${availableQuestions.length}, Required: ${QUESTIONS_PER_QUIZ}`);
    
    // Still generate quiz with available questions if we have at least 20
    if (availableQuestions.length < 20) {
      return {
        success: false,
        message: `Insufficient questions (${availableQuestions.length}/40). Minimum 20 required.`,
        questionCount: availableQuestions.length
      };
    }
  }

  // Randomly select questions with difficulty distribution
  const selectedQuestions = selectQuestionsWithDifficultyDistribution(
    availableQuestions,
    QUESTIONS_PER_QUIZ
  );

  // Check if a quiz already exists for this level
  const existingQuiz = await Quiz.findOne({
    quiz_level: level,
    auto_generated: true,
    is_active: true
  });

  if (existingQuiz) {
    // Update existing quiz
    existingQuiz.questions = selectedQuestions.map(q => ({
      question_id: q._id,
      text: q.text,
      choices: q.choices,
      answer: q.answer,
      difficulty: q.difficulty,
      topic: q.topic
    }));
    existingQuiz.generation_date = new Date();
    existingQuiz.updatedAt = new Date();
    
    await existingQuiz.save();
    
    return {
      success: true,
      quizId: existingQuiz._id,
      questionCount: selectedQuestions.length,
      updated: true
    };
  }

  // Create new quiz
  const newQuiz = new Quiz({
    title: `Mathematics Level ${level}`,
    description: `Auto-generated adaptive quiz for Mathematics level ${level}`,
    quiz_type: 'adaptive',
    quiz_level: level,
    auto_generated: true,
    generation_date: new Date(),
    is_adaptive: true,
    is_active: true,
    adaptive_config: {
      target_correct_answers: 20,
      difficulty_progression: 'immediate',
      starting_difficulty: 1,
      max_difficulty: 10
    },
    questions: selectedQuestions.map(q => ({
      question_id: q._id,
      text: q.text,
      choices: q.choices,
      answer: q.answer,
      difficulty: q.difficulty,
      topic: q.topic
    })),
    is_launched: false // Not launched by default
  });

  await newQuiz.save();

  return {
    success: true,
    quizId: newQuiz._id,
    questionCount: selectedQuestions.length,
    updated: false
  };
}

/**
 * Select questions with balanced difficulty distribution
 * Prioritizes variety across difficulty levels 1-10
 * @param {Array} questions - Available questions
 * @param {number} count - Number of questions to select
 * @returns {Array} Selected questions
 */
function selectQuestionsWithDifficultyDistribution(questions, count) {
  // Group questions by difficulty
  const byDifficulty = {};
  for (let i = 1; i <= 10; i++) {
    byDifficulty[i] = [];
  }

  questions.forEach(q => {
    const diff = q.difficulty || 3;
    if (byDifficulty[diff]) {
      byDifficulty[diff].push(q);
    }
  });

  // Calculate how many questions per difficulty level
  // Note: This approximation holds when count=40 (4 per level)
  // For smaller counts, distribution adjusts proportionally
  const selected = [];
  const targetPerLevel = Math.floor(count / 10); // Questions per difficulty level
  const remainder = count % 10;

  // First pass: Take targetPerLevel from each difficulty
  for (let diff = 1; diff <= 10; diff++) {
    const available = byDifficulty[diff];
    const toTake = Math.min(targetPerLevel, available.length);
    
    // Shuffle and take
    const shuffled = shuffleArray([...available]);
    selected.push(...shuffled.slice(0, toTake));
  }

  // Second pass: Fill remaining slots from any difficulty
  if (selected.length < count) {
    const remaining = questions.filter(q => !selected.includes(q));
    const shuffled = shuffleArray(remaining);
    const needed = count - selected.length;
    selected.push(...shuffled.slice(0, needed));
  }

  // Final shuffle for randomness
  return shuffleArray(selected).slice(0, count);
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get statistics about quiz generation readiness
 * @returns {object} Statistics object
 */
async function getQuizGenerationStats() {
  const stats = {
    levels: [],
    totalQuestions: 0,
    readyLevels: 0,
    insufficientLevels: 0
  };

  for (let level = 0; level <= 20; level++) {
    const count = await Question.countDocuments({
      quiz_level: level,
      subject: 'Mathematics',
      is_active: true
    });

    const difficultyDistribution = {};
    for (let diff = 1; diff <= 10; diff++) {
      const diffCount = await Question.countDocuments({
        quiz_level: level,
        subject: 'Mathematics',
        difficulty: diff,
        is_active: true
      });
      difficultyDistribution[diff] = diffCount;
    }

    stats.levels.push({
      level,
      questionCount: count,
      ready: count >= 40,
      canGenerate: count >= 20,
      difficultyDistribution
    });

    stats.totalQuestions += count;
    if (count >= 40) stats.readyLevels++;
    if (count < 20) stats.insufficientLevels++;
  }

  return stats;
}

module.exports = {
  autoGenerateAllQuizzes,
  generateQuizForLevel,
  getQuizGenerationStats
};
