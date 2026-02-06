const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const SupportTicket = require('../models/SupportTicket');
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
router.get('/dashboard-stats', authenticateSchoolAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    const schoolAdmin = req.schoolAdmin;
    const schoolId = schoolAdmin.schoolId;
    
    // ✅ FIX: Query the 'users' collection with role field, scoped to school
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses
    ] = await Promise.all([
      User.countDocuments({ role: 'Student', schoolId: schoolId }),
      User.countDocuments({ role: 'Teacher', schoolId: schoolId }),
      User.countDocuments({ role: 'Parent', schoolId: schoolId }),
      Class.countDocuments({ school_id: schoolId })
    ]);

    console.log(`✅ Found: ${totalStudents} students, ${totalTeachers} teachers, ${totalParents} parents, ${totalClasses} classes`);

    res.json({
      success: true,
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_parents: totalParents,
      total_classes: totalClasses
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

    // Map class IDs to names for display
    // Collect class IDs from students (class field) and teachers (assignedClasses array)
    const studentClassIds = users.map(u => u.class).filter(Boolean);
    const teacherClassIds = users.filter(u => u.role === 'Teacher' && u.assignedClasses && u.assignedClasses.length > 0)
      .flatMap(u => u.assignedClasses);
    const classIds = [...new Set([...studentClassIds, ...teacherClassIds])];
    const classLookup = {};
    if (classIds.length > 0) {
      // Filter to only valid ObjectIds to avoid query errors
      const validClassIds = classIds.filter(id => {
        try {
          return mongoose.Types.ObjectId.isValid(id);
        } catch (e) {
          return false;
        }
      });
      
      if (validClassIds.length > 0) {
        const classDocs = await Class.find({ _id: { $in: validClassIds }, school_id: schoolAdmin.schoolId })
          .select('class_name');
        classDocs.forEach(cls => {
          classLookup[cls._id.toString()] = cls.class_name;
        });
      }
    }

    // For students, find their linked parent
    const studentIds = users.filter(u => u.role === 'Student').map(u => u._id);
    const parentsWithStudents = await User.find({
      role: 'Parent',
      'linkedStudents.studentId': { $in: studentIds }
    }).select('_id name email linkedStudents');
    
    // Create a lookup for student -> parent
    const studentParentLookup = {};
    parentsWithStudents.forEach(parent => {
      parent.linkedStudents.forEach(link => {
        const studentIdStr = link.studentId.toString();
        if (!studentParentLookup[studentIdStr]) {
          studentParentLookup[studentIdStr] = {
            parentId: parent._id,
            parentName: parent.name,
            parentEmail: parent.email
          };
        }
      });
    });

    // For parents, resolve linked student names
    const allLinkedStudentIds = users
      .filter(u => u.role === 'Parent' && u.linkedStudents && u.linkedStudents.length > 0)
      .flatMap(u => u.linkedStudents.map(ls => ls.studentId));
    
    const linkedStudentsData = await User.find({
      _id: { $in: allLinkedStudentIds }
    }).select('_id name email');
    
    const studentLookup = {};
    linkedStudentsData.forEach(student => {
      studentLookup[student._id.toString()] = {
        id: student._id,
        name: student.name,
        email: student.email
      };
    });

    res.json({
      success: true,
      users: users.map(user => {
        const classKey = user.class ? user.class.toString() : null;
        const userIdStr = user._id.toString();
        
        // For teachers, resolve assignedClasses IDs to class names
        let teacherClassName = null;
        if (user.role === 'Teacher' && user.assignedClasses && user.assignedClasses.length > 0) {
          const resolvedClassNames = user.assignedClasses
            .map(classId => classLookup[classId] || null)
            .filter(Boolean);
          teacherClassName = resolvedClassNames.length > 0 ? resolvedClassNames.join(', ') : null;
        }
        
        // Build response object
        const result = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          className: user.role === 'Teacher' ? teacherClassName : (classKey ? (classLookup[classKey] || classKey) : null),
          gradeLevel: user.gradeLevel,
          subject: user.subject,
          contact: user.contact,
          date_of_birth: user.date_of_birth,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        };
        
        // Add linked parent for students
        if (user.role === 'Student' && studentParentLookup[userIdStr]) {
          result.linkedParent = studentParentLookup[userIdStr];
        }
        
        // Add linked students for parents
        if (user.role === 'Parent' && user.linkedStudents && user.linkedStudents.length > 0) {
          result.linkedStudents = user.linkedStudents.map(ls => {
            const studentIdStr = ls.studentId.toString();
            const studentData = studentLookup[studentIdStr];
            return {
              studentId: ls.studentId,
              relationship: ls.relationship,
              name: studentData ? studentData.name : null,
              email: studentData ? studentData.email : null
            };
          });
        }
        
        return result;
      })
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});

// ==================== GET USER DETAILS ====================
router.get('/users/:id/details', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const userId = req.params.id;
    
    const user = await User.findOne({
      _id: userId,
      schoolId: schoolAdmin.schoolId
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get class name if applicable
    let className = null;
    if (user.class) {
      // Only lookup if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(user.class)) {
        const classDoc = await Class.findById(user.class).select('class_name');
        className = classDoc ? classDoc.class_name : user.class;
      } else {
        // If it's not a valid ObjectId, it might be a plain class name string
        className = user.class;
      }
    }
    
    const result = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      className: className,
      gradeLevel: user.gradeLevel,
      subject: user.subject,
      contact: user.contact,
      date_of_birth: user.date_of_birth,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
    
    // For students, find their linked parent
    if (user.role === 'Student') {
      const parent = await User.findOne({
        role: 'Parent',
        'linkedStudents.studentId': user._id
      }).select('_id name email');
      
      if (parent) {
        result.linkedParent = {
          parentId: parent._id,
          parentName: parent.name,
          parentEmail: parent.email
        };
      }
    }
    
    // For parents, resolve linked student details
    if (user.role === 'Parent' && user.linkedStudents && user.linkedStudents.length > 0) {
      const studentIds = user.linkedStudents.map(ls => ls.studentId);
      const students = await User.find({ _id: { $in: studentIds } }).select('_id name email class gradeLevel');
      
      const studentLookup = {};
      students.forEach(s => {
        studentLookup[s._id.toString()] = s;
      });
      
      result.linkedStudents = user.linkedStudents.map(ls => {
        const student = studentLookup[ls.studentId.toString()];
        return {
          studentId: ls.studentId,
          relationship: ls.relationship,
          name: student ? student.name : null,
          email: student ? student.email : null,
          class: student ? student.class : null,
          gradeLevel: student ? student.gradeLevel : null
        };
      });
    }
    
    res.json({ success: true, user: result });
  } catch (error) {
    console.error('❌ Get user details error:', error);
    res.status(500).json({ success: false, error: 'Failed to load user details' });
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

    // Build a class name to ID lookup for the school
    const allClasses = await Class.find({ school_id: schoolAdmin.schoolId }).select('_id class_name');
    const classNameToId = {};
    allClasses.forEach(cls => {
      classNameToId[cls.class_name.toLowerCase()] = cls._id.toString();
    });
    
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

        // Resolve class name to class ID
        let classId = null;
        const className = studentData.class?.trim() || null;
        if (className) {
          const classKey = className.toLowerCase();
          if (classNameToId[classKey]) {
            classId = classNameToId[classKey];
          } else {
            console.log(`⚠️ Class "${className}" not found for student ${studentData.email}. User will be created without class assignment.`);
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
          class: classId,
          gradeLevel: studentData.gradeLevel?.trim() || 'Primary 1',
          parentEmail: studentData.parentEmail?.toLowerCase().trim() || null,
          contact: studentData.contact?.trim() || null,
          gender: studentData.gender?.trim() || null,
          dateOfBirth: parsedDateOfBirth,
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true, // User must change password on first login
          tempPassword: tempPassword, // Store temp password for pending credentials page
          credentialsSent: false, // Mark as not sent yet
          createdBy: 'school-admin',
          createdAt: new Date()
        });

        // If student has a class, add them to the Class.students array
        if (classId) {
          await Class.findByIdAndUpdate(classId, { $addToSet: { students: newUser._id } });
        }

        console.log(`✅ Student created in users collection: ${newUser.email}`);
        results.created++;
        studentsCreatedCount++; // Track for batch update

        // NOTE: Email sending is disabled - credentials will be displayed on the Pending Credentials page
        // The school admin can manually decide when to send credentials via that page
        console.log(`📋 Credentials saved to pending page for: ${newUser.email}`);
        results.emailsFailed++; // Count as not sent (available on pending page)

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
          tempPassword: tempPassword, // Store temp password for pending credentials page
          credentialsSent: false, // Mark as not sent yet
          createdBy: 'school-admin'
        });

        console.log(`✅ Teacher created: ${newTeacher.email}`);
        results.created++;
        teachersCreatedCount++; // Track for batch update

        // NOTE: Email sending is disabled - credentials will be displayed on the Pending Credentials page
        // The school admin can manually decide when to send credentials via that page
        console.log(`📋 Credentials saved to pending page for: ${newTeacher.email}`);
        results.emailsFailed++; // Count as not sent (available on pending page)

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
          tempPassword: tempPassword, // Store temp password for pending credentials page
          credentialsSent: false, // Mark as not sent yet
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

        // NOTE: Email sending is disabled - credentials will be displayed on the Pending Credentials page
        // The school admin can manually decide when to send credentials via that page
        console.log(`📋 Credentials saved to pending page for: ${newParent.email}`);
        results.emailsFailed++; // Count as not sent (available on pending page)

        results.details.push({
          row: rowNum,
          parentName: newParent.name,
          parentEmail: newParent.email,
          studentEmail: student.email,
          studentName: student.name,
          relationship: parentData.relationship,
          password: tempPassword,
          status: 'created',
          message: 'New parent account created and linked to student. Credentials available on Pending Credentials page.'
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

// ==================== BULK IMPORT ALL USERS (roles defined per row) ====================
router.post('/bulk-import-users', authenticateSchoolAdmin, upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import mixed users request received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const schoolAdmin = req.schoolAdmin;
  if (!schoolAdmin.schoolId) {
    return res.status(400).json({
      success: false,
      error: 'School admin must be associated with a school'
    });
  }

  const rows = [];
  const summary = { created: 0, failed: 0, errors: [] };

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    // Build a class name to ID lookup for the school
    const allClasses = await Class.find({ school_id: schoolAdmin.schoolId }).select('_id class_name');
    const classNameToId = {};
    allClasses.forEach(cls => {
      classNameToId[cls.class_name.toLowerCase()] = cls._id.toString();
    });

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2; // header is row 1
      const rawRole = (row.Role || row.role || '').trim();
      const roleMap = { student: 'Student', teacher: 'Teacher', parent: 'Parent', Student: 'Student', Teacher: 'Teacher', Parent: 'Parent' };
      const role = roleMap[rawRole] || rawRole;

      if (!row.Name || !row.Email || !role) {
        summary.failed++;
        summary.errors.push({ row: rowNumber, email: row.Email || 'unknown', error: 'Missing required fields (Name, Email, Role)' });
        continue;
      }

      if (!['Student', 'Teacher', 'Parent'].includes(role)) {
        summary.failed++;
        summary.errors.push({ row: rowNumber, email: row.Email || 'unknown', error: `Invalid role: ${rawRole}` });
        continue;
      }

      try {
        const existingUser = await User.findOne({ email: row.Email });
        if (existingUser) {
          summary.failed++;
          summary.errors.push({ row: rowNumber, email: row.Email, error: 'Email already exists' });
          continue;
        }

        if ((role === 'Teacher' || role === 'Student')) {
          const licenseCheck = await checkLicenseAvailability(schoolAdmin.schoolId, role);
          if (!licenseCheck.available) {
            summary.failed++;
            summary.errors.push({ row: rowNumber, email: row.Email, error: licenseCheck.error });
            continue;
          }
        }

        const tempPassword = generateTempPassword(role);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const linkedStudents = [];
        if (role === 'Parent' && row.StudentEmail) {
          const student = await User.findOne({ email: row.StudentEmail, role: 'Student', schoolId: schoolAdmin.schoolId });
          if (student) {
            linkedStudents.push({ studentId: student._id, relationship: row.Relationship || row.relationship || 'Parent' });
          } else {
            summary.failed++;
            summary.errors.push({ row: rowNumber, email: row.Email, error: `Student not found for email ${row.StudentEmail}` });
            continue;
          }
        }

        // Resolve class name to class ID for students
        let classId = null;
        const className = row.Class || row.class || null;
        if (role === 'Student' && className) {
          const classKey = className.toLowerCase().trim();
          if (classNameToId[classKey]) {
            classId = classNameToId[classKey];
          } else {
            // Class not found - still create user but without class assignment
            console.log(`⚠️ Class "${className}" not found for student ${row.Email}. User will be created without class assignment.`);
          }
        }

        // Parse date of birth
        let parsedDateOfBirth = null;
        const dateStr = row.DateOfBirth || row.dateOfBirth || row['Date of Birth'] || row.date_of_birth || null;
        if (dateStr) {
          try {
            const trimmedDate = dateStr.trim();
            if (trimmedDate.includes('-')) {
              parsedDateOfBirth = new Date(trimmedDate);
            } else if (trimmedDate.includes('/')) {
              const parts = trimmedDate.split('/');
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
          } catch (dateErr) {
            console.log(`⚠️ Invalid date format: ${dateStr}`);
            parsedDateOfBirth = null;
          }
        }

        const newUser = await User.create({
          name: row.Name,
          email: row.Email,
          password: hashedPassword,
          role,
          schoolId: schoolAdmin.schoolId,
          salutation: (role === 'Teacher' || role === 'Parent') ? (row.Salutation || row.salutation || null) : null,
          contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || null,
          gender: row.Gender || row.gender || null,
          date_of_birth: parsedDateOfBirth,
          class: role === 'Student' ? classId : null,
          gradeLevel: role === 'Student' ? (row.GradeLevel || row.gradeLevel || row['Grade Level'] || row.grade_level || 'Primary 1') : null,
          subject: role === 'Teacher' ? (row.Subject || row.subject || 'Mathematics') : null,
          linkedStudents: role === 'Parent' ? linkedStudents : undefined,
          emailVerified: true,
          accountActive: true,
          requirePasswordChange: true,
          tempPassword: tempPassword,
          credentialsSent: false,
          createdBy: 'school-admin'
        });

        // If student has a class, add them to the Class.students array
        if (role === 'Student' && classId) {
          await Class.findByIdAndUpdate(classId, { $addToSet: { students: newUser._id } });
        }

        if (role === 'Teacher' || role === 'Student') {
          const incrementField = role === 'Teacher' ? 'current_teachers' : 'current_students';
          await School.findByIdAndUpdate(
            schoolAdmin.schoolId,
            { $inc: { [incrementField]: 1 } }
          );
        }

        summary.created++;
      } catch (err) {
        console.error('Bulk import row error:', err);
        summary.failed++;
        summary.errors.push({ row: rowNumber, email: row.Email || 'unknown', error: err.message || 'Unknown error' });
      }
    }

    // Return both 'results' and 'summary' for backward compatibility
    res.json({ success: true, message: 'Bulk import completed', results: summary, summary });
  } catch (error) {
    console.error('Bulk import users error:', error);
    res.status(500).json({ success: false, error: 'Failed to import users: ' + error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// ==================== MANUAL CREATE USER ====================
router.post('/users/manual', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role: rawRole, 
      gradeLevel, 
      subject, 
      gender, 
      class: className, 
      parentEmail, 
      linkedStudents,
      salutation,
      contact,
      date_of_birth
    } = req.body;
    
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
      contact: contact || null,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      salutation: (role === 'Teacher' || role === 'Parent') ? (salutation || null) : null,
      emailVerified: true,
      accountActive: true,
      requirePasswordChange: true, // User must change password on first login
      createdBy: 'school-admin',
      tempPassword: tempPassword, // Store temp password for credential sending
      credentialsSent: false, // Mark as not sent yet
      ...(linkedStudentsData && { linkedStudents: linkedStudentsData })
    });

    // If class assignment provided, attach user to class document as well
    if (className) {
      const classFilter = { _id: className, school_id: schoolAdmin.schoolId };
      if (role === 'Student') {
        await Class.findOneAndUpdate(classFilter, { $addToSet: { students: newUser._id } });
      } else if (role === 'Teacher') {
        await Class.findOneAndUpdate(classFilter, { $addToSet: { teachers: newUser._id } });
        // Track assigned classes on teacher profile
        await User.findByIdAndUpdate(newUser._id, { assignedClasses: [className] });
      }
    }
    
    // Update school's current teacher/student count using atomic increment
    if (role === 'Teacher' || role === 'Student') {
      const incrementField = role === 'Teacher' ? 'current_teachers' : 'current_students';
      await School.findByIdAndUpdate(
        schoolAdmin.schoolId,
        { $inc: { [incrementField]: 1 } }
      );
    }
    
    // NOTE: Email sending is disabled - credentials will be displayed on the Pending Credentials page
    // The school admin can manually decide when to send credentials via that page
    // tempPassword is stored in the user record and displayed on the pending credentials page
    
    res.status(201).json({
      success: true,
      message: 'User created successfully. Credentials are available on the Pending Credentials page.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tempPassword: tempPassword // Return temp password so admin can view/share it
      },
      emailSent: false,
      credentialsPending: true,
      info: 'Login credentials have been saved and are available on the Pending Credentials page. You can send the email from there when ready.'
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
      tempPassword: tempPassword, // Store temp password for pending credentials page
      credentialsSent: false, // Mark as not sent yet
      createdBy: 'school-admin'
    });
    
    // NOTE: Email sending is disabled - credentials will be displayed on the Pending Credentials page
    // The school admin can manually decide when to send credentials via that page
    
    res.status(201).json({
      success: true,
      isExisting: false,
      message: 'Parent account created and linked to student. Credentials available on Pending Credentials page.',
      parent: {
        id: newParent._id,
        name: newParent.name,
        email: newParent.email,
        tempPassword: tempPassword
      },
      emailSent: false,
      credentialsPending: true
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
    const { deleteParents } = req.query; // Optional: comma-separated list of parent IDs to delete
    
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
    
    // If user is a student, handle parent relationships
    let affectedParents = [];
    if (user.role === 'Student') {
      // Remove student from their assigned class
      await Class.updateMany(
        { students: user._id },
        { $pull: { students: user._id } }
      );
      
      // Find parents who have this student linked
      const parentsWithStudent = await User.find({
        role: 'Parent',
        schoolId: schoolAdmin.schoolId,
        'linkedStudents.studentId': user._id
      });
      
      // Check each parent and categorize them
      for (const parent of parentsWithStudent) {
        const hasOnlyThisStudent = parent.linkedStudents.length === 1;
        affectedParents.push({
          id: parent._id,
          name: parent.name,
          email: parent.email,
          hasOnlyThisStudent: hasOnlyThisStudent
        });
      }
      
      // If deleteParents query param is provided, delete those parents concurrently
      if (deleteParents) {
        const parentIdsToDelete = deleteParents.split(',');
        const deletePromises = parentIdsToDelete
          .filter(parentId => {
            const parentToDelete = parentsWithStudent.find(p => String(p._id) === parentId);
            return parentToDelete && parentToDelete.linkedStudents.length === 1;
          })
          .map(parentId => User.findByIdAndDelete(parentId));
        await Promise.all(deletePromises);
      }
      
      // Remove student from all remaining parents' linkedStudents array
      await User.updateMany(
        { 
          role: 'Parent', 
          schoolId: schoolAdmin.schoolId,
          'linkedStudents.studentId': user._id 
        },
        { $pull: { linkedStudents: { studentId: user._id } } }
      );
    }
    
    // Now delete the user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      affectedParents: affectedParents
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
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
    user.tempPassword = tempPassword; // Store temp password for credential sending
    user.credentialsSent = false; // Mark as not sent yet
    user.credentialsSentAt = null;
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

// ==================== PENDING CREDENTIALS MANAGEMENT ====================

// GET users with pending credentials (tempPassword not null and credentialsSent = false)
router.get('/users/pending-credentials', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    
    const users = await User.find({
      schoolId: schoolAdmin.schoolId,
      tempPassword: { $ne: null },
      credentialsSent: { $ne: true },
      role: { $in: ['Teacher', 'Student', 'Parent'] }
    }).select('name email role tempPassword class gradeLevel createdAt');
    
    // Build class lookup map to resolve class IDs to class names
    const classIds = [...new Set(users.map(u => u.class).filter(Boolean))];
    const classLookup = {};
    if (classIds.length > 0) {
      // Filter to only valid ObjectIds
      const validClassIds = classIds.filter(id => {
        try {
          return mongoose.Types.ObjectId.isValid(id);
        } catch (e) {
          return false;
        }
      });
      
      if (validClassIds.length > 0) {
        const classDocs = await Class.find({ _id: { $in: validClassIds }, school_id: schoolAdmin.schoolId })
          .select('class_name');
        classDocs.forEach(cls => {
          classLookup[cls._id.toString()] = cls.class_name;
        });
      }
    }
    
    // Helper function to resolve class name
    const resolveClassName = (classId) => {
      if (!classId) return null;
      const classKey = classId.toString();
      return classLookup[classKey] || classKey;
    };
    
    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tempPassword: user.tempPassword,
      className: resolveClassName(user.class),
      gradeLevel: user.gradeLevel || null,
      createdAt: user.createdAt
    }));
    
    res.json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Get pending credentials error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users with pending credentials' });
  }
});

// POST send credentials email to a specific user
router.post('/users/:id/send-credentials', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verify the user belongs to the school admin's school
    if (String(user.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only send credentials for users from your school' });
    }
    
    // Check if tempPassword exists
    if (!user.tempPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'No temporary password found. The credentials may have already been sent or the user has changed their password.' 
      });
    }
    
    // Get school name
    const schoolData = await School.findById(schoolAdmin.schoolId);
    const schoolName = schoolData ? schoolData.organization_name : 'Your School';
    
    // Send email based on role
    let emailSent = false;
    try {
      if (user.role === 'Teacher') {
        await sendTeacherWelcomeEmail(user, user.tempPassword, schoolName);
        emailSent = true;
      } else if (user.role === 'Student') {
        // For students, we need to send to parent email if available
        // First check if parent is linked
        const linkedParent = await User.findOne({
          role: 'Parent',
          'linkedStudents.studentId': user._id
        });
        
        if (linkedParent) {
          await sendStudentCredentialsToParent(user, user.tempPassword, linkedParent.email, schoolName);
          emailSent = true;
        } else {
          // Send directly to student email
          await sendStudentCredentialsToParent(user, user.tempPassword, user.email, schoolName);
          emailSent = true;
        }
      } else if (user.role === 'Parent') {
        // Get linked student names
        let studentName = 'your child';
        if (user.linkedStudents && user.linkedStudents.length > 0) {
          const firstStudent = await User.findById(user.linkedStudents[0].studentId);
          if (firstStudent && firstStudent.name) {
            studentName = firstStudent.name;
          }
        }
        await sendParentWelcomeEmail(user, user.tempPassword, studentName, schoolName);
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send email. Please check email configuration.' 
      });
    }
    
    if (emailSent) {
      // Update user to mark credentials as sent
      await User.findByIdAndUpdate(userId, {
        credentialsSent: true,
        credentialsSentAt: new Date(),
        tempPassword: null // Clear temp password after sending
      });
      
      res.json({
        success: true,
        message: `Credentials sent successfully to ${user.email}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ success: false, error: 'Unable to send email for this user role' });
    }
  } catch (error) {
    console.error('Send credentials error:', error);
    res.status(500).json({ success: false, error: 'Failed to send credentials' });
  }
});

// POST bulk send credentials to multiple users
router.post('/users/bulk-send-credentials', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No users selected' });
    }
    
    // Get school name
    const schoolData = await School.findById(schoolAdmin.schoolId);
    const schoolName = schoolData ? schoolData.organization_name : 'Your School';
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process each user
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        
        if (!user) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }
        
        // Verify the user belongs to the school admin's school
        if (String(user.schoolId) !== String(schoolAdmin.schoolId)) {
          results.failed.push({ userId, email: user.email, error: 'User not from your school' });
          continue;
        }
        
        // Check if tempPassword exists
        if (!user.tempPassword) {
          results.failed.push({ userId, email: user.email, error: 'No temporary password found' });
          continue;
        }
        
        // Send email based on role
        let emailSent = false;
        try {
          if (user.role === 'Teacher') {
            await sendTeacherWelcomeEmail(user, user.tempPassword, schoolName);
            emailSent = true;
          } else if (user.role === 'Student') {
            const linkedParent = await User.findOne({
              role: 'Parent',
              'linkedStudents.studentId': user._id
            });
            
            if (linkedParent) {
              await sendStudentCredentialsToParent(user, user.tempPassword, linkedParent.email, schoolName);
            } else {
              await sendStudentCredentialsToParent(user, user.tempPassword, user.email, schoolName);
            }
            emailSent = true;
          } else if (user.role === 'Parent') {
            let studentName = 'your child';
            if (user.linkedStudents && user.linkedStudents.length > 0) {
              const firstStudent = await User.findById(user.linkedStudents[0].studentId);
              if (firstStudent && firstStudent.name) {
                studentName = firstStudent.name;
              }
            }
            await sendParentWelcomeEmail(user, user.tempPassword, studentName, schoolName);
            emailSent = true;
          }
        } catch (emailError) {
          console.error(`Email sending error for ${user.email}:`, emailError);
          results.failed.push({ userId, email: user.email, error: 'Failed to send email' });
          continue;
        }
        
        if (emailSent) {
          // Update user to mark credentials as sent
          await User.findByIdAndUpdate(userId, {
            credentialsSent: true,
            credentialsSentAt: new Date(),
            tempPassword: null
          });
          
          results.success.push({
            userId,
            email: user.email,
            name: user.name
          });
        } else {
          results.failed.push({ userId, email: user.email, error: 'Unable to send email for this user role' });
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        results.failed.push({ userId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Sent credentials to ${results.success.length} users. ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    console.error('Bulk send credentials error:', error);
    res.status(500).json({ success: false, error: 'Failed to send credentials' });
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
    const { includeClassId } = req.query;
    
    // Get all teachers in the school - accountActive filter removed to ensure
    // all teachers show up when creating/editing classes, regardless of active status
    const teachers = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Teacher'
    }).select('name email assignedClasses accountActive');
    
    // If includeClassId is provided, get the class to see who's currently assigned
    let currentClassTeachers = [];
    if (includeClassId) {
      try {
        const cls = await Class.findOne({ _id: includeClassId, school_id: schoolAdmin.schoolId });
        if (cls && cls.teachers && cls.teachers.length > 0) {
          currentClassTeachers = cls.teachers.map(t => t.toString());
        }
      } catch (err) {
        console.warn('Include class lookup for teachers failed:', err.message);
      }
    }
    
    res.json({
      success: true,
      teachers: teachers.map(t => ({
        id: t._id,
        name: t.name,
        email: t.email,
        assignedClasses: t.assignedClasses || [],
        isCurrentlyAssigned: currentClassTeachers.includes(t._id.toString())
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
    const { unassigned, includeClassId } = req.query;
    
    // Base filter - only students in this school
    // Note: accountActive filter removed to ensure all students show up when
    // creating/editing classes, regardless of account active status
    const filter = {
      schoolId: schoolAdmin.schoolId,
      role: 'Student'
    };
    
    // Build conditions for students without classes assigned
    const orConditions = [
      { class: { $in: [null, ''] } },
      { class: { $exists: false } }
    ];
    
    // If editing a class, include students currently in that class
    if (includeClassId) {
      try {
        const cls = await Class.findOne({ _id: includeClassId, school_id: schoolAdmin.schoolId });
        if (cls && cls.students && cls.students.length > 0) {
          orConditions.push({ _id: { $in: cls.students } });
        }
        // Also include students whose class field matches this class ID
        orConditions.push({ class: includeClassId });
        orConditions.push({ class: includeClassId.toString() });
      } catch (err) {
        console.warn('Include class lookup failed:', err.message);
      }
    }
    
    // Apply OR conditions unless explicitly showing all students
    const limitToUnassigned = unassigned !== 'false';
    if (limitToUnassigned) {
      filter.$or = orConditions;
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

// ==================== PARENT-STUDENT LINK MANAGEMENT ====================

// GET all students for a parent (for managing children)
router.get('/parents/:parentId/students', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { parentId } = req.params;
    
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    
    if (String(parent.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only manage users from your school' });
    }
    
    // Get linked students with details (students linked to THIS parent)
    const linkedStudentIds = parent.linkedStudents?.map(ls => ls.studentId) || [];
    const linkedStudents = await User.find({
      _id: { $in: linkedStudentIds },
      role: 'Student'
    }).select('_id name email class gradeLevel');
    
    // Find all students that are already linked to ANY parent in the school
    const allParentsWithLinks = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Parent',
      'linkedStudents.0': { $exists: true }
    }).select('linkedStudents');
    
    // Collect all student IDs that are linked to any parent (as ObjectIds for efficient query)
    const allLinkedStudentIds = allParentsWithLinks.flatMap(p => p.linkedStudents.map(ls => ls.studentId));
    
    // Get all students in the school that are NOT linked to ANY parent
    // (since each student can only have 1 parent)
    const availableStudents = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Student',
      _id: { $nin: allLinkedStudentIds }
    }).select('_id name email class gradeLevel');
    
    // Build class lookup map to resolve class IDs to class names
    const allStudents = [...linkedStudents, ...availableStudents];
    const classIds = [...new Set(allStudents.map(s => s.class).filter(Boolean))];
    const classLookup = {};
    if (classIds.length > 0) {
      const classDocs = await Class.find({ _id: { $in: classIds }, school_id: schoolAdmin.schoolId })
        .select('class_name');
      classDocs.forEach(cls => {
        classLookup[cls._id.toString()] = cls.class_name;
      });
    }
    
    // Helper function to resolve class name
    const resolveClassName = (classId) => {
      if (!classId) return 'Not assigned';
      const classKey = classId.toString();
      return classLookup[classKey] || 'Not assigned';
    };
    
    res.json({
      success: true,
      linkedStudents: linkedStudents.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        className: resolveClassName(s.class),
        gradeLevel: s.gradeLevel || 'N/A'
      })),
      availableStudents: availableStudents.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        className: resolveClassName(s.class),
        gradeLevel: s.gradeLevel || 'N/A'
      }))
    });
  } catch (error) {
    console.error('Get parent students error:', error);
    res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// PUT update parent's linked students (add/remove children)
router.put('/parents/:parentId/students', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { parentId } = req.params;
    const { studentIds } = req.body; // Array of student IDs to link
    
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, error: 'studentIds must be an array' });
    }
    
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    
    if (String(parent.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only manage users from your school' });
    }
    
    // Verify all students exist and belong to this school
    const students = await User.find({
      _id: { $in: studentIds },
      schoolId: schoolAdmin.schoolId,
      role: 'Student'
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ success: false, error: 'Some students were not found or do not belong to your school' });
    }
    
    // Update parent's linkedStudents
    parent.linkedStudents = studentIds.map(studentId => ({
      studentId: studentId,
      relationship: 'Parent'
    }));
    
    await parent.save();
    
    res.json({
      success: true,
      message: 'Parent-student links updated successfully',
      linkedCount: studentIds.length
    });
  } catch (error) {
    console.error('Update parent students error:', error);
    res.status(500).json({ success: false, error: 'Failed to update parent-student links' });
  }
});

// GET parent linked to a student
router.get('/students/:studentId/parent', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { studentId } = req.params;
    
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    if (String(student.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only manage users from your school' });
    }
    
    // Find parent linked to this student
    const linkedParent = await User.findOne({
      'linkedStudents.studentId': studentId,
      role: 'Parent'
    }).select('_id name email contact');
    
    // Get all parents in the school
    const availableParents = await User.find({
      schoolId: schoolAdmin.schoolId,
      role: 'Parent'
    }).select('_id name email contact');
    
    res.json({
      success: true,
      linkedParent: linkedParent ? {
        id: linkedParent._id,
        name: linkedParent.name,
        email: linkedParent.email,
        contact: linkedParent.contact || 'N/A'
      } : null,
      availableParents: availableParents.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        contact: p.contact || 'N/A'
      }))
    });
  } catch (error) {
    console.error('Get student parent error:', error);
    res.status(500).json({ success: false, error: 'Failed to load parent information' });
  }
});

// PUT update student's linked parent (student can only have 1 parent)
router.put('/students/:studentId/parent', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = req.schoolAdmin;
    const { studentId } = req.params;
    const { parentId } = req.body; // Can be null to unlink, or a parent ID to link
    
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    if (String(student.schoolId) !== String(schoolAdmin.schoolId)) {
      return res.status(403).json({ success: false, error: 'You can only manage users from your school' });
    }
    
    // Remove student from any existing parent
    await User.updateMany(
      { 
        role: 'Parent',
        'linkedStudents.studentId': studentId
      },
      { 
        $pull: { linkedStudents: { studentId: studentId } }
      }
    );
    
    // If a new parent is specified, link to them
    if (parentId) {
      const newParent = await User.findById(parentId);
      if (!newParent) {
        return res.status(404).json({ success: false, error: 'Parent not found' });
      }
      
      if (newParent.role !== 'Parent') {
        return res.status(400).json({ success: false, error: 'Selected user is not a parent' });
      }
      
      // Add student to new parent's linkedStudents
      await User.findByIdAndUpdate(parentId, {
        $addToSet: {
          linkedStudents: {
            studentId: studentId,
            relationship: 'Parent'
          }
        }
      });
      
      res.json({
        success: true,
        message: 'Student linked to parent successfully',
        parent: {
          id: newParent._id,
          name: newParent.name,
          email: newParent.email
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Student unlinked from parent successfully',
        parent: null
      });
    }
  } catch (error) {
    console.error('Update student parent error:', error);
    res.status(500).json({ success: false, error: 'Failed to update student-parent link' });
  }
});

// ==================== SUPPORT TICKET MANAGEMENT ====================
// Get all school-related support tickets for this school
router.get('/support-tickets', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { status, sortBy, sortOrder, search } = req.query;
    
    // Get school admin info to filter tickets by school
    const schoolAdmin = await User.findById(req.user.userId);
    if (!schoolAdmin || !schoolAdmin.school) {
      return res.status(400).json({
        success: false,
        error: 'School information not found'
      });
    }
    
    // Build query - only school-related tickets from this school
    const query = { 
      category: 'school',
      school_id: schoolAdmin.school
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Build sort object
    const sortOptions = {};
    const validSortFields = ['created_at', 'updated_at', 'status', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
    
    // Get tickets
    const tickets = await SupportTicket.find(query)
      .populate('user_id', 'name email role')
      .populate('school_id', 'name')
      .sort(sortOptions)
      .lean();
    
    // Filter by search term if provided
    let filteredTickets = tickets;
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filteredTickets = tickets.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.message?.toLowerCase().includes(searchLower) ||
        ticket.user_name?.toLowerCase().includes(searchLower) ||
        ticket.user_email?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      tickets: filteredTickets.map(ticket => ({
        _id: ticket._id,
        user_name: ticket.user_name || 'Unknown',
        user_email: ticket.user_email || 'N/A',
        user_role: ticket.user_role || 'Unknown',
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at
      })),
      total: filteredTickets.length
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch support tickets' 
    });
  }
});

// Get single support ticket
router.get('/support-tickets/:id', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = await User.findById(req.user.userId);
    
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      school_id: schoolAdmin.school // Ensure admin can only view tickets from their school
    })
      .populate('user_id', 'name email school')
      .populate('school_id', 'name')
      .lean();
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    // If ticket is 'open' and admin is viewing it, change status to 'pending'
    const updatedStatus = ticket.status === 'open' ? 'pending' : ticket.status;
    if (ticket.status === 'open') {
      await SupportTicket.findByIdAndUpdate(req.params.id, {
        status: 'pending',
        updated_at: new Date()
      });
    }
    
    res.json({
      success: true,
      ticket: {
        _id: ticket._id,
        user_name: ticket.user_name || 'Unknown',
        user_email: ticket.user_email || 'N/A',
        user_role: ticket.user_role || 'Unknown',
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: updatedStatus, // Return the updated status
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at
      }
    });
  } catch (error) {
    console.error('Get support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch support ticket' 
    });
  }
});

// Reply to a support ticket
router.post('/support-tickets/:id/reply', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response || response.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Response message is required' 
      });
    }
    
    const schoolAdmin = await User.findById(req.user.userId);
    
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      school_id: schoolAdmin.school
    });
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    ticket.admin_response = response;
    ticket.responded_by = req.user.userId;
    ticket.responded_at = new Date();
    ticket.updated_at = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket: {
        _id: ticket._id,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error('Reply to support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send reply' 
    });
  }
});

// Close a support ticket
router.post('/support-tickets/:id/close', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = await User.findById(req.user.userId);
    
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      school_id: schoolAdmin.school
    });
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    ticket.status = 'closed';
    ticket.closed_at = new Date();
    ticket.updated_at = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Ticket closed successfully',
      ticket: {
        _id: ticket._id,
        status: ticket.status,
        closed_at: ticket.closed_at
      }
    });
  } catch (error) {
    console.error('Close support ticket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to close ticket' 
    });
  }
});

// Get support ticket statistics
router.get('/support-tickets-stats', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdmin = await User.findById(req.user.userId);
    
    const [openCount, pendingCount, closedCount] = await Promise.all([
      SupportTicket.countDocuments({ category: 'school', school_id: schoolAdmin.school, status: 'open' }),
      SupportTicket.countDocuments({ category: 'school', school_id: schoolAdmin.school, status: 'pending' }),
      SupportTicket.countDocuments({ category: 'school', school_id: schoolAdmin.school, status: 'closed' })
    ]);
    
    res.json({
      success: true,
      data: {
        open: openCount,
        pending: pendingCount,
        closed: closedCount,
        total: openCount + pendingCount + closedCount
      }
    });
  } catch (error) {
    console.error('Get support ticket stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch ticket statistics' 
    });
  }
});

// ==================== SCHOOL ADMIN'S OWN SUPPORT TICKETS ====================
// These are tickets created by school admin for P2L Admin (website-related)

// Create a support ticket for P2L Admin
router.post('/my-support-tickets', authenticateSchoolAdmin, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }
    
    const schoolAdmin = await User.findById(req.user.userId);
    if (!schoolAdmin) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const ticket = await SupportTicket.create({
      user_id: schoolAdmin._id,
      user_name: schoolAdmin.name,
      user_email: schoolAdmin.email,
      user_role: 'School Admin',
      school_id: schoolAdmin.school,
      school_name: schoolAdmin.schoolName || '',
      subject,
      category: 'website', // School admins only create website-related tickets
      message,
      status: 'open',
      priority: priority || 'normal'
    });
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: ticket._id,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        status: ticket.status,
        created_at: ticket.created_at
      }
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

// Get school admin's own tickets
router.get('/my-support-tickets', authenticateSchoolAdmin, async (req, res) => {
  try {
    const schoolAdminId = req.user.userId;
    
    const tickets = await SupportTicket.find({
      user_id: schoolAdminId
    }).sort({ created_at: -1 }).lean();
    
    const formattedTickets = tickets.map(t => ({
      id: t._id,
      ticketId: t._id,
      subject: t.subject,
      message: t.message,
      status: t.status,
      priority: t.priority,
      created_at: t.created_at,
      updated_at: t.updated_at,
      admin_response: t.admin_response,
      responded_at: t.responded_at,
      hasReply: !!t.admin_response
    }));
    
    res.json({
      success: true,
      tickets: formattedTickets,
      totalTickets: formattedTickets.length
    });
  } catch (error) {
    console.error('Get my support tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load support tickets'
    });
  }
});

module.exports = router;
