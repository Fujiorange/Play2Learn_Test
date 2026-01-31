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
            'Your School'
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
    const { name, email, role, gradeLevel, subject, gender, class: className, parentEmail } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and role are required' 
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
    
    // Generate temporary password
    const tempPassword = generateTempPassword(role);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
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
      createdBy: 'school-admin',
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

module.exports = router;
