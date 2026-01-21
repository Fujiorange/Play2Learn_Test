// backend/routes/schoolAdminRoutes.js - FIXED CSV PARSING
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const User = require('../models/User');
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

// ========== STUDENTS BULK IMPORT (UPDATED) ==========
router.post('/bulk-import-students', upload.single('file'), async (req, res) => {
  console.log('\n📤 Bulk import students request received');
  console.log('Request Body:', req.body);
  
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
    // ✅ FIXED: Parse CSV with proper headers
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          console.log('📝 Raw CSV row:', row);
          
          // ✅ Handle all possible CSV header variations
          students.push({
            name: row.Name || row.name || '',
            email: row.Email || row.email || '',
            class: row.Class || row.class || '',
            gradeLevel: row.GradeLevel || row.gradeLevel || row['Grade Level'] || row.grade_level || '',
            parentEmail: row.ParentEmail || row.parentEmail || row['Parent Email'] || row.parent_email || '',
            // ✅ NEW FIELDS
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

    console.log('📊 Import complete:', {
      created: results.created,
      failed: results.failed,
      emailsSent: results.emailsSent,
      emailsFailed: results.emailsFailed,
      errors: results.errors
    });

    console.log('\n🔄 Processing students...\n');

    // Process each student
    for (const studentData of students) {
      try {
        console.log(`👤 Processing: ${studentData.name} (${studentData.email})`);
        
        // Validate required fields
        if (!studentData.name || !studentData.email) {
          console.log(`⚠️  Skipping - Missing required fields (name or email)`);
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

        // ✅ Parse date of birth properly (convert to Date object)
        let parsedDateOfBirth = null;
        if (studentData.dateOfBirth) {
          try {
            // Handle formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
            const dateStr = studentData.dateOfBirth.trim();
            
            if (dateStr.includes('-')) {
              // YYYY-MM-DD format
              parsedDateOfBirth = new Date(dateStr);
            } else if (dateStr.includes('/')) {
              // DD/MM/YYYY or MM/DD/YYYY format
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                // Assume DD/MM/YYYY for Singapore
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                const year = parseInt(parts[2]);
                parsedDateOfBirth = new Date(year, month, day);
              }
            }
            
            // Validate date
            if (parsedDateOfBirth && isNaN(parsedDateOfBirth.getTime())) {
              console.log(`⚠️  Invalid date format: ${studentData.dateOfBirth}, skipping date`);
              parsedDateOfBirth = null;
            }
          } catch (error) {
            console.log(`⚠️  Date parsing error: ${error.message}, skipping date`);
            parsedDateOfBirth = null;
          }
        }

        // ✅ Normalize gender value
        const normalizedGender = studentData.gender ? studentData.gender.toLowerCase() : null;

        // Create student with all fields
        const student = await User.create({
          name: studentData.name,
          email: studentData.email,
          username: username,
          password: hashedPassword,
          role: 'Student',
          class: studentData.class || null,
          gradeLevel: studentData.gradeLevel || 'Primary 1',
          // ✅ NEW FIELDS
          contact: studentData.contact || null,
          gender: normalizedGender,
          date_of_birth: parsedDateOfBirth,
          emailVerified: true,
          accountActive: true,
          createdBy: 'school-admin',
          isTrialUser: false
        });

        console.log(`✅ Student created in database with:
   - Name: ${student.name}
   - Email: ${student.email}
   - Contact: ${student.contact || 'N/A'}
   - Gender: ${student.gender || 'N/A'}
   - Date of Birth: ${student.date_of_birth ? student.date_of_birth.toISOString().split('T')[0] : 'N/A'}`);
        
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

// ========== TEACHERS BULK IMPORT (UPDATED) ==========
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
            subject: row.Subject || row.subject,
            // ✅ NEW FIELDS
            contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || '',
            gender: row.Gender || row.gender || '',
            dateOfBirth: row.DateOfBirth || row.dateOfBirth || row['Date of Birth'] || row.date_of_birth || ''
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

        // ✅ Parse date of birth properly
        let parsedDateOfBirth = null;
        if (teacherData.dateOfBirth) {
          try {
            const dateStr = teacherData.dateOfBirth.trim();
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

        // Create teacher
        const teacher = await User.create({
          name: teacherData.name,
          email: teacherData.email,
          password: hashedPassword,
          role: 'Teacher',
          subject: teacherData.subject,
          // ✅ NEW FIELDS
          contact: teacherData.contact || null,
          gender: teacherData.gender ? teacherData.gender.toLowerCase() : null,
          date_of_birth: parsedDateOfBirth,
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
          'Your School'
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

// ========== PARENTS BULK IMPORT (UPDATED) ==========
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
            parentName: row.ParentName || row.parent_name || row.Name || row.name,
            parentEmail: row.ParentEmail || row.parent_email || row.Email || row.email,
            studentEmail: row.StudentEmail || row.student_email,
            relationship: row.Relationship || row.relationship,
            // ✅ NEW FIELDS
            contact: row.ContactNumber || row.contactNumber || row['Contact Number'] || row.contact || '',
            gender: row.Gender || row.gender || '',
            dateOfBirth: row.DateOfBirth || row.dateOfBirth || row['Date of Birth'] || row.date_of_birth || ''
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

        // ✅ Parse date of birth
        let parsedDateOfBirth = null;
        if (parentData.dateOfBirth) {
          try {
            const dateStr = parentData.dateOfBirth.trim();
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
          // ✅ NEW FIELDS
          contact: parentData.contact || null,
          gender: parentData.gender ? parentData.gender.toLowerCase() : null,
          date_of_birth: parsedDateOfBirth,
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
          'Your School'
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