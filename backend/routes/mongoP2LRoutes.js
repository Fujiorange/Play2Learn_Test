// routes/mongoP2LRoutes.js
// Play2Learn Platform Admin Routes - Complete Management System

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// ==================== MIDDLEWARE ====================
// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is platform-admin
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.userId),
      role: 'platform-admin'
    });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Platform admin access required' 
      });
    }

    req.user = decoded;
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ==================== ADMIN LOGIN/LOGOUT ====================

// Admin login (separate from regular login for security)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const db = mongoose.connection.db;
    
    // Get admin user
    const user = await db.collection('users').findOne({ 
      email: email, 
      role: 'platform-admin' 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid admin credentials' 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid admin credentials' 
      });
    }

    // Check if admin is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin account is deactivated' 
      });
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );

    // Generate admin token with extended privileges
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        role: user.role,
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Shorter expiry for admin
    );

    // Get admin details
    const admin = await db.collection('platform_admins').findOne({ 
      user_id: user._id 
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        admin_level: admin?.admin_level || 'moderator',
        permissions: admin?.permissions || []
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Admin login failed' });
  }
});

// Admin logout (optional - client-side token removal)
router.post('/admin-logout', authenticateAdmin, (req, res) => {
  // Note: For JWT, logout is client-side (remove token)
  // You might want to add token blacklisting for sensitive admin sessions
  res.json({
    success: true,
    message: 'Admin logout successful'
  });
});

// ==================== SCHOOL ENROLLMENT & LICENSING ====================

// Get all schools with licensing info
router.get('/schools', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const filter = { role: 'school-admin' };
    if (status) filter.approval_status = status;
    if (search) {
      filter.$or = [
        { organization_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'school_profile.school_code': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get school admins (schools)
    const [schoolAdmins, total] = await Promise.all([
      db.collection('users')
        .find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection('users').countDocuments(filter)
    ]);

    // Enrich with school profiles and licensing
    const schools = await Promise.all(
      schoolAdmins.map(async (admin) => {
        const schoolProfile = await db.collection('school_profiles').findOne({ 
          admin_id: admin._id 
        });
        
        const license = await db.collection('licenses').findOne({
          school_id: admin._id,
          status: 'active'
        });

        const schoolAdminsCount = await db.collection('users').countDocuments({
          school_id: admin._id,
          role: 'school-admin'
        });

        return {
          school_id: admin._id,
          school_name: admin.organization_name,
          school_email: admin.email,
          school_code: schoolProfile?.school_code || 'N/A',
          license_tier: license?.tier || 'free',
          license_status: license?.status || 'inactive',
          license_expiry: license?.expiry_date,
          max_students: license?.max_students || 0,
          max_teachers: license?.max_teachers || 0,
          current_students: await db.collection('students').countDocuments({ 
            school_id: admin._id 
          }),
          current_teachers: await db.collection('teachers').countDocuments({ 
            school_id: admin._id 
          }),
          school_admins: schoolAdminsCount,
          status: admin.approval_status,
          created_at: admin.created_at
        };
      })
    );

    res.json({
      success: true,
      schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schools' });
  }
});

// Add/Update School Profile
router.post('/schools/profile', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { 
      admin_id, 
      school_name, 
      school_code, 
      address, 
      phone, 
      email, 
      principal_name,
      tier = 'basic',
      max_students = 100,
      max_teachers = 10,
      expiry_months = 12
    } = req.body;

    if (!admin_id || !school_name || !school_code) {
      return res.status(400).json({ 
        success: false, 
        error: 'admin_id, school_name, and school_code are required' 
      });
    }

    const adminId = new mongoose.Types.ObjectId(admin_id);
    
    // Check if admin exists and is a school-admin
    const admin = await db.collection('users').findOne({ 
      _id: adminId,
      role: 'school-admin' 
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'School admin not found' 
      });
    }

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiry_months);

    // Update school profile
    const schoolProfile = {
      admin_id: adminId,
      school_name,
      school_code,
      address: address || '',
      phone: phone || '',
      email: email || admin.email,
      principal_name: principal_name || '',
      tier,
      max_students,
      max_teachers,
      created_at: now,
      updated_at: now
    };

    // Upsert school profile
    await db.collection('school_profiles').updateOne(
      { admin_id: adminId },
      { $set: schoolProfile },
      { upsert: true }
    );

    // Create or update license
    const license = {
      school_id: adminId,
      tier,
      max_students,
      max_teachers,
      status: 'active',
      issued_date: now,
      expiry_date: expiryDate,
      created_at: now,
      updated_at: now
    };

    await db.collection('licenses').updateOne(
      { school_id: adminId, status: 'active' },
      { $set: license },
      { upsert: true }
    );

    // Update admin user with school info
    await db.collection('users').updateOne(
      { _id: adminId },
      { 
        $set: { 
          organization_name: school_name,
          updated_at: now
        }
      }
    );

    res.json({
      success: true,
      message: 'School profile updated successfully',
      school: {
        school_id: adminId,
        school_name,
        school_code,
        tier,
        license_status: 'active',
        expiry_date: expiryDate,
        max_students,
        max_teachers
      }
    });

  } catch (error) {
    console.error('School profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update school profile' });
  }
});

// Remove school (soft delete)
router.delete('/schools/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const schoolId = new mongoose.Types.ObjectId(req.params.id);

    // Check if school exists
    const schoolAdmin = await db.collection('users').findOne({ 
      _id: schoolId,
      role: 'school-admin' 
    });

    if (!schoolAdmin) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    // Deactivate school (soft delete)
    await db.collection('users').updateOne(
      { _id: schoolId },
      { 
        $set: { 
          is_active: false,
          approval_status: 'suspended',
          updated_at: new Date()
        }
      }
    );

    // Revoke active license
    await db.collection('licenses').updateOne(
      { school_id: schoolId, status: 'active' },
      { 
        $set: { 
          status: 'revoked',
          revoked_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    // Log the action
    await db.collection('admin_actions').insertOne({
      admin_id: new mongoose.Types.ObjectId(req.user.userId),
      action: 'remove_school',
      target_id: schoolId,
      target_type: 'school',
      details: `School ${schoolAdmin.organization_name} removed`,
      created_at: new Date()
    });

    res.json({
      success: true,
      message: 'School removed successfully'
    });

  } catch (error) {
    console.error('Remove school error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove school' });
  }
});

// ==================== SCHOOL ADMIN PROFILES ====================

// Get all school admins for a specific school
router.get('/schools/:id/admins', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const schoolId = new mongoose.Types.ObjectId(req.params.id);
    
    const schoolAdmins = await db.collection('users').find({
      school_id: schoolId,
      role: 'school-admin'
    }).toArray();

    // Enrich with admin profiles
    const admins = await Promise.all(
      schoolAdmins.map(async (admin) => {
        const adminProfile = await db.collection('school_admins').findOne({
          user_id: admin._id
        });

        const permissions = await db.collection('admin_permissions').findOne({
          admin_id: admin._id
        });

        return {
          admin_id: admin._id,
          name: admin.name,
          email: admin.email,
          contact: admin.contact,
          role: 'school-admin',
          permissions: permissions?.permissions || ['basic'],
          is_active: admin.is_active,
          created_at: admin.created_at,
          last_login: admin.last_login
        };
      })
    );

    res.json({
      success: true,
      school_id: schoolId,
      admins,
      total: admins.length
    });

  } catch (error) {
    console.error('Get school admins error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch school admins' });
  }
});

// Add new school admin
router.post('/schools/:id/admins', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const schoolId = new mongoose.Types.ObjectId(req.params.id);
    const { name, email, password, contact, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    // Check if school exists
    const school = await db.collection('users').findOne({
      _id: schoolId,
      role: 'school-admin'
    });

    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new school admin user
    const newAdmin = {
      name,
      email,
      password_hash: passwordHash,
      contact: contact || '',
      role: 'school-admin',
      school_id: schoolId,
      organization_name: school.organization_name,
      organization_type: 'school',
      approval_status: 'approved',
      is_active: true,
      created_at: new Date(),
      last_login: null
    };

    const result = await db.collection('users').insertOne(newAdmin);
    const userId = result.insertedId;

    // Create school admin profile
    await db.collection('school_admins').insertOne({
      user_id: userId,
      school_id: schoolId,
      permissions: permissions || ['basic'],
      created_at: new Date()
    });

    // Create permission record
    await db.collection('admin_permissions').insertOne({
      admin_id: userId,
      school_id: schoolId,
      permissions: permissions || ['basic'],
      created_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'School admin created successfully',
      admin: {
        admin_id: userId,
        name,
        email,
        school_id: schoolId,
        school_name: school.organization_name,
        permissions: permissions || ['basic']
      }
    });

  } catch (error) {
    console.error('Add school admin error:', error);
    res.status(500).json({ success: false, error: 'Failed to create school admin' });
  }
});

// ==================== LICENSE ASSIGNMENT ====================

// Assign/Update license for a school
router.post('/licenses/assign', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { 
      school_id, 
      tier, 
      max_students, 
      max_teachers, 
      expiry_months,
      notes 
    } = req.body;

    if (!school_id || !tier) {
      return res.status(400).json({ 
        success: false, 
        error: 'school_id and tier are required' 
      });
    }

    const schoolId = new mongoose.Types.ObjectId(school_id);
    
    // Check if school exists
    const school = await db.collection('users').findOne({
      _id: schoolId,
      role: 'school-admin'
    });

    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (expiry_months || 12));

    // Deactivate any existing active license
    await db.collection('licenses').updateMany(
      { school_id: schoolId, status: 'active' },
      { 
        $set: { 
          status: 'expired',
          updated_at: now
        }
      }
    );

    // Create new license
    const license = {
      school_id: schoolId,
      tier,
      max_students: max_students || 100,
      max_teachers: max_teachers || 10,
      status: 'active',
      issued_date: now,
      issued_by: new mongoose.Types.ObjectId(req.user.userId),
      expiry_date: expiryDate,
      notes: notes || '',
      created_at: now,
      updated_at: now
    };

    const result = await db.collection('licenses').insertOne(license);

    // Update school profile with tier
    await db.collection('school_profiles').updateOne(
      { admin_id: schoolId },
      { 
        $set: { 
          tier,
          max_students: max_students || 100,
          max_teachers: max_teachers || 10,
          updated_at: now
        }
      },
      { upsert: true }
    );

    // Log license assignment
    await db.collection('license_history').insertOne({
      license_id: result.insertedId,
      school_id: schoolId,
      admin_id: new mongoose.Types.ObjectId(req.user.userId),
      action: 'assign',
      tier,
      max_students: max_students || 100,
      max_teachers: max_teachers || 10,
      expiry_date: expiryDate,
      notes: notes || '',
      created_at: now
    });

    res.json({
      success: true,
      message: 'License assigned successfully',
      license: {
        license_id: result.insertedId,
        school_id: schoolId,
        school_name: school.organization_name,
        tier,
        max_students: max_students || 100,
        max_teachers: max_teachers || 10,
        status: 'active',
        issued_date: now,
        expiry_date: expiryDate
      }
    });

  } catch (error) {
    console.error('Assign license error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign license' });
  }
});

// Get all licenses
router.get('/licenses', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status, tier, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (tier) filter.tier = tier;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [licenses, total] = await Promise.all([
      db.collection('licenses')
        .find(filter)
        .sort({ issued_date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection('licenses').countDocuments(filter)
    ]);

    // Enrich with school information
    const enrichedLicenses = await Promise.all(
      licenses.map(async (license) => {
        const school = await db.collection('users').findOne({
          _id: license.school_id
        });

        const schoolProfile = await db.collection('school_profiles').findOne({
          admin_id: license.school_id
        });

        const issuedBy = license.issued_by ? 
          await db.collection('users').findOne({ _id: license.issued_by }) : null;

        // Get current usage
        const currentStudents = await db.collection('students').countDocuments({
          school_id: license.school_id
        });

        const currentTeachers = await db.collection('teachers').countDocuments({
          school_id: license.school_id
        });

        return {
          ...license,
          school_name: school?.organization_name || 'Unknown',
          school_code: schoolProfile?.school_code || 'N/A',
          issued_by_name: issuedBy?.name || 'System',
          current_students: currentStudents,
          current_teachers: currentTeachers,
          student_usage_percentage: license.max_students > 0 ? 
            Math.round((currentStudents / license.max_students) * 100) : 0,
          teacher_usage_percentage: license.max_teachers > 0 ? 
            Math.round((currentTeachers / license.max_teachers) * 100) : 0
        };
      })
    );

    res.json({
      success: true,
      licenses: enrichedLicenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch licenses' });
  }
});

// ==================== SUPPORT MANAGEMENT ====================

// Get all support tickets
router.get('/support/tickets', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status, priority, category, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tickets, total] = await Promise.all([
      db.collection('support_tickets')
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection('support_tickets').countDocuments(filter)
    ]);

    // Enrich tickets with user info
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await db.collection('users').findOne({ _id: ticket.user_id });
        const updates = await db.collection('ticket_updates')
          .find({ ticket_id: ticket._id })
          .sort({ created_at: -1 })
          .limit(5)
          .toArray();

        return {
          ...ticket,
          user_name: user?.name || 'Unknown',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          updates: updates.map(update => ({
            action: update.action,
            details: update.details,
            admin: update.admin_name || 'System',
            timestamp: update.created_at
          }))
        };
      })
    );

    res.json({
      success: true,
      tickets: enrichedTickets,
      stats: {
        open: await db.collection('support_tickets').countDocuments({ status: 'open' }),
        in_progress: await db.collection('support_tickets').countDocuments({ status: 'in_progress' }),
        resolved: await db.collection('support_tickets').countDocuments({ status: 'resolved' }),
        closed: await db.collection('support_tickets').countDocuments({ status: 'closed' })
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch support tickets' });
  }
});

// Update ticket status
router.put('/support/tickets/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const ticketId = new mongoose.Types.ObjectId(req.params.id);
    const { status, response, assigned_to, priority } = req.body;
    
    // Get current ticket
    const ticket = await db.collection('support_tickets').findOne({ _id: ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const updateData = {
      updated_at: new Date()
    };
    
    if (status) updateData.status = status;
    if (response) updateData.admin_response = response;
    if (assigned_to) updateData.assigned_to = new mongoose.Types.ObjectId(assigned_to);
    if (priority) updateData.priority = priority;

    // Update ticket
    const result = await db.collection('support_tickets').updateOne(
      { _id: ticketId },
      { $set: updateData }
    );

    // Log the update
    await db.collection('ticket_updates').insertOne({
      ticket_id: ticketId,
      admin_id: new mongoose.Types.ObjectId(req.user.userId),
      admin_name: req.admin.name,
      action: status ? `Status changed to ${status}` : 'Response added',
      details: response || '',
      created_at: new Date()
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        ...ticket,
        ...updateData
      }
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

// ==================== SYSTEM MANAGEMENT ====================

// System health check
router.get('/system/health', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    
    // Get system metrics
    const [
      totalUsers,
      activeUsers24h,
      totalQuizzes24h,
      systemUptime,
      errorLogs24h,
      pendingJobs
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({
        last_login: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      db.collection('quiz_attempts').countDocuments({
        created_at: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      db.collection('system_metrics').findOne({ key: 'uptime' }),
      db.collection('error_logs').countDocuments({
        timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      db.collection('background_jobs').countDocuments({
        status: 'pending'
      })
    ]);

    // Get recent errors
    const recentErrors = await db.collection('error_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Database connection check
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      success: true,
      health: {
        status: 'healthy',
        timestamp: now,
        database: {
          status: dbStatus,
          connection: mongoose.connection.readyState
        },
        metrics: {
          total_users: totalUsers,
          active_users_24h: activeUsers24h,
          quizzes_24h: totalQuizzes24h,
          error_rate_24h: errorLogs24h,
          pending_jobs: pendingJobs
        },
        system: {
          uptime: systemUptime?.value || 'Unknown',
          memory_usage: process.memoryUsage(),
          node_version: process.version
        },
        recent_errors: recentErrors.map(error => ({
          error: error.error,
          endpoint: error.endpoint,
          timestamp: error.timestamp
        }))
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'System health check failed',
      details: error.message 
    });
  }
});

// Get bug reports
router.get('/system/bugs', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status, severity, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bugs, total] = await Promise.all([
      db.collection('bug_reports')
        .find(filter)
        .sort({ reported_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection('bug_reports').countDocuments(filter)
    ]);

    res.json({
      success: true,
      bugs,
      stats: {
        open: await db.collection('bug_reports').countDocuments({ status: 'open' }),
        in_progress: await db.collection('bug_reports').countDocuments({ status: 'in_progress' }),
        resolved: await db.collection('bug_reports').countDocuments({ status: 'resolved' })
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bug reports' });
  }
});

// Update bug status
router.put('/system/bugs/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bugId = new mongoose.Types.ObjectId(req.params.id);
    const { status, resolution, assignee } = req.body;
    
    const updateData = {
      updated_at: new Date()
    };
    
    if (status) updateData.status = status;
    if (resolution) updateData.resolution = resolution;
    if (assignee) updateData.assignee = new mongoose.Types.ObjectId(assignee);
    if (status === 'resolved') updateData.resolved_at = new Date();

    const result = await db.collection('bug_reports').updateOne(
      { _id: bugId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Bug report not found' });
    }

    // Log bug resolution
    if (status === 'resolved') {
      await db.collection('bug_resolutions').insertOne({
        bug_id: bugId,
        resolved_by: new mongoose.Types.ObjectId(req.user.userId),
        resolution: resolution || '',
        resolved_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Bug report updated successfully'
    });

  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bug report' });
  }
});

// ==================== MACHINE LEARNING & ANALYTICS ====================

// Student profiling analytics
router.get('/ml/student-profiles', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get profile distribution
    const profileDistribution = await db.collection('students').aggregate([
      { $match: { current_profile: { $ne: null } } },
      {
        $group: {
          _id: '$current_profile',
          count: { $sum: 1 },
          avg_points: { $avg: '$points' },
          avg_quizzes: { $avg: '$total_quizzes' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Get skill matrix
    const skillMatrix = await db.collection('math_skills').aggregate([
      {
        $group: {
          _id: null,
          addition_avg_level: { $avg: '$addition.current_level' },
          subtraction_avg_level: { $avg: '$subtraction.current_level' },
          multiplication_avg_level: { $avg: '$multiplication.current_level' },
          division_avg_level: { $avg: '$division.current_level' }
        }
      }
    ]).toArray();

    // Get learning patterns
    const learningPatterns = await db.collection('quiz_attempts').aggregate([
      {
        $match: {
          quiz_type: { $ne: 'placement' },
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$created_at' },
            hour: { $hour: '$created_at' }
          },
          count: { $sum: 1 },
          avg_score: { $avg: '$percentage' }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]).toArray();

    // Get progression rates
    const progressionRates = await db.collection('quiz_attempts').aggregate([
      {
        $match: {
          quiz_type: { $ne: 'placement' },
          profile_change: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$profile_change',
          count: { $sum: 1 },
          percentage: { 
            $avg: { 
              $cond: [
                { $eq: ['$profile_change', 'advance'] }, 
                1, 
                { $cond: [
                  { $eq: ['$profile_change', 'demote'] }, 
                  -1, 
                  0 
                ]} 
              ]
            } 
          }
        }
      }
    ]).toArray();

    res.json({
      success: true,
      analytics: {
        profile_distribution: profileDistribution,
        skill_matrix: skillMatrix[0] || {},
        learning_patterns: learningPatterns,
        progression_rates: progressionRates,
        recommendations: generateMLRecommendations(profileDistribution, skillMatrix)
      }
    });

  } catch (error) {
    console.error('Student profiling error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate student profiles' });
  }
});

// Helper function for ML recommendations
function generateMLRecommendations(profileDistribution, skillMatrix) {
  const recommendations = [];
  
  // Example recommendations based on data
  if (profileDistribution.length > 0) {
    const lowProfiles = profileDistribution.filter(p => p._id <= 3);
    if (lowProfiles.length > 0) {
      recommendations.push({
        type: 'intervention',
        message: `Consider adding more basic addition/subtraction exercises for ${lowProfiles.reduce((sum, p) => sum + p.count, 0)} students in Profiles 1-3`,
        priority: 'medium'
      });
    }
    
    const highProfiles = profileDistribution.filter(p => p._id >= 8);
    if (highProfiles.length > 0) {
      recommendations.push({
        type: 'challenge',
        message: `Create advanced multiplication/division challenges for ${highProfiles.reduce((sum, p) => sum + p.count, 0)} students in Profiles 8-10`,
        priority: 'low'
      });
    }
  }

  if (skillMatrix[0]) {
    const skills = skillMatrix[0];
    if (skills.multiplication_avg_level < 2) {
      recommendations.push({
        type: 'curriculum',
        message: 'Multiplication skills need improvement across platform',
        priority: 'high'
      });
    }
  }

  return recommendations;
}

// ==================== RESOURCE MANAGEMENT ====================

// Create/Update/Delete Subjects
router.post('/resources/subjects', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { action, subject_id, name, description, grade_levels, color } = req.body;

    if (!action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Action is required (create/update/delete)' 
      });
    }

    const now = new Date();

    switch (action) {
      case 'create':
        if (!name) {
          return res.status(400).json({ 
            success: false, 
            error: 'Subject name is required' 
          });
        }

        const subject = {
          name,
          description: description || '',
          grade_levels: grade_levels || ['Primary 1', 'Primary 2', 'Primary 3'],
          color: color || '#4CAF50',
          is_active: true,
          created_at: now,
          updated_at: now
        };

        const result = await db.collection('subjects').insertOne(subject);
        
        res.status(201).json({
          success: true,
          message: 'Subject created successfully',
          subject: {
            subject_id: result.insertedId,
            ...subject
          }
        });
        break;

      case 'update':
        if (!subject_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Subject ID is required for update' 
          });
        }

        const updateData = {
          updated_at: now
        };
        
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (grade_levels) updateData.grade_levels = grade_levels;
        if (color) updateData.color = color;
        if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

        await db.collection('subjects').updateOne(
          { _id: new mongoose.Types.ObjectId(subject_id) },
          { $set: updateData }
        );

        res.json({
          success: true,
          message: 'Subject updated successfully'
        });
        break;

      case 'delete':
        if (!subject_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Subject ID is required for deletion' 
          });
        }

        // Soft delete (deactivate)
        await db.collection('subjects').updateOne(
          { _id: new mongoose.Types.ObjectId(subject_id) },
          { 
            $set: { 
              is_active: false,
              updated_at: now
            }
          }
        );

        res.json({
          success: true,
          message: 'Subject deleted successfully'
        });
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action. Use create, update, or delete' 
        });
    }

  } catch (error) {
    console.error('Subject management error:', error);
    res.status(500).json({ success: false, error: 'Subject operation failed' });
  }
});

// Create/Update/Delete Classes
router.post('/resources/classes', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { action, class_id, school_id, grade_level, class_name, subjects, teacher_id } = req.body;

    if (!action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Action is required (create/update/delete)' 
      });
    }

    const now = new Date();

    switch (action) {
      case 'create':
        if (!school_id || !grade_level || !class_name) {
          return res.status(400).json({ 
            success: false, 
            error: 'School ID, grade level, and class name are required' 
          });
        }

        const newClass = {
          school_id: new mongoose.Types.ObjectId(school_id),
          grade_level,
          class_name,
          subjects: subjects || [],
          teacher_id: teacher_id ? new mongoose.Types.ObjectId(teacher_id) : null,
          student_count: 0,
          is_active: true,
          academic_year: new Date().getFullYear(),
          created_at: now,
          updated_at: now
        };

        const result = await db.collection('classes').insertOne(newClass);
        
        res.status(201).json({
          success: true,
          message: 'Class created successfully',
          class: {
            class_id: result.insertedId,
            ...newClass
          }
        });
        break;

      case 'update':
        if (!class_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Class ID is required for update' 
          });
        }

        const updateData = {
          updated_at: now
        };
        
        if (grade_level) updateData.grade_level = grade_level;
        if (class_name) updateData.class_name = class_name;
        if (subjects) updateData.subjects = subjects;
        if (teacher_id) updateData.teacher_id = new mongoose.Types.ObjectId(teacher_id);
        if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

        await db.collection('classes').updateOne(
          { _id: new mongoose.Types.ObjectId(class_id) },
          { $set: updateData }
        );

        res.json({
          success: true,
          message: 'Class updated successfully'
        });
        break;

      case 'delete':
        if (!class_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'Class ID is required for deletion' 
          });
        }

        // Soft delete
        await db.collection('classes').updateOne(
          { _id: new mongoose.Types.ObjectId(class_id) },
          { 
            $set: { 
              is_active: false,
              updated_at: now
            }
          }
        );

        res.json({
          success: true,
          message: 'Class deleted successfully'
        });
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action. Use create, update, or delete' 
        });
    }

  } catch (error) {
    console.error('Class management error:', error);
    res.status(500).json({ success: false, error: 'Class operation failed' });
  }
});

// Assign subject to class
router.post('/resources/assign-subject', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { class_id, subject_id, teacher_id } = req.body;

    if (!class_id || !subject_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Class ID and Subject ID are required' 
      });
    }

    const classObj = await db.collection('classes').findOne({
      _id: new mongoose.Types.ObjectId(class_id)
    });

    if (!classObj) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    const subject = await db.collection('subjects').findOne({
      _id: new mongoose.Types.ObjectId(subject_id)
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    // Check if subject is already assigned
    const existingAssignment = classObj.subjects.find(
      s => s.subject_id.toString() === subject_id
    );

    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject already assigned to this class' 
      });
    }

    // Add subject to class
    const assignment = {
      subject_id: new mongoose.Types.ObjectId(subject_id),
      subject_name: subject.name,
      teacher_id: teacher_id ? new mongoose.Types.ObjectId(teacher_id) : null,
      assigned_at: new Date()
    };

    await db.collection('classes').updateOne(
      { _id: new mongoose.Types.ObjectId(class_id) },
      { 
        $push: { subjects: assignment },
        $set: { updated_at: new Date() }
      }
    );

    // If teacher is specified, update teacher assignments
    if (teacher_id) {
      await db.collection('teacher_assignments').insertOne({
        teacher_id: new mongoose.Types.ObjectId(teacher_id),
        class_id: new mongoose.Types.ObjectId(class_id),
        subject_id: new mongoose.Types.ObjectId(subject_id),
        assigned_by: new mongoose.Types.ObjectId(req.user.userId),
        assigned_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Subject assigned to class successfully',
      assignment
    });

  } catch (error) {
    console.error('Assign subject error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign subject' });
  }
});

// Assign teacher to class/subject
router.post('/resources/assign-teacher', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { teacher_id, class_id, subject_id } = req.body;

    if (!teacher_id || (!class_id && !subject_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Teacher ID and either Class ID or Subject ID are required' 
      });
    }

    // Check if teacher exists
    const teacher = await db.collection('teachers').findOne({
      user_id: new mongoose.Types.ObjectId(teacher_id)
    });

    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    if (class_id && subject_id) {
      // Assign teacher to specific subject in a class
      const assignment = {
        teacher_id: new mongoose.Types.ObjectId(teacher_id),
        class_id: new mongoose.Types.ObjectId(class_id),
        subject_id: new mongoose.Types.ObjectId(subject_id),
        assignment_type: 'class_subject',
        assigned_by: new mongoose.Types.ObjectId(req.user.userId),
        assigned_at: new Date()
      };

      await db.collection('teacher_assignments').insertOne(assignment);

      // Update the class record
      await db.collection('classes').updateOne(
        { 
          _id: new mongoose.Types.ObjectId(class_id),
          'subjects.subject_id': new mongoose.Types.ObjectId(subject_id)
        },
        { 
          $set: { 
            'subjects.$.teacher_id': new mongoose.Types.ObjectId(teacher_id),
            updated_at: new Date()
          }
        }
      );

      res.json({
        success: true,
        message: 'Teacher assigned to class subject successfully',
        assignment
      });

    } else if (class_id) {
      // Assign teacher as homeroom teacher for the class
      await db.collection('classes').updateOne(
        { _id: new mongoose.Types.ObjectId(class_id) },
        { 
          $set: { 
            teacher_id: new mongoose.Types.ObjectId(teacher_id),
            updated_at: new Date()
          }
        }
      );

      res.json({
        success: true,
        message: 'Teacher assigned as homeroom teacher successfully'
      });
    }

  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign teacher' });
  }
});

// Get all resources overview
router.get('/resources/overview', authenticateAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    const [
      subjectsCount,
      classesCount,
      activeClasses,
      assignmentsCount
    ] = await Promise.all([
      db.collection('subjects').countDocuments({ is_active: true }),
      db.collection('classes').countDocuments(),
      db.collection('classes').countDocuments({ is_active: true }),
      db.collection('teacher_assignments').countDocuments()
    ]);

    // Get recent activities
    const recentSubjects = await db.collection('subjects')
      .find({ is_active: true })
      .sort({ updated_at: -1 })
      .limit(5)
      .toArray();

    const recentClasses = await db.collection('classes')
      .find({ is_active: true })
      .sort({ updated_at: -1 })
      .limit(5)
      .toArray();

    // Get subject-class distribution
    const subjectDistribution = await db.collection('classes').aggregate([
      { $unwind: '$subjects' },
      {
        $group: {
          _id: '$subjects.subject_name',
          class_count: { $sum: 1 }
        }
      },
      { $sort: { class_count: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({
      success: true,
      overview: {
        subjects: {
          total: subjectsCount,
          recent: recentSubjects
        },
        classes: {
          total: classesCount,
          active: activeClasses,
          recent: recentClasses
        },
        assignments: assignmentsCount,
        distribution: subjectDistribution
      }
    });

  } catch (error) {
    console.error('Resources overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch resources overview' });
  }
});

module.exports = router;