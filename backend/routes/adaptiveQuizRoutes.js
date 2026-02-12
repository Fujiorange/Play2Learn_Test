const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const MathSkill = require('../models/MathSkill');
const MathProfile = require('../models/MathProfile');
const SkillPointsConfig = require('../models/SkillPointsConfig');

// ✅ Import shared streak utilities
const { updateStreakOnCompletion } = require('../utils/streakUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Middleware to authenticate users
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Helper function to get default difficulty points configuration
function getDefaultDifficultyPoints() {
  return {
    1: { correct: 1, wrong: -2.5 },
    2: { correct: 2, wrong: -2.0 },
    3: { correct: 3, wrong: -1.5 },
    4: { correct: 4, wrong: -1.0 },
    5: { correct: 5, wrong: -0.5 }
  };
}

// Level thresholds for points-based leveling system
const LEVEL_THRESHOLDS = [
  { level: 0, min: 0, max: 25 },
  { level: 1, min: 25, max: 50 },
  { level: 2, min: 50, max: 100 },
  { level: 3, min: 100, max: 200 },
  { level: 4, min: 200, max: 400 },
  { level: 5, min: 400, max: Infinity }
];

// Helper function to calculate level from points
function calculateLevelFromPoints(points) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].min) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 0;
}

// Helper function to calculate progressive score
function calculateProgressiveScore(attempt, quiz, timeElapsedSeconds) {
  const totalQuestions = 20;
  const correctAnswers = attempt.correct_count;
  
  const accuracyScore = correctAnswers / totalQuestions;
  
  const expectedTime = totalQuestions * 30;
  let speedBonus = 0;
  
  if (timeElapsedSeconds < expectedTime * 0.5) {
    speedBonus = 0.5;
  } else if (timeElapsedSeconds < expectedTime * 0.75) {
    speedBonus = 0.3;
  } else if (timeElapsedSeconds < expectedTime) {
    speedBonus = 0.1;
  } else if (timeElapsedSeconds < expectedTime * 1.5) {
    speedBonus = 0;
  } else {
    speedBonus = -0.2;
  }
  
  const quizLevel = quiz.quiz_level || 1;
  const difficultyBonus = (quizLevel - 1) * 0.2;
  
  const score = accuracyScore * (1 + speedBonus) * (1 + difficultyBonus);
  
  return {
    score: Math.max(0, score),
    accuracyScore,
    speedBonus,
    difficultyBonus,
    maxPossibleScore: 1 * (1 + 0.5) * (1 + difficultyBonus)
  };
}

// ==================== LEVEL PROGRESSION (ACCURACY FIRST) ====================
/**
 * Determines next quiz level based on performance
 * PRIMARY RULE: Must have 70%+ accuracy to level up
 * @param {number} currentLevel - Current quiz level (1-10)
 * @param {object} scoreData - { accuracyScore, speedBonus, difficultyBonus, score }
 * @returns {object} - { nextLevel, progression, levelChange, reason }
 */
function determineNextLevel(currentLevel, scoreData) {
  const { accuracyScore, speedBonus, difficultyBonus, score } = scoreData;
  
  // ✅ GATE 1: MINIMUM ACCURACY REQUIREMENT (70%)
  const MIN_ACCURACY_TO_ADVANCE = 0.70;
  const MIN_ACCURACY_TO_STAY = 0.40;
  
  console.log(`📊 Level Decision: Current=${currentLevel}, Accuracy=${Math.round(accuracyScore * 100)}%, Score=${score.toFixed(2)}`);
  
  // ❌ LEVEL DOWN: Accuracy < 40%
  if (accuracyScore < MIN_ACCURACY_TO_STAY) {
    const nextLevel = Math.max(1, currentLevel - 1);
    console.log(`⬇️ Level DOWN: ${currentLevel} → ${nextLevel} (accuracy too low)`);
    
    return {
      nextLevel: nextLevel,
      progression: currentLevel === 1 ? 'repeat' : 'down',
      levelChange: nextLevel - currentLevel,
      reason: `Score below 40% (${Math.round(accuracyScore * 100)}%). Let's practice at an easier level.`,
      blocked: false
    };
  }
  
  // ❌ STAY: Accuracy 40-69% (BLOCKED from advancing)
  if (accuracyScore < MIN_ACCURACY_TO_ADVANCE) {
    console.log(`➡️ STAY: Blocked by accuracy requirement (${Math.round(accuracyScore * 100)}% < 70%)`);
    
    return {
      nextLevel: currentLevel,
      progression: 'stay',
      levelChange: 0,
      reason: `You need 70%+ accuracy to advance. You scored ${Math.round(accuracyScore * 100)}%. Keep practicing!`,
      blocked: true,
      accuracyNeeded: 70 - Math.round(accuracyScore * 100)
    };
  }
  
  // ✅ GATE 2: Accuracy >= 70%, now check TOTAL SCORE with bonuses
  
  // THRESHOLDS (with bonuses applied)
  const THRESHOLD_STAY = 0.85;      // Need 0.85 score to level up
  const THRESHOLD_SKIP = 1.20;      // Need 1.20 score to skip levels
  
  let nextLevel = currentLevel;
  let progression = 'stay';
  let reason = '';
  
  // 🚀 SKIP +2: Excellent performance (85%+ accuracy + 1.20+ score)
  if (accuracyScore >= 0.85 && score >= THRESHOLD_SKIP) {
    nextLevel = Math.min(10, currentLevel + 2);
    progression = 'skip_one';
    reason = `🎉 Excellent! You scored ${Math.round(accuracyScore * 100)}% with great speed. Skipping ahead!`;
    console.log(`⏫ SKIP: ${currentLevel} → ${nextLevel} (excellent performance)`);
  }
  // ⬆️ LEVEL UP +1: Good performance (75%+ accuracy + 0.85+ score)
  else if (accuracyScore >= 0.75 && score >= THRESHOLD_STAY) {
    nextLevel = Math.min(10, currentLevel + 1);
    progression = 'up_one';
    reason = `✨ Well done! You scored ${Math.round(accuracyScore * 100)}%. Ready for the next level!`;
    console.log(`⬆️ LEVEL UP: ${currentLevel} → ${nextLevel} (good performance)`);
  }
  // ➡️ STAY: 70-74% accuracy OR score < 0.85
  else {
    nextLevel = currentLevel;
    progression = 'stay';
    reason = `Good job scoring ${Math.round(accuracyScore * 100)}%! Practice more to level up faster.`;
    console.log(`➡️ STAY: ${currentLevel} (accuracy OK but need better score)`);
  }
  
  // 🔒 MAX LEVEL CAP
  if (nextLevel >= 10) {
    nextLevel = 10;
    progression = nextLevel === currentLevel ? 'stay' : 'max_reached';
    reason = nextLevel === 10 && currentLevel < 10 
      ? '🏆 Congratulations! You reached the maximum level!' 
      : '🏆 You are at maximum level. Keep practicing!';
    console.log(`🏆 MAX LEVEL: Staying at 10`);
  }
  
  return {
    nextLevel: nextLevel,
    progression: progression,
    levelChange: nextLevel - currentLevel,
    reason: reason,
    blocked: false,
    stats: {
      accuracy: Math.round(accuracyScore * 100),
      speedBonus: Math.round(speedBonus * 100),
      difficultyBonus: Math.round(difficultyBonus * 100),
      finalScore: Math.round(score * 100)
    }
  };
}

// Helper function to update skills from adaptive quiz answers
async function updateSkillsFromAdaptiveQuiz(userId, answers) {
  try {
    let pointsConfig;
    try {
      pointsConfig = await SkillPointsConfig.getConfig();
    } catch (err) {
      console.log("Using default points configuration for adaptive quiz");
      pointsConfig = { difficultyPoints: getDefaultDifficultyPoints() };
    }
    
    const difficultyPoints = pointsConfig.difficultyPoints || getDefaultDifficultyPoints();
    const skillUpdates = {};

    answers.forEach((answer) => {
      let topic = answer.topic || 'General';
      
      if (!topic || topic === 'General' || topic === '') {
        const questionText = (answer.question_text || '').toLowerCase();
        if (questionText.includes('+')) {
          topic = 'Addition';
        } else if (questionText.includes('-') && !questionText.includes('subtract')) {
          topic = 'Subtraction';
        } else if (questionText.includes('subtract') || questionText.includes('minus')) {
          topic = 'Subtraction';
        } else if (questionText.includes('×') || questionText.includes('*')) {
          topic = 'Multiplication';
        } else if (questionText.includes('multiply') || questionText.includes('times')) {
          topic = 'Multiplication';
        } else if (questionText.includes('÷') || questionText.includes('/')) {
          topic = 'Division';
        } else if (questionText.includes('divide')) {
          topic = 'Division';
        }
      }
      
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);
      
      const difficulty = answer.difficulty || 3;
      const difficultyStr = String(difficulty);
      const levelPoints = difficultyPoints[difficultyStr] || difficultyPoints['3'];
      
      if (!skillUpdates[topic]) {
        skillUpdates[topic] = { 
          correct: 0, 
          total: 0, 
          pointsChange: 0 
        };
      }
      
      skillUpdates[topic].total++;
      
      if (answer.isCorrect) {
        skillUpdates[topic].correct++;
        skillUpdates[topic].pointsChange += levelPoints.correct;
      } else {
        skillUpdates[topic].pointsChange += levelPoints.wrong;
      }
    });

    const topicNames = Object.keys(skillUpdates);
    
    if (topicNames.length === 0) return;
    
    const existingSkills = await MathSkill.find({ 
      student_id: userId, 
      skill_name: { $in: topicNames } 
    });
    
    const skillMap = new Map(existingSkills.map(s => [s.skill_name, s]));
    const bulkOps = [];

    for (const [topicName, stats] of Object.entries(skillUpdates)) {
      const skillPercentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const xpGain = Math.floor(skillPercentage / 10);

      const existingSkill = skillMap.get(topicName);
      
      if (existingSkill) {
        const newXp = existingSkill.xp + xpGain;
        const currentPoints = existingSkill.points || 0;
        const newPoints = Math.max(0, currentPoints + stats.pointsChange);
        const newLevel = calculateLevelFromPoints(newPoints);
        
        bulkOps.push({
          updateOne: {
            filter: { _id: existingSkill._id },
            update: { 
              $set: { 
                xp: newXp, 
                current_level: newLevel,
                points: newPoints,
                updatedAt: new Date() 
              } 
            }
          }
        });
      } else {
        const newXp = xpGain;
        const newPoints = Math.max(0, stats.pointsChange);
        const newLevel = calculateLevelFromPoints(newPoints);
        
        bulkOps.push({
          insertOne: {
            document: {
              student_id: userId,
              skill_name: topicName,
              current_level: newLevel,
              xp: newXp,
              points: newPoints,
              unlocked: true,
              updatedAt: new Date()
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await MathSkill.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("Error updating skills from adaptive quiz:", error);
  }
}

// ✅ FIXED: Helper function to update streak and points when adaptive quiz is completed
async function updateStreakAndPointsOnQuizCompletion(userId, correctCount, totalAnswered) {
  try {
    const mathProfile = await MathProfile.findOne({ student_id: userId });
    const pointsEarned = Math.max(0, correctCount * 10);
    
    if (!mathProfile) {
      console.log(`⚠️ No math profile found for user ${userId} - creating new profile`);
      const newProfile = new MathProfile({
        student_id: userId,
        streak: 1, // ✅ First Quiz Journey quiz = streak 1
        last_quiz_date: new Date(), // ✅ Correct field name
        total_points: pointsEarned,
        placement_completed: false,
        current_profile: 1,
        adaptive_quiz_level: 1
      });
      await newProfile.save();
      console.log(`✅ Created new profile with streak=1 for user ${userId}`);
      return;
    }

    // ✅ Use shared updateStreakOnCompletion function
    const newStreak = updateStreakOnCompletion(mathProfile);
    
    // Update points
    mathProfile.total_points = (mathProfile.total_points || 0) + pointsEarned;
    
    await mathProfile.save();
    
    console.log(`✅ Quiz Journey completed for user ${userId}:`);
    console.log(`   - Streak: ${newStreak}`);
    console.log(`   - Points earned: ${pointsEarned}`);
    console.log(`   - Total points: ${mathProfile.total_points}`);
  } catch (error) {
    console.error("❌ Error updating streak and points:", error);
  }
}

// ==================== GET STUDENT'S CURRENT LEVEL ====================
// ✅ CRITICAL: This reads placement quiz result from MathProfile.current_profile
router.get('/student/current-level', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const mathProfile = await MathProfile.findOne({ student_id: userId });
    
    if (!mathProfile) {
      return res.json({
        success: true,
        currentLevel: 1,
        unlockedLevels: [1],
        placementCompleted: false
      });
    }
    
    // ✅ CRITICAL FIX: Read adaptive_quiz_level (set by placement quiz)
    // If not set, fall back to current_profile (also set by placement quiz)
    const currentLevel = mathProfile.adaptive_quiz_level || mathProfile.current_profile || 1;
    
    // Generate array of unlocked levels (1 up to current)
    const unlockedLevels = Array.from({ length: currentLevel }, (_, i) => i + 1);
    
    console.log(`✅ Student ${userId} - Placement Level: ${currentLevel}, Unlocked: ${unlockedLevels}`);
    
    res.json({
      success: true,
      currentLevel: currentLevel,
      unlockedLevels: unlockedLevels,
      placementCompleted: mathProfile.placement_completed || false
    });
  } catch (error) {
    console.error('Error fetching student level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student level'
    });
  }
});

// Get all available adaptive quizzes - SHOW ALL LEVELS
router.get('/quizzes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get ALL active adaptive quizzes (ignore launch status for adaptive quizzes)
    const quizzes = await Quiz.find({ 
      quiz_type: 'adaptive',
      is_active: true
    })
    .select('title description adaptive_config questions createdAt quiz_type is_launched launched_at launch_start_date launch_end_date launched_for_classes quiz_level')
    .sort({ quiz_level: 1 })
    .lean();

    const quizzesWithStats = quizzes.map(quiz => {
      const difficultyCount = {};
      quiz.questions.forEach(q => {
        const diff = q.difficulty || 3;
        difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
      });

      return {
        _id: quiz._id,
        quiz_level: quiz.quiz_level,
        title: quiz.title,
        description: quiz.description,
        total_questions: quiz.questions.length,
        difficulty_distribution: difficultyCount,
        target_correct_answers: quiz.adaptive_config?.target_correct_answers || 10,
        difficulty_progression: quiz.adaptive_config?.difficulty_progression || 'gradual',
        createdAt: quiz.createdAt,
        is_launched: quiz.is_launched,
        launched_at: quiz.launched_at,
        launch_start_date: quiz.launch_start_date,
        launch_end_date: quiz.launch_end_date
      };
    });

    res.json({
      success: true,
      data: quizzesWithStats
    });
  } catch (error) {
    console.error('Get adaptive quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quizzes' 
    });
  }
});

// Start quiz with AUTO-LAUNCH
router.post('/quizzes/:quizId/start', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    let quiz;
    
    if (quizId.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(quizId);
    } else {
      const level = parseInt(quizId);
      if (isNaN(level)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid quiz identifier. Please provide a valid quiz ID or level number.' 
        });
      }
      
      // Find quiz regardless of launch status
      quiz = await Quiz.findOne({
        quiz_level: level,
        quiz_type: 'adaptive',
        is_active: true
      }).sort({ createdAt: -1 });
    }

    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found for this level. Please contact your teacher to create the quiz.' 
      });
    }

    if (quiz.quiz_type !== 'adaptive') {
      return res.status(400).json({ 
        success: false, 
        error: 'This is not an adaptive quiz' 
      });
    }

    // ✅ CRITICAL: Check if student has unlocked this level based on placement
    const mathProfile = await MathProfile.findOne({ student_id: userId });
    const studentLevel = mathProfile?.adaptive_quiz_level || mathProfile?.current_profile || 1;
    const quizLevel = quiz.quiz_level || 1;

    console.log(`📊 Access check: User ${userId} (Level ${studentLevel}) requesting Quiz Level ${quizLevel}`);

    if (quizLevel > studentLevel) {
      console.log(`🔒 Access DENIED: Level ${quizLevel} > Student Level ${studentLevel}`);
      return res.status(403).json({
        success: false,
        error: `🔒 Level ${quizLevel} is locked! You are currently at Level ${studentLevel}. ${studentLevel === 1 ? 'Complete Level 1 first.' : `Complete Level ${studentLevel} to unlock Level ${quizLevel}.`}`,
        debug: {
          yourLevel: studentLevel,
          requestedLevel: quizLevel,
          message: 'If you just completed a quiz, please refresh the page and try again.'
        }
      });
    }

    console.log(`✅ Access GRANTED: Student can access Level ${quizLevel}`);

    // Auto-launch quiz if not launched
    if (!quiz.is_launched) {
      console.log(`🚀 Auto-launching quiz level ${quizLevel} for student ${userId}`);
      quiz.is_launched = true;
      quiz.launched_at = new Date();
      quiz.launched_by = userId;
      await quiz.save();
    }

    const existingAttempt = await QuizAttempt.findOne({
      userId,
      quizId: quiz._id,
      is_completed: false
    });

    if (existingAttempt) {
      const timeElapsed = new Date() - new Date(existingAttempt.startedAt);
      const hoursElapsed = timeElapsed / (1000 * 60 * 60);
      
      if (hoursElapsed > 24) {
        console.log(`Deleting stale incomplete attempt for user ${userId}, quiz ${quiz._id}`);
        await QuizAttempt.deleteOne({ _id: existingAttempt._id });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'You have an incomplete attempt. Please complete or cancel it first.',
          attemptId: existingAttempt._id
        });
      }
    }

    const attempt = new QuizAttempt({
      userId,
      quizId: quiz._id,
      current_difficulty: quiz.adaptive_config?.starting_difficulty || 1,
      correct_count: 0,
      total_answered: 0,
      is_completed: false
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      data: {
        attemptId: attempt._id,
        quizTitle: quiz.title,
        quizLevel: quiz.quiz_level,
        target_correct_answers: 20,
        current_difficulty: attempt.current_difficulty,
        correct_count: attempt.correct_count
      }
    });
  } catch (error) {
    console.error('Start quiz attempt error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start quiz attempt' 
    });
  }
});

// Get next question - ADAPTIVE with flexible fallback to reach 20 questions
router.get('/attempts/:attemptId/next-question', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await QuizAttempt.findOne({ 
      _id: attemptId, 
      userId 
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz attempt not found' 
      });
    }

    if (attempt.is_completed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz attempt already completed' 
      });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    // Check if 20 questions answered
    const targetQuestions = 20;
    if (attempt.total_answered >= targetQuestions) {
      const timeElapsedMs = new Date() - new Date(attempt.startedAt);
      const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
      
      const scoreData = calculateProgressiveScore(attempt, quiz, timeElapsedSeconds);
      const currentLevel = quiz.quiz_level || 1;
      const levelDecision = determineNextLevel(currentLevel, scoreData);
      
      const nextQuiz = await Quiz.findOne({
        quiz_level: levelDecision.nextLevel,
        quiz_type: 'adaptive',
        is_active: true
      }).sort({ createdAt: -1 });
      
      attempt.is_completed = true;
      attempt.completedAt = new Date();
      attempt.score = scoreData.score;
      
      attempt.progressionData = {
        accuracyScore: scoreData.accuracyScore,
        speedBonus: scoreData.speedBonus,
        difficultyBonus: scoreData.difficultyBonus,
        finalScore: scoreData.score,
        timeElapsedSeconds,
        progression: levelDecision.progression,
        currentLevel,
        nextLevel: levelDecision.nextLevel,
        levelChange: levelDecision.levelChange,
        reason: levelDecision.reason,
        blocked: levelDecision.blocked,
        stats: levelDecision.stats
      };
      
      await attempt.save();
      await updateSkillsFromAdaptiveQuiz(userId, attempt.answers);
      
      // ✅ UPDATE STREAK - This is Quiz Journey!
      await updateStreakAndPointsOnQuizCompletion(userId, attempt.correct_count, attempt.total_answered);

      // ✅ CRITICAL FIX: Update student's adaptive_quiz_level in MathProfile (both UP and DOWN)
      let confirmedLevel = currentLevel;
      try {
        console.log(`📊 Attempting to update student level from ${currentLevel} to ${levelDecision.nextLevel}`);
        
        const mathProfile = await MathProfile.findOne({ student_id: userId });
        if (mathProfile) {
          const targetLevel = levelDecision.nextLevel;
          
          // ✅ FIX: Update level regardless of whether it goes up or down
          if (targetLevel !== mathProfile.adaptive_quiz_level) {
            const direction = targetLevel > mathProfile.adaptive_quiz_level ? 'UP' : 'DOWN';
            console.log(`🔄 Updating level ${direction}: ${mathProfile.adaptive_quiz_level} → ${targetLevel}`);
            
            mathProfile.adaptive_quiz_level = targetLevel;
            mathProfile.current_profile = targetLevel; // Keep in sync
            await mathProfile.save();
            
            // Verify the save worked
            const verifiedProfile = await MathProfile.findOne({ student_id: userId });
            confirmedLevel = verifiedProfile.adaptive_quiz_level;
            
            console.log(`✅ VERIFIED: Student quiz level updated to ${confirmedLevel}`);
          } else {
            confirmedLevel = mathProfile.adaptive_quiz_level;
            console.log(`ℹ️ Student staying at level ${confirmedLevel} (no change)`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to update adaptive quiz level:', error);
      }

      return res.json({
        success: true,
        completed: true,
        message: 'Quiz completed!',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_questions: targetQuestions,
          scoreData: scoreData,
          levelDecision: {
            ...levelDecision,
            confirmedLevel: confirmedLevel
          },
          hasNextLevel: !!nextQuiz,
          nextQuizId: nextQuiz ? nextQuiz._id : null,
          nextQuizLevel: nextQuiz ? nextQuiz.quiz_level : null,
          nextQuizTitle: nextQuiz ? nextQuiz.title : null,
          timeElapsedSeconds
        }
      });
    }

    // 🎯 ADAPTIVE QUESTION SELECTION - Flexible to always reach 20 questions
    const answeredIds = attempt.answers.map(a => a.questionId.toString());
    const recentlyAnsweredIds = attempt.answers.slice(-3).map(a => a.questionId.toString());

    let nextQuestion = null;
    const currentDifficulty = attempt.current_difficulty;

    console.log(`🔍 Question ${attempt.total_answered + 1}/20 - Looking for difficulty ${currentDifficulty}`);

    // PRIORITY 1: Exact difficulty, not recently answered
    const exactNotRecent = quiz.questions.filter(q => {
      const qId = q._id.toString();
      return q.difficulty === currentDifficulty && !recentlyAnsweredIds.includes(qId);
    });

    if (exactNotRecent.length > 0) {
      nextQuestion = exactNotRecent[Math.floor(Math.random() * exactNotRecent.length)];
      console.log(`✅ Found question at difficulty ${currentDifficulty} (Priority 1 - Exact match)`);
    }

    // PRIORITY 2: Current +1 difficulty, not recently answered
    if (!nextQuestion && currentDifficulty < 5) {
      const higherNotRecent = quiz.questions.filter(q => {
        const qId = q._id.toString();
        return q.difficulty === currentDifficulty + 1 && !recentlyAnsweredIds.includes(qId);
      });
      
      if (higherNotRecent.length > 0) {
        nextQuestion = higherNotRecent[Math.floor(Math.random() * higherNotRecent.length)];
        console.log(`⬆️ Using difficulty ${currentDifficulty + 1} (Priority 2 - One higher)`);
      }
    }

    // PRIORITY 3: ANY difficulty at or above current, not recently answered
    if (!nextQuestion) {
      const anyAtOrAbove = quiz.questions.filter(q => {
        const qId = q._id.toString();
        return q.difficulty >= currentDifficulty && !recentlyAnsweredIds.includes(qId);
      });
      
      if (anyAtOrAbove.length > 0) {
        nextQuestion = anyAtOrAbove[Math.floor(Math.random() * anyAtOrAbove.length)];
        console.log(`📊 Using difficulty ${nextQuestion.difficulty} (Priority 3 - At/above current)`);
      }
    }

    // PRIORITY 4: Current difficulty -1, not recently answered
    if (!nextQuestion && currentDifficulty > 1) {
      const lowerNotRecent = quiz.questions.filter(q => {
        const qId = q._id.toString();
        return q.difficulty === currentDifficulty - 1 && !recentlyAnsweredIds.includes(qId);
      });
      
      if (lowerNotRecent.length > 0) {
        nextQuestion = lowerNotRecent[Math.floor(Math.random() * lowerNotRecent.length)];
        console.log(`⬇️ Using difficulty ${currentDifficulty - 1} (Priority 4 - One lower)`);
      }
    }

    // PRIORITY 5: ANY question not recently answered
    if (!nextQuestion) {
      const anyNotRecent = quiz.questions.filter(q => {
        const qId = q._id.toString();
        return !recentlyAnsweredIds.includes(qId);
      });
      
      if (anyNotRecent.length > 0) {
        nextQuestion = anyNotRecent[Math.floor(Math.random() * anyNotRecent.length)];
        console.log(`🔄 Using difficulty ${nextQuestion.difficulty} (Priority 5 - Any not recent)`);
      }
    }

    // PRIORITY 6: ABSOLUTELY ANY QUESTION (FORCE REUSE)
    if (!nextQuestion) {
      if (quiz.questions.length > 0) {
        nextQuestion = quiz.questions[Math.floor(Math.random() * quiz.questions.length)];
        console.log(`♻️ Forced reuse - difficulty ${nextQuestion.difficulty} (Priority 6 - Any question)`);
      }
    }

    // ONLY complete early if NO questions exist at all
    if (!nextQuestion) {
      console.log('❌ CRITICAL: No questions available in quiz - completing early');
      
      const timeElapsedMs = new Date() - new Date(attempt.startedAt);
      const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
      
      const scoreData = calculateProgressiveScore(attempt, quiz, timeElapsedSeconds);
      const currentLevel = quiz.quiz_level || 1;
      const levelDecision = determineNextLevel(currentLevel, scoreData);
      
      const nextQuiz = await Quiz.findOne({
        quiz_level: levelDecision.nextLevel,
        quiz_type: 'adaptive',
        is_active: true
      }).sort({ createdAt: -1 });
      
      attempt.is_completed = true;
      attempt.completedAt = new Date();
      attempt.score = scoreData.score;
      attempt.progressionData = {
        accuracyScore: scoreData.accuracyScore,
        speedBonus: scoreData.speedBonus,
        difficultyBonus: scoreData.difficultyBonus,
        finalScore: scoreData.score,
        timeElapsedSeconds,
        progression: levelDecision.progression,
        currentLevel,
        nextLevel: levelDecision.nextLevel,
        levelChange: levelDecision.levelChange,
        reason: levelDecision.reason,
        blocked: levelDecision.blocked,
        stats: levelDecision.stats
      };
      await attempt.save();
      
      await updateSkillsFromAdaptiveQuiz(userId, attempt.answers);
      
      // ✅ UPDATE STREAK
      await updateStreakAndPointsOnQuizCompletion(userId, attempt.correct_count, attempt.total_answered);

      // ✅ FIX: Update level both UP and DOWN
      let confirmedLevel = currentLevel;
      try {
        const mathProfile = await MathProfile.findOne({ student_id: userId });
        if (mathProfile) {
          if (levelDecision.nextLevel !== mathProfile.adaptive_quiz_level) {
            mathProfile.adaptive_quiz_level = levelDecision.nextLevel;
            mathProfile.current_profile = levelDecision.nextLevel;
            await mathProfile.save();
            
            const verifiedProfile = await MathProfile.findOne({ student_id: userId });
            confirmedLevel = verifiedProfile.adaptive_quiz_level;
          } else {
            confirmedLevel = mathProfile.adaptive_quiz_level;
          }
        }
      } catch (error) {
        console.error('Failed to update adaptive quiz level:', error);
      }

      return res.json({
        success: true,
        completed: true,
        message: 'Quiz completed (no questions available)',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_questions: 20,
          scoreData: scoreData,
          levelDecision: {
            ...levelDecision,
            confirmedLevel: confirmedLevel
          },
          hasNextLevel: !!nextQuiz,
          nextQuizId: nextQuiz ? nextQuiz._id : null,
          nextQuizLevel: nextQuiz ? nextQuiz.quiz_level : null,
          nextQuizTitle: nextQuiz ? nextQuiz.title : null,
          timeElapsedSeconds
        }
      });
    }

    // Return the selected question
    res.json({
      success: true,
      completed: false,
      data: {
        question: {
          id: nextQuestion._id,
          text: nextQuestion.text,
          choices: nextQuestion.choices,
          difficulty: nextQuestion.difficulty
        },
        progress: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_questions: 20,
          current_difficulty: attempt.current_difficulty,
          questionsRemaining: 20 - attempt.total_answered
        }
      }
    });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get next question' 
    });
  }
});

// Submit answer - ADAPTIVE difficulty progression
router.post('/attempts/:attemptId/submit-answer', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;
    const userId = req.user.userId;

    if (!questionId || answer === undefined || answer === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'questionId and answer are required' 
      });
    }

    const attempt = await QuizAttempt.findOne({ 
      _id: attemptId, 
      userId 
    });

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz attempt not found' 
      });
    }

    if (attempt.is_completed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quiz attempt already completed' 
      });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    const question = quiz.questions.find(q => q._id.toString() === questionId.toString());

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found in quiz' 
      });
    }

    const justAnswered = attempt.answers.length > 0 && 
                         attempt.answers[attempt.answers.length - 1].questionId.toString() === questionId.toString();

    if (justAnswered) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot answer the same question twice in a row' 
      });
    }

    const isCorrect = answer.toString().trim().toLowerCase() === question.answer.toString().trim().toLowerCase();

    attempt.answers.push({
      questionId: question._id,
      question_text: question.text,
      difficulty: question.difficulty,
      topic: question.topic,
      answer: answer,
      correct_answer: question.answer,
      isCorrect: isCorrect
    });

    attempt.total_answered += 1;
    if (isCorrect) {
      attempt.correct_count += 1;
    }

    // 🎯 ADAPTIVE: Only count answers AT CURRENT DIFFICULTY LEVEL
    const answersAtCurrentDifficulty = attempt.answers.filter(
      a => a.difficulty === attempt.current_difficulty
    );
    
    const recentAtDifficulty = answersAtCurrentDifficulty.slice(-4);
    const recentCorrect = recentAtDifficulty.filter(a => a.isCorrect).length;
    
    console.log(`📊 ADAPTIVE Performance at Difficulty ${attempt.current_difficulty}:`);
    console.log(`   - Total answered at this difficulty: ${answersAtCurrentDifficulty.length}`);
    console.log(`   - Recent 4: ${recentCorrect}/${recentAtDifficulty.length} correct`);
    console.log(`   - Pattern: ${recentAtDifficulty.map(a => a.isCorrect ? '✓' : '✗').join(' ')}`);
    
    // Check if at max difficulty and mastered it
    let shouldCompleteQuiz = false;
    
    if (attempt.current_difficulty === 5 && recentCorrect === 4 && recentAtDifficulty.length === 4) {
      console.log(`🏆 Mastered maximum difficulty!`);
      shouldCompleteQuiz = true;
    }
    // Increase difficulty if ALL 4 consecutive answers at current difficulty are correct
    else if (recentCorrect === 4 && recentAtDifficulty.length === 4 && attempt.current_difficulty < 5) {
      attempt.current_difficulty += 1;
      console.log(`✨ ADAPTIVE: Difficulty increased to ${attempt.current_difficulty} after 4 consecutive correct`);
    } 
    // Decrease difficulty if 3+ consecutive wrong answers
    else if (recentCorrect === 0 && recentAtDifficulty.length >= 3 && attempt.current_difficulty > 1) {
      attempt.current_difficulty -= 1;
      console.log(`📉 ADAPTIVE: Difficulty decreased to ${attempt.current_difficulty}`);
    }
    else {
      console.log(`➡️ ADAPTIVE: Staying at difficulty ${attempt.current_difficulty}`);
    }

    await attempt.save();

    res.json({
      success: true,
      data: {
        isCorrect,
        correct_answer: question.answer,
        new_difficulty: attempt.current_difficulty,
        correct_count: attempt.correct_count,
        total_answered: attempt.total_answered,
        questionsRemaining: 20 - attempt.total_answered,
        shouldComplete: shouldCompleteQuiz
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit answer' 
    });
  }
});

// Get quiz attempt results
router.get('/attempts/:attemptId/results', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await QuizAttempt.findOne({ 
      _id: attemptId, 
      userId 
    }).populate('quizId', 'title description adaptive_config quiz_level');

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz attempt not found' 
      });
    }

    const targetQuestions = 20;
    const accuracy = attempt.total_answered > 0 
      ? Math.round((attempt.correct_count / attempt.total_answered) * 100) 
      : 0;

    const difficultyProgression = attempt.answers.map((a, index) => ({
      questionNumber: index + 1,
      difficulty: a.difficulty,
      isCorrect: a.isCorrect
    }));

    res.json({
      success: true,
      data: {
        quizTitle: attempt.quizId.title,
        quizLevel: attempt.quizId.quiz_level,
        correct_count: attempt.correct_count,
        total_answered: attempt.total_answered,
        target_questions: targetQuestions,
        accuracy: accuracy,
        is_completed: attempt.is_completed,
        difficulty_progression: difficultyProgression,
        answers: attempt.answers,
        progressionData: attempt.progressionData,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get quiz results' 
    });
  }
});

// Get user's quiz attempts history
router.get('/my-attempts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const attempts = await QuizAttempt.find({ userId })
      .populate('quizId', 'title description adaptive_config quiz_level')
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    const validAttempts = attempts.filter(attempt => {
      if (!attempt.quizId) {
        console.warn(`Orphaned quiz attempt found: attemptId=${attempt._id}`);
        return false;
      }
      return true;
    });

    const attemptsWithStats = validAttempts.map(attempt => ({
      attemptId: attempt._id,
      quizTitle: attempt.quizId.title,
      quizLevel: attempt.quizId.quiz_level,
      correct_count: attempt.correct_count,
      total_answered: attempt.total_answered,
      target_questions: 20,
      accuracy: attempt.total_answered > 0 
        ? Math.round((attempt.correct_count / attempt.total_answered) * 100) 
        : 0,
      is_completed: attempt.is_completed,
      progressionData: attempt.progressionData,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt
    }));

    res.json({
      success: true,
      data: attemptsWithStats
    });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get quiz attempts' 
    });
  }
});

// Cancel/Reset incomplete quiz attempt
router.post('/attempts/:attemptId/cancel', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      userId
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    if (attempt.is_completed) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed quiz attempt'
      });
    }

    await QuizAttempt.deleteOne({ _id: attemptId });

    res.json({
      success: true,
      message: 'Quiz attempt cancelled successfully. You can now start a new attempt.'
    });
  } catch (error) {
    console.error('Cancel quiz attempt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel quiz attempt'
    });
  }
});

// Get student's current level for adaptive quiz
router.get('/student/level', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const mathProfile = await MathProfile.findOne({ student_id: userId });
    
    if (!mathProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found. Please complete placement quiz first.'
      });
    }
    
    res.json({
      success: true,
      data: {
        currentLevel: mathProfile.current_profile || 1,
        totalPoints: mathProfile.total_points || 0,
        placementCompleted: mathProfile.placement_completed || false,
        adaptiveQuizLevel: mathProfile.adaptive_quiz_level || mathProfile.current_profile || 1
      }
    });
  } catch (error) {
    console.error('Error fetching student level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student data'
    });
  }
});

module.exports = router;