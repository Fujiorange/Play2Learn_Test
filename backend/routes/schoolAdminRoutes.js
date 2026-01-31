// backend/routes/schoolAdminRoutes.js - WITH SCHOOL ISOLATION
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

// ============ SCHOOL ISOLATION HELPER ============
// Gets the schoolId for the current School Admin
const getSchoolId = async (db, userId) => {
  try {
    const adminUser = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!adminUser) return null;
    
    // Check multiple possible fields for school ID
    // Priority: schoolId > school_id > organization_id > _id (for school-admin who IS the school)
    if (adminUser.schoolId) return adminUser.schoolId.toString();
    if (adminUser.school_id) return adminUser.school_id.toString();
    if (adminUser.organization_id) return adminUser.organization_id.toString();
    
    // For school admins, their own _id might be the school reference
    // Check if there's a school record linked to this admin
    const school = await db.collection('schools').findOne({
      $or: [
        { admin_id: adminUser._id },
        { admin_email: adminUser.email }
      ]
    });
    
    if (school) return school._id.toString();
    
    // Fallback: use admin's own _id as schoolId
    return adminUser._id.toString();
  } catch (e) {
    console.error('getSchoolId error:', e);
    return null;
  }
};

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

const canModifyUser = async (db, userId, schoolId) => {
  try {
    const objectId = toObjectId(userId);
    if (!objectId) {
      return { allowed: false, error: 'Invalid user ID format', user: null };
    }
    const user = await db.collection('users').findOne({ _id: objectId });
    if (!user) return { allowed: false, error: 'User not found', user: null };
    
    // Check if user belongs to same school
    const userSchoolId = user.schoolId || user.school_id;
    if (schoolId && userSchoolId && userSchoolId.toString() !== schoolId.toString()) {
      return { allowed: false, error: 'User belongs to different school', user: null };
    }
    
    const protectedRoles = ['p2ladmin', 'p2l-admin', 'school-admin', 'schooladmin', 'platform-admin', 'platform admin'];
    if (protectedRoles.includes(user.role?.toLowerCase())) return { allowed: false, error: 'Cannot modify admin', user };
    return { allowed: true, user };
  } catch (e) {
    console.error('canModifyUser error:', e);
    return { allowed: false, error: 'Invalid user ID', user: null };
  }
};

// ============ ROUTES WITH SCHOOL ISOLATION ============

// Dashboard Stats - FILTERED BY SCHOOL
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    console.log('📊 Dashboard for schoolId:', schoolId);
    
    // Build filter - if schoolId exists, filter by it
    const schoolFilter = schoolId ? { schoolId: schoolId } : {};
    
    const [totalStudents, totalTeachers, totalParents, totalClasses] = await Promise.all([
      db.collection('users').countDocuments({ ...schoolFilter, role: { $in: ['Student', 'student'] } }),
      db.collection('users').countDocuments({ ...schoolFilter, role: { $in: ['Teacher', 'teacher'] } }),
      db.collection('users').countDocuments({ ...schoolFilter, role: { $in: ['Parent', 'parent'] } }),
      db.collection('classes').countDocuments(schoolId ? { schoolId: schoolId } : {})
    ]);
    
    // Get school info if available
    let schoolInfo = null;
    if (schoolId) {
      schoolInfo = await db.collection('schools').findOne({ _id: toObjectId(schoolId) });
    }
    
    res.json({
      success: true, 
      total_students: totalStudents, 
      total_teachers: totalTeachers,
      total_parents: totalParents, 
      total_classes: totalClasses,
      school: schoolInfo ? {
        name: schoolInfo.organization_name,
        plan: schoolInfo.plan,
        teacherLimit: schoolInfo.plan_info?.teacher_limit || 50,
        studentLimit: schoolInfo.plan_info?.student_limit || 500
      } : null,
      license: { 
        plan: schoolInfo?.plan || 'starter', 
        teacherLimit: schoolInfo?.plan_info?.teacher_limit || 50, 
        studentLimit: schoolInfo?.plan_info?.student_limit || 500, 
        currentTeachers: totalTeachers, 
        currentStudents: totalStudents 
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// Get users - FILTERED BY SCHOOL
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    console.log('👥 Getting users for schoolId:', schoolId);
    
    const { role, search, status } = req.query;
    const allowedRoles = ['Student', 'student', 'Teacher', 'teacher', 'Parent', 'parent'];
    
    // Base filter with school isolation
    let filter = { 
      role: { $in: allowedRoles }
    };
    
    // Add school filter if schoolId exists
    if (schoolId) {
      filter.schoolId = schoolId;
    }
    
    if (role && role !== 'all') filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
    if (status === 'active') filter.accountActive = true;
    if (status === 'disabled') filter.accountActive = false;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    
    const users = await db.collection('users').find(filter).project({ password: 0, password_hash: 0 }).sort({ createdAt: -1 }).limit(500).toArray();
    console.log('👥 Found', users.length, 'users for school');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// Create user - WITH SCHOOL ID
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    console.log('➕ Creating user for schoolId:', schoolId);
    
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
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      role: normalizedRole,
      gender: gender || null, 
      gradeLevel: gradeLevel || 'Primary 1', 
      class: userClass || null,
      classes: normalizedRole === 'Teacher' ? (classes || []) : undefined,
      linkedStudents: normalizedRole === 'Parent' ? (linkedStudents || []) : [],
      schoolId: schoolId, // ← SCHOOL ISOLATION: Tag user with school
      accountActive: true, 
      emailVerified: false, 
      createdBy: req.user.email,
      createdAt: new Date(), 
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // If student, also create in students collection
    if (normalizedRole === 'Student') {
      await db.collection('students').insertOne({
        user_id: result.insertedId,
        name,
        email: email.toLowerCase(),
        grade_level: gradeLevel || 'Primary 1',
        class: userClass || null,
        schoolId: schoolId, // ← SCHOOL ISOLATION
        points: 0,
        level: 1,
        streak: 0,
        total_quizzes: 0,
        badges: [],
        created_at: new Date()
      });
    }
    
    console.log('✅ User created:', email, 'for school:', schoolId);
    res.json({ success: true, user: { ...newUser, _id: result.insertedId, tempPassword } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    
    console.log('📝 PUT /users/:id called');
    console.log('   User ID:', req.params.id);
    console.log('   School ID:', schoolId);
    
    const check = await canModifyUser(db, req.params.id, schoolId);
    if (!check.allowed) {
      console.log('   ❌ Not allowed:', check.error);
      return res.status(403).json({ success: false, error: check.error });
    }
    
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.password; delete updates.role; delete updates.schoolId;
    
    console.log('   Updates to save:', JSON.stringify(updates));
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      console.log('   ❌ Invalid ObjectId');
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    
    const result = await db.collection('users').updateOne({ _id: objectId }, { $set: updates });
    console.log('   ✅ Update result: matchedCount=' + result.matchedCount + ', modifiedCount=' + result.modifiedCount);
    
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

// Update user status (enable/disable)
router.patch('/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const check = await canModifyUser(db, req.params.id, schoolId);
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

// Reset user password
router.post('/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const check = await canModifyUser(db, req.params.id, schoolId);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    
    const tempPassword = generateTempPassword(check.user.role || 'user');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await db.collection('users').updateOne({ _id: objectId }, { $set: { password: hashedPassword, updatedAt: new Date() } });
    console.log(`🔑 Password reset for ${check.user.email}`);
    res.json({ success: true, tempPassword });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const check = await canModifyUser(db, req.params.id, schoolId);
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

// Classes - FILTERED BY SCHOOL
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    
    // Filter by school if schoolId exists
    const filter = schoolId ? { schoolId: schoolId } : {};
    const classes = await db.collection('classes').find(filter).sort({ name: 1 }).toArray();
    
    // Remove duplicates by name
    const seenNames = new Set();
    const uniqueClasses = [];
    const duplicateIds = [];
    
    for (let cls of classes) {
      if (seenNames.has(cls.name)) {
        duplicateIds.push(cls._id);
        continue;
      }
      seenNames.add(cls.name);
      
      // Count students in this school
      const studentFilter = { class: cls.name, role: { $in: ['Student', 'student'] } };
      if (schoolId) studentFilter.schoolId = schoolId;
      cls.studentCount = await db.collection('users').countDocuments(studentFilter);
      
      if (cls.teacherId) {
        try {
          const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) });
          cls.teacherName = teacher?.name || 'Unknown';
        } catch (e) { cls.teacherName = 'Unknown'; }
      } else {
        cls.teacherName = 'Not assigned';
      }
      uniqueClasses.push(cls);
    }
    
    // Clean up duplicates in background
    if (duplicateIds.length > 0) {
      db.collection('classes').deleteMany({ _id: { $in: duplicateIds } })
        .then(() => console.log(`🧹 Cleaned up ${duplicateIds.length} duplicate classes`))
        .catch(err => console.error('Cleanup error:', err));
    }
    
    res.json({ success: true, classes: uniqueClasses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

// Create class - WITH SCHOOL ID
router.post('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    
    const { name, grade, subject, teacherId } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Class name required' });
    
    // Check for existing class with same name IN THIS SCHOOL
    const existingFilter = { name: name.trim() };
    if (schoolId) existingFilter.schoolId = schoolId;
    const existing = await db.collection('classes').findOne(existingFilter);
    if (existing) return res.status(400).json({ success: false, error: 'Class name exists in your school' });
    
    let teacherName = null;
    if (teacherId && teacherId !== '' && teacherId !== 'null') {
      try {
        const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
        teacherName = teacher?.name || null;
        if (teacher) await db.collection('users').updateOne({ _id: teacher._id }, { $addToSet: { classes: name.trim() } });
      } catch (e) {}
    }
    
    const newClass = { 
      name: name.trim(), 
      grade: grade || 'Primary 1', 
      subject: subject || 'Mathematics', 
      teacherId: teacherId || null, 
      teacherName, 
      studentCount: 0, 
      schoolId: schoolId, // ← SCHOOL ISOLATION
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    const result = await db.collection('classes').insertOne(newClass);
    console.log(`✅ Class created: ${name} for school: ${schoolId}`);
    res.json({ success: true, class: { ...newClass, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

// Update class
router.put('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const { teacherId, name } = req.body;
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid class ID' });
    
    const cls = await db.collection('classes').findOne({ _id: objectId });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found' });
    
    // Verify class belongs to this school
    if (schoolId && cls.schoolId && cls.schoolId.toString() !== schoolId.toString()) {
      return res.status(403).json({ success: false, error: 'Class belongs to different school' });
    }
    
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.schoolId;
    
    // Handle teacher change
    if (teacherId !== undefined && teacherId !== cls.teacherId) {
      if (cls.teacherId) {
        try { await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) }, { $pull: { classes: cls.name } }); } catch (e) {}
      }
      if (teacherId && teacherId !== '' && teacherId !== 'null') {
        try {
          const teacher = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
          updates.teacherName = teacher?.name || null;
          await db.collection('users').updateOne({ _id: teacher._id }, { $addToSet: { classes: cls.name } });
        } catch (e) { updates.teacherName = null; }
      } else {
        updates.teacherName = null;
      }
    }
    
    // Check name uniqueness if changing
    if (name && name !== cls.name) {
      const nameFilter = { name: name.trim(), _id: { $ne: objectId } };
      if (schoolId) nameFilter.schoolId = schoolId;
      const existing = await db.collection('classes').findOne(nameFilter);
      if (existing) return res.status(400).json({ success: false, error: 'Class name exists' });
    }
    
    await db.collection('classes').updateOne({ _id: objectId }, { $set: updates });
    res.json({ success: true, class: await db.collection('classes').findOne({ _id: objectId }) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

// Delete class
router.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ success: false, error: 'Invalid class ID' });
    
    const cls = await db.collection('classes').findOne({ _id: objectId });
    
    // Verify class belongs to this school
    if (cls && schoolId && cls.schoolId && cls.schoolId.toString() !== schoolId.toString()) {
      return res.status(403).json({ success: false, error: 'Class belongs to different school' });
    }
    
    if (cls?.teacherId) {
      try { await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(cls.teacherId) }, { $pull: { classes: cls.name } }); } catch (e) {}
    }
    await db.collection('classes').deleteOne({ _id: objectId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

// Badges - FILTERED BY SCHOOL
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const filter = schoolId ? { $or: [{ schoolId: schoolId }, { schoolId: { $exists: false } }, { isGlobal: true }] } : {};
    const badges = await db.collection('badges').find(filter).toArray();
    res.json({ success: true, badges });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/badges', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const badge = { ...req.body, schoolId: schoolId, createdAt: new Date() };
    const result = await db.collection('badges').insertOne(badge);
    res.json({ success: true, badge: { ...badge, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/badges/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.schoolId;
    await db.collection('badges').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/badges/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('badges').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Shop Items - FILTERED BY SCHOOL
router.get('/shop-items', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const filter = schoolId ? { $or: [{ schoolId: schoolId }, { schoolId: { $exists: false } }, { isGlobal: true }] } : {};
    res.json({ success: true, items: await db.collection('shop_items').find(filter).toArray() });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/shop-items', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const item = { ...req.body, schoolId: schoolId, createdAt: new Date() };
    const result = await db.collection('shop_items').insertOne(item);
    res.json({ success: true, item: { ...item, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/shop-items/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.schoolId;
    await getDb().collection('shop_items').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/shop-items/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('shop_items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Announcements - FILTERED BY SCHOOL
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const filter = schoolId ? { $or: [{ schoolId: schoolId }, { schoolId: { $exists: false } }, { isGlobal: true }] } : {};
    res.json({ success: true, announcements: await db.collection('announcements').find(filter).sort({ createdAt: -1 }).toArray() });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const ann = { ...req.body, schoolId: schoolId, createdAt: new Date(), createdBy: req.user.email };
    const result = await db.collection('announcements').insertOne(ann);
    res.json({ success: true, announcement: { ...ann, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.schoolId;
    await getDb().collection('announcements').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('announcements').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Support Tickets - FILTERED BY SCHOOL
router.get('/support-tickets', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const { status, priority } = req.query;
    const filter = schoolId ? { schoolId: schoolId } : {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    res.json({ success: true, tickets: await db.collection('supporttickets').find(filter).sort({ createdAt: -1 }).toArray() });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/support-tickets/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    await getDb().collection('supporttickets').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Maintenance Messages
router.get('/maintenance', authenticateToken, async (req, res) => {
  try { res.json({ success: true, messages: await getDb().collection('maintenance_messages').find({}).sort({ createdAt: -1 }).toArray() }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    const msg = { ...req.body, createdAt: new Date() };
    const result = await getDb().collection('maintenance_messages').insertOne(msg);
    res.json({ success: true, message: { ...msg, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.put('/maintenance/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('maintenance_messages').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { ...req.body, updatedAt: new Date() } }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.delete('/maintenance/:id', authenticateToken, async (req, res) => {
  try { await getDb().collection('maintenance_messages').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Analytics - FILTERED BY SCHOOL
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const filter = schoolId ? { schoolId: schoolId } : {};
    
    const [totalStudents, totalQuizzes, avgScore] = await Promise.all([
      db.collection('users').countDocuments({ ...filter, role: { $in: ['Student', 'student'] } }),
      db.collection('quiz_attempts').countDocuments(filter),
      db.collection('quiz_attempts').aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$score' } } }
      ]).toArray()
    ]);
    
    res.json({
      success: true,
      analytics: {
        totalStudents,
        totalQuizzes,
        averageScore: avgScore[0]?.avg || 0,
        activeUsers: totalStudents
      }
    });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// Bulk Upload - WITH SCHOOL ID
router.post('/bulk-upload/:type', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const { type } = req.params;
    const results = [], errors = [];
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path).pipe(csv()).on('data', (row) => rows.push(row)).on('end', resolve).on('error', reject);
    });
    
    // Auto-create classes without duplicates
    const classesToCreate = new Set();
    for (const row of rows) {
      const className = (row.class || row.Class || '').trim();
      if (className) classesToCreate.add(className);
    }
    
    for (const className of classesToCreate) {
      const existingFilter = { name: className };
      if (schoolId) existingFilter.schoolId = schoolId;
      const existing = await db.collection('classes').findOne(existingFilter);
      if (!existing) {
        await db.collection('classes').insertOne({
          name: className,
          grade: 'Primary 1',
          subject: 'Mathematics',
          teacherId: null,
          teacherName: null,
          studentCount: 0,
          schoolId: schoolId, // ← SCHOOL ISOLATION
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Auto-created class: ${className} for school: ${schoolId}`);
      }
    }
    
    for (const row of rows) {
      try {
        const email = (row.email || row.Email || '').toLowerCase().trim();
        const name = row.name || row.Name || '';
        if (!email || !name) { errors.push({ row, error: 'Missing data' }); continue; }
        if (await db.collection('users').findOne({ email })) { errors.push({ row, error: 'Email exists' }); continue; }
        const role = normalizeRole(type.slice(0, -1));
        const tempPassword = generateTempPassword(role);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const newUser = { 
          name, 
          email, 
          password: hashedPassword, 
          role, 
          gradeLevel: row.gradeLevel || 'Primary 1', 
          class: row.class || null, 
          schoolId: schoolId, // ← SCHOOL ISOLATION
          accountActive: true, 
          createdBy: req.user.email, 
          createdAt: new Date() 
        };
        const result = await db.collection('users').insertOne(newUser);
        if (role === 'Student') {
          await db.collection('students').insertOne({ 
            user_id: result.insertedId, 
            name, 
            email, 
            grade_level: newUser.gradeLevel, 
            class: newUser.class, 
            schoolId: schoolId, // ← SCHOOL ISOLATION
            points: 0, 
            level: 1, 
            streak: 0, 
            total_quizzes: 0, 
            badges: [], 
            created_at: new Date() 
          });
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
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const filter = schoolId ? { $or: [{ schoolId: schoolId }, { schoolId: { $exists: false } }] } : {};
    res.json({ success: true, rules: await db.collection('point_rules').find(filter).toArray() });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
});

router.post('/point-rules', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const schoolId = await getSchoolId(db, req.user.userId);
    const result = await db.collection('point_rules').insertOne({ ...req.body, schoolId: schoolId, createdAt: new Date() });
    res.json({ success: true, rule: { ...req.body, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: 'Failed' }); }
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
