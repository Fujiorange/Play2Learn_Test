// backend/routes/schoolAdminRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust path based on your structure
const { sendTeacherWelcomeEmail, sendParentWelcomeEmail, sendStudentCredentialsToParent } = require('../services/emailService');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Password generator utility
function generateTempPassword(userType) {
  const crypto = require('crypto');
  const prefix = userType.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex');
  const special = '!';
  return `${prefix}${year}${random}${special}`;
}

// ========== TEACHERS BULK IMPORT ==========
router.post('/bulk-import-teachers', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk Import Teachers Request Received');
  
  if (!req.file) {
    console.log('❌ No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log(`📄 File uploaded: ${req.file.originalname}`);
  
  const teachers = [];
  const results = {
    created: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: []
  };

  try {
    // Parse CSV
    console.log('📖 Parsing CSV file...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          console.log('📝 CSV Row:', row);
          teachers.push({
            name: row.Name || row.name,
            email: row.Email || row.email,
            subject: row.Subject || row.subject
          });
        })
        .on('end', () => {
          console.log(`✅ CSV parsed: ${teachers.length} teachers found`);
          resolve();
        })
        .on('error', reject);
    });

    console.log('\n🔄 Processing teachers...\n');

    // Process each teacher
    for (const teacherData of teachers) {
      try {
        console.log(`👤 Processing: ${teacherData.name} (${teacherData.email})`);
        
        // Validate
        if (!teacherData.name || !teacherData.email) {
          console.log(`⚠️  Skipping - Missing required fields`);
          results.failed++;
          results.errors.push({ 
            email: teacherData.email || 'unknown', 
            error: 'Missing required fields (name or email)' 
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: teacherData.email });
        if (existingUser) {
          console.log(`⚠️  Skipping - Email already exists`);
          results.failed++;
          results.errors.push({ 
            email: teacherData.email, 
            error: 'Email already registered' 
          });
          continue;
        }

        // Generate password
        const tempPassword = generateTempPassword('Teacher');
        console.log(`🔑 Generated password: ${tempPassword}`);
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create teacher
        const teacher = await User.create({
          name: teacherData.name,
          email: teacherData.email,
          password: hashedPassword,
          role: 'Teacher',
          subject: teacherData.subject,
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
          isTrialUser: false
        });

        console.log(`✅ Teacher created in database`);
        results.created++;

        // Send welcome email
        console.log(`📧 Sending welcome email to ${teacher.email}...`);
        
        const emailResult = await sendTeacherWelcomeEmail(
          teacher, 
          tempPassword, 
          'Test School'
        );

        if (emailResult.success) {
          console.log(`✅ Email sent successfully`);
          results.emailsSent++;
        } else {
          console.log(`❌ Email failed: ${emailResult.error}`);
          results.emailsFailed++;
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error processing ${teacherData.email}:`, error.message);
        results.failed++;
        results.errors.push({ 
          email: teacherData.email, 
          error: error.message 
        });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    console.log('🗑️  Temporary CSV file deleted\n');

    console.log('📊 BULK IMPORT SUMMARY:');
    console.log(`   ✅ Created: ${results.created}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📧 Emails Sent: ${results.emailsSent}`);
    console.log(`   ⚠️  Emails Failed: ${results.emailsFailed}\n`);

    res.json({
      success: true,
      message: `${results.created} teachers created successfully`,
      results: results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    
    // Clean up file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message 
    });
  }
});

// ========== STUDENTS BULK IMPORT ==========
router.post('/bulk-import-students', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk Import Students Request Received');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

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
    console.log('📖 Parsing CSV file...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          students.push({
            name: row.Name || row.name,
            email: row.Email || row.email,
            class: row.Class || row.class,
            gradeLevel: row.GradeLevel || row.gradeLevel || row.grade_level,
            parentEmail: row.ParentEmail || row.parent_email || row.parentEmail
          });
        })
        .on('end', () => {
          console.log(`✅ CSV parsed: ${students.length} students found`);
          resolve();
        })
        .on('error', reject);
    });

    console.log('\n🔄 Processing students...\n');

    // Process each student
    for (const studentData of students) {
      try {
        console.log(`👤 Processing: ${studentData.name} (${studentData.email})`);
        
        // Validate
        if (!studentData.name || !studentData.email) {
          console.log(`⚠️  Skipping - Missing required fields`);
          results.failed++;
          results.errors.push({ 
            email: studentData.email || 'unknown', 
            error: 'Missing required fields' 
          });
          continue;
        }

        // Check if exists
        const existingUser = await User.findOne({ email: studentData.email });
        if (existingUser) {
          console.log(`⚠️  Skipping - Email already exists`);
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

        // Create student
        const student = await User.create({
          name: studentData.name,
          email: studentData.email,
          username: username,
          password: hashedPassword,
          role: 'Student',
          class: studentData.class,
          gradeLevel: studentData.gradeLevel,
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
          isTrialUser: false
        });

        console.log(`✅ Student created in database`);
        results.created++;

        // Send credentials to parent if email provided
        if (studentData.parentEmail) {
          console.log(`📧 Sending credentials to parent: ${studentData.parentEmail}...`);
          
          const emailResult = await sendStudentCredentialsToParent(
            student,
            tempPassword,
            studentData.parentEmail,
            'Test School'
          );

          if (emailResult.success) {
            console.log(`✅ Email sent to parent`);
            results.emailsSent++;
          } else {
            console.log(`❌ Email failed: ${emailResult.error}`);
            results.emailsFailed++;
          }
        } else {
          console.log(`⚠️  No parent email provided - skipping email`);
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error processing ${studentData.email}:`, error.message);
        results.failed++;
        results.errors.push({ 
          email: studentData.email, 
          error: error.message 
        });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    console.log('🗑️  Temporary CSV file deleted\n');

    console.log('📊 BULK IMPORT SUMMARY:');
    console.log(`   ✅ Created: ${results.created}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📧 Emails Sent: ${results.emailsSent}`);
    console.log(`   ⚠️  Emails Failed: ${results.emailsFailed}\n`);

    res.json({
      success: true,
      message: `${results.created} students created successfully`,
      results: results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// ========== PARENTS BULK IMPORT ==========
router.post('/bulk-import-parents', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk Import Parents Request Received');
  
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
            parentName: row.ParentName || row.parent_name,
            parentEmail: row.ParentEmail || row.parent_email,
            studentEmail: row.StudentEmail || row.student_email,
            relationship: row.Relationship || row.relationship
          });
        })
        .on('end', () => {
          console.log(`✅ CSV parsed: ${parents.length} parents found`);
          resolve();
        })
        .on('error', reject);
    });

    console.log('\n🔄 Processing parents...\n');

    for (const parentData of parents) {
      try {
        console.log(`👤 Processing: ${parentData.parentName} (${parentData.parentEmail})`);
        
        if (!parentData.parentName || !parentData.parentEmail || !parentData.studentEmail) {
          console.log(`⚠️  Skipping - Missing required fields`);
          results.failed++;
          results.errors.push({ 
            email: parentData.parentEmail, 
            error: 'Missing required fields' 
          });
          continue;
        }

        // Find linked student
        const student = await User.findOne({ 
          email: parentData.studentEmail, 
          role: 'Student' 
        });

        if (!student) {
          console.log(`⚠️  Skipping - Student not found: ${parentData.studentEmail}`);
          results.failed++;
          results.errors.push({ 
            email: parentData.parentEmail, 
            error: `Student not found: ${parentData.studentEmail}` 
          });
          continue;
        }

        // Check if parent exists
        const existingParent = await User.findOne({ email: parentData.parentEmail });
        if (existingParent) {
          console.log(`⚠️  Skipping - Parent email already exists`);
          results.failed++;
          results.errors.push({ 
            email: parentData.parentEmail, 
            error: 'Email already registered' 
          });
          continue;
        }

        // Generate password
        const tempPassword = generateTempPassword('Parent');
        console.log(`🔑 Generated password: ${tempPassword}`);
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create parent
        const parent = await User.create({
          name: parentData.parentName,
          email: parentData.parentEmail,
          password: hashedPassword,
          role: 'Parent',
          linkedStudents: [{
            studentId: student._id,
            relationship: parentData.relationship
          }],
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
          isTrialUser: false
        });

        console.log(`✅ Parent created and linked to ${student.name}`);
        results.created++;

        // Send welcome email
        console.log(`📧 Sending welcome email to ${parent.email}...`);
        
        const emailResult = await sendParentWelcomeEmail(
          parent,
          tempPassword,
          student.name,
          'Test School'
        );

        if (emailResult.success) {
          console.log(`✅ Email sent successfully`);
          results.emailsSent++;
        } else {
          console.log(`❌ Email failed: ${emailResult.error}`);
          results.emailsFailed++;
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error processing ${parentData.parentEmail}:`, error.message);
        results.failed++;
        results.errors.push({ 
          email: parentData.parentEmail, 
          error: error.message 
        });
      }
    }

    fs.unlinkSync(req.file.path);
    console.log('🗑️  Temporary CSV file deleted\n');

    console.log('📊 BULK IMPORT SUMMARY:');
    console.log(`   ✅ Created: ${results.created}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📧 Emails Sent: ${results.emailsSent}`);
    console.log(`   ⚠️  Emails Failed: ${results.emailsFailed}\n`);

    res.json({
      success: true,
      message: `${results.created} parents created successfully`,
      results: results
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

module.exports = router;