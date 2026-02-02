// backend/routes/schoolAdminRoutes.js - COMPLETE VERSION WITH EMAIL FIX
// ✅ Queries USERS collection correctly for dashboard stats
// ✅ Parent CSV import with linkedStudents integration
// ✅ FIXED: Student credentials email now sends correct parameters
// backend/routes/schoolAdminRoutes.js - COMPLETE VERSION WITH EMAIL FIX + ANNOUNCEMENTS
// ✅ Queries USERS collection correctly for dashboard stats
// ✅ Parent CSV import with linkedStudents integration
// ✅ FIXED: Student credentials email now sends correct parameters
// ⭐ NEW: Added announcement routes from Wei Xiang's implementation
// backend/routes/schoolAdminRoutes.js - COMPREHENSIVE FIX
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const { sendTeacherWelcomeEmail, sendParentWelcomeEmail, sendStudentCredentialsToParent } = require('../services/emailService');
const { generateTempPassword } = require('../utils/passwordGenerator');
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

// Middleware to verify school admin role
const authenticateSchoolAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    // Fixed: Check for 'School Admin' as stored in database, not 'school-admin'
    if (!user || user.role !== 'School Admin') {
      return res.status(403).json({ success: false, error: 'Access restricted to school admins' });
    }
    
    req.user = decoded;
    req.schoolAdmin = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ==================== FILE UPLOAD CONFIGURATION ====================
const upload = multer({ dest: 'uploads/' });

// ==================== LICENSE CHECKING HELPER ====================
async function checkLicenseAvailability(schoolId, role) {
  const school = await School.findById(schoolId);
  
  if (!school) {
    return { available: false, error: 'School not found' };
  }
  
  if (!school.is_active) {
    return { available: false, error: 'School is not active' };
  }
  
  if (role === 'Teacher') {
    const currentTeachers = school.current_teachers || 0;
    const teacherLimit = school.plan_info.teacher_limit;
    
    if (currentTeachers >= teacherLimit) {
      return { 
        available: false, 
        error: `Teacher limit reached (${currentTeachers}/${teacherLimit}). Please upgrade your plan.` 
      };
    }
    return { available: true, school };
  }
  
  if (role === 'Student') {
    const currentStudents = school.current_students || 0;
    const studentLimit = school.plan_info.student_limit;
    
    if (currentStudents >= studentLimit) {
      return { 
        available: false, 
        error: `Student limit reached (${currentStudents}/${studentLimit}). Please upgrade your plan.` 
      };
    }
    return { available: true, school };
  }
  
  // Parent or other roles don't have limits
  return { available: true, school };
}

// ==================== STUDENT-PARENT LINK HELPER ====================
// Check if a student is already linked to a parent
async function checkStudentLinkedToParent(studentId) {
  const existingParent = await User.findOne({
    role: 'Parent',
    'linkedStudents.studentId': studentId
  });
  
  if (existingParent) {
    return { 
      isLinked: true, 
      parentEmail: existingParent.email 
    };
  }
  
  return { isLinked: false };
}

// ⭐ Helper to get MongoDB database (for announcements)
const getDb = () => mongoose.connection.db;

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

// ==================== GET SCHOOL LICENSE INFO ====================
router.get('/school-info', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    if (!schoolAdmin.schoolId) {
      return res.status(400).json({
        success: false,
        error: 'School admin is not associated with a school'
      });
    }
    
    const school = await School.findById(schoolAdmin.schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }
    
    // Get actual current counts from Users collection
    const [currentTeachers, currentStudents] = await Promise.all([
      User.countDocuments({ schoolId: schoolAdmin.schoolId, role: 'Teacher' }),
      User.countDocuments({ schoolId: schoolAdmin.schoolId, role: 'Student' })
    ]);
    
    // Update school counts if they differ (sync)
    if (school.current_teachers !== currentTeachers || school.current_students !== currentStudents) {
      school.current_teachers = currentTeachers;
      school.current_students = currentStudents;
      await school.save();
    }
    
    res.json({
      success: true,
      school: {
        id: school._id,
        organization_name: school.organization_name,
        organization_type: school.organization_type,
        plan: school.plan,
        plan_info: {
          teacher_limit: school.plan_info.teacher_limit,
          student_limit: school.plan_info.student_limit,
          price: school.plan_info.price
        },
        current_teachers: currentTeachers,
        current_students: currentStudents,
        is_active: school.is_active
      },
      license: {
        plan: school.plan,
        teachers: {
          current: currentTeachers,
          limit: school.plan_info.teacher_limit,
          available: Math.max(0, school.plan_info.teacher_limit - currentTeachers),
          limitReached: currentTeachers >= school.plan_info.teacher_limit
        },
        students: {
          current: currentStudents,
          limit: school.plan_info.student_limit,
          available: Math.max(0, school.plan_info.student_limit - currentStudents),
          limitReached: currentStudents >= school.plan_info.student_limit
        }
      }
    });
  } catch (error) {
    console.error('Get school info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get school information'
    });
  }
});

// ==================== GET USERS (FIXED!) ====================
router.get('/users', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { gradeLevel, subject, role } = req.query;
    
    // Filter by school ID to ensure school admin only sees their school's users
    const filter = { schoolId: schoolAdmin.schoolId };
    
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

// Update user - FIXED to sync students collection
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const check = await canModifyUser(db, req.params.id);
    if (!check.allowed) return res.status(403).json({ success: false, error: check.error });
    
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id; delete updates.password; delete updates.role;
    
    await db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updates });
    
    // SYNC to students collection
    if (check.user.role?.toLowerCase() === 'student') {
      const studentUpdates = { updated_at: new Date() };
      if (updates.class !== undefined) studentUpdates.class = updates.class;
      if (updates.name !== undefined) studentUpdates.name = updates.name;
      if (updates.gradeLevel !== undefined) studentUpdates.grade_level = updates.gradeLevel;
      await db.collection('students').updateOne(
        { $or: [{ user_id: new mongoose.Types.ObjectId(req.params.id) }, { email: check.user.email }] },
        { $set: studentUpdates }
      );
    }
    
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// ==================== BULK IMPORT STUDENTS (FIXED - NO DUPLICATE PROFILE) ====================
router.post('/bulk-import-students', authenticateSchoolAdmin, upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import students request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Get school admin's school
  const schoolAdmin = req.schoolAdmin;
  if (!schoolAdmin.schoolId) {
    return res.status(400).json({
      success: false,
      error: 'School admin must be associated with a school'
    });
  }

  console.log('📄 Parsing CSV file...');
  
  const students = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
    limitReached: false
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

    // Get school data once for all operations
    const schoolData = await School.findById(schoolAdmin.schoolId);
    if (!schoolData) {
      throw new Error('School not found');
    }

    
    // Track students created in this batch for atomic update at the end
    let studentsCreatedCount = 0;

    // ✅ FIX: Only create user in 'users' collection, NO separate student profile
    for (const studentData of students) {
      try {
        console.log(`👤 Processing: ${studentData.name} (${studentData.email})`);
        
        // Check license availability using cached school data
        const currentStudents = (schoolData.current_students || 0) + studentsCreatedCount;
        const studentLimit = schoolData.plan_info.student_limit;
        
        if (currentStudents >= studentLimit) {
          console.log(`⚠️  License limit reached - stopping bulk import`);
          results.limitReached = true;
          const processedCount = results.created + results.failed;
          results.errors.push({ 
            email: studentData.email || 'unknown', 
            error: `Student limit reached (${currentStudents}/${studentLimit}). Import stopped at record ${processedCount + 1} of ${students.length}.`
          });
          // Count remaining unprocessed students as failed
          results.failed += (students.length - processedCount);
          break; // Stop processing remaining students when limit is reached
        }
        
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
            console.log(`⚠️  Invalid date format: ${studentData.dateOfBirth}`);
            parsedDateOfBirth = null;
          }
        }

        // ✅ Create ONLY user document in 'users' collection
        const newUser = await User.create({
          name: studentData.name.trim(),
          email: studentData.email.toLowerCase().trim(),
          username: username,
          password: hashedPassword,
          role: 'Student',
          schoolId: schoolAdmin.schoolId,
          class: studentData.class?.trim() || null,
          gradeLevel: studentData.gradeLevel?.trim() || 'Primary 1',
          parentEmail: studentData.parentEmail?.toLowerCase().trim() || null,
          contact: studentData.contact?.trim() || null,
          gender: studentData.gender?.trim() || null,
          dateOfBirth: parsedDateOfBirth,
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true, // User must change password on first login
          createdBy: 'school-admin',
          createdAt: new Date()
        });

        console.log(`✅ Student created in users collection: ${newUser.email}`);
        results.created++;
        studentsCreatedCount++; // Track for batch update

        // ✅ FIXED: Send credentials email with correct parameter order
        if (studentData.parentEmail) {
          try {
            const schoolName = schoolData.organization_name || 'Your School';
            
            await sendStudentCredentialsToParent(
              newUser,                    // 1. student object (has .name, .email, .class)
              tempPassword,               // 2. tempPassword string
              studentData.parentEmail,    // 3. parentEmail string
              schoolName                  // 4. schoolName string
            );
            console.log(`📧 Sent credentials to parent: ${studentData.parentEmail}`);
            results.emailsSent++;
          } catch (emailError) {
            console.error(`❌ Failed to send email to parent:`, emailError.message);
            results.emailsFailed++;
          }
        } else {
          results.emailsFailed++;
        }

      } catch (error) {
        console.error(`❌ Error creating student:`, error);
        results.failed++;
        results.errors.push({ 
          email: studentData.email, 
          error: error.message 
        });
      }
    }

    // Atomic update of school's student count for all created students
    if (studentsCreatedCount > 0) {
      await School.findByIdAndUpdate(
        schoolAdmin.schoolId,
        { $inc: { current_students: studentsCreatedCount } }
      );
    }

    fs.unlinkSync(req.file.path);

    console.log('\n✅ Bulk import completed!');
    console.log(`   Created: ${results.created}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Emails sent: ${results.emailsSent}`);
    console.log(`   Emails failed: ${results.emailsFailed}\n`);

    const message = results.limitReached 
      ? `Bulk import partially completed. License limit reached after creating ${results.created} student(s).`
      : 'Bulk import completed';

    res.json({
      success: true,
      message: message,
      results,
      warning: results.limitReached ? 'Student license limit reached. Please upgrade your plan to add more students.' : null
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Bulk import failed' });
  }
});

// ==================== BULK IMPORT TEACHERS ====================
router.post('/bulk-import-teachers', authenticateSchoolAdmin, upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import teachers request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Get school admin's school
  const schoolAdmin = req.schoolAdmin;
  if (!schoolAdmin.schoolId) {
    return res.status(400).json({
      success: false,
      error: 'School admin must be associated with a school'
    });
  }

  const teachers = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
    limitReached: false
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
            contact: row.ContactNumber || row.contactNumber || row.contact || '',
            gender: row.Gender || row.gender || ''
          });
        })
        .on('end', () => {
          console.log(`✅ Found ${teachers.length} teachers in CSV`);
          resolve();
        })
        .on('error', reject);
    });

    // Get school data once for all operations
    const schoolData = await School.findById(schoolAdmin.schoolId);
    if (!schoolData) {
      throw new Error('School not found');
    }
    
    // Track teachers created in this batch for atomic update at the end
    let teachersCreatedCount = 0;

    for (const teacherData of teachers) {
      try {
        // Check license availability using cached school data
        const currentTeachers = (schoolData.current_teachers || 0) + teachersCreatedCount;
        const teacherLimit = schoolData.plan_info.teacher_limit;
        
        if (currentTeachers >= teacherLimit) {
          console.log(`⚠️  License limit reached - stopping bulk import`);
          results.limitReached = true;
          const processedCount = results.created + results.failed;
          results.errors.push({ 
            email: teacherData.email || 'unknown', 
            error: `Teacher limit reached (${currentTeachers}/${teacherLimit}). Import stopped at record ${processedCount + 1} of ${teachers.length}.`
          });
          // Count remaining unprocessed teachers as failed
          results.failed += (teachers.length - processedCount);
          break; // Stop processing remaining teachers when limit is reached
        }
        
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

        const newTeacher = await User.create({
          name: teacherData.name.trim(),
          email: teacherData.email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'Teacher',
          schoolId: schoolAdmin.schoolId,
          subject: teacherData.subject?.trim() || 'Mathematics',
          contact: teacherData.contact?.trim() || null,
          gender: teacherData.gender?.trim() || null,
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true, // User must change password on first login
          createdBy: 'school-admin'
        });

        console.log(`✅ Teacher created: ${newTeacher.email}`);
        results.created++;
        teachersCreatedCount++; // Track for batch update

        try {
          const schoolName = schoolData.organization_name || 'Your School';
          
          await sendTeacherWelcomeEmail(
            newTeacher,
            tempPassword,
            schoolName
          );
          results.emailsSent++;
        } catch (emailError) {
          console.error(`❌ Failed to send email:`, emailError.message);
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

    // Atomic update of school's teacher count for all created teachers
    if (teachersCreatedCount > 0) {
      await School.findByIdAndUpdate(
        schoolAdmin.schoolId,
        { $inc: { current_teachers: teachersCreatedCount } }
      );
    }

    fs.unlinkSync(req.file.path);

    const message = results.limitReached 
      ? `Bulk import partially completed. License limit reached after creating ${results.created} teacher(s).`
      : 'Bulk import completed';

    res.json({
      success: true,
      message: message,
      results,
      warning: results.limitReached ? 'Teacher license limit reached. Please upgrade your plan to add more teachers.' : null
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Bulk import failed' });
  }
});

// ==================== BULK IMPORT PARENTS (COMPLETE VERSION WITH LINKEDSTUDENTS) ====================
router.post('/bulk-import-parents', authenticateSchoolAdmin, upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import parents request received');
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  // Get school admin's school
  const schoolAdmin = req.schoolAdmin;
  if (!schoolAdmin.schoolId) {
    return res.status(400).json({
      success: false,
      error: 'School admin must be associated with a school'
    });
  }

  console.log('📄 Parsing CSV file...');
  
  const parents = [];
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
    details: []
  };

  try {
    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          parents.push({
            parentName: row.ParentName || row.parentName || row['Parent Name'] || '',
            parentEmail: row.ParentEmail || row.parentEmail || row['Parent Email'] || '',
            studentEmail: row.StudentEmail || row.studentEmail || row['Student Email'] || '',
            relationship: row.Relationship || row.relationship || 'Parent'
          });
        })
        .on('end', () => {
          console.log(`✅ Found ${parents.length} parent records in CSV`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(error);
        });
    });

    console.log('\n🔄 Processing parents...\n');

    // Get school name for emails
    const schoolData = await School.findById(schoolAdmin.schoolId);
    const schoolName = schoolData ? schoolData.organization_name : 'Your School';

    // Process each parent
    for (let i = 0; i < parents.length; i++) {
      const parentData = parents[i];
      const rowNum = i + 2; // CSV row number (header is row 1)

      try {
        console.log(`\n👤 Processing row ${rowNum}: ${parentData.parentName} (${parentData.parentEmail})`);

        // Validate required fields
        if (!parentData.parentName || !parentData.parentEmail || !parentData.studentEmail) {
          console.log(`⚠️  Skipping - Missing required fields`);
          results.failed++;
          results.errors.push({
            row: rowNum,
            parentEmail: parentData.parentEmail || 'N/A',
            error: 'Missing required fields (ParentName, ParentEmail, or StudentEmail)'
          });
          continue;
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(parentData.parentEmail)) {
          console.log(`⚠️  Skipping - Invalid parent email format`);
          results.failed++;
          results.errors.push({
            row: rowNum,
            parentEmail: parentData.parentEmail,
            error: 'Invalid parent email format'
          });
          continue;
        }

        if (!emailRegex.test(parentData.studentEmail)) {
          console.log(`⚠️  Skipping - Invalid student email format`);
          results.failed++;
          results.errors.push({
            row: rowNum,
            parentEmail: parentData.parentEmail,
            error: 'Invalid student email format'
          });
          continue;
        }

        // Find the student by email
        const student = await User.findOne({ 
          email: parentData.studentEmail.toLowerCase().trim(),
          role: 'Student'
        });

        if (!student) {
          console.log(`⚠️  Skipping - Student not found: ${parentData.studentEmail}`);
          results.failed++;
          results.errors.push({
            row: rowNum,
            parentEmail: parentData.parentEmail,
            error: `Student not found with email: ${parentData.studentEmail}. Please import students first.`
          });
          continue;
        }

        console.log(`✅ Found student: ${student.name} (${student.email})`);

        // Check if parent already exists
        const existingParent = await User.findOne({ 
          email: parentData.parentEmail.toLowerCase().trim()
        });

        if (existingParent) {
          // Parent exists - just add student link if not already linked
          console.log(`ℹ️  Parent already exists: ${existingParent.email}`);

          // Initialize linkedStudents array if it doesn't exist
          if (!existingParent.linkedStudents) {
            existingParent.linkedStudents = [];
          }

          // Check if already linked to this student
          const alreadyLinked = existingParent.linkedStudents.some(
            link => link.studentEmail === student.email
          );

          if (alreadyLinked) {
            console.log(`ℹ️  Parent already linked to student ${student.email}`);
            results.details.push({
              row: rowNum,
              parentName: existingParent.name,
              parentEmail: existingParent.email,
              studentEmail: student.email,
              status: 'already_linked',
              message: 'Parent already linked to this student'
            });
          } else {
            // Add new student link
            existingParent.linkedStudents.push({
              studentId: student._id,
              studentName: student.name,
              studentEmail: student.email,
              relationship: parentData.relationship || 'Parent',
              gradeLevel: student.gradeLevel,
              class: student.class
            });

            await existingParent.save();

            // Update student's parentEmail if not already set
            if (!student.parentEmail || student.parentEmail !== parentData.parentEmail) {
              student.parentEmail = parentData.parentEmail.toLowerCase().trim();
              await student.save();
            }

            console.log(`✅ Linked existing parent to new student`);
            results.updated++;
            
            results.details.push({
              row: rowNum,
              parentName: existingParent.name,
              parentEmail: existingParent.email,
              studentEmail: student.email,
              studentName: student.name,
              relationship: parentData.relationship,
              status: 'linked',
              message: 'Existing parent linked to student'
            });
          }

          continue;
        }

        // Parent doesn't exist - create new parent account
        const tempPassword = generateTempPassword('Parent');
        console.log(`🔑 Generated password for new parent: ${tempPassword}`);

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create new parent with linkedStudents array
        const newParent = await User.create({
          name: parentData.parentName.trim(),
          email: parentData.parentEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'Parent',
          schoolId: schoolAdmin.schoolId, // Set schoolId so parent appears in user management
          linkedStudents: [
            {
              studentId: student._id,
              studentName: student.name,
              studentEmail: student.email,
              relationship: parentData.relationship || 'Parent',
              gradeLevel: student.gradeLevel,
              class: student.class
            }
          ],
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true, // User must change password on first login
          createdBy: 'school-admin',
          createdAt: new Date()
        });

        console.log(`✅ Created new parent: ${newParent.email}`);
        results.created++;

        // Update student's parentEmail
        if (!student.parentEmail || student.parentEmail !== parentData.parentEmail) {
          student.parentEmail = parentData.parentEmail.toLowerCase().trim();
          await student.save();
          console.log(`✅ Updated student's parentEmail field`);
        }

        // Send welcome email to parent
        try {
          await sendParentWelcomeEmail(
            newParent,
            tempPassword,
            student.name,
            schoolName
          );
          console.log(`📧 Sent welcome email to: ${newParent.email}`);
          results.emailsSent++;
        } catch (emailError) {
          console.error(`❌ Failed to send email to parent:`, emailError.message);
          results.emailsFailed++;
        }

        results.details.push({
          row: rowNum,
          parentName: newParent.name,
          parentEmail: newParent.email,
          studentEmail: student.email,
          studentName: student.name,
          relationship: parentData.relationship,
          password: tempPassword,
          status: 'created',
          message: 'New parent account created and linked to student'
        });

      } catch (error) {
        console.error(`❌ Error processing row ${rowNum}:`, error);
        results.failed++;
        results.errors.push({
          row: rowNum,
          parentEmail: parentData.parentEmail || 'N/A',
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('\n✅ Parent bulk import completed!');
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated (linked): ${results.updated}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Emails sent: ${results.emailsSent}`);
    console.log(`   Emails failed: ${results.emailsFailed}\n`);

    // Return summary
    res.json({
      success: true,
      message: `Parent import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      summary: {
        totalRows: parents.length,
        created: results.created,
        updated: results.updated,
        failed: results.failed,
        emailsSent: results.emailsSent,
        emailsFailed: results.emailsFailed
      },
      details: results.details,
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    console.error('❌ Bulk import parents error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to import parents: ' + error.message 
    });
  }
});

// ==================== MANUAL CREATE USER ====================
router.post('/users/manual', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { name, email, role: rawRole, gradeLevel, subject, gender, class: className, parentEmail, linkedStudents } = req.body;
    
    if (!name || !email || !rawRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and role are required' 
      });
    }
    
    // Normalize role to match User model enum (capitalize first letter)
    const roleMap = {
      'student': 'Student',
      'teacher': 'Teacher',
      'parent': 'Parent',
      'Student': 'Student',
      'Teacher': 'Teacher',
      'Parent': 'Parent'
    };
    const role = roleMap[rawRole] || rawRole;
    
    // Validate that role is valid
    const validRoles = ['Student', 'Teacher', 'Parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role: ${rawRole}. Valid roles are: student, teacher, parent`
      });
    }
    
    // Get school admin's school
    const schoolAdmin = req.schoolAdmin;
    if (!schoolAdmin.schoolId) {
      return res.status(400).json({
        success: false,
        error: 'School admin must be associated with a school'
      });
    }
    
    // Check license availability for teachers and students
    if (role === 'Teacher' || role === 'Student') {
      const licenseCheck = await checkLicenseAvailability(schoolAdmin.schoolId, role);
      if (!licenseCheck.available) {
        return res.status(403).json({
          success: false,
          error: licenseCheck.error
        });
      }
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    
    // Validate that students can only be linked to one parent
    if (role === 'Parent' && linkedStudents && Array.isArray(linkedStudents) && linkedStudents.length > 0) {
      // Check if any of the students are already linked to another parent
      const existingParents = await User.find({
        role: 'Parent',
        'linkedStudents.studentId': { $in: linkedStudents }
      });
      
      if (existingParents.length > 0) {
        const alreadyLinkedStudents = [];
        for (const student of linkedStudents) {
          const parentWithStudent = existingParents.find(p => 
            p.linkedStudents.some(ls => ls.studentId.toString() === student.toString())
          );
          if (parentWithStudent) {
            const studentDoc = await User.findById(student);
            alreadyLinkedStudents.push({
              studentName: studentDoc ? studentDoc.name : 'Unknown',
              parentEmail: parentWithStudent.email
            });
          }
        }
        
        if (alreadyLinkedStudents.length > 0) {
          let errorMsg;
          if (alreadyLinkedStudents.length === 1) {
            errorMsg = `${alreadyLinkedStudents[0].studentName} is already linked to parent ${alreadyLinkedStudents[0].parentEmail}`;
          } else {
            const studentList = alreadyLinkedStudents
              .map(s => `${s.studentName} (linked to ${s.parentEmail})`)
              .join(', ');
            errorMsg = `These students are already linked to other parents: ${studentList}`;
          }
          
          return res.status(409).json({
            success: false,
            error: `Cannot create parent account. ${errorMsg}. Each student can only be linked to one parent.`
          });
        }
      }
    }
    
    // Generate temporary password
    const tempPassword = generateTempPassword(role);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Prepare linkedStudents for parents
    const linkedStudentsData = (role === 'Parent' && linkedStudents && Array.isArray(linkedStudents) && linkedStudents.length > 0)
      ? linkedStudents.map(studentId => ({
          studentId: studentId,
          relationship: 'Parent'
        }))
      : undefined;
    
    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      schoolId: schoolAdmin.schoolId,
      gender: gender || null,
      gradeLevel: gradeLevel || (role === 'Student' ? 'Primary 1' : null),
      subject: subject || (role === 'Teacher' ? 'Mathematics' : null),
      class: className || null,
      emailVerified: true,
      accountActive: true,
      requirePasswordChange: true, // User must change password on first login
      createdBy: 'school-admin',
      ...(linkedStudentsData && { linkedStudents: linkedStudentsData })
    });
    
    // Update school's current teacher/student count using atomic increment
    if (role === 'Teacher' || role === 'Student') {
      const incrementField = role === 'Teacher' ? 'current_teachers' : 'current_students';
      await School.findByIdAndUpdate(
        schoolAdmin.schoolId,
        { $inc: { [incrementField]: 1 } }
      );
    }
    
    // Send credentials via email
    let emailSent = false;
    try {
      const schoolData = await School.findById(schoolAdmin.schoolId);
      const schoolName = schoolData ? schoolData.organization_name : 'Your School';
      
      if (role === 'Teacher') {
        await sendTeacherWelcomeEmail(newUser, tempPassword, schoolName);
        emailSent = true;
      } else if (role === 'Student') {
        if (parentEmail) {
          await sendStudentCredentialsToParent(newUser, tempPassword, parentEmail, schoolName);
          emailSent = true;
        }
      } else if (role === 'Parent') {
        // Get the first linked student's name for the email
        let studentName = 'your child';
        if (linkedStudents && linkedStudents.length > 0) {
          try {
            const firstStudent = await User.findById(linkedStudents[0]);
            if (firstStudent && firstStudent.name) {
              studentName = firstStudent.name;
            }
            // If student exists but has no name, keep default 'your child'
          } catch (err) {
            console.error('Error fetching student name:', err);
            // On lookup error, keep default fallback
          }
        }
        await sendParentWelcomeEmail(newUser, tempPassword, studentName, schoolName);
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      emailSent = false;
      // Continue even if email fails - user is still created
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tempPassword: tempPassword // Return temp password so admin can share it if email fails
      },
      warning: !emailSent && role === 'Student' && !parentEmail 
        ? 'No parent email provided. Please share the credentials manually with the student.' 
        : (!emailSent ? 'Email sending failed. Please share the credentials manually.' : null)
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// ==================== CREATE OR LINK PARENT ====================
// This endpoint handles creating a new parent or linking a student to an existing parent
router.post('/users/create-or-link-parent', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { parentName, parentEmail, studentId } = req.body;
    const schoolAdmin = req.schoolAdmin;
    
    if (!parentEmail || !studentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parent email and student ID are required' 
      });
    }
    
    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Check if parent email already exists
    const existingParent = await User.findOne({ email: parentEmail.toLowerCase().trim() });
    
    if (existingParent) {
      // Parent exists - check if they are actually a parent
      if (existingParent.role !== 'Parent') {
        return res.status(409).json({
          success: false,
          error: `Email ${parentEmail} is already registered with a different role (${existingParent.role})`
        });
      }
      
      // Check if student is already linked to this parent
      const alreadyLinked = existingParent.linkedStudents && existingParent.linkedStudents.some(
        link => link.studentId && link.studentId.toString() === studentId.toString()
      );
      
      if (alreadyLinked) {
        return res.json({
          success: true,
          isExisting: true,
          message: 'Student is already linked to this parent',
          parent: {
            id: existingParent._id,
            name: existingParent.name,
            email: existingParent.email
          }
        });
      }
      
      // Check if student is already linked to another parent
      const linkCheck = await checkStudentLinkedToParent(studentId);
      if (linkCheck.isLinked) {
        return res.status(409).json({
          success: false,
          error: `This student is already linked to another parent (${linkCheck.parentEmail}). Each student can only have one parent account.`
        });
      }
      
      // Link student to existing parent
      if (!existingParent.linkedStudents) {
        existingParent.linkedStudents = [];
      }
      
      existingParent.linkedStudents.push({
        studentId: student._id,
        relationship: 'Parent'
      });
      
      await existingParent.save();
      
      return res.json({
        success: true,
        isExisting: true,
        message: 'Student linked to existing parent account',
        parent: {
          id: existingParent._id,
          name: existingParent.name,
          email: existingParent.email
        }
      });
    }
    
    // Check if student is already linked to another parent
    const linkCheck = await checkStudentLinkedToParent(studentId);
    if (linkCheck.isLinked) {
      return res.status(409).json({
        success: false,
        error: `This student is already linked to another parent (${linkCheck.parentEmail}). Each student can only have one parent account.`
      });
    }
    
    // Create new parent account
    const tempPassword = generateTempPassword('Parent');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const newParent = await User.create({
      name: parentName || 'Parent',
      email: parentEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: 'Parent',
      schoolId: schoolAdmin.schoolId, // Important: Set schoolId so parent appears in user management
      linkedStudents: [{
        studentId: student._id,
        relationship: 'Parent'
      }],
      emailVerified: true,
      accountActive: true,
      requirePasswordChange: true,
      createdBy: 'school-admin'
    });
    
    // Try to send welcome email
    let emailSent = false;
    try {
      const schoolData = await School.findById(schoolAdmin.schoolId);
      const schoolName = schoolData ? schoolData.organization_name : 'Your School';
      await sendParentWelcomeEmail(newParent, tempPassword, student.name, schoolName);
      emailSent = true;
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }
    
    res.status(201).json({
      success: true,
      isExisting: false,
      message: 'Parent account created and linked to student',
      parent: {
        id: newParent._id,
        name: newParent.name,
        email: newParent.email,
        tempPassword: tempPassword
      },
      emailSent
    });
    
  } catch (error) {
    console.error('Create or link parent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create or link parent' });
  }
});

// ==================== GET STUDENTS WITHOUT PARENT ====================
// Returns students who are not yet linked to any parent account
router.get('/students-without-parent', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    // Get all students in this school
    const allStudents = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Student',
      accountActive: true
    }).select('_id name email class');
    
    // Get all parents in this school with their linked students
    const parentsWithLinks = await User.find({
      role: 'Parent',
      'linkedStudents.0': { $exists: true } // Only parents with at least one linked student
    }).select('linkedStudents');
    
    // Collect all student IDs that are already linked to a parent
    const linkedStudentIds = new Set();
    parentsWithLinks.forEach(parent => {
      if (parent.linkedStudents) {
        parent.linkedStudents.forEach(link => {
          if (link.studentId) {
            linkedStudentIds.add(link.studentId.toString());
          }
        });
      }
    });
    
    // Filter to only students without a parent
    const studentsWithoutParent = allStudents.filter(student => 
      !linkedStudentIds.has(student._id.toString())
    );
    
    res.json({
      success: true,
      students: studentsWithoutParent.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        currentClass: s.class
      }))
    });
    
  } catch (error) {
    console.error('Get students without parent error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// ==================== DELETE USER ====================
router.delete('/users/:id', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    // First find the user to get their role and class assignments
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verify the user belongs to the school admin's school
    if (String(user.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only delete users from your school' });
    }
    
    // If user is a teacher, remove them from all assigned classes
    if (user.role === 'Teacher') {
      await Class.updateMany(
        { teachers: user._id },
        { $pull: { teachers: user._id } }
      );
    }
    
    // If user is a student, remove them from their assigned class
    if (user.role === 'Student') {
      await Class.updateMany(
        { students: user._id },
        { $pull: { students: user._id } }
      );
    }
    
    // Now delete the user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// ==================== UPDATE USER STATUS ====================
router.put('/users/:id/status', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { isActive } = req.body;
    
    // First find the user to verify school ownership
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verify the user belongs to the school admin's school
    if (String(user.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only update users from your school' });
    }
    
    // Update the user status
    user.accountActive = isActive;
    await user.save();
    
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
// Updated to generate random password and set requirePasswordChange flag
router.put('/users/:id/password', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    // Find the user first
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verify the user belongs to the school admin's school
    if (String(user.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only reset passwords for users from your school' });
    }
    
    // Generate a new temporary password based on role
    const rolePrefix = user.role === 'Teacher' ? 'TEA' : 
                       user.role === 'Student' ? 'STU' : 
                       user.role === 'Parent' ? 'PAR' : 'USR';
    const tempPassword = generateTempPassword(rolePrefix);
    
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update user with new password and set requirePasswordChange flag
    user.password = hashedPassword;
    user.requirePasswordChange = true;
    await user.save();
    
    // Return temp password for one-time viewing by school admin
    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      tempPassword: tempPassword,
      userId: user._id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// ==================== GET CLASSES ====================
// ==================== CLASS MANAGEMENT ROUTES ====================

// GET all classes for the school
router.get('/classes', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { grade, subject } = req.query;
    
    // Build filter
    const filter = { school_id: schoolAdmin.schoolId };
    if (grade) filter.grade = grade;
    if (subject) filter.subjects = subject;
    
    // Get classes with populated teachers and students
    const classes = await Class.find(filter)
      .populate('teachers', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedClasses = classes.map(cls => ({
      id: cls._id,
      name: cls.class_name,
      grade: cls.grade,
      subjects: cls.subjects,
      subject: cls.subjects[0] || 'Mathematics',
      students: cls.students.length,
      studentList: cls.students,
      teachers: cls.teachers.length,
      teacherList: cls.teachers,
      teacher: cls.teachers.length > 0 ? cls.teachers.map(t => t.name).join(', ') : 'Not assigned',
      is_active: cls.is_active,
      createdAt: cls.createdAt
    }));
    
    res.json({ success: true, classes: formattedClasses });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

// GET available teachers for class assignment
// NOTE: This route MUST be defined BEFORE /classes/:id to avoid route collision
router.get('/classes/available/teachers', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    const teachers = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Teacher',
      accountActive: true
    }).select('name email assignedClasses');
    
    res.json({
      success: true,
      teachers: teachers.map(t => ({
        id: t._id,
        name: t.name,
        email: t.email,
        assignedClasses: t.assignedClasses || []
      }))
    });
  } catch (error) {
    console.error('Get available teachers error:', error);
    res.status(500).json({ success: false, error: 'Failed to load teachers' });
  }
});

// GET available students for class assignment
// NOTE: This route MUST be defined BEFORE /classes/:id to avoid route collision
router.get('/classes/available/students', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { unassigned } = req.query;
    
    const filter = {
      schoolId: schoolAdmin.schoolId,
      role: 'Student',
      accountActive: true
    };
    
    // Optionally filter to only unassigned students
    if (unassigned === 'true') {
      filter.class = { $in: [null, ''] };
    }
    
    const students = await User.find(filter).select('name email class');
    
    res.json({
      success: true,
      students: students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        currentClass: s.class
      }))
    });
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// GET single class by ID
router.get('/classes/:id', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    const classData = await Class.findOne({ 
      _id: req.params.id,
      school_id: schoolAdmin.schoolId 
    })
      .populate('teachers', 'name email')
      .populate('students', 'name email');
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    res.json({
      success: true,
      class: {
        id: classData._id,
        name: classData.class_name,
        grade: classData.grade,
        subjects: classData.subjects,
        students: classData.students,
        teachers: classData.teachers,
        is_active: classData.is_active,
        createdAt: classData.createdAt
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ success: false, error: 'Failed to load class' });
  }
});

// CREATE new class
router.post('/classes', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { name, grade, subjects, teachers, students } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Class name is required' });
    }
    
    // Validate that school admin has a school ID
    if (!schoolAdmin.schoolId) {
      return res.status(400).json({ 
        success: false, 
        error: 'School admin must be associated with a school' 
      });
    }
    
    // Convert schoolId to ObjectId if it's a string
    let schoolObjectId;
    try {
      schoolObjectId = new mongoose.Types.ObjectId(schoolAdmin.schoolId);
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid school ID format' 
      });
    }
    
    // Check if class name already exists for this school
    const existingClass = await Class.findOne({
      class_name: name,
      school_id: schoolObjectId
    });
    
    if (existingClass) {
      return res.status(409).json({ success: false, error: 'A class with this name already exists' });
    }
    
    // Create new class
    const newClass = new Class({
      class_name: name,
      grade: grade || 'Primary 1',
      subjects: subjects || ['Mathematics'],
      teachers: teachers || [],
      students: students || [],
      school_id: schoolObjectId
    });
    
    await newClass.save();
    
    // Update users with class assignment
    if (teachers && teachers.length > 0) {
      await User.updateMany(
        { _id: { $in: teachers } },
        { $addToSet: { assignedClasses: newClass._id.toString() } }
      );
    }
    
    if (students && students.length > 0) {
      await User.updateMany(
        { _id: { $in: students } },
        { class: newClass._id.toString() }
      );
    }
    
    // Populate and return
    const populatedClass = await Class.findById(newClass._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: populatedClass._id,
        name: populatedClass.class_name,
        grade: populatedClass.grade,
        subjects: populatedClass.subjects,
        subject: populatedClass.subjects[0] || 'Mathematics',
        students: populatedClass.students.length,
        studentList: populatedClass.students,
        teachers: populatedClass.teachers.length,
        teacherList: populatedClass.teachers,
        teacher: populatedClass.teachers.length > 0 ? populatedClass.teachers.map(t => t.name).join(', ') : 'Not assigned',
        is_active: populatedClass.is_active,
        createdAt: populatedClass.createdAt
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

// UPDATE class
router.put('/classes/:id', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { name, grade, subjects, teachers, students, is_active } = req.body;
    
    const classData = await Class.findOne({
      _id: req.params.id,
      school_id: schoolAdmin.schoolId
    });
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    // Check if new name already exists (if name is being changed)
    if (name && name !== classData.class_name) {
      const existingClass = await Class.findOne({
        class_name: name,
        school_id: schoolAdmin.schoolId,
        _id: { $ne: req.params.id }
      });
      
      if (existingClass) {
        return res.status(409).json({ success: false, error: 'A class with this name already exists' });
      }
    }
    
    // Update fields
    if (name) classData.class_name = name;
    if (grade) classData.grade = grade;
    if (subjects) classData.subjects = subjects;
    if (is_active !== undefined) classData.is_active = is_active;
    
    // Handle teacher updates
    if (teachers !== undefined) {
      // Remove class from old teachers
      const oldTeacherIds = classData.teachers.map(t => t.toString());
      await User.updateMany(
        { _id: { $in: oldTeacherIds } },
        { $pull: { assignedClasses: classData._id.toString() } }
      );
      
      // Add class to new teachers
      classData.teachers = teachers;
      if (teachers.length > 0) {
        await User.updateMany(
          { _id: { $in: teachers } },
          { $addToSet: { assignedClasses: classData._id.toString() } }
        );
      }
    }
    
    // Handle student updates
    if (students !== undefined) {
      // Remove class from old students
      const oldStudentIds = classData.students.map(s => s.toString());
      await User.updateMany(
        { _id: { $in: oldStudentIds } },
        { class: null }
      );
      
      // Add class to new students
      classData.students = students;
      if (students.length > 0) {
        await User.updateMany(
          { _id: { $in: students } },
          { class: classData._id.toString() }
        );
      }
    }
    
    await classData.save();
    
    // Populate and return
    const populatedClass = await Class.findById(classData._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');
    
    res.json({
      success: true,
      message: 'Class updated successfully',
      class: {
        id: populatedClass._id,
        name: populatedClass.class_name,
        grade: populatedClass.grade,
        subjects: populatedClass.subjects,
        subject: populatedClass.subjects[0] || 'Mathematics',
        students: populatedClass.students.length,
        studentList: populatedClass.students,
        teachers: populatedClass.teachers.length,
        teacherList: populatedClass.teachers,
        teacher: populatedClass.teachers.length > 0 ? populatedClass.teachers.map(t => t.name).join(', ') : 'Not assigned',
        is_active: populatedClass.is_active,
        createdAt: populatedClass.createdAt
      }
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

// DELETE class
router.delete('/classes/:id', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    const classData = await Class.findOne({
      _id: req.params.id,
      school_id: schoolAdmin.schoolId
    });
    
    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    // Remove class from all assigned teachers
    await User.updateMany(
      { _id: { $in: classData.teachers } },
      { $pull: { assignedClasses: classData._id.toString() } }
    );
    
    // Remove class from all assigned students
    await User.updateMany(
      { _id: { $in: classData.students } },
      { class: null }
    );
    
    // Delete the class
    await Class.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});
// ==================================================================================
// ⭐ ANNOUNCEMENT ROUTES - FROM WEI XIANG'S IMPLEMENTATION
// ==================================================================================
// These routes use direct MongoDB access (getDb()) for compatibility with Wei Xiang's admin UI

// ==================== GET ANNOUNCEMENTS (Admin View) ====================
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const announcements = await db.collection('announcements')
      .find({})
      .sort({ pinned: -1, createdAt: -1 })
      .toArray();
    
    console.log(`📢 Admin fetched ${announcements.length} announcements`);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('❌ Get announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to load announcements' });
  }
});

// ==================== GET PUBLIC ANNOUNCEMENTS (For Students/Parents) ====================
router.get('/announcements/public', async (req, res) => {
  try {
    const db = getDb();
    const { audience } = req.query;
    
    console.log('📢 Fetching public announcements for:', audience);
    
    const now = new Date();
    
    // Base filter: not expired
    let filter = {
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ]
    };
    
    // Add audience filter if specified
    if (audience && audience !== 'all') {
      const audienceNormalized = audience.toLowerCase();
      const audienceMatches = ['all']; // Always include 'all' audience
      
      if (audienceNormalized.includes('student')) {
        audienceMatches.push('student', 'students');
      } else if (audienceNormalized.includes('teacher')) {
        audienceMatches.push('teacher', 'teachers');
      } else if (audienceNormalized.includes('parent')) {
        audienceMatches.push('parent', 'parents');
      } else {
        audienceMatches.push(audienceNormalized);
      }
      
      filter = {
        $and: [
          { $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null },
            { expiresAt: { $exists: false } }
          ]},
          { $or: [
            { audience: { $in: audienceMatches } },
            { audience: { $exists: false } }
          ]}
        ]
      };
    }
    
    const announcements = await db.collection('announcements')
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .toArray();
    
    console.log(`✅ Found ${announcements.length} announcements for ${audience}`);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('❌ Get public announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to load announcements' });
  }
});

// ==================== CREATE ANNOUNCEMENT ====================
router.post('/announcements', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { title, content, priority, audience, pinned, expiresAt } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and content are required' 
      });
    }
    
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
    
    console.log(`📢 Announcement created: "${title}" by ${newAnnouncement.author}`);
    res.json({ 
      success: true, 
      announcement: { ...newAnnouncement, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('❌ Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

// ==================== UPDATE ANNOUNCEMENT ====================
router.put('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    
    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }
    
    const result = await db.collection('announcements').updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    console.log(`📢 Announcement updated: ${req.params.id}`);
    res.json({ success: true, message: 'Announcement updated' });
  } catch (error) {
    console.error('❌ Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

// ==================== DELETE ANNOUNCEMENT ====================
router.delete('/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('announcements').deleteOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    console.log(`📢 Announcement deleted: ${req.params.id}`);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('❌ Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

// ==================== TEACHER ASSIGNMENT ====================

// Assign classes and subjects to a teacher
router.put('/teachers/:teacherId/assignments', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classes, subjects } = req.body;
    
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    
    if (teacher.role !== 'Teacher' && teacher.role !== 'Trial Teacher') {
      return res.status(400).json({ success: false, error: 'User is not a teacher' });
    }
    
    // Update teacher's assigned classes and subjects
    teacher.assignedClasses = classes || [];
    teacher.assignedSubjects = subjects || [];
    await teacher.save();
    
    console.log(`📚 Teacher ${teacher.name} assigned to classes: ${classes?.join(', ')}`);
    res.json({
      success: true,
      message: 'Teacher assignments updated',
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        assignedClasses: teacher.assignedClasses,
        assignedSubjects: teacher.assignedSubjects
      }
    });
  } catch (error) {
    console.error('❌ Teacher assignment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update teacher assignments' });
  }
});

// Get teacher assignments
router.get('/teachers/:teacherId/assignments', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await User.findById(teacherId)
      .select('name email assignedClasses assignedSubjects');
    
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    
    res.json({
      success: true,
      assignments: {
        classes: teacher.assignedClasses || [],
        subjects: teacher.assignedSubjects || []
      }
    });
  } catch (error) {
    console.error('❌ Get teacher assignments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get teacher assignments' });
  }
});

// Get all teachers with their assignments
router.get('/teachers/assignments', authenticateToken, async (req, res) => {
  try {
    const teachers = await User.find({
      role: { $in: ['Teacher', 'Trial Teacher'] }
    }).select('name email assignedClasses assignedSubjects accountActive');
    
    res.json({
      success: true,
      teachers: teachers.map(t => ({
        _id: t._id,
        name: t.name,
        email: t.email,
        assignedClasses: t.assignedClasses || [],
        assignedSubjects: t.assignedSubjects || [],
        accountActive: t.accountActive
      }))
    });
  } catch (error) {
    console.error('❌ Get teachers assignments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get teachers' });
  }
});

// ==================== PLACEMENT QUIZ MANAGEMENT ====================
const Quiz = require('../models/Quiz');

// Get available placement quizzes
router.get('/placement-quizzes', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      quiz_type: 'placement',
      is_active: true
    }).select('title description is_launched launched_at launched_for_school createdAt');
    
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('❌ Get placement quizzes error:', error);
    res.status(500).json({ success: false, error: 'Failed to load placement quizzes' });
  }
});

// Launch a placement quiz for the school
router.post('/placement-quizzes/:quizId/launch', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { startDate, endDate } = req.body;
    const schoolAdmin = req.schoolAdmin;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    if (quiz.quiz_type !== 'placement') {
      return res.status(400).json({ success: false, error: 'This is not a placement quiz' });
    }
    
    // Get all classes in the school
    const classes = await User.distinct('class', { 
      role: 'Student',
      schoolId: schoolAdmin.schoolId 
    });
    
    // Update quiz with launch info
    quiz.is_launched = true;
    quiz.launched_by = schoolAdmin._id;
    quiz.launched_at = new Date();
    quiz.launched_for_school = schoolAdmin.schoolId;
    quiz.launched_for_classes = classes;
    quiz.launch_start_date = startDate ? new Date(startDate) : new Date();
    quiz.launch_end_date = endDate ? new Date(endDate) : null;
    
    await quiz.save();
    
    console.log(`🎯 Placement quiz "${quiz.title}" launched for school ${schoolAdmin.schoolId}`);
    res.json({
      success: true,
      message: 'Placement quiz launched successfully',
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        launched_for_classes: classes,
        launch_start_date: quiz.launch_start_date,
        launch_end_date: quiz.launch_end_date
      }
    });
  } catch (error) {
    console.error('❌ Launch placement quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to launch placement quiz' });
  }
});

// Revoke placement quiz launch
router.post('/placement-quizzes/:quizId/revoke', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { quizId } = req.params;
    const schoolAdmin = req.schoolAdmin;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    
    // Verify school admin launched this quiz
    if (quiz.launched_for_school !== schoolAdmin.schoolId) {
      return res.status(403).json({ success: false, error: 'You can only revoke quizzes for your school' });
    }
    
    quiz.is_launched = false;
    quiz.launched_by = null;
    quiz.launched_at = null;
    quiz.launched_for_school = null;
    quiz.launched_for_classes = [];
    quiz.launch_start_date = null;
    quiz.launch_end_date = null;
    
    await quiz.save();
    
    console.log(`🎯 Placement quiz "${quiz.title}" revoked for school ${schoolAdmin.schoolId}`);
    res.json({ success: true, message: 'Placement quiz launch revoked' });
  } catch (error) {
    console.error('❌ Revoke placement quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke placement quiz' });
  }
});

module.exports = router;
