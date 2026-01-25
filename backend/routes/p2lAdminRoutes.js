const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const School = require('../models/School');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Middleware to authenticate P2L Admins
const authenticateP2LAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.userId), role: 'p2ladmin' });
    if (!admin) return res.status(403).json({ error: 'Access restricted to P2L Admins' });

    req.user = admin;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== Register P2L Admin ====================
// Public endpoint - allows creation of admin accounts
router.post('/register-admin', async (req, res) => {
  try {
    // Check MongoDB connection status
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const CONNECTED_STATE = 1;
    if (mongoose.connection.readyState !== CONNECTED_STATE) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database connection unavailable. Please try again later.' 
      });
    }

    const { email, password, name } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin name from email if not provided
    const adminName = name || email.split('@')[0];

    // Create new admin user
    const newAdmin = new User({
      name: adminName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'p2ladmin',
      emailVerified: true,
      accountActive: true
    });

    await newAdmin.save();

    res.status(201).json({ 
      success: true, 
      message: 'Admin registration successful',
      user: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during registration';
    
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      errorMessage = 'Database connection error. Please try again later.';
    } else if (err.code === 11000) {
      // Duplicate key error (email already exists, but caught by validation)
      errorMessage = 'Email already registered';
    } else if (err.message) {
      // Log the actual error for debugging but don't expose internal details
      console.error('Detailed error:', err.message, err.stack);
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// ==================== Default Health Check Endpoint ====================
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'success',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Health check failed' });
  }
});

// ==================== SCHOOL MANAGEMENT ROUTES ====================

// Get all schools
router.get('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch schools' 
    });
  }
});

// Get single school
router.get('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }
    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch school' 
    });
  }
});

// Create school
router.post('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type, plan, plan_info, contact } = req.body;
    
    // Validate required fields
    if (!organization_name || !plan || !plan_info) {
      return res.status(400).json({ 
        success: false, 
        error: 'organization_name, plan, and plan_info are required' 
      });
    }

    const school = new School({
      organization_name,
      organization_type: organization_type || 'school',
      plan,
      plan_info,
      contact: contact || ''
    });

    await school.save();

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create school' 
    });
  }
});

// Update school
router.put('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type, plan, plan_info, contact, is_active } = req.body;
    
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    // Update fields if provided
    if (organization_name) school.organization_name = organization_name;
    if (organization_type) school.organization_type = organization_type;
    if (plan) school.plan = plan;
    if (plan_info) school.plan_info = plan_info;
    if (contact !== undefined) school.contact = contact;
    if (is_active !== undefined) school.is_active = is_active;

    await school.save();

    res.json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update school' 
    });
  }
});

// Delete school
router.delete('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete school' 
    });
  }
});

// Get school admins
router.get('/schools/:id/admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const schoolId = req.params.id;

    // Find users who are school-admins for this school
    const admins = await User.find({
      school_id: schoolId,
      role: 'school-admin'
    }).select('-password');

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get school admins error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch school admins' 
    });
  }
});

// Create/assign school admin
router.post('/schools/:id/admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const schoolId = req.params.id;
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create school admin
    const admin = new User({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'school-admin',
      school_id: schoolId,
      emailVerified: true,
      accountActive: true
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'School admin created successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Create school admin error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create school admin' 
    });
  }
});

// ==================== QUESTION MANAGEMENT ROUTES ====================

// Get all questions
router.get('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { subject, topic, difficulty, is_active } = req.query;
    
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = parseInt(difficulty);
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const questions = await Question.find(filter)
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch questions' 
    });
  }
});

// Get single question
router.get('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('created_by', 'name email');
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch question' 
    });
  }
});

// Create question
router.post('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty, subject, topic, is_active } = req.body;
    
    // Validate required fields
    if (!text || !answer) {
      return res.status(400).json({ 
        success: false, 
        error: 'text and answer are required' 
      });
    }

    const question = new Question({
      text,
      choices: choices || [],
      answer,
      difficulty: difficulty || 2,
      subject: subject || 'General',
      topic: topic || '',
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user._id
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create question' 
    });
  }
});

// Update question
router.put('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty, subject, topic, is_active } = req.body;
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    // Update fields if provided
    if (text) question.text = text;
    if (choices) question.choices = choices;
    if (answer) question.answer = answer;
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (subject) question.subject = subject;
    if (topic !== undefined) question.topic = topic;
    if (is_active !== undefined) question.is_active = is_active;

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update question' 
    });
  }
});

// Delete question
router.delete('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete question' 
    });
  }
});

// ==================== QUIZ MANAGEMENT ROUTES ====================

// Get all quizzes
router.get('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const { is_adaptive, is_active } = req.query;
    
    const filter = {};
    if (is_adaptive !== undefined) filter.is_adaptive = is_adaptive === 'true';
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const quizzes = await Quiz.find(filter)
      .populate('created_by', 'name email')
      .populate('questions.question_id', 'text difficulty subject')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quizzes' 
    });
  }
});

// Get single quiz
router.get('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('questions.question_id', 'text choices answer difficulty subject topic');
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quiz' 
    });
  }
});

// Create quiz
router.post('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, questions, is_adaptive, is_active } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'title is required' 
      });
    }

    const quiz = new Quiz({
      title,
      description: description || '',
      questions: questions || [],
      is_adaptive: is_adaptive !== undefined ? is_adaptive : true,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user._id
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create quiz' 
    });
  }
});

// Update quiz
router.put('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, questions, is_adaptive, is_active } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    // Update fields if provided
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (is_adaptive !== undefined) quiz.is_adaptive = is_adaptive;
    if (is_active !== undefined) quiz.is_active = is_active;

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update quiz' 
    });
  }
});

// Delete quiz
router.delete('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete quiz' 
    });
  }
});

// Run adaptive quiz
// NOTE: This endpoint currently returns the full quiz structure.
// Adaptive quiz logic (selecting questions based on student performance) 
// should be implemented in a future iteration. For now, this serves as a
// placeholder to load quiz data for execution.
router.post('/quizzes/run', authenticateP2LAdmin, async (req, res) => {
  try {
    const { quizId, studentId } = req.body;
    
    if (!quizId) {
      return res.status(400).json({ 
        success: false, 
        error: 'quizId is required' 
      });
    }

    const quiz = await Quiz.findById(quizId).populate('questions.question_id');
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quiz not found' 
      });
    }

    // Return the quiz with all questions
    // Future enhancement: implement adaptive logic to select questions based on student's ability level
    res.json({
      success: true,
      message: 'Quiz loaded for execution',
      data: {
        quiz_id: quiz._id,
        title: quiz.title,
        is_adaptive: quiz.is_adaptive,
        questions: quiz.questions
      }
    });
  } catch (error) {
    console.error('Run quiz error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to run quiz' 
    });
  }
});

// Other Admin Functions...
module.exports = router;
