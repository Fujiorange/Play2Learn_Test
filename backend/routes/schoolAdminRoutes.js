// backend/routes/schoolAdminRoutes.js - COMPLETE VERSION
// ✅ All School Admin CRUD operations
// ✅ Badges, Points, Announcements, Support Tickets, Classes
// ✅ Proper MongoDB integration

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ==================== AUTHENTICATION MIDDLEWARE ====================
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

// ==================== FILE UPLOAD CONFIGURATION ====================
const upload = multer({ dest: 'uploads/' });

// ==================== HELPER: Get DB Connection ====================
const getDb = () => mongoose.connection.db;

// ==================== HELPER: Normalize Role ====================
const normalizeRole = (role) => {
  const roleMap = {
    'student': 'Student',
    'teacher': 'Teacher',
    'parent': 'Parent',
    'school-admin': 'School-Admin',
    'schooladmin': 'School-Admin',
    'p2ladmin': 'P2L-Admin',
    'platform-admin': 'P2L-Admin',
    'trial user': 'Trial-User',
    'trial': 'Trial-User'
  };
  return roleMap[role?.toLowerCase()] || role;
};

// ==================== PASSWORD GENERATOR ====================
function generateTempPassword(userType) {
  const crypto = require('crypto');
  const prefix = userType.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex');
  return `${prefix}${year}${random}!`;
}

// ============================================================
//                    DASHBOARD STATS (with License Info)
// ============================================================
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    
    // Get the school admin's school info to check license
    const schoolAdmin = await db.collection('users').findOne({ 
      email: req.user.email 
    });
    
    // Get school license info
    let licenseInfo = null;
    if (schoolAdmin?.schoolId) {
      const school = await db.collection('schools').findOne({ 
        _id: new mongoose.Types.ObjectId(schoolAdmin.schoolId) 
      });
      if (school) {
        licenseInfo = {
          plan: school.plan || 'starter',
          teacherLimit: school.plan_info?.teacher_limit || 50,
          studentLimit: school.plan_info?.student_limit || 500,
          currentTeachers: school.current_teachers || 0,
          currentStudents: school.current_students || 0
        };
      }
    }
    
    // If no school found, try to find by school admin's organization
    if (!licenseInfo) {
      const school = await db.collection('schools').findOne({
        $or: [
          { contact: req.user.email },
          { admin_email: req.user.email }
        ]
      });
      if (school) {
        licenseInfo = {
          plan: school.plan || 'starter',
          teacherLimit: school.plan_info?.teacher_limit || 50,
          studentLimit: school.plan_info?.student_limit || 500,
          currentTeachers: school.current_teachers || 0,
          currentStudents: school.current_students || 0
        };
      }
    }
    
    // Count users by role
    const [totalStudents, totalTeachers, totalParents, totalClasses] = await Promise.all([
      db.collection('users').countDocuments({ role: { $in: ['Student', 'student'] } }),
      db.collection('users').countDocuments({ role: { $in: ['Teacher', 'teacher'] } }),
      db.collection('users').countDocuments({ role: { $in: ['Parent', 'parent'] } }),
      db.collection('classes').countDocuments({})
    ]);

    // Update license info with actual counts
    if (licenseInfo) {
      licenseInfo.currentTeachers = totalTeachers;
      licenseInfo.currentStudents = totalStudents;
    }

    res.json({
      success: true,
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_parents: totalParents,
      total_classes: totalClasses,
      license: licenseInfo || {
        plan: 'starter',
        teacherLimit: 50,
        studentLimit: 500,
        currentTeachers: totalTeachers,
        currentStudents: totalStudents
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

// ============================================================
//                    USER MANAGEMENT
// ============================================================

// Get all users (with filters)
// School Admin can ONLY see: Students, Teachers, Parents (NOT P2L Admin or School Admin)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { role, search, status } = req.query;
    
    // School Admin can only manage these roles
    const allowedRoles = ['Student', 'student', 'Teacher', 'teacher', 'Parent', 'parent'];
    
    let filter = {
      role: { $in: allowedRoles }
    };
    
    if (role && role !== 'all') {
      filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
      // Double check it's an allowed role
      if (!allowedRoles.some(r => r.toLowerCase() === role.toLowerCase())) {
        return res.status(403).json({ success: false, error: 'Cannot view this role' });
      }
    }
    if (status === 'active') filter.accountActive = true;
    if (status === 'disabled') filter.accountActive = false;
    if (search) {
      filter.$and = [
        { role: { $in: allowedRoles } },
        { $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]}
      ];
    }

    const users = await db.collection('users')
      .find(filter)
      .project({ password: 0, password_hash: 0 })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// Add single user
// School Admin can ONLY create: Students, Teachers, Parents
// Must check license limits before creating
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, email, role, gender, gradeLevel, class: userClass, subject, classes, linkedStudents } = req.body;

    // School Admin cannot create admin accounts
    const allowedRoles = ['student', 'teacher', 'parent'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(403).json({ success: false, error: 'You can only create Student, Teacher, or Parent accounts' });
    }

    // Check license limits
    const school = await db.collection('schools').findOne({
      $or: [
        { contact: req.user.email },
        { admin_email: req.user.email }
      ]
    });

    if (school) {
      const teacherLimit = school.plan_info?.teacher_limit || 50;
      const studentLimit = school.plan_info?.student_limit || 500;
      
      if (role.toLowerCase() === 'teacher') {
        const currentTeachers = await db.collection('users').countDocuments({ role: { $in: ['Teacher', 'teacher'] } });
        if (currentTeachers >= teacherLimit) {
          return res.status(403).json({ 
            success: false, 
            error: `Teacher license limit reached (${currentTeachers}/${teacherLimit}). Please upgrade your plan.` 
          });
        }
      }
      
      if (role.toLowerCase() === 'student') {
        const currentStudents = await db.collection('users').countDocuments({ role: { $in: ['Student', 'student'] } });
        if (currentStudents >= studentLimit) {
          return res.status(403).json({ 
            success: false, 
            error: `Student license limit reached (${currentStudents}/${studentLimit}). Please upgrade your plan.` 
          });
        }
      }
    }

    // Check if email exists
    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    // Validate teacher must have at least one class
    if (role.toLowerCase() === 'teacher' && (!classes || classes.length === 0)) {
      return res.status(400).json({ success: false, error: 'Teacher must be assigned to at least one class' });
    }

    // Validate parent must have at least one linked student
    if (role.toLowerCase() === 'parent' && (!linkedStudents || linkedStudents.length === 0)) {
      return res.status(400).json({ success: false, error: 'Parent must be linked to at least one student' });
    }

    const tempPassword = generateTempPassword(role);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const normalizedRole = normalizeRole(role);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
      gender: gender || null,
      gradeLevel: gradeLevel || null,
      class: userClass || null,
      subject: subject || null,
      // Teacher: array of classes they teach
      classes: normalizedRole === 'Teacher' ? (classes || []) : undefined,
      // Parent: array of linked student IDs
      linkedStudents: normalizedRole === 'Parent' ? (linkedStudents || []) : [],
      accountActive: true,
      emailVerified: false,
      createdBy: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);

    // If student, also create entry in students collection
    if (normalizedRole === 'Student') {
      await db.collection('students').insertOne({
        user_id: result.insertedId,
        name,
        email: email.toLowerCase(),
        grade_level: gradeLevel || 'Primary 1',
        class: userClass || null,
        points: 0,
        level: 1,
        current_profile: 1,
        streak: 0,
        total_quizzes: 0,
        badges: [],
        achievements: [],
        placement_completed: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Update school's current student count
      if (school) {
        await db.collection('schools').updateOne(
          { _id: school._id },
          { $inc: { current_students: 1 } }
        );
      }
    }

    // If teacher, update school's current teacher count
    if (normalizedRole === 'Teacher' && school) {
      await db.collection('schools').updateOne(
        { _id: school._id },
        { $inc: { current_teachers: 1 } }
      );
    }

    // If parent, update the linked students' parent reference
    if (normalizedRole === 'Parent' && linkedStudents && linkedStudents.length > 0) {
      for (const studentId of linkedStudents) {
        await db.collection('users').updateOne(
          { _id: new mongoose.Types.ObjectId(studentId) },
          { $set: { parentId: result.insertedId } }
        );
        await db.collection('students').updateOne(
          { user_id: new mongoose.Types.ObjectId(studentId) },
          { $set: { parent_id: result.insertedId } }
        );
      }
    }

    res.json({
      success: true,
      message: `User created successfully`,
      user: { ...newUser, _id: result.insertedId, password: undefined },
      tempPassword
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Helper: Check if School Admin can modify this user
const canModifyUser = async (db, userId) => {
  const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
  if (!user) return { allowed: false, error: 'User not found', user: null };
  
  const protectedRoles = ['p2ladmin', 'p2l-admin', 'school-admin', 'schooladmin', 'platform-admin'];
  if (protectedRoles.includes(user.role?.toLowerCase())) {
    return { allowed: false, error: 'You cannot modify admin accounts', user };
  }
  return { allowed: true, user };
};

// Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Check authority
    const check = await canModifyUser(db, id);
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error });
    }

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    delete updates.password;
    delete updates.role; // Cannot change role via this endpoint

    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Disable/Enable user
router.patch('/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { accountActive } = req.body;

    // Check authority
    const check = await canModifyUser(db, id);
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error });
    }

    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { accountActive, updatedAt: new Date() } }
    );

    res.json({ success: true, message: `User ${accountActive ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

// Reset password
router.post('/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Check authority
    const check = await canModifyUser(db, id);
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error });
    }

    const tempPassword = generateTempPassword(check.user.role || 'user');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ success: true, tempPassword, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Check authority
    const check = await canModifyUser(db, id);
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error });
    }

    await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
    // Also delete from students collection if applicable
    if (check.user.role?.toLowerCase() === 'student') {
      await db.collection('students').deleteOne({ user_id: new mongoose.Types.ObjectId(id) });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// ============================================================
//                    CLASS MANAGEMENT
// ============================================================

router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const classes = await db.collection('classes').find({}).sort({ name: 1 }).toArray();
    
    // Get student counts for each class
    for (let cls of classes) {
      cls.studentCount = await db.collection('users').countDocuments({ 
        class: cls.name, 
        role: { $in: ['Student', 'student'] } 
      });
    }

    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

router.post('/classes', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, gradeLevel, teacherId } = req.body;

    const existing = await db.collection('classes').findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Class name already exists' });
    }

    const newClass = {
      name,
      gradeLevel: gradeLevel || 'Primary 1',
      teacherId: teacherId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('classes').insertOne(newClass);
    res.json({ success: true, class: { ...newClass, _id: result.insertedId } });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

router.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('classes').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

// ============================================================
//                    BADGES MANAGEMENT
// ============================================================

router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const badges = await db.collection('badges').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, badges });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ success: false, error: 'Failed to load badges' });
  }
});

router.post('/badges', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, description, icon, criteriaType, criteriaValue, rarity, isActive } = req.body;

    const newBadge = {
      name,
      description,
      icon: icon || '🏆',
      criteriaType,
      criteriaValue: parseInt(criteriaValue),
      rarity: rarity || 'common',
      isActive: isActive !== false,
      earnedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('badges').insertOne(newBadge);
    res.json({ success: true, badge: { ...newBadge, _id: result.insertedId } });
  } catch (error) {
    console.error('Create badge error:', error);
    res.status(500).json({ success: false, error: 'Failed to create badge' });
  }
});

router.put('/badges/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;

    await db.collection('badges').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Badge updated successfully' });
  } catch (error) {
    console.error('Update badge error:', error);
    res.status(500).json({ success: false, error: 'Failed to update badge' });
  }
});

router.delete('/badges/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('badges').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Delete badge error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete badge' });
  }
});

// ============================================================
//                    POINTS MANAGEMENT
// ============================================================

router.get('/point-rules', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const rules = await db.collection('point_rules').find({}).sort({ points: -1 }).toArray();
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Get point rules error:', error);
    res.status(500).json({ success: false, error: 'Failed to load point rules' });
  }
});

router.post('/point-rules', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { action, points, description, isActive } = req.body;

    const newRule = {
      action,
      points: parseInt(points),
      description,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('point_rules').insertOne(newRule);
    res.json({ success: true, rule: { ...newRule, _id: result.insertedId } });
  } catch (error) {
    console.error('Create point rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to create point rule' });
  }
});

router.put('/point-rules/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;

    await db.collection('point_rules').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Point rule updated successfully' });
  } catch (error) {
    console.error('Update point rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to update point rule' });
  }
});

router.delete('/point-rules/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('point_rules').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Point rule deleted successfully' });
  } catch (error) {
    console.error('Delete point rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete point rule' });
  }
});

// NOTE: Points adjustment moved to Teacher routes
// School Admin can view point rules but cannot adjust individual student points
// See teacherRoutes.js for POST /students/:id/adjust-points

// ============================================================
//                    SHOP ITEMS
// ============================================================

router.get('/shop-items', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const items = await db.collection('shop_items').find({}).sort({ cost: 1 }).toArray();
    res.json({ success: true, items });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ success: false, error: 'Failed to load shop items' });
  }
});

router.post('/shop-items', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { name, description, icon, cost, category, stock, isActive } = req.body;

    const newItem = {
      name,
      description,
      icon: icon || '🎁',
      cost: parseInt(cost),
      category: category || 'cosmetic',
      stock: stock === -1 ? -1 : parseInt(stock || -1),
      purchaseCount: 0,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('shop_items').insertOne(newItem);
    res.json({ success: true, item: { ...newItem, _id: result.insertedId } });
  } catch (error) {
    console.error('Create shop item error:', error);
    res.status(500).json({ success: false, error: 'Failed to create shop item' });
  }
});

router.put('/shop-items/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;

    await db.collection('shop_items').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Shop item updated successfully' });
  } catch (error) {
    console.error('Update shop item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update shop item' });
  }
});

router.delete('/shop-items/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('shop_items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Shop item deleted successfully' });
  } catch (error) {
    console.error('Delete shop item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete shop item' });
  }
});

// ============================================================
//                    ANNOUNCEMENTS
// ============================================================

router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const announcements = await db.collection('announcements')
      .find({})
      .sort({ pinned: -1, createdAt: -1 })
      .toArray();
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to load announcements' });
  }
});

router.get('/announcements/public', async (req, res) => {
  try {
    const db = getDb();
    const { audience } = req.query;
    
    console.log('📢 Fetching public announcements for audience:', audience);
    
    const now = new Date();
    
    // Build filter - show announcements that are not expired
    let filter = {
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ]
    };

    // If specific audience, filter by audience
    if (audience && audience !== 'all') {
      filter.audience = { $in: ['all', audience, 'students', 'teachers', 'parents'] };
      // More specific: match 'all' OR the specific role
      filter = {
        $and: [
          { $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null },
            { expiresAt: { $exists: false } }
          ]},
          { $or: [
            { audience: 'all' },
            { audience: audience },
            { audience: { $exists: false } }
          ]}
        ]
      };
    }

    const announcements = await db.collection('announcements')
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(10)
      .toArray();

    console.log(`✅ Found ${announcements.length} announcements`);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to load announcements' });
  }
});

router.post('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { title, content, priority, audience, pinned, expiresAt } = req.body;

    const newAnnouncement = {
      title,
      content,
      priority: priority || 'info',
      audience: audience || 'all',
      pinned: pinned || false,
      author: req.user.name || req.user.email,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('announcements').insertOne(newAnnouncement);
    res.json({ success: true, announcement: { ...newAnnouncement, _id: result.insertedId } });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

router.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    if (updates.expiresAt) updates.expiresAt = new Date(updates.expiresAt);

    await db.collection('announcements').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

router.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('announcements').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

// ============================================================
//                    MAINTENANCE MESSAGES
// ============================================================

router.get('/maintenance', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const messages = await db.collection('maintenance_messages')
      .find({})
      .sort({ scheduledDate: -1 })
      .toArray();
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get maintenance messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to load maintenance messages' });
  }
});

router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { title, description, scheduledDate, startTime, endTime, notifyBefore } = req.body;

    const newMessage = {
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      notifyBefore: notifyBefore || '24',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('maintenance_messages').insertOne(newMessage);
    res.json({ success: true, message: { ...newMessage, _id: result.insertedId } });
  } catch (error) {
    console.error('Create maintenance message error:', error);
    res.status(500).json({ success: false, error: 'Failed to create maintenance message' });
  }
});

router.put('/maintenance/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    if (updates.scheduledDate) updates.scheduledDate = new Date(updates.scheduledDate);

    await db.collection('maintenance_messages').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Maintenance message updated successfully' });
  } catch (error) {
    console.error('Update maintenance message error:', error);
    res.status(500).json({ success: false, error: 'Failed to update maintenance message' });
  }
});

router.delete('/maintenance/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('maintenance_messages').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ success: true, message: 'Maintenance message deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance message error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete maintenance message' });
  }
});

// ============================================================
//                    SUPPORT TICKETS
// ============================================================

router.get('/support-tickets', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { status, priority } = req.query;
    
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;

    const tickets = await db.collection('supporttickets')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const counts = {
      all: await db.collection('supporttickets').countDocuments({}),
      open: await db.collection('supporttickets').countDocuments({ status: 'open' }),
      in_progress: await db.collection('supporttickets').countDocuments({ status: 'in_progress' }),
      resolved: await db.collection('supporttickets').countDocuments({ status: 'resolved' }),
      closed: await db.collection('supporttickets').countDocuments({ status: 'closed' })
    };

    res.json({ success: true, tickets, counts });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to load support tickets' });
  }
});

router.put('/support-tickets/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, reply } = req.body;

    const ticket = await db.collection('supporttickets').findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const updates = { status, updatedAt: new Date() };
    
    if (reply) {
      const newResponse = {
        by: req.user.name || 'School Admin',
        message: reply,
        at: new Date()
      };
      updates.responses = [...(ticket.responses || []), newResponse];
    }

    await db.collection('supporttickets').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updates }
    );

    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

// ============================================================
//                    ANALYTICS
// ============================================================

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const db = getDb();

    const [totalStudents, activeToday, totalQuizzes] = await Promise.all([
      db.collection('students').countDocuments({}),
      db.collection('students').countDocuments({ 
        last_active: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      db.collection('quiz_attempts').countDocuments({})
    ]);

    const classPerformance = await db.collection('students').aggregate([
      { $match: { class: { $ne: null } } },
      { $group: {
        _id: '$class',
        students: { $sum: 1 },
        avgScore: { $avg: '$average_score' },
        avgPoints: { $avg: '$points' },
        totalQuizzes: { $sum: '$total_quizzes' }
      }},
      { $sort: { avgScore: -1 } }
    ]).toArray();

    const topStudents = await db.collection('students')
      .find({})
      .sort({ points: -1 })
      .limit(10)
      .toArray();

    const strugglingStudents = await db.collection('students')
      .find({
        $or: [
          { average_score: { $lt: 60 } },
          { last_active: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      })
      .sort({ average_score: 1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      overview: { totalStudents, activeToday, totalQuizzes, avgScore: 0 },
      classPerformance,
      topStudents,
      strugglingStudents
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
});

// ============================================================
//                    CSV BULK UPLOAD
// ============================================================

router.post('/bulk-upload/:type', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const db = getDb();
    const { type } = req.params;
    const results = [];
    const errors = [];

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (const row of rows) {
      try {
        const email = (row.email || row.Email || '').toLowerCase().trim();
        const name = row.name || row.Name || '';

        if (!email || !name) {
          errors.push({ row, error: 'Missing name or email' });
          continue;
        }

        const existing = await db.collection('users').findOne({ email });
        if (existing) {
          errors.push({ row, error: 'Email already exists' });
          continue;
        }

        const role = normalizeRole(type.slice(0, -1));
        const tempPassword = generateTempPassword(role);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = {
          name,
          email,
          password: hashedPassword,
          role,
          gender: row.gender || row.Gender || null,
          gradeLevel: row.gradeLevel || row.GradeLevel || row.grade_level || 'Primary 1',
          class: row.class || row.Class || null,
          subject: row.subject || row.Subject || null,
          accountActive: true,
          emailVerified: false,
          createdBy: req.user.email,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        if (role === 'Student') {
          await db.collection('students').insertOne({
            user_id: result.insertedId,
            name,
            email,
            grade_level: newUser.gradeLevel,
            class: newUser.class,
            points: 0,
            level: 1,
            current_profile: 1,
            streak: 0,
            total_quizzes: 0,
            badges: [],
            achievements: [],
            placement_completed: false,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        results.push({ name, email, tempPassword });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      created: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to process file' });
  }
});

module.exports = router;
