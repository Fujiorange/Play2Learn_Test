// backend/routes/schoolAdminRoutes.js - COMPREHENSIVE FIX
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const upload = multer({ dest: 'uploads/' });
const getDb = () => mongoose.connection.db;

const normalizeRole = (role) => {
  const roleMap = {
    'student': 'Student', 'teacher': 'Teacher', 'parent': 'Parent',
    'school-admin': 'School-Admin', 'schooladmin': 'School-Admin',
    'p2ladmin': 'P2L-Admin', 'platform-admin': 'P2L-Admin'
  };
  return roleMap[role?.toLowerCase()] || role;
};

function generateTempPassword(userType) {
  const crypto = require('crypto');
  return `${userType.substring(0, 3).toUpperCase()}${new Date().getFullYear()}${crypto.randomBytes(3).toString('hex')}!`;
}

// Dashboard Stats
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const [totalStudents, totalTeachers, totalParents, totalClasses] = await Promise.all([
      db.collection('users').countDocuments({ role: { $in: ['Student', 'student'] } }),
      db.collection('users').countDocuments({ role: { $in: ['Teacher', 'teacher'] } }),
      db.collection('users').countDocuments({ role: { $in: ['Parent', 'parent'] } }),
      db.collection('classes').countDocuments({})
    ]);
    res.json({
      success: true, total_students: totalStudents, total_teachers: totalTeachers,
      total_parents: totalParents, total_classes: totalClasses,
      license: { plan: 'starter', teacherLimit: 50, studentLimit: 500, currentTeachers: totalTeachers, currentStudents: totalStudents }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// Get users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { role, search, status } = req.query;
    const allowedRoles = ['Student', 'student', 'Teacher', 'teacher', 'Parent', 'parent'];
    let filter = { role: { $in: allowedRoles } };
    if (role && role !== 'all') filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
    if (status === 'active') filter.accountActive = true;
    if (status === 'disabled') filter.accountActive = false;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await db.collection('users').find(filter).project({ password: 0 }).sort({ createdAt: -1 }).limit(200).toArray();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// Create user
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, email, role, gender, gradeLevel, class: userClass, classes, linkedStudents } = req.body;
    if (!['student', 'teacher', 'parent'].includes(role.toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Invalid role' });
    }
    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists' });
    
    const tempPassword = generateTempPassword(role);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const normalizedRole = normalizeRole(role);
    
    const newUser = {
      name, email: email.toLowerCase(), password: hashedPassword, role: normalizedRole,
      gender: gender || null, gradeLevel: gradeLevel || 'Primary 1', class: userClass || null,
      classes: normalizedRole === 'Teacher' ? (classes || []) : undefined,
      linkedStudents: normalizedRole === 'Parent' ? (linkedStudents || []) : [],
      accountActive: true, emailVerified: false, createdBy: req.user.email,
      createdAt: new Date(), updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    console.log(`✅ User created: ${email} (${normalizedRole})`);
    
    if (normalizedRole === 'Student') {
      await db.collection('students').insertOne({
        user_id: result.insertedId, name, email: email.toLowerCase(),
        grade_level: gradeLevel || 'Primary 1', class: userClass || null,
        points: 0, level: 1, current_profile: 1, streak: 0, total_quizzes: 0,
        badges: [], achievements: [], placement_completed: false,
        created_at: new Date(), updated_at: new Date()
      });
    }
    
    if (normalizedRole === 'Parent' && linkedStudents?.length > 0) {
      for (const sid of linkedStudents) {
        try {
          await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(sid) }, { $set: { parentId: result.insertedId } });
          await db.collection('students').updateOne({ user_id: new mongoose.Types.ObjectId(sid) }, { $set: { parent_id: result.insertedId } });
        } catch (e) {}
      }
    }
    
    res.json({ success: true, user: { ...newUser, _id: result.insertedId, password: undefined }, tempPassword });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Helper to safely convert to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
};

const canModifyUser = async (db, userId) => {
  try {
    const objectId = toObjectId(userId);
    if (!objectId) {
      return { allowed: false, error: 'Invalid user ID format', user: null };
    }
    const user = await db.collection('users').findOne({ _id: objectId });
    if (!user) return { allowed: false, error: 'User not found', user: null };
    const protectedRoles = ['p2ladmin', 'p2l-admin', 'school-admin', 'schooladmin', 'platform-admin', 'platform admin'];
    if (protectedRoles.includes(user.role?.toLowerCase())) return { allowed: false, error: 'Cannot modify admin', user };
    return { allowed: true, user };
  } catch (e) {
    console.error('canModifyUser error:', e);
    return { allowed: false, error: 'Invalid user ID', user: null };
  }
};

// Update user - FIXED to sync students collection
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const check = await canModifyUser(db, req.params.id);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.password; delete updates.role;
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    
    await db.collection('users').updateOne({ _id: objectId }, { $set: updates });
    
    // SYNC to students collection
    if (check.user.role?.toLowerCase() === 'student') {
      const studentUpdates = { updated_at: new Date() };
      if (updates.class !== undefined) studentUpdates.class = updates.class;
      if (updates.name !== undefined) studentUpdates.name = updates.name;
      if (updates.gradeLevel !== undefined) studentUpdates.grade_level = updates.gradeLevel;
      await db.collection('students').updateOne(
        { $or: [{ user_id: objectId }, { email: check.user.email }] },
        { $set: studentUpdates }
      );
    }
    
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

router.patch('/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const check = await canModifyUser(db, req.params.id);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    
    await db.collection('users').updateOne({ _id: objectId }, { $set: { accountActive: req.body.accountActive, updatedAt: new Date() } });
    console.log(`👤 User ${check.user.email} status changed to ${req.body.accountActive ? 'active' : 'disabled'}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

router.post('/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const check = await canModifyUser(db, req.params.id);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    
    const tempPassword = generateTempPassword(check.user.role || 'user');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await db.collection('users').updateOne({ _id: objectId }, { $set: { password: hashedPassword } });
    res.json({ success: true, tempPassword });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const check = await canModifyUser(db, req.params.id);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    
    await db.collection('users').deleteOne({ _id: objectId });
    if (check.user.role?.toLowerCase() === 'student') {
      await db.collection('students').deleteOne({ $or: [{ user_id: objectId }, { email: check.user.email }] });
    }
    console.log('✅ User deleted:', check.user.email);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Classes
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const classes = await db.collection('classes').find({}).sort({ name: 1 }).toArray();
    for (let cls of classes) {
      cls.studentCount = await db.collection('users').countDocuments({ class: cls.name, role: { $in: ['Student', 'student'] } });
      if (cls.teacherId) {
        try {
          const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) });
          cls.teacherName = teacher?.name || 'Unknown';
        } catch (e) { cls.teacherName = 'Unknown'; }
      } else {
        cls.teacherName = 'Not assigned';
      }
    }
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

router.post('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, grade, subject, teacherId } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Class name required' });
    const existing = await db.collection('classes').findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ success: false, error: 'Class name exists' });
    
    let teacherName = null;
    if (teacherId && teacherId !== '' && teacherId !== 'null') {
      try {
        const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
        teacherName = teacher?.name || null;
        if (teacher) await db.collection('users').updateOne({ _id: teacher._id }, { $addToSet: { classes: name.trim() } });
      } catch (e) {}
    }
    
    const newClass = { name: name.trim(), grade: grade || 'Primary 1', subject: subject || 'Mathematics', teacherId: teacherId || null, teacherName, studentCount: 0, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('classes').insertOne(newClass);
    console.log(`✅ Class created: ${name}`);
    res.json({ success: true, class: { ...newClass, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

router.put('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { teacherId, name } = req.body;
    const objectId = new mongoose.Types.ObjectId(req.params.id);
    const cls = await db.collection('classes').findOne({ _id: objectId });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found' });
    
    const updates = { updatedAt: new Date() };
    
    if (teacherId !== undefined) {
      if (cls.teacherId) {
        try { await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) }, { $pull: { classes: cls.name } }); } catch (e) {}
      }
      if (teacherId && teacherId !== '' && teacherId !== 'null') {
        const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
        if (teacher) {
          updates.teacherId = teacherId;
          updates.teacherName = teacher.name;
          await db.collection('users').updateOne({ _id: teacher._id }, { $addToSet: { classes: cls.name } });
        }
      } else {
        updates.teacherId = null;
        updates.teacherName = null;
      }
    }
    
    if (name && name !== cls.name) {
      const existing = await db.collection('classes').findOne({ name: name.trim() });
      if (existing) return res.status(400).json({ success: false, error: 'Class name exists' });
      updates.name = name.trim();
      await db.collection('users').updateMany({ class: cls.name }, { $set: { class: name.trim() } });
      await db.collection('students').updateMany({ class: cls.name }, { $set: { class: name.trim() } });
    }
    
    await db.collection('classes').updateOne({ _id: objectId }, { $set: updates });
    res.json({ success: true, class: await db.collection('classes').findOne({ _id: objectId }) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

router.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const objectId = new mongoose.Types.ObjectId(req.params.id);
    const cls = await db.collection('classes').findOne({ _id: objectId });
    if (cls?.teacherId) {
      try { await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) }, { $pull: { classes: cls.name } }); } catch (e) {}
    }
    await db.collection('classes').deleteOne({ _id: objectId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

// Badges
router.get('/badges', authenticateToken, async (req, res) => {
  try { res.json({ success: true, badges: await getDb().collection('badges').find({}).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/badges', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, criteriaType, criteriaValue, rarity, isActive } = req.body;
    const result = await getDb().collection('badges').insertOne({ name, description, icon: icon || '🏆', criteriaType: criteriaType || 'manual', criteriaValue: criteriaValue || 0, rarity: rarity || 'common', isActive: isActive !== false, earnedCount: 0, createdAt: new Date() });
    res.json({ success: true, badge: { ...req.body, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/badges/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() }; delete updates._id;
    await getDb().collection('badges').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/badges/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('badges').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Shop Items
router.get('/shop-items', authenticateToken, async (req, res) => {
  try { res.json({ success: true, items: await getDb().collection('shop_items').find({}).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/shop-items', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, cost, category, stock, isActive } = req.body;
    const result = await getDb().collection('shop_items').insertOne({ name, description, icon: icon || '🎁', cost: cost || 100, category: category || 'reward', stock: stock === undefined ? -1 : stock, isActive: isActive !== false, purchaseCount: 0, createdAt: new Date() });
    res.json({ success: true, item: { ...req.body, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/shop-items/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() }; delete updates._id;
    await getDb().collection('shop_items').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/shop-items/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('shop_items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Announcements - FIXED for all roles
router.get('/announcements', authenticateToken, async (req, res) => {
  try { res.json({ success: true, announcements: await getDb().collection('announcements').find({}).sort({ pinned: -1, createdAt: -1 }).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.get('/announcements/public', async (req, res) => {
  try {
    const db = getDb();
    const { audience } = req.query;
    console.log('📢 Fetching announcements for:', audience);
    
    const now = new Date();
    let filter = { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] };
    
    if (audience && audience !== 'all') {
      const audienceNormalized = audience.toLowerCase();
      const audienceMatches = ['all'];
      if (audienceNormalized.includes('student')) audienceMatches.push('student', 'students');
      else if (audienceNormalized.includes('teacher')) audienceMatches.push('teacher', 'teachers');
      else if (audienceNormalized.includes('parent')) audienceMatches.push('parent', 'parents');
      else audienceMatches.push(audienceNormalized);
      
      filter = {
        $and: [
          { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] },
          { $or: [{ audience: { $in: audienceMatches } }, { audience: { $exists: false } }] }
        ]
      };
    }
    
    const announcements = await db.collection('announcements').find(filter).sort({ pinned: -1, createdAt: -1 }).limit(10).toArray();
    console.log(`✅ Found ${announcements.length} announcements`);
    res.json({ success: true, announcements });
  } catch (e) {
    console.error('Get announcements error:', e);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

router.post('/announcements', authenticateToken, async (req, res) => {
  try {
    const { title, content, priority, audience, pinned, expiresAt } = req.body;
    const result = await getDb().collection('announcements').insertOne({ title, content, priority: priority || 'info', audience: audience || 'all', pinned: pinned || false, author: req.user.name || req.user.email, expiresAt: expiresAt ? new Date(expiresAt) : null, createdAt: new Date(), updatedAt: new Date() });
    console.log(`📢 Announcement created: "${title}"`);
    res.json({ success: true, announcement: { ...req.body, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() }; delete updates._id;
    if (updates.expiresAt) updates.expiresAt = new Date(updates.expiresAt);
    await getDb().collection('announcements').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('announcements').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Maintenance
router.get('/maintenance', authenticateToken, async (req, res) => {
  try { res.json({ success: true, messages: await getDb().collection('maintenance_messages').find({}).sort({ createdAt: -1 }).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    const { title, content, scheduledStart, scheduledEnd, type, isActive } = req.body;
    const result = await getDb().collection('maintenance_messages').insertOne({ title, content, scheduledStart: scheduledStart ? new Date(scheduledStart) : null, scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null, type: type || 'maintenance', isActive: isActive !== false, createdBy: req.user.email, createdAt: new Date() });
    res.json({ success: true, message: { ...req.body, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/maintenance/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() }; delete updates._id;
    if (updates.scheduledStart) updates.scheduledStart = new Date(updates.scheduledStart);
    if (updates.scheduledEnd) updates.scheduledEnd = new Date(updates.scheduledEnd);
    await getDb().collection('maintenance_messages').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/maintenance/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('maintenance_messages').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Support Tickets
router.get('/support-tickets', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { status, priority } = req.query;
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    const tickets = await db.collection('supporttickets').find(filter).sort({ createdAt: -1 }).toArray();
    const counts = {
      all: await db.collection('supporttickets').countDocuments({}),
      open: await db.collection('supporttickets').countDocuments({ status: 'open' }),
      in_progress: await db.collection('supporttickets').countDocuments({ status: 'in_progress' }),
      resolved: await db.collection('supporttickets').countDocuments({ status: 'resolved' }),
      closed: await db.collection('supporttickets').countDocuments({ status: 'closed' })
    };
    res.json({ success: true, tickets, counts });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/support-tickets/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { status, reply } = req.body;
    const ticket = await db.collection('supporttickets').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!ticket) return res.status(404).json({ success: false, error: 'Not found' });
    const updates = { status, updatedAt: new Date() };
    if (reply) updates.responses = [...(ticket.responses || []), { by: req.user.name || 'Admin', message: reply, at: new Date() }];
    await db.collection('supporttickets').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const [totalStudents, activeToday, totalQuizzes] = await Promise.all([
      db.collection('students').countDocuments({}),
      db.collection('students').countDocuments({ last_active: { $gte: new Date(Date.now() - 86400000) } }),
      db.collection('quizattempts').countDocuments({})
    ]);
    const classPerformance = await db.collection('students').aggregate([
      { $match: { class: { $ne: null } } },
      { $group: { _id: '$class', students: { $sum: 1 }, avgScore: { $avg: '$average_score' }, avgPoints: { $avg: '$points' } } },
      { $sort: { avgScore: -1 } }
    ]).toArray();
    const topStudents = await db.collection('students').find({}).sort({ points: -1 }).limit(10).toArray();
    res.json({ success: true, overview: { totalStudents, activeToday, totalQuizzes, avgScore: 0 }, classPerformance, topStudents, strugglingStudents: [] });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Bulk Upload
router.post('/bulk-upload/:type', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const db = getDb();
    const { type } = req.params;
    const results = [], errors = [];
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path).pipe(csv()).on('data', (row) => rows.push(row)).on('end', resolve).on('error', reject);
    });
    for (const row of rows) {
      try {
        const email = (row.email || row.Email || '').toLowerCase().trim();
        const name = row.name || row.Name || '';
        if (!email || !name) { errors.push({ row, error: 'Missing data' }); continue; }
        if (await db.collection('users').findOne({ email })) { errors.push({ row, error: 'Email exists' }); continue; }
        const role = normalizeRole(type.slice(0, -1));
        const tempPassword = generateTempPassword(role);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const newUser = { name, email, password: hashedPassword, role, gradeLevel: row.gradeLevel || 'Primary 1', class: row.class || null, accountActive: true, createdBy: req.user.email, createdAt: new Date() };
        const result = await db.collection('users').insertOne(newUser);
        if (role === 'Student') {
          await db.collection('students').insertOne({ user_id: result.insertedId, name, email, grade_level: newUser.gradeLevel, class: newUser.class, points: 0, level: 1, streak: 0, total_quizzes: 0, badges: [], created_at: new Date() });
        }
        results.push({ name, email, tempPassword });
      } catch (err) { errors.push({ row, error: err.message }); }
    }
    fs.unlinkSync(req.file.path);
    res.json({ success: true, created: results.length, failed: errors.length, results, errors });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Point Rules
router.get('/point-rules', authenticateToken, async (req, res) => {
  try { res.json({ success: true, rules: await getDb().collection('point_rules').find({}).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});
router.post('/point-rules', authenticateToken, async (req, res) => {
  try { const result = await getDb().collection('point_rules').insertOne({ ...req.body, createdAt: new Date() }); res.json({ success: true, rule: { ...req.body, _id: result.insertedId } }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});
router.put('/point-rules/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('point_rules').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { ...req.body, updatedAt: new Date() } }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});
router.delete('/point-rules/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('point_rules').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

module.exports = router;
