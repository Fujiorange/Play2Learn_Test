// routes/mongoStudentRoutes.js - MongoDB Student Routes 
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==================== GET DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('📊 Dashboard request for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const usersCollection = db.collection('users');

    // Find student profile
    let student = await studentsCollection.findOne({ user_id: userId });

    // If student profile doesn't exist, create it automatically
    if (!student) {
      console.log('⚠️ Student profile not found, creating now...');
      
      const user = await usersCollection.findOne({ _id: userId });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.role.toLowerCase() !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'User is not a student'
        });
      }

      const timestamp = new Date();
      const newStudent = {
        user_id: userId,
        name: user.name,
        email: user.email,
        grade_level: user.gradeLevel || 'Primary 1',
        class: user.class || null,
        school_id: user.school_id || null,
        parent_id: null,
        points: 0,
        level: 1,
        current_profile: null,
        consecutive_fails: 0,
        placement_completed: false,
        streak: 0,
        total_quizzes: 0,
        average_score: 0,
        badges: [],
        achievements: [],
        last_active: timestamp,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      };

      const result = await studentsCollection.insertOne(newStudent);
      console.log('✅ Auto-created student profile:', result.insertedId);
      
      student = newStudent;
      student._id = result.insertedId;
    }

    console.log('✅ Student found:', student._id);

    // Get quiz results (excluding placement quizzes)
    const quizResultsCollection = db.collection('quiz_results');
    const quizResults = await quizResultsCollection.find({
      student_id: student._id,
      is_placement_quiz: { $ne: true }
    }).toArray();

    // Calculate stats from actual data
    const totalQuizzes = quizResults.length;
    const averageScore = totalQuizzes > 0
      ? Math.round(quizResults.reduce((sum, quiz) => sum + ((quiz.score / quiz.total_questions) * 100), 0) / totalQuizzes)
      : 0;

    // Get recent activity
    const recentActivity = await quizResultsCollection.find({
      student_id: student._id
    })
      .sort({ completed_at: -1 })
      .limit(5)
      .toArray();

    // Update student stats
    await studentsCollection.updateOne(
      { _id: student._id },
      {
        $set: {
          total_quizzes: totalQuizzes,
          average_score: averageScore,
          last_active: new Date(),
          updated_at: new Date()
        }
      }
    );

    console.log('✅ Dashboard data prepared');

    // Return dashboard data
    res.json({
      success: true,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        gradeLevel: student.grade_level,
        class: student.class,
        points: student.points || 0,
        level: student.level || 1,
        badges: student.badges || [],
        achievements: student.achievements || [],
        quizzesTaken: totalQuizzes,
        averageScore: averageScore,
        streak: student.streak || 0,
        placementCompleted: student.placement_completed || false,
        currentProfile: student.current_profile,
        recentActivity: recentActivity.map(activity => ({
          title: activity.quiz_title || activity.title,
          score: activity.score,
          completedAt: activity.completed_at,
          duration: activity.time_taken || activity.duration
        }))
      }
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard',
      details: error.message
    });
  }
});

// ==================== GET QUIZ RESULTS ====================
router.get('/quiz-results', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const quizResults = await quizResultsCollection.find({
      student_id: student._id
    })
      .sort({ completed_at: -1 })
      .toArray();

    res.json({
      success: true,
      data: quizResults.map(result => ({
        id: result._id,
        title: result.quiz_title || result.title,
        score: result.score,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        completedAt: result.completed_at,
        duration: result.time_taken || result.duration,
        isPlacement: result.is_placement_quiz || false
      }))
    });

  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz results'
    });
  }
});

// ==================== GET MATH PROFILE ====================
router.get('/math-profile', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('📊 Math profile request for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Check if placement completed
    if (!student.placement_completed) {
      return res.json({
        success: true,
        requiresPlacement: true,
        profile: null
      });
    }

    // Check daily quiz attempts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const quizResultsCollection = db.collection('quiz_results');
    const todayQuizzes = await quizResultsCollection.countDocuments({
      student_id: student._id,
      is_placement_quiz: { $ne: true },
      completed_at: { $gte: today }
    });

    const attemptsRemaining = Math.max(0, 2 - todayQuizzes);

    // Get profile info
    const currentProfile = student.current_profile || 1;

    res.json({
      success: true,
      requiresPlacement: false,
      profile: {
        current_profile: currentProfile,
        attemptsRemaining: attemptsRemaining,
        attemptsToday: todayQuizzes,
        number_range_min: 1,
        number_range_max: Math.min(currentProfile * 10, 100),
        operations: currentProfile >= 6 
          ? ['addition', 'subtraction', 'multiplication', 'division']
          : ['addition', 'subtraction'],
        pass_threshold: 70,
        fail_threshold: 50,
        profile_name: `Profile ${currentProfile}`,
        totalQuizzes: student.total_quizzes || 0,
        averageScore: student.average_score || 0
      }
    });

  } catch (error) {
    console.error('Math profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load math profile'
    });
  }
});

// ==================== GET MATH SKILLS ====================
router.get('/math-skills', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Get actual skills from database or initialize
    const skills = student.skills || [
      { skill_name: 'Addition', current_level: 0, xp: 0, max_level: 5, unlocked: true, percentage: 0 },
      { skill_name: 'Subtraction', current_level: 0, xp: 0, max_level: 5, unlocked: true, percentage: 0 },
      { skill_name: 'Multiplication', current_level: 0, xp: 0, max_level: 5, unlocked: student.current_profile >= 6, percentage: 0 },
      { skill_name: 'Division', current_level: 0, xp: 0, max_level: 5, unlocked: student.current_profile >= 6, percentage: 0 },
    ];

    res.json({
      success: true,
      skills: skills,
      currentProfile: student.current_profile || 1
    });

  } catch (error) {
    console.error('Math skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load math skills'
    });
  }
});

// ==================== GET MATH PROGRESS ====================
router.get('/math-progress', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Get recent quizzes from database
    const recentQuizzes = await quizResultsCollection.find({
      student_id: student._id
    })
      .sort({ completed_at: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      progressData: {
        currentProfile: student.current_profile || 1,
        profileProgress: ((student.current_profile || 1) / 10) * 100,
        totalQuizzes: student.total_quizzes || 0,
        averageScore: student.average_score || 0,
        streak: student.streak || 0,
        totalPoints: student.points || 0,
        profileHistory: [],
        recentQuizzes: recentQuizzes.map(q => ({
          date: q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'N/A',
          profile: q.profile_level || 1,
          score: q.score || 0,
          total: q.total_questions || 15
        }))
      }
    });

  } catch (error) {
    console.error('Math progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load math progress'
    });
  }
});

// ==================== GET LEADERBOARD ====================
router.get('/leaderboard', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');

    // Get all active students sorted by points from database
    const students = await studentsCollection.find({
      is_active: true
    })
      .sort({ points: -1 })
      .limit(50)
      .toArray();

    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      name: student.name,
      points: student.points || 0,
      level: student.level || 1,
      achievements: student.achievements?.length || 0,
      isCurrentUser: student.user_id.toString() === userId.toString()
    }));

    res.json({
      success: true,
      leaderboard: leaderboard
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load leaderboard'
    });
  }
});

// ==================== GET MATH QUIZ RESULTS ====================
router.get('/math-quiz-results', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const results = await quizResultsCollection.find({
      student_id: student._id,
      is_placement_quiz: { $ne: true }
    })
      .sort({ completed_at: -1 })
      .toArray();

    res.json({
      success: true,
      results: results.map(r => ({
        id: r._id,
        profile: r.profile_level || 1,
        score: r.score || 0,
        maxScore: r.total_questions || 15,
        questions: r.total_questions || 15,
        date: r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'N/A'
      }))
    });

  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz results'
    });
  }
});

// ==================== GET MATH QUIZ HISTORY ====================
router.get('/quiz-history', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const history = await quizResultsCollection.find({
      student_id: student._id
    })
      .sort({ completed_at: -1 })
      .toArray();

    res.json({
      success: true,
      history: history.map(h => ({
        id: h._id,
        profile: h.profile_level || 1,
        score: h.score || 0,
        maxScore: h.total_questions || 15,
        totalQuestions: h.total_questions || 15,
        date: h.completed_at ? new Date(h.completed_at).toLocaleDateString() : 'N/A',
        time: h.completed_at ? new Date(h.completed_at).toLocaleTimeString() : 'N/A',
        percentage: Math.round(((h.score || 0) / (h.total_questions || 15)) * 100)
      }))
    });

  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz history'
    });
  }
});

// ==================== PLACEMENT QUIZ - GENERATE ====================
router.post('/placement-quiz/generate', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('🎯 Generating placement quiz for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizzesCollection = db.collection('quizzes');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Check if placement already completed
    if (student.placement_completed) {
      return res.json({
        success: false,
        error: 'Placement quiz already completed'
      });
    }

    // Generate 20 random math questions with ALL 4 operations for comprehensive placement assessment
    const questions = [];
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    
    for (let i = 0; i < 20; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let num1, num2, answer;
      
      if (operation === 'addition') {
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} + ${num2} = ?`,
          correct_answer: answer
        });
      } else if (operation === 'subtraction') {
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} - ${num2} = ?`,
          correct_answer: answer
        });
      } else if (operation === 'multiplication') {
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} × ${num2} = ?`,
          correct_answer: answer
        });
      } else { // division
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = Math.floor(Math.random() * 12) + 1;
        num1 = num2 * answer; // Ensure clean division
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} ÷ ${num2} = ?`,
          correct_answer: answer
        });
      }
    }

    // Store quiz in database for validation later
    const quiz = {
      student_id: student._id,
      quiz_type: 'placement',
      questions: questions,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
    };

    const result = await quizzesCollection.insertOne(quiz);
    const quizId = result.insertedId;

    res.json({
      success: true,
      quiz_id: quizId.toString(),
      total_questions: 20,
      questions: questions.map(q => ({
        question_number: q.question_number,
        operation: q.operation,
        question_text: q.question_text
        // Don't send correct_answer to frontend
      }))
    });

  } catch (error) {
    console.error('❌ Generate placement quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate placement quiz'
    });
  }
});

// ==================== PLACEMENT QUIZ - SUBMIT ====================
router.post('/placement-quiz/submit', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { quiz_id, answers } = req.body;
    
    console.log('📤 Submitting placement quiz for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizzesCollection = db.collection('quizzes');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Get the stored quiz from database
    const quiz = await quizzesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(quiz_id),
      student_id: student._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found or expired'
      });
    }

    // Validate answers against stored questions
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (quiz.questions[index] && parseInt(answer) === quiz.questions[index].correct_answer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / 15) * 100);
    
    // Determine profile based on actual score
    let assignedProfile = 1;
    if (percentage >= 90) assignedProfile = 10;
    else if (percentage >= 80) assignedProfile = 8;
    else if (percentage >= 70) assignedProfile = 6;
    else if (percentage >= 60) assignedProfile = 5;
    else if (percentage >= 50) assignedProfile = 4;
    else if (percentage >= 40) assignedProfile = 3;
    else if (percentage >= 30) assignedProfile = 2;
    else assignedProfile = 1;

    // Save quiz result
    const quizResult = {
      student_id: student._id,
      quiz_id: quiz._id,
      quiz_title: 'Placement Quiz',
      profile_level: assignedProfile,
      score: correctCount,
      total_questions: 15,
      correct_answers: correctCount,
      is_placement_quiz: true,
      completed_at: new Date(),
      created_at: new Date()
    };

    await quizResultsCollection.insertOne(quizResult);

    // Update student profile
    await studentsCollection.updateOne(
      { _id: student._id },
      {
        $set: {
          placement_completed: true,
          current_profile: assignedProfile,
          level: assignedProfile,
          total_quizzes: 1,
          average_score: percentage,
          updated_at: new Date()
        }
      }
    );

    // Delete the quiz from database (cleanup)
    await quizzesCollection.deleteOne({ _id: quiz._id });

    res.json({
      success: true,
      result: {
        score: correctCount,
        total: 15,
        percentage: percentage,
        assigned_profile: assignedProfile,
        profile_changed: true,
        change_type: 'placement',
        new_profile: assignedProfile
      }
    });

  } catch (error) {
    console.error('❌ Submit placement quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit placement quiz'
    });
  }
});

// ==================== REGULAR QUIZ - GENERATE ====================
router.post('/quiz/generate', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('🎯 Generating regular quiz for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizzesCollection = db.collection('quizzes');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Check if placement completed
    if (!student.placement_completed) {
      return res.json({
        success: false,
        requiresPlacement: true,
        error: 'Please complete placement quiz first'
      });
    }

    // Check daily limit (2 quizzes per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const quizResultsCollection = db.collection('quiz_results');
    const todayQuizzes = await quizResultsCollection.countDocuments({
      student_id: student._id,
      is_placement_quiz: { $ne: true },
      completed_at: { $gte: today }
    });

    if (todayQuizzes >= 2) {
      return res.json({
        success: false,
        error: 'Daily quiz limit reached (2/2). Come back tomorrow at 12:00 AM SGT!'
      });
    }

    const currentProfile = student.current_profile || 1;
    
    // Generate 15 questions based on current profile
    const questions = [];
    const operations = currentProfile >= 6 
      ? ['addition', 'subtraction', 'multiplication', 'division']
      : ['addition', 'subtraction'];
    
    const maxNumber = Math.min(currentProfile * 10, 100);
    
    for (let i = 0; i < 15; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let num1, num2, answer;
      
      if (operation === 'addition') {
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;
        answer = num1 + num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} + ${num2} = ?`,
          correct_answer: answer
        });
      } else if (operation === 'subtraction') {
        num1 = Math.floor(Math.random() * maxNumber) + Math.floor(maxNumber/2);
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} - ${num2} = ?`,
          correct_answer: answer
        });
      } else if (operation === 'multiplication') {
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} × ${num2} = ?`,
          correct_answer: answer
        });
      } else { // division
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = Math.floor(Math.random() * 12) + 1;
        num1 = num2 * answer;
        questions.push({
          question_number: i + 1,
          operation: operation,
          question_text: `${num1} ÷ ${num2} = ?`,
          correct_answer: answer
        });
      }
    }

    // Store quiz in database for validation later
    const quiz = {
      student_id: student._id,
      quiz_type: 'regular',
      profile_level: currentProfile,
      questions: questions,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
    };

    const result = await quizzesCollection.insertOne(quiz);
    const quizId = result.insertedId;

    res.json({
      success: true,
      quiz_id: quizId.toString(),
      profile: currentProfile,
      total_questions: 15,
      attemptsToday: todayQuizzes + 1,
      questions: questions.map(q => ({
        question_number: q.question_number,
        operation: q.operation,
        question_text: q.question_text
        // Don't send correct_answer to frontend
      }))
    });

  } catch (error) {
    console.error('❌ Generate quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz'
    });
  }
});

// ==================== REGULAR QUIZ - SUBMIT ====================
router.post('/quiz/submit', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { quiz_id, answers } = req.body;
    
    console.log('📤 Submitting quiz for userId:', userId);

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const quizzesCollection = db.collection('quizzes');
    const quizResultsCollection = db.collection('quiz_results');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    // Get the stored quiz from database
    const quiz = await quizzesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(quiz_id),
      student_id: student._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found or expired'
      });
    }

    const currentProfile = quiz.profile_level;

    // Validate answers against stored questions
    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (quiz.questions[index] && parseInt(answer) === quiz.questions[index].correct_answer) {
        correctCount++;
      }
    });
    
    const percentage = Math.round((correctCount / 15) * 100);
    
    // Profile progression logic based on actual score
    let newProfile = currentProfile;
    let profileChanged = false;
    let changeType = null;
    let consecutiveFails = student.consecutive_fails || 0;

    if (percentage >= 70) {
      // Advance to next profile (if not at max)
      if (currentProfile < 10) {
        newProfile = currentProfile + 1;
        profileChanged = true;
        changeType = 'advance';
      }
      consecutiveFails = 0;
    } else if (percentage < 50) {
      // Increment fail counter
      consecutiveFails++;
      if (consecutiveFails >= 6 && currentProfile > 1) {
        newProfile = currentProfile - 1;
        profileChanged = true;
        changeType = 'demote';
        consecutiveFails = 0;
      }
    } else {
      // 50-69% - stay at current profile
      consecutiveFails = 0;
    }

    // Save quiz result
    const quizResult = {
      student_id: student._id,
      quiz_id: quiz._id,
      quiz_title: `Profile ${currentProfile} Quiz`,
      profile_level: currentProfile,
      score: correctCount,
      total_questions: 15,
      correct_answers: correctCount,
      is_placement_quiz: false,
      completed_at: new Date(),
      created_at: new Date()
    };

    await quizResultsCollection.insertOne(quizResult);

    // Update student stats
    const totalQuizzes = (student.total_quizzes || 0) + 1;
    const avgScore = Math.round(((student.average_score || 0) * (totalQuizzes - 1) + percentage) / totalQuizzes);

    await studentsCollection.updateOne(
      { _id: student._id },
      {
        $set: {
          current_profile: newProfile,
          level: newProfile,
          consecutive_fails: consecutiveFails,
          total_quizzes: totalQuizzes,
          average_score: avgScore,
          points: (student.points || 0) + correctCount * 10,
          updated_at: new Date()
        }
      }
    );

    // Delete the quiz from database (cleanup)
    await quizzesCollection.deleteOne({ _id: quiz._id });

    res.json({
      success: true,
      result: {
        score: correctCount,
        total: 15,
        percentage: percentage,
        profile_changed: profileChanged,
        change_type: changeType,
        old_profile: currentProfile,
        new_profile: newProfile,
        consecutive_fails: consecutiveFails,
        points_earned: correctCount * 10
      }
    });

  } catch (error) {
    console.error('❌ Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
});

// ==================== GET ASSIGNMENTS ====================
router.get('/assignments', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('assignments');
    const studentsCollection = db.collection('students');

    const student = await studentsCollection.findOne({ user_id: userId });
    
    if (!student) {
      return res.json({
        success: true,
        assignments: []
      });
    }

    // Get actual assignments from database
    const assignments = await assignmentsCollection.find({
      $or: [
        { student_id: student._id },
        { class_id: student.class },
        { school_id: student.school_id }
      ]
    }).toArray();

    res.json({
      success: true,
      assignments: assignments
    });
  } catch (error) {
    console.error('Assignments error:', error);
    res.json({
      success: true,
      assignments: []
    });
  }
});

// ==================== GET SUPPORT TICKETS ====================
router.get('/support-tickets', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const ticketsCollection = db.collection('support_tickets');

    // Get actual support tickets from database
    const tickets = await ticketsCollection.find({
      user_id: userId
    })
      .sort({ created_at: -1 })
      .toArray();

    res.json({
      success: true,
      tickets: tickets
    });
  } catch (error) {
    console.error('Support tickets error:', error);
    res.json({
      success: true,
      tickets: []
    });
  }
});

// ==================== CREATE SUPPORT TICKET ====================
router.post('/support-ticket', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { category, priority, subject, description } = req.body;
    
    const db = mongoose.connection.db;
    const ticketsCollection = db.collection('support_tickets');
    
    // Create actual ticket in database
    const ticket = {
      user_id: userId,
      category: category,
      priority: priority,
      subject: subject,
      description: description,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await ticketsCollection.insertOne(ticket);
    
    res.json({
      success: true,
      ticketId: result.insertedId.toString(),
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

// ==================== CREATE TESTIMONIAL ====================
router.post('/testimonial', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { title, rating, testimonial, displayName, allowPublic } = req.body;
    
    const db = mongoose.connection.db;
    const testimonialsCollection = db.collection('testimonials');
    
    // Create actual testimonial in database
    const testimonialDoc = {
      user_id: userId,
      title: title,
      rating: rating,
      testimonial: testimonial,
      display_name: displayName,
      allow_public: allowPublic,
      created_at: new Date()
    };

    await testimonialsCollection.insertOne(testimonialDoc);
    
    res.json({
      success: true,
      message: 'Testimonial submitted successfully'
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit testimonial'
    });
  }
});

// ==================== GET PROFILE ====================
router.get('/profile', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        contact: user.contact,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        is_active: user.is_active,
        points: user.points || 0
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile'
    });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { name, gradeLevel, class: className } = req.body;

    const db = mongoose.connection.db;
    const studentsCollection = db.collection('students');
    const usersCollection = db.collection('users');

    const updateData = {
      updated_at: new Date()
    };

    if (name) updateData.name = name;
    if (gradeLevel) updateData.grade_level = gradeLevel;
    if (className !== undefined) updateData.class = className;

    const result = await studentsCollection.updateOne(
      { user_id: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    if (name) {
      await usersCollection.updateOne(
        { _id: userId },
        { $set: { name: name } }
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;