// backend/routes/p2lAdminRoutes.js
// Routes for p2ladmin (platform-level admin)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../models/User');
const School = require('../models/School');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const LandingPage = require('../models/LandingPage');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to authenticate a p2ladmin JWT (token must include userId)
const authenticateP2LAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      role: 'p2ladmin'
    });

    if (!user) return res.status(403).json({ success: false, error: 'P2LAdmin access required' });

    req.user = decoded;
    req.admin = user;
    next();
  } catch (err) {
    console.error('P2L admin auth error:', err);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Utility - generate random 8-char alphanumeric
function genTempPassword(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

// ==================== SEED / CREATE INITIAL P2LADMIN ====================
router.post('/seed', async (req, res) => {
  try {
    const { email = 'p2ladmin@p2l.com', password = 'P2LAdmin1234', name = 'Platform Admin' } = req.body || {};

    // Check if exists; if yes, update password
    const existing = await User.findOne({ email: email.toLowerCase() });
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      existing.password = passwordHash;
      existing.role = 'p2ladmin';
      existing.accountActive = true;
      existing.emailVerified = true;
      existing.name = name;
      await existing.save();
      
      console.log(`✅ Updated p2ladmin: ${email}`);
      return res.json({ success: true, message: 'P2L admin updated', email, password });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'p2ladmin',
      emailVerified: true,
      accountActive: true
    });

    await newUser.save();

    console.log(`✅ Created p2ladmin: ${email} / password: ${password}`);
    return res.json({ success: true, message: 'P2L admin created', email, password });
  } catch (error) {
    console.error('❌ Seed p2ladmin error:', error);
    return res.status(500).json({ success: false, error: 'Failed to seed p2ladmin' });
  }
});

// ==================== REGISTER NEW P2LADMIN ====================
/**
 * Register a new P2L Admin user
 * Validates email format and password strength
 * Hashes password securely with bcrypt
 * Sets admin field (role) to 'p2ladmin'
 * 
 * Security Note: This endpoint should be protected with rate limiting
 * in production to prevent brute force attacks and spam registrations.
 * Consider adding express-rate-limit middleware.
 */
router.post('/register-admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Email format validation (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Password validation
    // Minimum 8 characters, at least one letter, one number, and one special character
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLetter || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must contain at least one letter, one number, and one special character' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password with bcrypt (salt rounds: 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new admin user with admin field set to true
    const newAdmin = new User({
      name: email.split('@')[0], // Use email prefix as default name
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'p2ladmin', // Admin role
      emailVerified: true,
      accountActive: true
    });

    await newAdmin.save();

    console.log(`✅ Registered new p2ladmin: ${email}`);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Admin registration successful',
      user: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('❌ Admin registration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// ==================== LANDING PAGE CRUD (modular blocks) ====================
router.post('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    const { blocks = [] } = req.body;

    // Find existing landing page or create new one
    let landingPage = await LandingPage.findOne({});
    
    if (landingPage) {
      landingPage.blocks = blocks;
      landingPage.updated_by = req.admin._id;
      landingPage.version += 1;
      await landingPage.save();
    } else {
      landingPage = new LandingPage({
        blocks,
        updated_by: req.admin._id
      });
      await landingPage.save();
    }

    return res.json({ success: true, message: 'Landing page saved', blocks: landingPage.blocks });
  } catch (err) {
    console.error('Save landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save landing page' });
  }
});

router.get('/landing', async (req, res) => {
  try {
    const landingPage = await LandingPage.findOne({ is_active: true });
    return res.json({ success: true, blocks: landingPage?.blocks || [] });
  } catch (err) {
    console.error('Get landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load landing page' });
  }
});

router.put('/landing/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { blocks } = req.body;
    const landingPage = await LandingPage.findById(req.params.id);
    
    if (!landingPage) {
      return res.status(404).json({ success: false, error: 'Landing page not found' });
    }

    landingPage.blocks = blocks;
    landingPage.updated_by = req.admin._id;
    landingPage.version += 1;
    await landingPage.save();

    return res.json({ success: true, message: 'Landing page updated', landingPage });
  } catch (err) {
    console.error('Update landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update landing page' });
  }
});

router.delete('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    await LandingPage.deleteMany({});
    return res.json({ success: true, message: 'Landing page removed' });
  } catch (err) {
    console.error('Delete landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete landing page' });
  }
});

// ==================== SCHOOLS & LICENSING ====================
const LICENSE_PLANS = {
  starter: { teacher_limit: 50, student_limit: 500, price: 2500 },
  professional: { teacher_limit: 100, student_limit: 1000, price: 5000 },
  enterprise: { teacher_limit: 250, student_limit: 2500, price: 10000 }
};

// Create a new school
router.post('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type = 'school', plan = 'starter', contact = '' } = req.body;

    if (!organization_name) return res.status(400).json({ success: false, error: 'organization_name required' });
    if (!LICENSE_PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan' });

    const planInfo = LICENSE_PLANS[plan];
    const school = new School({
      organization_name,
      organization_type,
      plan,
      plan_info: planInfo,
      contact
    });

    await school.save();
    return res.status(201).json({ success: true, school_id: school._id, school });
  } catch (err) {
    console.error('Create school error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create school' });
  }
});

// Get all schools
router.get('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const schools = await School.find({});
    return res.json({ success: true, schools });
  } catch (err) {
    console.error('Get schools error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve schools' });
  }
});

// Get a specific school
router.get('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    return res.json({ success: true, school });
  } catch (err) {
    console.error('Get school error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve school' });
  }
});

// Update a school
router.put('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { organization_name, organization_type, plan, contact, is_active } = req.body;
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    if (organization_name) school.organization_name = organization_name;
    if (organization_type) school.organization_type = organization_type;
    if (contact !== undefined) school.contact = contact;
    if (is_active !== undefined) school.is_active = is_active;
    
    if (plan && LICENSE_PLANS[plan]) {
      school.plan = plan;
      school.plan_info = LICENSE_PLANS[plan];
    }

    await school.save();
    return res.json({ success: true, message: 'School updated', school });
  } catch (err) {
    console.error('Update school error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update school' });
  }
});

// Delete a school
router.delete('/schools/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    return res.json({ success: true, message: 'School deleted' });
  } catch (err) {
    console.error('Delete school error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete school' });
  }
});

// ==================== CREATE SCHOOL ADMINS (with temp password) ====================
router.post('/school-admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const { schoolId, admins = [] } = req.body;

    if (!schoolId || !Array.isArray(admins) || admins.length === 0) {
      return res.status(400).json({ success: false, error: 'schoolId and admins[] required' });
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    const created = [];
    for (const a of admins) {
      const { name, email, contact = '' } = a;
      if (!name || !email) continue;

      // Ensure unique email
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        created.push({ email, success: false, error: 'Email already exists' });
        continue;
      }

      const tempPassword = genTempPassword(8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const newAdmin = new User({
        name,
        email: email.toLowerCase(),
        password: passwordHash,
        contact,
        role: 'School Admin',
        schoolId: schoolId,
        emailVerified: true,
        accountActive: true
      });

      await newAdmin.save();

      console.log(`✅ Created school admin: ${email} / password: ${tempPassword}`);
      created.push({ email, success: true, tempPassword, name });
    }

    return res.json({ success: true, created });
  } catch (err) {
    console.error('❌ Create school-admins error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create school admins' });
  }
});

// Get all school admins for a school
router.get('/schools/:schoolId/admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const admins = await User.find({ 
      schoolId: req.params.schoolId, 
      role: 'School Admin' 
    }).select('-password');
    
    return res.json({ success: true, admins });
  } catch (err) {
    console.error('Get school admins error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve school admins' });
  }
});

// ==================== QUESTION BANK MANAGEMENT ====================
// Create a new question
router.post('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty = 2, subject = 'General', topic = '' } = req.body;

    if (!text || !answer) {
      return res.status(400).json({ success: false, error: 'text and answer are required' });
    }

    if (![1, 2, 3].includes(difficulty)) {
      return res.status(400).json({ success: false, error: 'difficulty must be 1, 2, or 3' });
    }

    const question = new Question({
      text,
      choices: choices || [],
      answer,
      difficulty,
      subject,
      topic,
      created_by: req.admin._id
    });

    await question.save();
    return res.status(201).json({ success: true, message: 'Question created', question });
  } catch (err) {
    console.error('Create question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create question' });
  }
});

// Get all questions with optional filters
router.get('/questions', authenticateP2LAdmin, async (req, res) => {
  try {
    const { difficulty, subject, is_active = true } = req.query;
    const filter = { is_active };

    if (difficulty) filter.difficulty = parseInt(difficulty);
    if (subject) filter.subject = subject;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, questions });
  } catch (err) {
    console.error('Get questions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve questions' });
  }
});

// Get a specific question
router.get('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    return res.json({ success: true, question });
  } catch (err) {
    console.error('Get question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve question' });
  }
});

// Update a question
router.put('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { text, choices, answer, difficulty, subject, topic, is_active } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    if (text) question.text = text;
    if (choices) question.choices = choices;
    if (answer) question.answer = answer;
    if (difficulty) question.difficulty = difficulty;
    if (subject) question.subject = subject;
    if (topic !== undefined) question.topic = topic;
    if (is_active !== undefined) question.is_active = is_active;

    await question.save();
    return res.json({ success: true, message: 'Question updated', question });
  } catch (err) {
    console.error('Update question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update question' });
  }
});

// Delete a question
router.delete('/questions/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    return res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    console.error('Delete question error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
});

// ==================== QUIZ MANAGEMENT (ADAPTIVE) ====================
// Create a new quiz
router.post('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description = '', question_ids = [], is_adaptive = true } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    // Fetch questions from the question bank
    const questions = await Question.find({ _id: { $in: question_ids }, is_active: true });

    const quizQuestions = questions.map(q => ({
      question_id: q._id,
      text: q.text,
      choices: q.choices,
      answer: q.answer,
      difficulty: q.difficulty
    }));

    const quiz = new Quiz({
      title,
      description,
      questions: quizQuestions,
      is_adaptive,
      created_by: req.admin._id
    });

    await quiz.save();
    return res.status(201).json({ success: true, message: 'Quiz created', quiz_id: quiz._id, quiz });
  } catch (err) {
    console.error('Create quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create quiz' });
  }
});

// Get all quizzes
router.get('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ is_active: true }).sort({ createdAt: -1 });
    return res.json({ success: true, quizzes });
  } catch (err) {
    console.error('Get quizzes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve quizzes' });
  }
});

// Get a specific quiz
router.get('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    return res.json({ success: true, quiz });
  } catch (err) {
    console.error('Get quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve quiz' });
  }
});

// Update a quiz
router.put('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const { title, description, question_ids, is_adaptive, is_active } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (is_adaptive !== undefined) quiz.is_adaptive = is_adaptive;
    if (is_active !== undefined) quiz.is_active = is_active;

    if (question_ids && Array.isArray(question_ids)) {
      const questions = await Question.find({ _id: { $in: question_ids }, is_active: true });
      quiz.questions = questions.map(q => ({
        question_id: q._id,
        text: q.text,
        choices: q.choices,
        answer: q.answer,
        difficulty: q.difficulty
      }));
    }

    await quiz.save();
    return res.json({ success: true, message: 'Quiz updated', quiz });
  } catch (err) {
    console.error('Update quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/quizzes/:id', authenticateP2LAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    return res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) {
    console.error('Delete quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete quiz' });
  }
});

// Adaptive quiz run - Get next question based on previous answer
router.post('/quizzes/run', authenticateP2LAdmin, async (req, res) => {
  try {
    const { quizId, lastQuestionId = null, wasCorrect = null, currentDifficulty = 2 } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    if (!quiz.is_adaptive) {
      // For non-adaptive quizzes, just return questions in order
      const question = quiz.questions.find(q => String(q.question_id) !== String(lastQuestionId));
      return res.json({ success: true, question: question || null, nextDifficulty: currentDifficulty });
    }

    // Decide next difficulty based on previous answer
    let nextDifficulty = currentDifficulty;
    if (wasCorrect === true) {
      nextDifficulty = Math.min(3, currentDifficulty + 1);
    } else if (wasCorrect === false) {
      nextDifficulty = Math.max(1, currentDifficulty - 1);
    }

    // Filter questions by difficulty and exclude last question
    const pool = quiz.questions.filter(q => 
      q.difficulty === nextDifficulty && 
      String(q.question_id || q._id) !== String(lastQuestionId)
    );

    let question = pool[Math.floor(Math.random() * pool.length)];

    if (!question) {
      // Fallback: pick any question not equal to lastQuestionId
      const alt = quiz.questions.filter(q => 
        String(q.question_id || q._id) !== String(lastQuestionId)
      );
      question = alt[Math.floor(Math.random() * alt.length)];
    }

    return res.json({ success: true, question: question || null, nextDifficulty });
  } catch (err) {
    console.error('Adaptive run error:', err);
    return res.status(500).json({ success: false, error: 'Adaptive run failed' });
  }
});

// ==================== HEALTH CHECK ====================
router.get('/health', async (req, res) => {
  try {
    const mongooseState = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const isConnected = mongoose.connection.readyState === 1;
    
    return res.json({
      success: isConnected,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: mongooseState,
        connected: isConnected,
        type: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health error:', err);
    return res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

module.exports = router;