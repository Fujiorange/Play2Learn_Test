// backend/routes/schoolAdminRoutes.js - FIXED VERSION
// Queries USERS collection correctly for dashboard stats
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendTeacherWelcomeEmail, sendParentWelcomeEmail, sendStudentCredentialsToParent } = require('../services/emailService');
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

// ==================== PASSWORD GENERATOR ====================
function generateTempPassword(userType) {
  const crypto = require('crypto');
  const prefix = userType.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex');
  const special = '!';
  return `${prefix}${year}${random}${special}`;
}

// ==================== DASHBOARD STATS (FIXED!) ====================
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    // ✅ FIX: Query the 'users' collection with role field, not separate collections!
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Teacher' }),
      User.countDocuments({ role: 'Parent' }),
      User.countDocuments()
    ]);

    console.log(`✅ Found: ${totalStudents} students, ${totalTeachers} teachers, ${totalParents} parents`);

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get active users (last 30 days login)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      accountActive: true
    });

    res.json({
      success: true,
      stats: {
        students: totalStudents,
        teachers: totalTeachers,
        parents: totalParents,
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        recentRegistrations: recentRegistrations,
        classes: 0, // Will implement when class management is ready
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard stats',
      details: error.message 
    });
  }
});

// ==================== GET USERS (FIXED!) ====================
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { gradeLevel, subject, role } = req.query;
    
    const filter = {};
    
    // Filter by role
    if (role) {
      filter.role = role;
    }
    
    // Filter by grade level (for students)
    if (gradeLevel) {
      filter.gradeLevel = gradeLevel;
    }
    
    // Filter by subject (for teachers)
    if (subject) {
      filter.subject = subject;
    }

    console.log('🔍 Fetching users with filter:', filter);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users`);

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
        gradeLevel: user.gradeLevel,
        subject: user.subject,
        contact: user.contact,
        accountActive: user.accountActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      }))
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// ==================== BULK IMPORT STUDENTS (FIXED - NO DUPLICATE PROFILE) ====================
router.post('/bulk-import-students', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import students request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('📄 Parsing CSV file...');
  
  const students = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: []
  };

  try {
    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          students.push({
            name: row.Name || row.name || '',
            email: row.Email || row.email || '',
            class: row.Class || row.class || '',
            gradeLevel: row.GradeLevel || row.gradeLevel || row['Grade Level'] || row.grade_level || '',
            parentEmail: row.ParentEmail || row.parentEmail || row['Parent Email'] || row.parent_email || '',
            contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || '',
            gender: row.Gender || row.gender || '',
            dateOfBirth: row.DateOfBirth || row.dateOfBirth || row['Date of Birth'] || row.date_of_birth || ''
          });
        })
        .on('end', () => {
          console.log(`✅ Found ${students.length} students in CSV`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(error);
        });
    });

    console.log('\n🔄 Processing students...\n');

    // ✅ FIX: Only create user in 'users' collection, NO separate student profile
    for (const studentData of students) {
      try {
        console.log(`👤 Processing: ${studentData.name} (${studentData.email})`);
        
        // Validate required fields
        if (!studentData.name || !studentData.email) {
          console.log(`⚠️  Skipping - Missing required fields`);
          results.failed++;
          results.errors.push({ 
            email: studentData.email || 'unknown', 
            error: 'Missing required fields (name or email)' 
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: studentData.email });
        if (existingUser) {
          console.log(`⚠️  Skipping - Email already exists: ${studentData.email}`);
          results.failed++;
          results.errors.push({ 
            email: studentData.email, 
            error: 'Email already registered' 
          });
          continue;
        }

        // Generate password
        const tempPassword = generateTempPassword('Student');
        console.log(`🔑 Generated password: ${tempPassword}`);
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const username = studentData.email.split('@')[0];

        // Parse date of birth
        let parsedDateOfBirth = null;
        if (studentData.dateOfBirth) {
          try {
            const dateStr = studentData.dateOfBirth.trim();
            
            if (dateStr.includes('-')) {
              parsedDateOfBirth = new Date(dateStr);
            } else if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                parsedDateOfBirth = new Date(year, month, day);
              }
            }
            
            if (parsedDateOfBirth && isNaN(parsedDateOfBirth.getTime())) {
              parsedDateOfBirth = null;
            }
          } catch (error) {
            parsedDateOfBirth = null;
          }
        }

        // Normalize gender value
        const normalizedGender = studentData.gender ? studentData.gender.toLowerCase() : null;

        // ✅ Create ONLY user account (no duplicate student profile!)
        const student = await User.create({
          name: studentData.name,
          email: studentData.email,
          username: username,
          password: hashedPassword,
          role: 'Student',
          class: studentData.class || null,
          gradeLevel: studentData.gradeLevel || 'Primary 1',
          contact: studentData.contact || null,
          gender: normalizedGender,
          date_of_birth: parsedDateOfBirth,
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
          isTrialUser: false
        });

        console.log(`✅ Student created: ${student.name} (${student.email})`);
        results.created++;

        // Send credentials to parent if email provided
        if (studentData.parentEmail) {
          console.log(`📧 Sending credentials to parent: ${studentData.parentEmail}...`);
          
          const emailResult = await sendStudentCredentialsToParent(
            student,
            tempPassword,
            studentData.parentEmail,
            'Your School'
          );

          if (emailResult.success) {
            console.log(`✅ Email sent to parent`);
            results.emailsSent++;
          } else {
            console.log(`❌ Failed to send email to parent`);
            results.emailsFailed++;
          }
        }

      } catch (error) {
        console.error(`❌ Error creating student ${studentData.email}:`, error);
        results.failed++;
        results.errors.push({ 
          email: studentData.email, 
          error: error.message 
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('\n✅ Bulk import completed!');
    console.log(`   Created: ${results.created}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Emails sent: ${results.emailsSent}`);
    console.log(`   Emails failed: ${results.emailsFailed}\n`);

    res.json({
      success: true,
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Bulk import failed',
      details: error.message 
    });
  }
});

// ==================== BULK IMPORT TEACHERS ====================
router.post('/bulk-import-teachers', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import teachers request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const teachers = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: []
  };

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          teachers.push({
            name: row.Name || row.name || '',
            email: row.Email || row.email || '',
            subject: row.Subject || row.subject || 'Mathematics',
            contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || '',
            gender: row.Gender || row.gender || '',
          });
        })
        .on('end', () => {
          console.log(`✅ Found ${teachers.length} teachers in CSV`);
          resolve();
        })
        .on('error', reject);
    });

    for (const teacherData of teachers) {
      try {
        if (!teacherData.name || !teacherData.email) {
          results.failed++;
          results.errors.push({ 
            email: teacherData.email || 'unknown', 
            error: 'Missing required fields' 
          });
          continue;
        }

        const existingUser = await User.findOne({ email: teacherData.email });
        if (existingUser) {
          results.failed++;
          results.errors.push({ 
            email: teacherData.email, 
            error: 'Email already registered' 
          });
          continue;
        }

        const tempPassword = generateTempPassword('Teacher');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const teacher = await User.create({
          name: teacherData.name,
          email: teacherData.email,
          password: hashedPassword,
          role: 'Teacher',
          subject: teacherData.subject || 'Mathematics',
          contact: teacherData.contact || null,
          gender: teacherData.gender ? teacherData.gender.toLowerCase() : null,
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
        });

        console.log(`✅ Teacher created: ${teacher.name}`);
        results.created++;

        // Send welcome email
        const emailResult = await sendTeacherWelcomeEmail(
          teacher,
          tempPassword,
          'Your School'
        );

        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.emailsFailed++;
        }

      } catch (error) {
        console.error(`❌ Error creating teacher:`, error);
        results.failed++;
        results.errors.push({ 
          email: teacherData.email, 
          error: error.message 
        });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Bulk import failed' });
  }
});

// ==================== BULK IMPORT PARENTS ====================
router.post('/bulk-import-parents', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import parents request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const parents = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: []
  };

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          parents.push({
            name: row.Name || row.name || '',
            email: row.Email || row.email || '',
            studentEmail: row.StudentEmail || row.studentEmail || row['Student Email'] || '',
            contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || '',
            relationship: row.Relationship || row.relationship || 'Parent',
          });
        })
        .on('end', () => {
          console.log(`✅ Found ${parents.length} parents in CSV`);
          resolve();
        })
        .on('error', reject);
    });

    for (const parentData of parents) {
      try {
        if (!parentData.name || !parentData.email) {
          results.failed++;
          results.errors.push({ 
            email: parentData.email || 'unknown', 
            error: 'Missing required fields' 
          });
          continue;
        }

        const existingUser = await User.findOne({ email: parentData.email });
        if (existingUser) {
          results.failed++;
          results.errors.push({ 
            email: parentData.email, 
            error: 'Email already registered' 
          });
          continue;
        }

        // Find linked student
        let linkedStudent = null;
        if (parentData.studentEmail) {
          linkedStudent = await User.findOne({ 
            email: parentData.studentEmail, 
            role: 'Student' 
          });
        }

        const tempPassword = generateTempPassword('Parent');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const parent = await User.create({
          name: parentData.name,
          email: parentData.email,
          password: hashedPassword,
          role: 'Parent',
          contact: parentData.contact || null,
          linkedStudents: linkedStudent ? [{
            studentId: linkedStudent._id,
            relationship: parentData.relationship || 'Parent'
          }] : [],
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
        });

        console.log(`✅ Parent created: ${parent.name}`);
        results.created++;

        // Send welcome email
        const emailResult = await sendParentWelcomeEmail(
          parent,
          tempPassword,
          linkedStudent ? linkedStudent.name : 'Your Child',
          'Your School'
        );

        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.emailsFailed++;
        }

      } catch (error) {
        console.error(`❌ Error creating parent:`, error);
        results.failed++;
        results.errors.push({ 
          email: parentData.email, 
          error: error.message 
        });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Bulk import failed' });
  }
});

// ==================== MANUAL CREATE USER ====================
router.post('/users/manual', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, gradeLevel, subject, gender } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, password, and role are required' 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      gender: gender || null,
      gradeLevel: gradeLevel || 'Primary 1',
      subject: subject || 'Mathematics',
      emailVerified: true,
      accountActive: true,
      createdBy: 'school-admin',
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// ==================== DELETE USER ====================
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// ==================== UPDATE USER STATUS ====================
router.put('/users/:id/status', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountActive: isActive },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

// ==================== UPDATE USER ROLE ====================
router.put('/users/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Security check
    if (role === 'School Admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Cannot assign school-admin role' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// ==================== RESET USER PASSWORD ====================
router.put('/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// ==================== GET CLASSES ====================
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    // Get unique classes
    const classes = await User.aggregate([
      { $match: { role: 'Student', class: { $ne: null } } },
      { $group: { 
        _id: { class: '$class', gradeLevel: '$gradeLevel' },
        studentCount: { $sum: 1 }
      }},
      { $project: {
        _id: 0,
        id: '$_id.class',
        name: '$_id.class',
        grade: '$_id.gradeLevel',
        subject: 'Mathematics',
        students: '$studentCount',
        teacher: 'Not assigned'
      }}
    ]);
    
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

// ==================== CREATE CLASS ====================
router.post('/classes', authenticateToken, async (req, res) => {
  try {
    const { name, grade, subject } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Class name is required' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: new mongoose.Types.ObjectId().toString(),
        name,
        grade: grade || 'Primary 1',
        subject: subject || 'Mathematics',
        students: 0,
        teacher: 'Not assigned'
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

module.exports = router;