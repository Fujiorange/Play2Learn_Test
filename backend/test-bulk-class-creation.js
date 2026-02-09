#!/usr/bin/env node

/**
 * Test script for bulk class creation
 * This script simulates the CSV upload and validates the logic
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('./models/User');
const Class = require('./models/Class');
const School = require('./models/School');

const MONGODB_URI = process.env.MONGODB_URI;

async function testBulkClassLogic() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('TEST: Bulk Class Creation Logic Validation');
    console.log('='.repeat(60));

    // Read and parse the test CSV
    const csvPath = './test-bulk-class-sample.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ Test CSV file not found:', csvPath);
      return;
    }

    console.log('\n📄 Reading test CSV file...');
    
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    console.log(`✅ Parsed ${rows.length} rows\n`);

    // Validate CSV structure
    console.log('🔍 Validating CSV structure...\n');

    const firstRow = rows[0];
    const classNameField = firstRow['Class Name'] || firstRow['class_name'] || firstRow['ClassName'];
    const gradeField = firstRow['Grade'] || firstRow['grade'];
    const subjectField = firstRow['Subject'] || firstRow['subject'];

    console.log('Class Metadata:');
    console.log(`  Class Name: ${classNameField || '❌ MISSING'}`);
    console.log(`  Grade: ${gradeField || '❌ MISSING'}`);
    console.log(`  Subject: ${subjectField || '❌ MISSING'}`);

    if (!classNameField || !gradeField || !subjectField) {
      console.log('\n❌ CSV validation failed: Missing required class metadata');
      return;
    }

    // Count teachers and students
    let teacherCount = 0;
    let studentCount = 0;
    let parentEmails = new Set();

    rows.forEach((row, index) => {
      const teacherEmail = row['Teacher Email'] || row['teacher_email'] || row['TeacherEmail'];
      const teacherRole = row['Teacher Role'] || row['teacher_role'] || row['TeacherRole'];
      
      const studentEmail = row['Student Email'] || row['student_email'] || row['StudentEmail'];
      const studentRole = row['Student Role'] || row['student_role'] || row['StudentRole'];
      
      const parentEmail = row['Linked Parent Email'] || row['linked_parent_email'] || row['LinkedParentEmail'];

      if (teacherEmail && teacherRole && teacherRole.toLowerCase() === 'teacher') {
        teacherCount++;
      }

      if (studentEmail && studentRole && studentRole.toLowerCase() === 'student') {
        studentCount++;
        if (parentEmail && parentEmail.trim()) {
          parentEmails.add(parentEmail.toLowerCase().trim());
        }
      }
    });

    console.log('\n📊 CSV Content Summary:');
    console.log(`  Teachers: ${teacherCount}`);
    console.log(`  Students: ${studentCount}`);
    console.log(`  Unique Parent Emails: ${parentEmails.size}`);

    if (teacherCount === 0) {
      console.log('\n⚠️  Warning: No teacher found in CSV');
    } else if (teacherCount > 1) {
      console.log('\n⚠️  Warning: Multiple teachers found (only first will be processed)');
    }

    if (studentCount === 0) {
      console.log('\n⚠️  Warning: No students found in CSV');
    }

    // Check if we have a test school
    console.log('\n🏫 Checking for test school...');
    
    const testSchool = await School.findOne({ name: { $regex: /test/i } }).populate('licenseId');
    
    if (!testSchool) {
      console.log('⚠️  No test school found in database');
      console.log('   This test requires a school to validate license limits');
    } else {
      console.log(`✅ Found test school: ${testSchool.name}`);
      
      if (testSchool.licenseId) {
        console.log('\n📋 License Information:');
        console.log(`  Max Classes: ${testSchool.licenseId.maxClasses === -1 ? 'Unlimited' : testSchool.licenseId.maxClasses}`);
        console.log(`  Max Teachers: ${testSchool.licenseId.maxTeachers === -1 ? 'Unlimited' : testSchool.licenseId.maxTeachers}`);
        console.log(`  Max Students: ${testSchool.licenseId.maxStudents === -1 ? 'Unlimited' : testSchool.licenseId.maxStudents}`);
        console.log(`  Max Parents: ${testSchool.licenseId.maxParents === -1 ? 'Unlimited' : testSchool.licenseId.maxParents}`);
        
        console.log('\n📊 Current Usage:');
        console.log(`  Classes: ${testSchool.current_classes || 0}`);
        console.log(`  Teachers: ${testSchool.current_teachers || 0}`);
        console.log(`  Students: ${testSchool.current_students || 0}`);
        console.log(`  Parents: ${testSchool.current_parents || 0}`);
        
        // Check if we have space
        const classLimit = testSchool.licenseId.maxClasses;
        const teacherLimit = testSchool.licenseId.maxTeachers;
        const studentLimit = testSchool.licenseId.maxStudents;
        const parentLimit = testSchool.licenseId.maxParents;
        
        const canAddClass = classLimit === -1 || (testSchool.current_classes || 0) < classLimit;
        const canAddTeacher = teacherLimit === -1 || (testSchool.current_teachers || 0) < teacherLimit;
        const canAddStudents = studentLimit === -1 || (testSchool.current_students || 0) + studentCount <= studentLimit;
        const canAddParents = parentLimit === -1 || (testSchool.current_parents || 0) + parentEmails.size <= parentLimit;
        
        console.log('\n✅ License Capacity Check:');
        console.log(`  Can add class: ${canAddClass ? '✅' : '❌'}`);
        console.log(`  Can add ${teacherCount} teacher(s): ${canAddTeacher ? '✅' : '❌'}`);
        console.log(`  Can add ${studentCount} student(s): ${canAddStudents ? '✅' : '❌'}`);
        console.log(`  Can add ${parentEmails.size} parent(s): ${canAddParents ? '✅' : '❌'}`);
        
        if (!canAddClass || !canAddTeacher || !canAddStudents || !canAddParents) {
          console.log('\n⚠️  Warning: License limits would prevent this upload');
        }
      }
    }

    // Check for existing users with test emails
    console.log('\n👥 Checking for existing test users...');
    
    const testEmails = [];
    rows.forEach(row => {
      const teacherEmail = row['Teacher Email'] || row['teacher_email'] || row['TeacherEmail'];
      const studentEmail = row['Student Email'] || row['student_email'] || row['StudentEmail'];
      const parentEmail = row['Linked Parent Email'] || row['linked_parent_email'] || row['LinkedParentEmail'];
      
      if (teacherEmail && teacherEmail.trim()) testEmails.push(teacherEmail.toLowerCase().trim());
      if (studentEmail && studentEmail.trim()) testEmails.push(studentEmail.toLowerCase().trim());
      if (parentEmail && parentEmail.trim()) testEmails.push(parentEmail.toLowerCase().trim());
    });
    
    const existingUsers = await User.find({ 
      email: { $in: testEmails } 
    }).select('email role');
    
    if (existingUsers.length > 0) {
      console.log(`\nFound ${existingUsers.length} existing users:`);
      existingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      console.log('\n⚠️  These users would be assigned to the class instead of created');
    } else {
      console.log('✅ No existing users found - all would be created as new');
    }

    // Check for existing class
    if (testSchool) {
      const existingClass = await Class.findOne({
        class_name: classNameField,
        school_id: testSchool._id
      });
      
      if (existingClass) {
        console.log(`\n❌ Class "${classNameField}" already exists in ${testSchool.name}`);
        console.log('   Upload would fail with conflict error');
      } else {
        console.log(`\n✅ Class "${classNameField}" does not exist - ready for creation`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 Summary');
    console.log('='.repeat(60));
    console.log('CSV Structure: ✅ Valid');
    console.log('Class Metadata: ✅ Present');
    console.log(`Teachers: ${teacherCount} (${teacherCount === 1 ? '✅ Valid' : '⚠️  Multiple/None'})`);
    console.log(`Students: ${studentCount} (${studentCount > 0 ? '✅ Valid' : '❌ None'})`);
    console.log(`Parents: ${parentEmails.size} (Optional)`);
    
    console.log('\n💡 To test actual creation, use the API endpoint:');
    console.log('   POST /api/school-admin/classes/bulk-create');
    console.log('   with authentication token and CSV file upload');
    
    console.log('\n✅ Validation test completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testBulkClassLogic();
