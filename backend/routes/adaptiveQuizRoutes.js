const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const MathSkill = require('../models/MathSkill');
const MathProfile = require('../models/MathProfile');
const SkillPointsConfig = require('../models/SkillPointsConfig');
const StudentProfile = require('../models/StudentProfile');
const quizGenerationService = require('../services/quizGenerationService');
const {
  calculatePerformanceScore,
  calculatePerformanceScoreLegacy,
  determineNextLevel,
  calculateAverageTime,
  calculateTotalTime,
  getPerformanceRating
} = require('../utils/performanceCalculator');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Constants
const MAX_PERFORMANCE_HISTORY_LENGTH = 20;

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
  { level: 0, min: 0, max: 25 },      // Level 0: 0-24 points
  { level: 1, min: 25, max: 50 },     // Level 1: 25-49 points
  { level: 2, min: 50, max: 100 },    // Level 2: 50-99 points
  { level: 3, min: 100, max: 200 },   // Level 3: 100-199 points
  { level: 4, min: 200, max: 400 },   // Level 4: 200-399 points
  { level: 5, min: 400, max: Infinity } // Level 5: 400+ points (max level)
];

// Helper function to calculate level from points
function calculateLevelFromPoints(points) {
  // Find the highest level threshold that the points meet
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].min) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 0;
}

// Helper function to update skills from adaptive quiz answers
async function updateSkillsFromAdaptiveQuiz(userId, answers) {
  try {
    // Get skill points configuration
    let pointsConfig;
    try {
      pointsConfig = await SkillPointsConfig.getConfig();
    } catch (err) {
      console.log("Using default points configuration for adaptive quiz");
      pointsConfig = { difficultyPoints: getDefaultDifficultyPoints() };
    }
    
    const difficultyPoints = pointsConfig.difficultyPoints || getDefaultDifficultyPoints();
    
    // Calculate points change for each skill/topic
    const skillUpdates = {};

    answers.forEach((answer) => {
      // Get topic from the answer - prefer explicit topic from question metadata
      // The topic field should be set on the question when it's created in the quiz
      let topic = answer.topic || 'General';
      
      // Fallback: If no explicit topic, try basic pattern matching as last resort
      // Note: This is a best-effort fallback and may not be accurate for all questions
      // Ideally, all questions should have explicit topic metadata set
      if (!topic || topic === 'General' || topic === '') {
        const questionText = (answer.question_text || '').toLowerCase();
        // Only use pattern matching for simple arithmetic operators
        if (questionText.includes('+')) {
          topic = 'Addition';
        } else if (questionText.includes('-') && !questionText.includes('subtract')) {
          // Check for minus sign without the word 'subtract' to avoid double matching
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
        // If still 'General', keep it as the default fallback topic
      }
      
      // Capitalize first letter
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);
      
      // Get difficulty level (default to 3 if not specified)
      const difficulty = answer.difficulty || 3;
      const difficultyStr = String(difficulty);
      
      // Get points for this difficulty level
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
    
    // Fetch all existing skills
    const existingSkills = await MathSkill.find({ 
      student_id: userId, 
      skill_name: { $in: topicNames } 
    });
    
    const skillMap = new Map(existingSkills.map(s => [s.skill_name, s]));
    const bulkOps = [];

    for (const [topicName, stats] of Object.entries(skillUpdates)) {
      const skillPercentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      // XP is still calculated and stored for backward compatibility and display purposes
      // but is no longer used for level calculation (points are used instead)
      const xpGain = Math.floor(skillPercentage / 10);

      const existingSkill = skillMap.get(topicName);
      
      if (existingSkill) {
        // Update existing skill
        const newXp = existingSkill.xp + xpGain;
        
        // Calculate new points (minimum 0 - cannot go negative)
        const currentPoints = existingSkill.points || 0;
        const newPoints = Math.max(0, currentPoints + stats.pointsChange);
        
        // Calculate level based on points using helper function
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
        // Insert new skill
        const newXp = xpGain;
        const newPoints = Math.max(0, stats.pointsChange);
        
        // Calculate level based on points using helper function
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

    // Execute all updates
    if (bulkOps.length > 0) {
      await MathSkill.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("Error updating skills from adaptive quiz:", error);
  }
}

// Helper function to update streak and points when adaptive quiz is completed
async function updateStreakAndPointsOnQuizCompletion(userId, correctCount, totalAnswered) {
  try {
    const mathProfile = await MathProfile.findOne({ student_id: userId });
    
    // Calculate points: 10 points per correct answer
    const pointsEarned = Math.max(0, correctCount * 10);
    
    if (!mathProfile) {
      // Create profile if doesn't exist
      const newProfile = new MathProfile({
        student_id: userId,
        streak: 1,
        last_mid: new Date(),
        total_points: pointsEarned
      });
      await newProfile.save();
      return;
    }

    // Check if last quiz was yesterday or today
    const now = new Date();
    const lastQuizDate = mathProfile.last_mid ? new Date(mathProfile.last_mid) : null;
    
    if (!lastQuizDate) {
      // First quiz
      mathProfile.streak = 1;
    } else {
      const diffDays = Math.floor((now - lastQuizDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, keep streak as is
        // Do nothing
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        mathProfile.streak = (mathProfile.streak || 0) + 1;
      } else {
        // Gap in days, reset streak
        mathProfile.streak = 1;
      }
    }

    // Update last quiz date and add points
    mathProfile.last_mid = now;
    mathProfile.total_points = (mathProfile.total_points || 0) + pointsEarned;
    await mathProfile.save();
  } catch (error) {
    console.error("Error updating streak and points:", error);
  }
}

// Helper function to calculate performance and update student progress
async function finalizeQuizCompletion(userId, attempt, quizLevel) {
  try {
    // Get user for character type
    const user = await User.findById(userId);
    const characterType = user?.gender === 'male' ? 'male' : 
                          user?.gender === 'female' ? 'female' : 'neutral';
    
    // Calculate performance score using legacy function for backward compatibility
    const performanceScore = calculatePerformanceScoreLegacy(attempt.answers, quizLevel);
    
    // Get current level from student profile
    let studentProfile = await StudentProfile.findOne({ userId });
    const currentLevel = studentProfile?.currentLevel || quizLevel;
    
    // Determine next level with 2-level skip cap
    const nextLevel = determineNextLevel(performanceScore, currentLevel);
    
    // Calculate time metrics
    const totalTime = calculateTotalTime(attempt.answers);
    const avgTime = calculateAverageTime(attempt.answers);
    
    // Update attempt with performance metrics
    attempt.performanceScore = performanceScore;
    attempt.nextLevel = nextLevel;
    attempt.timeSpent = totalTime;
    
    // Update or create student profile with new level and gameboard data
    if (!studentProfile) {
      studentProfile = new StudentProfile({
        userId,
        currentLevel: nextLevel,
        gameboard_position: nextLevel,
        character_type: characterType,
        lastQuizTaken: new Date(),
        performanceHistory: [{
          quizLevel,
          performanceScore,
          completedAt: new Date()
        }],
        quiz_history: [{
          level_attempted: quizLevel,
          P_score: performanceScore,
          next_level: nextLevel,
          timestamp: new Date()
        }]
      });
    } else {
      // Set character type if not already set
      if (!studentProfile.character_type) {
        studentProfile.character_type = characterType;
      }
      
      studentProfile.currentLevel = nextLevel;
      studentProfile.gameboard_position = nextLevel;
      studentProfile.lastQuizTaken = new Date();
      
      // Add to performance history
      studentProfile.performanceHistory.push({
        quizLevel,
        performanceScore,
        completedAt: new Date()
      });
      
      // Add to quiz history for gameboard tracking
      studentProfile.quiz_history.push({
        level_attempted: quizLevel,
        P_score: performanceScore,
        next_level: nextLevel,
        timestamp: new Date()
      });
      
      // Keep only last MAX_PERFORMANCE_HISTORY_LENGTH performance records
      if (studentProfile.performanceHistory.length > MAX_PERFORMANCE_HISTORY_LENGTH) {
        studentProfile.performanceHistory = studentProfile.performanceHistory.slice(-MAX_PERFORMANCE_HISTORY_LENGTH);
      }
      
      // Keep only last 50 quiz history records
      if (studentProfile.quiz_history.length > 50) {
        studentProfile.quiz_history = studentProfile.quiz_history.slice(-50);
      }
    }
    
    await studentProfile.save();
    
    // Automatically generate/ensure quiz exists and is launched for next level
    // This applies whether student is advancing, staying, or going back a level
    try {
      // Check if quiz exists for next level
      const existingNextQuiz = await Quiz.findOne({
        quiz_level: nextLevel,
        quiz_type: 'adaptive',
        is_active: true
      });
      
      if (!existingNextQuiz) {
        // Auto-generate quiz for next level
        console.log(`Auto-generating quiz for level ${nextLevel} for student ${userId}`);
        const newQuiz = await quizGenerationService.generateQuiz(
          nextLevel,
          userId,
          nextLevel === quizLevel ? 'repeat_level' : 'auto_progression',
          false
        );
        
        // Auto-launch the quiz (make it available for the student)
        newQuiz.is_launched = true;
        newQuiz.launched_at = new Date();
        newQuiz.launched_by = null; // System-launched
        await newQuiz.save();
        
        console.log(`Quiz for level ${nextLevel} auto-generated and launched`);
      } else if (!existingNextQuiz.is_launched) {
        // If quiz exists but not launched, auto-launch it
        existingNextQuiz.is_launched = true;
        existingNextQuiz.launched_at = new Date();
        existingNextQuiz.launched_by = null; // System-launched
        await existingNextQuiz.save();
        
        console.log(`Quiz for level ${nextLevel} auto-launched`);
      }
    } catch (genError) {
      console.error(`Error auto-generating/launching quiz for level ${nextLevel}:`, genError.message);
      // Don't fail the completion if quiz generation fails
    }
    
    return {
      performanceScore,
      nextLevel,
      totalTime,
      avgTime,
      rating: getPerformanceRating(performanceScore)
    };
  } catch (error) {
    console.error("Error finalizing quiz completion:", error);
    throw error;
  }
}

// Helper function to check if a quiz is available for a student
const isQuizAvailableForStudent = async (quiz, userId) => {
  // If quiz is not launched, it's not available
  if (!quiz.is_launched) {
    return { available: false, reason: 'Quiz has not been launched yet' };
  }
  
  // Check date range if set
  const now = new Date();
  if (quiz.launch_start_date && now < quiz.launch_start_date) {
    return { available: false, reason: 'Quiz has not started yet' };
  }
  if (quiz.launch_end_date && now > quiz.launch_end_date) {
    return { available: false, reason: 'Quiz has ended' };
  }
  
  // Get user's class
  const user = await User.findById(userId);
  if (!user) {
    return { available: false, reason: 'User not found' };
  }
  
  // Check if user's class is in the launched classes
  if (quiz.launched_for_classes && quiz.launched_for_classes.length > 0) {
    if (!quiz.launched_for_classes.includes(user.class)) {
      return { available: false, reason: 'Quiz not available for your class' };
    }
  }
  
  return { available: true };
};

// Get all available adaptive quizzes (for students - only launched ones)
router.get('/quizzes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Use lean() for read-only query to improve performance
    const user = await User.findById(userId).lean();
    
    // Build query - show only launched quizzes for the student's class
    const now = new Date();
    let query = { 
      quiz_type: 'adaptive',
      is_active: true,
      is_launched: true,
      $or: [
        { launch_start_date: null },
        { launch_start_date: { $lte: now } }
      ]
    };
    
    // Add end date check
    query.$and = [
      {
        $or: [
          { launch_end_date: null },
          { launch_end_date: { $gte: now } }
        ]
      }
    ];
    
    // If user has a class, filter by class
    if (user && user.class) {
      query.$and.push({
        $or: [
          { launched_for_classes: { $size: 0 } }, // No specific classes
          { launched_for_classes: user.class }     // Or includes user's class
        ]
      });
    }
    
    // Use lean() for read-only query to improve performance
    const quizzes = await Quiz.find(query)
    .select('title description adaptive_config questions createdAt quiz_type is_launched launched_at launch_start_date launch_end_date launched_for_classes')
    .sort({ launched_at: -1 })
    .lean();

    // Count questions by difficulty for each quiz
    const quizzesWithStats = quizzes.map(quiz => {
      const difficultyCount = {};
      quiz.questions.forEach(q => {
        const diff = q.difficulty || 3;
        difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
      });

      return {
        _id: quiz._id,
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

// Start an adaptive quiz attempt
router.post('/quizzes/:quizId/start', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    if (quiz.quiz_type !== 'adaptive') {
      return res.status(400).json({ 
        success: false, 
        error: 'This is not an adaptive quiz' 
      });
    }

    // Check if quiz is launched and available for this student
    const availability = await isQuizAvailableForStudent(quiz, userId);
    if (!availability.available) {
      return res.status(403).json({
        success: false,
        error: availability.reason
      });
    }

    // Check if user has an incomplete attempt
    const existingAttempt = await QuizAttempt.findOne({
      userId,
      quizId,
      is_completed: false
    });

    if (existingAttempt) {
      // If the incomplete attempt was started more than 24 hours ago, automatically delete it
      const timeElapsed = new Date() - new Date(existingAttempt.startedAt);
      const hoursElapsed = timeElapsed / (1000 * 60 * 60);
      
      if (hoursElapsed > 24) {
        console.log(`Deleting stale incomplete attempt for user ${userId}, quiz ${quizId}`);
        await QuizAttempt.deleteOne({ _id: existingAttempt._id });
      } else {
        // Incomplete attempt is still recent - return error
        return res.status(400).json({ 
          success: false, 
          error: 'You have an incomplete attempt. Please complete or cancel it first.',
          attemptId: existingAttempt._id
        });
      }
    }

    // Create new quiz attempt with quiz level
    const attempt = new QuizAttempt({
      userId,
      quizId,
      quizLevel: quiz.quiz_level || 1,
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
        target_correct_answers: quiz.adaptive_config?.target_correct_answers || 10,
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

// Get next question for adaptive quiz
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

    // Check if target is reached
    const targetCorrect = quiz.adaptive_config?.target_correct_answers || 10;
    if (attempt.correct_count >= targetCorrect) {
      attempt.is_completed = true;
      attempt.completedAt = new Date();
      attempt.score = attempt.correct_count;
      
      // Calculate performance metrics and update student progress
      const performanceMetrics = await finalizeQuizCompletion(userId, attempt, attempt.quizLevel || quiz.quiz_level || 1);
      await attempt.save();
      
      // Update skill matrix based on answers
      await updateSkillsFromAdaptiveQuiz(userId, attempt.answers);
      
      // Update streak and award points when quiz is completed
      await updateStreakAndPointsOnQuizCompletion(userId, attempt.correct_count, attempt.total_answered);

      return res.json({
        success: true,
        completed: true,
        message: 'Quiz completed!',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_correct_answers: targetCorrect,
          performanceScore: performanceMetrics.performanceScore,
          nextLevel: performanceMetrics.nextLevel,
          currentLevel: attempt.quizLevel || quiz.quiz_level || 1,
          averageTime: performanceMetrics.avgTime,
          totalTime: performanceMetrics.totalTime,
          rating: performanceMetrics.rating
        }
      });
    }

    // Get already answered question IDs
    const answeredIds = attempt.answers.map(a => a.questionId.toString());

    // Find questions at current difficulty that haven't been answered
    const availableQuestions = quiz.questions.filter(q => 
      q.difficulty === attempt.current_difficulty && 
      !answeredIds.includes(q.question_id?.toString() || q._id.toString())
    );

    // If no questions at current difficulty, try adjacent difficulties
    let nextQuestion = null;
    if (availableQuestions.length > 0) {
      nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    } else {
      // Try difficulty +1 or -1
      const alternativeDifficulties = [
        attempt.current_difficulty + 1,
        attempt.current_difficulty - 1
      ].filter(d => d >= 1 && d <= 5);

      for (const altDiff of alternativeDifficulties) {
        const altQuestions = quiz.questions.filter(q => 
          q.difficulty === altDiff && 
          !answeredIds.includes(q.question_id?.toString() || q._id.toString())
        );
        
        if (altQuestions.length > 0) {
          nextQuestion = altQuestions[Math.floor(Math.random() * altQuestions.length)];
          break;
        }
      }
    }

    if (!nextQuestion) {
      // No more questions available, complete the quiz
      attempt.is_completed = true;
      attempt.completedAt = new Date();
      attempt.score = attempt.correct_count;
      
      // Calculate performance metrics and update student progress
      const performanceMetrics = await finalizeQuizCompletion(userId, attempt, attempt.quizLevel || quiz.quiz_level || 1);
      await attempt.save();
      
      // Update skill matrix based on answers
      await updateSkillsFromAdaptiveQuiz(userId, attempt.answers);
      
      // Update streak and award points when quiz is completed
      await updateStreakAndPointsOnQuizCompletion(userId, attempt.correct_count, attempt.total_answered);

      return res.json({
        success: true,
        completed: true,
        message: 'No more questions available. Quiz completed!',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_correct_answers: targetCorrect,
          performanceScore: performanceMetrics.performanceScore,
          nextLevel: performanceMetrics.nextLevel,
          currentLevel: attempt.quizLevel || quiz.quiz_level || 1,
          averageTime: performanceMetrics.avgTime,
          totalTime: performanceMetrics.totalTime,
          rating: performanceMetrics.rating
        }
      });
    }

    res.json({
      success: true,
      completed: false,
      data: {
        question: {
          id: nextQuestion.question_id || nextQuestion._id,
          text: nextQuestion.text,
          choices: nextQuestion.choices,
          difficulty: nextQuestion.difficulty
        },
        progress: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_correct_answers: targetCorrect,
          current_difficulty: attempt.current_difficulty
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

// Submit answer for current question
router.post('/attempts/:attemptId/submit-answer', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer, timeSpent } = req.body;
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

    // Find the question in the quiz
    const question = quiz.questions.find(q => 
      (q.question_id?.toString() === questionId) || (q._id.toString() === questionId)
    );

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found in quiz' 
      });
    }

    // Check if question already answered
    const alreadyAnswered = attempt.answers.some(a => 
      a.questionId.toString() === questionId
    );

    if (alreadyAnswered) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question already answered' 
      });
    }

    // Check answer
    const isCorrect = answer.toString().trim().toLowerCase() === question.answer.toString().trim().toLowerCase();

    // Add answer to attempt with time tracking
    attempt.answers.push({
      questionId: question.question_id || question._id,
      question_text: question.text,
      difficulty: question.difficulty,
      answer: answer,
      correct_answer: question.answer,
      isCorrect: isCorrect,
      timeSpent: timeSpent || null
    });

    attempt.total_answered += 1;
    if (isCorrect) {
      attempt.correct_count += 1;
    }

    // Adjust difficulty based on performance and progression strategy
    const progression = quiz.adaptive_config?.difficulty_progression || 'gradual';
    
    if (progression === 'immediate') {
      // Immediate: increase on correct, decrease on incorrect
      if (isCorrect && attempt.current_difficulty < 5) {
        attempt.current_difficulty += 1;
      } else if (!isCorrect && attempt.current_difficulty > 1) {
        attempt.current_difficulty -= 1;
      }
    } else if (progression === 'gradual') {
      // Gradual: adjust based on recent performance (last 3 answers)
      const recentAnswers = attempt.answers.slice(-3);
      const recentCorrect = recentAnswers.filter(a => a.isCorrect).length;
      
      if (recentCorrect >= 2 && attempt.current_difficulty < 5) {
        attempt.current_difficulty += 1;
      } else if (recentCorrect <= 1 && attempt.current_difficulty > 1 && recentAnswers.length >= 3) {
        attempt.current_difficulty -= 1;
      }
    } else if (progression === 'ml-based') {
      // ML-based: Simple algorithm based on overall accuracy
      const accuracy = attempt.correct_count / attempt.total_answered;
      const targetDifficulty = Math.min(5, Math.max(1, Math.ceil(accuracy * 5)));
      
      // Gradually move towards target difficulty
      if (targetDifficulty > attempt.current_difficulty && attempt.current_difficulty < 5) {
        attempt.current_difficulty += 1;
      } else if (targetDifficulty < attempt.current_difficulty && attempt.current_difficulty > 1) {
        attempt.current_difficulty -= 1;
      }
    }

    await attempt.save();

    res.json({
      success: true,
      data: {
        isCorrect,
        correct_answer: question.answer,
        new_difficulty: attempt.current_difficulty,
        correct_count: attempt.correct_count,
        total_answered: attempt.total_answered
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
    }).populate('quizId', 'title description adaptive_config');

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz attempt not found' 
      });
    }

    const targetCorrect = attempt.quizId.adaptive_config?.target_correct_answers || 10;
    const accuracy = attempt.total_answered > 0 
      ? Math.round((attempt.correct_count / attempt.total_answered) * 100) 
      : 0;

    // Calculate difficulty progression
    const difficultyProgression = attempt.answers.map((a, index) => ({
      questionNumber: index + 1,
      difficulty: a.difficulty,
      isCorrect: a.isCorrect,
      timeSpent: a.timeSpent
    }));

    // Calculate time metrics
    const totalTime = calculateTotalTime(attempt.answers);
    const avgTime = calculateAverageTime(attempt.answers);

    res.json({
      success: true,
      data: {
        quizTitle: attempt.quizId.title,
        quizLevel: attempt.quizLevel,
        correct_count: attempt.correct_count,
        total_answered: attempt.total_answered,
        target_correct_answers: targetCorrect,
        accuracy: accuracy,
        is_completed: attempt.is_completed,
        performanceScore: attempt.performanceScore || 0,
        nextLevel: attempt.nextLevel,
        averageTime: avgTime,
        totalTime: totalTime,
        rating: attempt.performanceScore ? getPerformanceRating(attempt.performanceScore) : 'N/A',
        difficulty_progression: difficultyProgression,
        answers: attempt.answers,
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
    
    // Use lean() for read-only query to improve performance
    const attempts = await QuizAttempt.find({ userId })
      .populate('quizId', 'title description adaptive_config')
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    // Filter out attempts with missing quiz references and log them for debugging
    const validAttempts = attempts.filter(attempt => {
      if (!attempt.quizId) {
        console.warn(`Orphaned quiz attempt found: attemptId=${attempt._id}, quizId reference is null`);
        return false;
      }
      return true;
    });

    const attemptsWithStats = validAttempts.map(attempt => ({
      attemptId: attempt._id,
      quizTitle: attempt.quizId.title,
      correct_count: attempt.correct_count,
      total_answered: attempt.total_answered,
      target_correct_answers: attempt.quizId.adaptive_config?.target_correct_answers || 10,
      accuracy: attempt.total_answered > 0 
        ? Math.round((attempt.correct_count / attempt.total_answered) * 100) 
        : 0,
      is_completed: attempt.is_completed,
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

    // Delete the incomplete attempt
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

// Get student's current level and performance history
router.get('/student/level', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user for character type
    const user = await User.findById(userId);
    const characterType = user?.gender === 'male' ? 'male' : 
                          user?.gender === 'female' ? 'female' : 'neutral';
    
    let studentProfile = await StudentProfile.findOne({ userId });
    
    if (!studentProfile) {
      // Create default profile if it doesn't exist
      studentProfile = new StudentProfile({
        userId,
        currentLevel: 1,
        gameboard_position: 1,
        character_type: characterType
      });
      await studentProfile.save();
    } else if (!studentProfile.character_type) {
      // Update character type if not set
      studentProfile.character_type = characterType;
      await studentProfile.save();
    }
    
    res.json({
      success: true,
      data: {
        currentLevel: studentProfile.currentLevel,
        gameboard_position: studentProfile.gameboard_position || studentProfile.currentLevel,
        character_type: studentProfile.character_type || characterType,
        totalPoints: studentProfile.totalPoints,
        lastQuizTaken: studentProfile.lastQuizTaken,
        performanceHistory: studentProfile.performanceHistory || [],
        quiz_history: studentProfile.quiz_history || []
      }
    });
  } catch (error) {
    console.error('Get student level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get student level'
    });
  }
});

// Get quiz for a specific level (auto-generates if needed)
router.get('/quizzes/level/:level', authenticateToken, async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const userId = req.user.userId;
    
    if (isNaN(level) || level < 1 || level > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid level. Must be between 1 and 10'
      });
    }
    
    // Try to find existing quiz for this level
    let quiz = await Quiz.findOne({
      quiz_level: level,
      quiz_type: 'adaptive',
      is_active: true,
      is_launched: true
    });
    
    // If no quiz exists, try to generate one
    if (!quiz) {
      try {
        console.log(`No quiz found for level ${level}, attempting to generate...`);
        quiz = await quizGenerationService.generateQuiz(
          level,
          userId,
          'on_demand',
          false
        );
        
        // Auto-launch the generated quiz
        quiz.is_launched = true;
        quiz.launched_at = new Date();
        quiz.launched_by = null;
        await quiz.save();
        
        console.log(`Quiz for level ${level} generated and auto-launched`);
      } catch (genError) {
        return res.status(500).json({
          success: false,
          error: `Failed to generate quiz for level ${level}: ${genError.message}`
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        quiz_level: quiz.quiz_level,
        total_questions: quiz.questions.length,
        target_correct_answers: quiz.adaptive_config?.target_correct_answers || 10,
        difficulty_progression: quiz.adaptive_config?.difficulty_progression || 'gradual'
      }
    });
  } catch (error) {
    console.error('Get quiz by level error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quiz for level'
    });
  }
});

module.exports = router;
