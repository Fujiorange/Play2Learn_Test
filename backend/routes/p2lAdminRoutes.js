// backend/routes/p2lAdminRoutes.js
// Routes for p2ladmin (platform-level admin)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to authenticate a p2ladmin JWT (token must include userId)
const authenticateP2LAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(decoded.userId),
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
    const db = mongoose.connection.db;

    // Check if exists; if yes, update password
    const existing = await db.collection('users').findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      await db.collection('users').updateOne(
        { _id: existing._id },
        { $set: { password_hash: passwordHash, role: 'p2ladmin', is_active: true, name } }
      );
      return res.json({ success: true, message: 'P2L admin updated', email, password });
    }

    const newUser = {
      name,
      email,
      password_hash: passwordHash,
      role: 'p2ladmin',
      contact: '',
      approval_status: 'approved',
      is_active: true,
      created_at: new Date(),
      last_login: null
    };

    const result = await db.collection('users').insertOne(newUser);

    // Optional platform_admins collection compatibility (not required)
    await db.collection('platform_admins').insertOne({
      user_id: result.insertedId,
      admin_level: 'owner',
      permissions: ['all'],
      created_at: new Date()
    });

    console.log(`Created p2ladmin: ${email} / password: ${password}`);
    return res.json({ success: true, message: 'P2L admin created', email, password });
  } catch (error) {
    console.error('Seed p2ladmin error:', error);
    return res.status(500).json({ success: false, error: 'Failed to seed p2ladmin' });
  }
});

// ==================== LANDING PAGE CRUD (modular blocks) ====================
router.post('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { blocks = [] } = req.body;

    // Replace existing landing doc (single document approach)
    const timestamp = new Date();
    await db.collection('landing_pages').updateOne(
      { _id: 'default' },
      { $set: { blocks, updated_at: timestamp, updated_by: req.admin._id } },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Landing page saved', blocks });
  } catch (err) {
    console.error('Save landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save landing page' });
  }
});

router.get('/landing', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const doc = await db.collection('landing_pages').findOne({ _id: 'default' });
    return res.json({ success: true, blocks: doc?.blocks || [] });
  } catch (err) {
    console.error('Get landing error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load landing page' });
  }
});

router.delete('/landing', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await db.collection('landing_pages').deleteOne({ _id: 'default' });
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

router.post('/schools', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { organization_name, organization_type = 'school', plan = 'starter', contact = '' } = req.body;

    if (!organization_name) return res.status(400).json({ success: false, error: 'organization_name required' });
    if (!LICENSE_PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan' });

    const planInfo = LICENSE_PLANS[plan];
    const doc = {
      organization_name,
      organization_type,
      plan,
      plan_info: planInfo,
      contact,
      created_at: new Date()
    };

    const result = await db.collection('schools').insertOne(doc);
    return res.status(201).json({ success: true, school_id: result.insertedId, school: doc });
  } catch (err) {
    console.error('Create school error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create school' });
  }
});

// ==================== CREATE SCHOOL ADMINS (with temp password) ====================
router.post('/school-admins', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { schoolId, admins = [] } = req.body;

    if (!schoolId || !Array.isArray(admins) || admins.length === 0) {
      return res.status(400).json({ success: false, error: 'schoolId and admins[] required' });
    }

    const created = [];
    for (const a of admins) {
      const { name, email, contact = '' } = a;
      if (!name || !email) continue;

      // Ensure unique email
      const existing = await db.collection('users').findOne({ email });
      if (existing) {
        created.push({ email, success: false, error: 'Email already exists' });
        continue;
      }

      const tempPassword = genTempPassword(8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const newAdmin = {
        name,
        email,
        password_hash: passwordHash,
        contact,
        role: 'school-admin',
        school_id: new mongoose.Types.ObjectId(schoolId),
        organization_type: 'school',
        approval_status: 'approved',
        is_active: true,
        created_at: new Date(),
        last_login: null
      };

      const result = await db.collection('users').insertOne(newAdmin);
      // insert profile
      await db.collection('school_admins').insertOne({
        user_id: result.insertedId,
        school_id: new mongoose.Types.ObjectId(schoolId),
        permissions: ['basic'],
        created_at: new Date()
      });

      created.push({ email, success: true, tempPassword });
    }

    return res.json({ success: true, created });
  } catch (err) {
    console.error('Create school-admins error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create school admins' });
  }
});

// ==================== QUIZ / QUESTION BANK (basic adaptive run) ====================
router.post('/quizzes', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { title = 'Default Quiz', questions = [] } = req.body;
    // Questions: [{ text, choices, answer, difficulty: 1|2|3 }]
    const doc = { title, questions, created_at: new Date() };
    const result = await db.collection('quizzes').insertOne(doc);
    return res.status(201).json({ success: true, quiz_id: result.insertedId, quiz: doc });
  } catch (err) {
    console.error('Create quiz error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create quiz' });
  }
});

// Simple adaptive run: client sends lastQuestionId & wasCorrect and desired quizId
router.post('/quizzes/run', authenticateP2LAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { quizId, lastQuestionId = null, wasCorrect = null, currentDifficulty = 2 } = req.body;

    const quiz = await db.collection('quizzes').findOne({ _id: new mongoose.Types.ObjectId(quizId) });
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Decide next difficulty
    let nextDifficulty = currentDifficulty;
    if (wasCorrect === true) nextDifficulty = Math.min(3, currentDifficulty + 1);
    else if (wasCorrect === false) nextDifficulty = Math.max(1, currentDifficulty - 1);
    // pick a question with that difficulty not equal to lastQuestionId
    const pool = quiz.questions.filter(q => (q.difficulty || 2) === nextDifficulty && String(q._id || '') !== String(lastQuestionId || ''));
    let question = pool[Math.floor(Math.random() * pool.length)];
    if (!question) {
      // fallback: pick any question not lastQuestionId
      const alt = quiz.questions.filter(q => String(q._id || '') !== String(lastQuestionId || ''));
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
    const db = mongoose.connection.db;
    const mongooseState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    return res.json({
      success: true,
      environment: process.env.NODE_ENV || 'development',
      db: mongooseState,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health error:', err);
    return res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

module.exports = router;