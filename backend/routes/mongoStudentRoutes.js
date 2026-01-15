// routes/mongoStudentRoutes.js
// MongoDB Student Routes for Play2Learn

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    // Get student data
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.json({
        success: true,
        dashboardData: {
          totalPoints: 0,
          level: 1,
          currentProfile: 1,
          streak: 0,
          totalQuizzes: 0,
          averageScore: 0
        }
      });
    }

    // Get quiz stats
    const quizzes = await db.collection('quiz_attempts').find({ 
      student_id: student._id 
    }).toArray();

    const totalQuizzes = quizzes.length;
    const averageScore = totalQuizzes > 0 
      ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
      : 0;

    res.json({
      success: true,
      dashboardData: {
        totalPoints: student.points || 0,
        level: student.level || 1,
        currentProfile: student.current_profile || 1,
        streak: student.streak || 0,
        totalQuizzes,
        averageScore,
        gradeLevel: student.grade_level || 'Primary 1'
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ==================== MATH PROFILE ====================
router.get('/math-profile', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const currentProfile = student.current_profile || 1;
    
    // Profile configurations
    const profileConfig = {
      1: { range: [1, 10], ops: ['addition', 'subtraction'] },
      2: { range: [1, 20], ops: ['addition', 'subtraction'] },
      3: { range: [1, 30], ops: ['addition', 'subtraction'] },
      4: { range: [1, 40], ops: ['addition', 'subtraction'] },
      5: { range: [1, 50], ops: ['addition', 'subtraction'] },
      6: { range: [1, 60], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      7: { range: [1, 70], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      8: { range: [1, 80], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      9: { range: [1, 90], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      10: { range: [1, 100], ops: ['addition', 'subtraction', 'multiplication', 'division'] }
    };

    const config = profileConfig[currentProfile];
    
    // Get today's attempts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attemptsToday = await db.collection('quiz_attempts').countDocuments({
      student_id: student._id,
      created_at: { $gte: today }
    });

    // Get last quiz score
    const lastQuiz = await db.collection('quiz_attempts')
      .find({ student_id: student._id })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    res.json({
      success: true,
      profile: {
        current_profile: currentProfile,
        profile_name: `Profile ${currentProfile}`,
        number_range_min: config.range[0],
        number_range_max: config.range[1],
        operations: config.ops,
        pass_threshold: 70,
        fail_threshold: 50,
        attemptsToday: attemptsToday,
        lastScore: lastQuiz.length > 0 ? {
          score: lastQuiz[0].score,
          total_questions: lastQuiz[0].total_questions,
          percentage: lastQuiz[0].percentage
        } : null
      }
    });
  } catch (error) {
    console.error('Math profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to load math profile' });
  }
});

// ==================== MATH PROGRESS ====================
router.get('/math-progress', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Get quiz history
    const quizzes = await db.collection('quiz_attempts')
      .find({ student_id: student._id })
      .sort({ created_at: -1 })
      .toArray();

    const totalQuizzes = quizzes.length;
    const averageScore = totalQuizzes > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
      : 0;

    // Get recent quizzes (last 5)
    const recentQuizzes = quizzes.slice(0, 5).map(q => ({
      date: new Date(q.created_at).toLocaleDateString(),
      profile: q.profile_level || 1,
      score: q.score,
      total: q.total_questions,
      percentage: q.percentage
    }));

    res.json({
      success: true,
      progressData: {
        currentProfile: student.current_profile || 1,
        profileProgress: ((student.current_profile || 1) / 10) * 100,
        totalQuizzes,
        averageScore,
        streak: student.streak || 0,
        totalPoints: student.points || 0,
        profileHistory: [],
        recentQuizzes
      }
    });
  } catch (error) {
    console.error('Math progress error:', error);
    res.status(500).json({ success: false, error: 'Failed to load progress' });
  }
});

// ==================== MATH SKILLS ====================
router.get('/math-skills', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const currentProfile = student.current_profile || 1;
    
    // Get or create skills
    let skills = await db.collection('math_skills').findOne({ student_id: student._id });
    
    if (!skills) {
      // Create default skills
      skills = {
        student_id: student._id,
        addition: { current_level: 0, max_level: 5 },
        subtraction: { current_level: 0, max_level: 5 },
        multiplication: { current_level: 0, max_level: 5 },
        division: { current_level: 0, max_level: 5 },
        created_at: new Date()
      };
      await db.collection('math_skills').insertOne(skills);
    }

    const skillsArray = [
      { 
        skill_name: 'Addition', 
        current_level: skills.addition?.current_level || 0, 
        max_level: 5, 
        unlocked: true 
      },
      { 
        skill_name: 'Subtraction', 
        current_level: skills.subtraction?.current_level || 0, 
        max_level: 5, 
        unlocked: true 
      },
      { 
        skill_name: 'Multiplication', 
        current_level: skills.multiplication?.current_level || 0, 
        max_level: 5, 
        unlocked: currentProfile >= 6 
      },
      { 
        skill_name: 'Division', 
        current_level: skills.division?.current_level || 0, 
        max_level: 5, 
        unlocked: currentProfile >= 6 
      }
    ];

    res.json({
      success: true,
      currentProfile,
      skills: skillsArray
    });
  } catch (error) {
    console.error('Math skills error:', error);
    res.status(500).json({ success: false, error: 'Failed to load skills' });
  }
});

// ==================== QUIZ RESULTS ====================
router.get('/quiz-results', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const quizzes = await db.collection('quiz_attempts')
      .find({ student_id: student._id })
      .sort({ created_at: -1 })
      .toArray();

    const results = quizzes.map(q => ({
      id: q._id.toString(),
      date: new Date(q.created_at).toLocaleDateString(),
      profile: q.profile_level || 1,
      score: q.score,
      maxScore: q.total_questions,
      questions: q.total_questions,
      percentage: q.percentage
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({ success: false, error: 'Failed to load results' });
  }
});

// ==================== QUIZ HISTORY ====================
router.get('/quiz-history', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const quizzes = await db.collection('quiz_attempts')
      .find({ student_id: student._id })
      .sort({ created_at: -1 })
      .toArray();

    const history = quizzes.map(q => {
      const date = new Date(q.created_at);
      return {
        id: q._id.toString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        profile: q.profile_level || 1,
        score: q.score,
        maxScore: q.total_questions,
        totalQuestions: q.total_questions,
        percentage: q.percentage
      };
    });

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Quiz history error:', error);
    res.status(500).json({ success: false, error: 'Failed to load history' });
  }
});

// ==================== LEADERBOARD ====================
router.get('/leaderboard', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    // Get all students with their users
    const students = await db.collection('students').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { points: -1 } },
      { $limit: 50 }
    ]).toArray();

    const leaderboard = students.map((s, index) => ({
      rank: index + 1,
      name: s.user.name || s.name,
      points: s.points || 0,
      level: s.level || 1,
      achievements: 0,
      isCurrentUser: s.user_id.equals(userId)
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

// ==================== SUPPORT TICKETS ====================
router.post('/support-ticket', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const ticket = {
      student_id: student._id,
      user_id: userId,
      category: req.body.category,
      priority: req.body.priority,
      subject: req.body.subject,
      description: req.body.description,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('support_tickets').insertOne(ticket);
    
    res.json({
      success: true,
      ticketId: `TICKET-${result.insertedId.toString().slice(-6).toUpperCase()}`,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

router.get('/support-tickets', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const tickets = await db.collection('support_tickets')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    const formattedTickets = tickets.map(t => ({
      id: `TICKET-${t._id.toString().slice(-6).toUpperCase()}`,
      category: t.category,
      priority: t.priority,
      subject: t.subject,
      status: t.status,
      createdOn: new Date(t.created_at).toLocaleDateString(),
      lastUpdate: new Date(t.updated_at).toLocaleDateString()
    }));

    res.json({
      success: true,
      tickets: formattedTickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to load tickets' });
  }
});

// ==================== TESTIMONIALS ====================
router.post('/testimonial', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const testimonial = {
      student_id: student._id,
      user_id: userId,
      title: req.body.title,
      rating: req.body.rating,
      testimonial: req.body.testimonial,
      display_name: req.body.displayName,
      allow_public: req.body.allowPublic,
      created_at: new Date()
    };

    await db.collection('testimonials').insertOne(testimonial);
    
    res.json({
      success: true,
      message: 'Testimonial submitted successfully'
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ success: false, error: 'Failed to create testimonial' });
  }
});

module.exports = router;