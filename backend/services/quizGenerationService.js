// Quiz Generation Service
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const crypto = require('crypto');

/**
 * Calculate weight for a question based on freshness and usage
 * @param {Object} question - The question object
 * @param {Number} maxTimeGap - Maximum time gap in milliseconds
 * @returns {Number} - Weight for the question
 */
function calculateQuestionWeight(question, maxTimeGap) {
  const baseWeight = 100;
  
  // Freshness bonus: Questions that haven't been used recently get higher priority
  let freshnessBonus = 0;
  if (question.last_used_timestamp) {
    const timeSinceLastUse = Date.now() - new Date(question.last_used_timestamp).getTime();
    freshnessBonus = (timeSinceLastUse / maxTimeGap) * 50; // Up to 50 bonus points
  } else {
    // Never used questions get maximum freshness bonus
    freshnessBonus = 50;
  }
  
  // Usage penalty: More frequently used questions get lower priority
  const usagePenalty = (question.usage_count || 0) * 5;
  
  const finalWeight = Math.max(1, baseWeight + freshnessBonus - usagePenalty);
  return finalWeight;
}

/**
 * Weighted random selection from a pool of questions
 * @param {Array} questions - Array of questions with weights
 * @returns {Object} - Selected question
 */
function weightedRandomSelect(questions) {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const question of questions) {
    random -= question.weight;
    if (random <= 0) {
      return question;
    }
  }
  
  // Fallback to last question
  return questions[questions.length - 1];
}

/**
 * Calculate next difficulty level with adaptive progression
 * @param {Number} currentDifficulty - Current difficulty level (1-5)
 * @returns {Number} - Next difficulty level (1-5)
 */
function calculateNextDifficulty(currentDifficulty) {
  // 50% chance to increase, 30% stay same, 20% decrease
  const rand = Math.random();
  
  if (rand < 0.5 && currentDifficulty < 5) {
    return currentDifficulty + 1;
  } else if (rand < 0.8) {
    return currentDifficulty;
  } else if (currentDifficulty > 1) {
    return currentDifficulty - 1;
  }
  
  return currentDifficulty;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
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
 * Generate a unique hash for quiz identification
 * @param {String} studentId - Student ID (optional)
 * @param {Number} quizLevel - Quiz level
 * @param {Date} timestamp - Generation timestamp
 * @returns {String} - Unique hash
 */
function generateUniqueHash(studentId, quizLevel, timestamp) {
  const data = `${studentId || 'system'}-${quizLevel}-${timestamp.getTime()}-${Math.random()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Main quiz generation function
 * @param {Number} quizLevel - Quiz level (1-10)
 * @param {String} studentId - Optional student ID for personalization
 * @param {String} triggerReason - Reason for generation (e.g., 'manual', 'enrollment', 'completion', 'automatic')
 * @param {Object} options - Additional options (grade, subject, etc.)
 * @returns {Object} - Generated quiz
 */
async function generateQuiz(quizLevel, studentId = null, triggerReason = 'manual', options = {}) {
  // Step 1: Build query for questions - need at least 40 questions in quiz_level
  const query = {
    quiz_level: quizLevel,
    is_active: true
  };
  
  // Add optional filters for grade and subject
  if (options.grade) {
    query.grade = options.grade;
  }
  if (options.subject) {
    query.subject = options.subject;
  }
  
  const questionsPool = await Question.find(query);
  
  if (questionsPool.length < 40) {
    throw new Error(`Insufficient questions for quiz level ${quizLevel}. Need at least 40, found ${questionsPool.length}`);
  }
  
  // Get grade and subject from first question
  // These should be consistent since we filtered by them in the query
  const grade = options.grade || (questionsPool.length > 0 ? questionsPool[0].grade : null);
  const subject = options.subject || (questionsPool.length > 0 ? questionsPool[0].subject : null);
  
  // Validate that we have grade and subject
  if (!grade || !subject) {
    throw new Error('Grade and subject must be specified or derivable from questions');
  }
  
  // Step 2: Calculate max time gap for freshness weighting
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000; // One year in milliseconds
  
  // Step 3: Apply freshness weighting to all questions
  const weightedQuestions = questionsPool.map(q => ({
    ...q.toObject(),
    weight: calculateQuestionWeight(q, oneYear)
  }));
  
  // Step 4: Select 20 questions with adaptive difficulty progression
  const selectedQuestions = [];
  const availableQuestions = [...weightedQuestions];
  let currentDifficulty = 1;
  
  for (let i = 0; i < 20; i++) {
    // Filter by current difficulty
    let difficultyPool = availableQuestions.filter(q => q.difficulty === currentDifficulty);
    
    // If no questions at current difficulty, expand to adjacent difficulties
    if (difficultyPool.length === 0) {
      const adjacentDifficulties = [
        currentDifficulty - 1,
        currentDifficulty + 1
      ].filter(d => d >= 1 && d <= 5);
      
      difficultyPool = availableQuestions.filter(q => 
        adjacentDifficulties.includes(q.difficulty)
      );
    }
    
    // If still no questions, use any available
    if (difficultyPool.length === 0) {
      difficultyPool = availableQuestions;
    }
    
    if (difficultyPool.length === 0) {
      throw new Error('Ran out of questions during generation');
    }
    
    // Random selection with freshness weighting
    const selectedQuestion = weightedRandomSelect(difficultyPool);
    
    // Add to selected questions
    selectedQuestions.push({
      question_id: selectedQuestion._id,
      text: selectedQuestion.text,
      choices: selectedQuestion.choices,
      answer: selectedQuestion.answer,
      difficulty: selectedQuestion.difficulty,
      position: i + 1,
      starting_difficulty: currentDifficulty
    });
    
    // Update question usage in database
    await Question.findByIdAndUpdate(selectedQuestion._id, {
      $inc: { usage_count: 1 },
      last_used_timestamp: new Date()
    });
    
    // Remove from available pool to prevent duplicates
    const index = availableQuestions.findIndex(q => 
      q._id.toString() === selectedQuestion._id.toString()
    );
    if (index > -1) {
      availableQuestions.splice(index, 1);
    }
    
    // Calculate next difficulty for adaptive progression (not for last question)
    if (i < 19) {
      currentDifficulty = calculateNextDifficulty(currentDifficulty);
    }
  }
  
  // Step 5: Shuffle final sequence for additional randomness
  const shuffledQuestions = shuffleArray(selectedQuestions);
  
  // Update positions after shuffle to reflect final presentation order
  // Note: 'position' represents the order questions will be shown to students
  // 'starting_difficulty' (set at line 166) preserves the original generation difficulty
  shuffledQuestions.forEach((q, index) => {
    q.position = index + 1;
  });
  
  // Step 6: Create quiz record
  const timestamp = new Date();
  const uniqueHash = generateUniqueHash(studentId, quizLevel, timestamp);
  
  // Format quiz title according to requirement: Grade's Quiz Level _
  const quizLevelName = `Level ${quizLevel}`;
  const quizTitle = `${grade}'s ${quizLevelName}`;
  
  const quiz = new Quiz({
    title: quizTitle,
    description: `Auto-generated quiz for ${grade}, ${subject}, ${quizLevelName}. Trigger: ${triggerReason}`,
    quiz_level: quizLevel,
    quiz_type: 'adaptive',
    questions: shuffledQuestions,
    is_adaptive: true,
    is_auto_generated: true,
    generation_criteria: triggerReason,
    unique_hash: uniqueHash,
    adaptive_config: {
      target_correct_answers: 10,
      difficulty_progression: 'gradual',
      starting_difficulty: 1
    },
    created_by: null, // System generated
    createdAt: timestamp
  });
  
  await quiz.save();
  
  return quiz;
}

/**
 * Check if quiz generation is possible for a given quiz level
 * @param {Number} quizLevel - Quiz level to check
 * @param {Object} options - Optional filters (grade, subject)
 * @returns {Object} - Status object with availability info
 */
async function checkGenerationAvailability(quizLevel, options = {}) {
  const query = {
    quiz_level: quizLevel,
    is_active: true
  };
  
  if (options.grade) {
    query.grade = options.grade;
  }
  if (options.subject) {
    query.subject = options.subject;
  }
  
  const questionCount = await Question.countDocuments(query);
  
  return {
    available: questionCount >= 40,
    questionCount,
    required: 40,
    message: questionCount >= 40 
      ? `${questionCount} questions available for level ${quizLevel}` 
      : `Only ${questionCount}/40 questions available for level ${quizLevel}`
  };
}

/**
 * Check and auto-generate quizzes for all eligible combinations
 * Finds all grade/subject/quiz_level combinations with 40+ questions
 * and generates quizzes for those that don't already exist
 * @returns {Object} - Summary of generation results
 */
async function autoGenerateQuizzes() {
  try {
    // Step 1: Aggregate to find all grade/subject/quiz_level combinations with 40+ questions
    const eligibleCombinations = await Question.aggregate([
      {
        $match: {
          is_active: true
        }
      },
      {
        $group: {
          _id: {
            grade: '$grade',
            subject: '$subject',
            quiz_level: '$quiz_level'
          },
          questionCount: { $sum: 1 }
        }
      },
      {
        $match: {
          questionCount: { $gte: 40 }
        }
      },
      {
        $sort: {
          '_id.grade': 1,
          '_id.subject': 1,
          '_id.quiz_level': 1
        }
      }
    ]);
    
    const results = {
      checked: eligibleCombinations.length,
      generated: 0,
      skipped: 0,
      errors: [],
      quizzes: []
    };
    
    // Step 2: For each eligible combination, check if quiz already exists
    for (const combo of eligibleCombinations) {
      const { grade, subject, quiz_level } = combo._id;
      
      try {
        // Escape special regex characters in grade name for safe matching
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedGrade = escapeRegex(grade);
        
        // Check if a quiz already exists for this combination
        const existingQuiz = await Quiz.findOne({
          quiz_level,
          is_auto_generated: true,
          title: { $regex: new RegExp(`^${escapedGrade}'s.*Level ${quiz_level}`, 'i') }
        }).sort({ createdAt: -1 });
        
        // Skip if a quiz was already generated recently (within last 24 hours)
        if (existingQuiz) {
          const hoursSinceGeneration = (Date.now() - existingQuiz.createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceGeneration < 24) {
            results.skipped++;
            continue;
          }
        }
        
        // Generate new quiz
        const quiz = await generateQuiz(
          quiz_level,
          null,
          'automatic',
          { grade, subject }
        );
        
        results.generated++;
        results.quizzes.push({
          title: quiz.title,
          quiz_level,
          grade,
          subject,
          questionCount: combo.questionCount
        });
        
      } catch (error) {
        results.errors.push({
          grade,
          subject,
          quiz_level,
          error: error.message
        });
      }
    }
    
    return results;
    
  } catch (error) {
    throw new Error(`Auto-generation failed: ${error.message}`);
  }
}

/**
 * Check all possible combinations and return which ones are eligible for generation
 * @returns {Array} - List of eligible combinations
 */
async function checkAllEligibleCombinations() {
  const eligibleCombinations = await Question.aggregate([
    {
      $match: {
        is_active: true
      }
    },
    {
      $group: {
        _id: {
          grade: '$grade',
          subject: '$subject',
          quiz_level: '$quiz_level'
        },
        questionCount: { $sum: 1 }
      }
    },
    {
      $match: {
        questionCount: { $gte: 40 }
      }
    },
    {
      $sort: {
        '_id.grade': 1,
        '_id.subject': 1,
        '_id.quiz_level': 1
      }
    }
  ]);
  
  return eligibleCombinations.map(combo => ({
    grade: combo._id.grade,
    subject: combo._id.subject,
    quiz_level: combo._id.quiz_level,
    questionCount: combo.questionCount,
    eligible: true
  }));
}

module.exports = {
  generateQuiz,
  checkGenerationAvailability,
  autoGenerateQuizzes,
  checkAllEligibleCombinations,
  calculateQuestionWeight,
  weightedRandomSelect,
  calculateNextDifficulty,
  shuffleArray,
  generateUniqueHash
};
