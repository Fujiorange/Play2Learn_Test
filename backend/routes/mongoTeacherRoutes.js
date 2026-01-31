// backend/routes/mongoTeacherRoutes.js
// Teacher routes for student management and points adjustment

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

router.use(authenticateToken);

const getDb = () => mongoose.connection.db;

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDb();
    
    // Get teacher info
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    const teacherClasses = teacher.classes || [];
    
    // Count students in teacher's classes
    const studentCount = await db.collection('users').countDocuments({
      role: { $in: ['Student', 'student'] },
      class: { $in: teacherClasses }
    });

    // Get class performance summary
    const classStats = [];
    for (const className of teacherClasses) {
      const students = await db.collection('students')
        .find({ class: className })
        .toArray();
      
      const avgScore = students.length > 0 
        ? students.reduce((sum, s) => sum + (s.average_score || 0), 0) / students.length 
        : 0;
      
      classStats.push({
        name: className,
        studentCount: students.length,
        avgScore: Math.round(avgScore)
      });
    }

    res.json({
      success: true,
      dashboard: {
        totalStudents: studentCount,
        totalClasses: teacherClasses.length,
        classes: classStats
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ==================== CLASSES ====================
router.get('/classes', async (req, res) => {
  try {
    const db = getDb();
    
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    const teacherClasses = teacher.classes || [];
    
    // Get details for each class
    const classDetails = [];
    for (const className of teacherClasses) {
      const students = await db.collection('students')
        .find({ class: className })
        .toArray();
      
      classDetails.push({
        name: className,
        studentCount: students.length,
        students: students.map(s => ({
          id: s._id,
          user_id: s.user_id,
          name: s.name,
          email: s.email,
          points: s.points || 0,
          level: s.level || 1,
          average_score: s.average_score || 0
        }))
      });
    }

    res.json({ success: true, classes: classDetails });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

router.get('/classes/:className/students', async (req, res) => {
  try {
    const db = getDb();
    const { className } = req.params;

    const students = await db.collection('students')
      .find({ class: decodeURIComponent(className) })
      .sort({ name: 1 })
      .toArray();

    res.json({ 
      success: true, 
      students: students.map(s => ({
        id: s._id,
        user_id: s.user_id,
        name: s.name,
        email: s.email,
        points: s.points || 0,
        level: s.level || 1,
        average_score: s.average_score || 0,
        total_quizzes: s.total_quizzes || 0,
        streak: s.streak || 0,
        last_active: s.last_active
      }))
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

router.get('/classes/:className/leaderboard', async (req, res) => {
  try {
    const db = getDb();
    const { className } = req.params;

    const students = await db.collection('students')
      .find({ class: decodeURIComponent(className) })
      .sort({ points: -1 })
      .limit(20)
      .toArray();

    res.json({ 
      success: true, 
      leaderboard: students.map((s, index) => ({
        rank: index + 1,
        id: s._id,
        name: s.name,
        points: s.points || 0,
        level: s.level || 1,
        average_score: s.average_score || 0,
        badges: s.badges?.length || 0
      }))
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

// ==================== STUDENTS ====================
router.get('/students', async (req, res) => {
  try {
    const db = getDb();
    
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    const teacherClasses = teacher.classes || [];
    
    const students = await db.collection('students')
      .find({ class: { $in: teacherClasses } })
      .sort({ name: 1 })
      .toArray();

    res.json({ 
      success: true, 
      students: students.map(s => ({
        id: s._id,
        user_id: s.user_id,
        name: s.name,
        email: s.email,
        class: s.class,
        points: s.points || 0,
        level: s.level || 1,
        average_score: s.average_score || 0,
        total_quizzes: s.total_quizzes || 0
      }))
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const student = await db.collection('students').findOne({ 
      _id: new mongoose.Types.ObjectId(id) 
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Get recent quiz results
    const recentQuizzes = await db.collection('quizzes')
      .find({ student_id: student.user_id })
      .sort({ completed_at: -1 })
      .limit(10)
      .toArray();

    // Get point history
    const pointHistory = await db.collection('point_transactions')
      .find({ student_id: student._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Get badges
    const badges = student.badges || [];
    const badgeDetails = await db.collection('badges')
      .find({ _id: { $in: badges.map(b => new mongoose.Types.ObjectId(b)) } })
      .toArray();

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        class: student.class,
        points: student.points || 0,
        level: student.level || 1,
        average_score: student.average_score || 0,
        total_quizzes: student.total_quizzes || 0,
        streak: student.streak || 0,
        badges: badgeDetails,
        recentQuizzes: recentQuizzes.map(q => ({
          id: q._id,
          score: q.score,
          percentage: q.percentage,
          points_earned: q.points_earned,
          completed_at: q.completed_at
        })),
        pointHistory
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ success: false, error: 'Failed to load student details' });
  }
});

// ==================== POINTS ADJUSTMENT ====================
router.post('/students/:id/adjust-points', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { amount, reason } = req.body;

    if (amount === undefined || !reason) {
      return res.status(400).json({ success: false, error: 'Amount and reason are required' });
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ success: false, error: 'Amount must be a number' });
    }

    // Get student
    const student = await db.collection('students').findOne({ 
      _id: new mongoose.Types.ObjectId(id) 
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Verify teacher has access to this student's class
    const teacher = await db.collection('users').findOne({ email: req.user.email });
    const teacherClasses = teacher?.classes || [];
    
    if (student.class && !teacherClasses.includes(student.class)) {
      return res.status(403).json({ success: false, error: 'You do not have access to this student' });
    }

    const previousBalance = student.points || 0;
    const newPoints = Math.max(0, previousBalance + parsedAmount);

    // Update student points
    await db.collection('students').updateOne(
      { _id: student._id },
      { $set: { points: newPoints, updated_at: new Date() } }
    );

    // Log transaction
    await db.collection('point_transactions').insertOne({
      student_id: student._id,
      amount: parsedAmount,
      reason,
      type: 'teacher_adjustment',
      adjustedBy: req.user.email,
      adjustedByName: req.user.name || teacher?.name || 'Teacher',
      previousBalance,
      newBalance: newPoints,
      createdAt: new Date()
    });

    console.log(`💰 Teacher ${req.user.email} adjusted ${student.name}'s points by ${parsedAmount}. New balance: ${newPoints}`);

    res.json({ 
      success: true, 
      message: `Points ${parsedAmount >= 0 ? 'added' : 'deducted'} successfully`,
      previousBalance,
      newPoints,
      adjustment: parsedAmount
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ success: false, error: 'Failed to adjust points' });
  }
});

router.get('/students/:id/point-history', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const history = await db.collection('point_transactions')
      .find({ student_id: new mongoose.Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({ success: true, history });
  } catch (error) {
    console.error('Get point history error:', error);
    res.status(500).json({ success: false, error: 'Failed to load point history' });
  }
});

module.exports = router;
