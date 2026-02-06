const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

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
    const user = await User.findById(userId);
    
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
    
    const quizzes = await Quiz.find(query)
    .select('title description adaptive_config questions createdAt quiz_type is_launched launched_at launch_start_date launch_end_date launched_for_classes')
    .sort({ launched_at: -1 });

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
      return res.status(400).json({ 
        success: false, 
        error: 'You have an incomplete attempt. Please complete or cancel it first.',
        attemptId: existingAttempt._id
      });
    }

    // Create new quiz attempt
    const attempt = new QuizAttempt({
      userId,
      quizId,
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
      await attempt.save();

      return res.json({
        success: true,
        completed: true,
        message: 'Quiz completed!',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_correct_answers: targetCorrect
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
      await attempt.save();

      return res.json({
        success: true,
        completed: true,
        message: 'No more questions available. Quiz completed!',
        data: {
          correct_count: attempt.correct_count,
          total_answered: attempt.total_answered,
          target_correct_answers: targetCorrect
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

    // Add answer to attempt
    attempt.answers.push({
      questionId: question.question_id || question._id,
      question_text: question.text,
      difficulty: question.difficulty,
      answer: answer,
      correct_answer: question.answer,
      isCorrect: isCorrect
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
      isCorrect: a.isCorrect
    }));

    res.json({
      success: true,
      data: {
        quizTitle: attempt.quizId.title,
        correct_count: attempt.correct_count,
        total_answered: attempt.total_answered,
        target_correct_answers: targetCorrect,
        accuracy: accuracy,
        is_completed: attempt.is_completed,
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
    
    const attempts = await QuizAttempt.find({ userId })
      .populate('quizId', 'title description adaptive_config')
      .sort({ startedAt: -1 })
      .limit(20);

    const attemptsWithStats = attempts.map(attempt => ({
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

module.exports = router;
