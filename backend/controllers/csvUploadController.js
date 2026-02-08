const bcrypt = require('bcrypt');
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const { generateTempPassword } = require('../utils/passwordGenerator');
const { sendTeacherWelcomeEmail, sendParentWelcomeEmail, sendStudentCredentialsToParent } = require('../services/emailService');
const { parseMultiSectionCSV, validateCSVData } = require('../utils/csvClassParser');
const mongoose = require('mongoose');

/**
 * Check license availability for bulk operations
 */
async function checkBulkLicenseAvailability(schoolId, teachersCount, studentsCount) {
  const school = await School.findById(schoolId);
  
  if (!school) {
    return { available: false, error: 'School not found' };
  }
  
  if (!school.is_active) {
    return { available: false, error: 'School is not active' };
  }
  
  // Check teacher limit
  const currentTeachers = await User.countDocuments({ schoolId, role: 'Teacher' });
  const teacherLimit = school.plan_info.teacher_limit;
  
  if (currentTeachers + teachersCount > teacherLimit) {
    return {
      available: false,
      error: `Teacher limit would be exceeded. Current: ${currentTeachers}, Trying to add: ${teachersCount}, Limit: ${teacherLimit}`
    };
  }
  
  // Check student limit
  const currentStudents = await User.countDocuments({ schoolId, role: 'Student' });
  const studentLimit = school.plan_info.student_limit;
  
  if (currentStudents + studentsCount > studentLimit) {
    return {
      available: false,
      error: `Student limit would be exceeded. Current: ${currentStudents}, Trying to add: ${studentsCount}, Limit: ${studentLimit}`
    };
  }
  
  return { available: true, school };
}

/**
 * Create a user with a random password
 */
async function createUserWithRandomPassword(userData, schoolId) {
  const tempPassword = generateTempPassword(userData.role);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  const user = await User.create({
    name: userData.fullName,
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
    schoolId: schoolId,
    tempPassword: tempPassword,
    requirePasswordChange: true,
    credentialsSent: false,
    gradeLevel: userData.gradeLevel || null,
    class: userData.classId || null,
    subject: userData.subjects && userData.subjects.length > 0 ? userData.subjects[0] : null,
    assignedClasses: userData.classIds || [],
    assignedSubjects: userData.subjects || []
  });
  
  return { user, tempPassword };
}

/**
 * Send welcome email to user based on role
 */
async function sendWelcomeEmail(user, tempPassword, schoolName) {
  try {
    switch (user.role) {
      case 'Teacher':
        await sendTeacherWelcomeEmail(user.email, user.name, tempPassword, schoolName);
        break;
      case 'Parent':
        await sendParentWelcomeEmail(user.email, user.name, tempPassword, schoolName);
        break;
      case 'Student':
        // For students, we send credentials to parent if linked
        // Otherwise, send to student email
        await sendStudentCredentialsToParent(user.email, user.name, tempPassword, schoolName, user.email);
        break;
    }
    
    user.credentialsSent = true;
    user.credentialsSentAt = new Date();
    await user.save();
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't fail the whole process if email fails
  }
}

/**
 * Main CSV processing function
 */
async function processCSVUpload(csvData, schoolId, schoolAdminId) {
  const results = {
    created: { classes: 0, teachers: 0, students: 0, parents: 0 },
    updated: { teachers: 0, parents: 0 },
    errors: [],
    warnings: []
  };

  try {
    // Parse CSV
    const parsedData = parseMultiSectionCSV(csvData);
    
    // Validate CSV data
    const validation = validateCSVData(parsedData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        results
      };
    }

    // Get school info
    const school = await School.findById(schoolId);
    if (!school) {
      return {
        success: false,
        errors: ['School not found'],
        results
      };
    }

    // Count new teachers and students for license check
    const existingTeachers = await User.find({
      email: { $in: parsedData.teachers.map(t => t.email) },
      schoolId,
      role: 'Teacher'
    }).select('email');
    
    const newTeachersCount = parsedData.teachers.length - existingTeachers.length;
    const newStudentsCount = parsedData.students.length; // All students must be new

    // Check license limits
    const licenseCheck = await checkBulkLicenseAvailability(schoolId, newTeachersCount, newStudentsCount);
    if (!licenseCheck.available) {
      return {
        success: false,
        errors: [licenseCheck.error],
        results
      };
    }

    // Step 1: Create classes first
    const classMap = {}; // Map class name to class ID
    for (const classData of parsedData.classes) {
      try {
        // Check if class already exists
        let existingClass = await Class.findOne({
          class_name: classData.className,
          school_id: schoolId
        });

        if (existingClass) {
          classMap[classData.className] = existingClass._id;
          results.warnings.push(`Class "${classData.className}" already exists, using existing class`);
        } else {
          const newClass = await Class.create({
            class_name: classData.className,
            grade: classData.gradeLevel,
            subjects: classData.subjects.length > 0 ? classData.subjects : ['Mathematics'],
            school_id: schoolId,
            teachers: [],
            students: [],
            is_active: true
          });
          
          classMap[classData.className] = newClass._id;
          results.created.classes++;
        }
      } catch (error) {
        results.errors.push(`Failed to create class "${classData.className}": ${error.message}`);
      }
    }

    // Step 2: Create/update teachers and assign to classes
    for (const teacherData of parsedData.teachers) {
      try {
        let teacher = await User.findOne({
          email: teacherData.email,
          schoolId,
          role: 'Teacher'
        });

        // Get class IDs for this teacher
        const classIds = teacherData.classes
          .map(className => classMap[className])
          .filter(id => id);

        if (teacher) {
          // Update existing teacher - add new classes
          const currentClasses = teacher.assignedClasses || [];
          const updatedClasses = [...new Set([...currentClasses, ...classIds.map(id => id.toString())])];
          
          teacher.assignedClasses = updatedClasses;
          if (teacherData.subjects && teacherData.subjects.length > 0) {
            teacher.assignedSubjects = teacherData.subjects;
            teacher.subject = teacherData.subjects[0];
          }
          await teacher.save();

          // Update class documents to include this teacher
          for (const classId of classIds) {
            await Class.findByIdAndUpdate(
              classId,
              { $addToSet: { teachers: teacher._id } }
            );
          }

          results.updated.teachers++;
        } else {
          // Create new teacher
          const { user: newTeacher, tempPassword } = await createUserWithRandomPassword({
            fullName: teacherData.fullName,
            email: teacherData.email,
            role: 'Teacher',
            subjects: teacherData.subjects,
            classIds: classIds.map(id => id.toString())
          }, schoolId);

          // Update class documents to include this teacher
          for (const classId of classIds) {
            await Class.findByIdAndUpdate(
              classId,
              { $addToSet: { teachers: newTeacher._id } }
            );
          }

          // Send welcome email
          await sendWelcomeEmail(newTeacher, tempPassword, school.organization_name);

          results.created.teachers++;
        }
      } catch (error) {
        results.errors.push(`Failed to process teacher "${teacherData.email}": ${error.message}`);
      }
    }

    // Step 3: Create students (must be new emails)
    for (const studentData of parsedData.students) {
      try {
        // Check if student already exists
        const existing = await User.findOne({
          email: studentData.email,
          schoolId
        });

        if (existing) {
          results.errors.push(`Student email ${studentData.email} already exists`);
          continue;
        }

        // Get class ID
        const classId = classMap[studentData.class];
        if (!classId) {
          results.errors.push(`Student "${studentData.email}": Class "${studentData.class}" not found`);
          continue;
        }

        // Create student
        const { user: newStudent, tempPassword } = await createUserWithRandomPassword({
          fullName: studentData.fullName,
          email: studentData.email,
          role: 'Student',
          gradeLevel: studentData.gradeLevel,
          classId: classId
        }, schoolId);

        // Update class document to include this student
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: newStudent._id } }
        );

        // Send welcome email
        await sendWelcomeEmail(newStudent, tempPassword, school.organization_name);

        results.created.students++;
      } catch (error) {
        results.errors.push(`Failed to create student "${studentData.email}": ${error.message}`);
      }
    }

    // Step 4: Create/update parents and link to students
    for (const parentData of parsedData.parents) {
      try {
        let parent = await User.findOne({
          email: parentData.email,
          schoolId,
          role: 'Parent'
        });

        // Find student IDs from emails
        const students = await User.find({
          email: { $in: parentData.linkedStudentEmails },
          schoolId,
          role: 'Student'
        });

        const studentLinks = students.map(s => ({
          studentId: s._id,
          relationship: 'Parent' // Default relationship
        }));

        if (parent) {
          // Update existing parent - add new student links
          const currentLinks = parent.linkedStudents || [];
          const currentStudentIds = currentLinks.map(link => link.studentId.toString());
          
          // Add new students that aren't already linked
          for (const link of studentLinks) {
            if (!currentStudentIds.includes(link.studentId.toString())) {
              currentLinks.push(link);
            }
          }
          
          parent.linkedStudents = currentLinks;
          await parent.save();

          results.updated.parents++;
        } else {
          // Create new parent
          const { user: newParent, tempPassword } = await createUserWithRandomPassword({
            fullName: parentData.fullName,
            email: parentData.email,
            role: 'Parent'
          }, schoolId);

          newParent.linkedStudents = studentLinks;
          await newParent.save();

          // Send welcome email
          await sendWelcomeEmail(newParent, tempPassword, school.organization_name);

          results.created.parents++;
        }
      } catch (error) {
        results.errors.push(`Failed to process parent "${parentData.email}": ${error.message}`);
      }
    }

    // Update school counts
    school.current_teachers = await User.countDocuments({ schoolId, role: 'Teacher' });
    school.current_students = await User.countDocuments({ schoolId, role: 'Student' });
    await school.save();

    return {
      success: true,
      results,
      message: 'CSV processing completed'
    };

  } catch (error) {
    console.error('CSV processing error:', error);
    return {
      success: false,
      errors: ['Processing failed: ' + error.message],
      results
    };
  }
}

module.exports = {
  processCSVUpload,
  checkBulkLicenseAvailability
};
