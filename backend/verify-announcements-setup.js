// verify-announcements-setup.js
// Script to verify that announcements and parent-student linking are set up correctly

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const { getValidStudentIds } = require('./utils/parentUtils');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('   Please set MONGODB_URI in your .env file');
  process.exit(1);
}

async function verifySetup() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check 1: Verify students have schoolId
    console.log('📊 Check 1: Verifying students have schoolId...');
    const studentsWithoutSchoolId = await User.find({ 
      role: 'Student', 
      $or: [{ schoolId: null }, { schoolId: { $exists: false } }] 
    }).select('name email');
    
    if (studentsWithoutSchoolId.length > 0) {
      console.log(`⚠️  Found ${studentsWithoutSchoolId.length} students without schoolId:`);
      studentsWithoutSchoolId.forEach(s => {
        console.log(`   - ${s.name} (${s.email})`);
      });
      console.log('   ℹ️  These students will NOT see any announcements!');
    } else {
      console.log('✅ All students have schoolId set');
    }
    console.log('');

    // Check 2: Verify teachers have schoolId
    console.log('📊 Check 2: Verifying teachers have schoolId...');
    const teachersWithoutSchoolId = await User.find({ 
      role: { $in: ['Teacher', 'Trial Teacher'] },
      $or: [{ schoolId: null }, { schoolId: { $exists: false } }] 
    }).select('name email');
    
    if (teachersWithoutSchoolId.length > 0) {
      console.log(`⚠️  Found ${teachersWithoutSchoolId.length} teachers without schoolId:`);
      teachersWithoutSchoolId.forEach(t => {
        console.log(`   - ${t.name} (${t.email})`);
      });
      console.log('   ℹ️  These teachers will NOT see any announcements!');
    } else {
      console.log('✅ All teachers have schoolId set');
    }
    console.log('');

    // Check 3: Verify parents have schoolId or linked students
    console.log('📊 Check 3: Verifying parents have schoolId or linked students...');
    const allParents = await User.find({ role: 'Parent' }).select('name email schoolId linkedStudents');
    
    const parentsWithoutSchoolOrStudents = allParents.filter(p => {
      const hasSchoolId = p.schoolId != null;
      const hasLinkedStudents = p.linkedStudents && p.linkedStudents.length > 0;
      return !hasSchoolId && !hasLinkedStudents;
    });
    
    if (parentsWithoutSchoolOrStudents.length > 0) {
      console.log(`⚠️  Found ${parentsWithoutSchoolOrStudents.length} parents without schoolId or linked students:`);
      parentsWithoutSchoolOrStudents.forEach(p => {
        console.log(`   - ${p.name} (${p.email})`);
      });
      console.log('   ℹ️  These parents will NOT see any announcements!');
    } else {
      console.log('✅ All parents have schoolId or linked students');
    }
    console.log('');

    // Check 4: Verify announcement collection exists and has data
    console.log('📊 Check 4: Checking announcements collection...');
    
    const announcementsCount = await Announcement.countDocuments();
    
    if (announcementsCount === 0) {
      console.log('⚠️  No announcements found!');
      console.log('   ℹ️  Create announcements via School Admin dashboard');
    } else {
      console.log(`✅ Announcements collection exists with ${announcementsCount} announcements`);
      
      // Show sample announcements
      const sampleAnnouncements = await Announcement.find({})
        .limit(3)
        .select('title schoolId audience createdAt')
        .lean();
      
      console.log('   📢 Sample announcements:');
      sampleAnnouncements.forEach(a => {
        console.log(`   - "${a.title}" (School: ${a.schoolId || 'N/A'}, Audience: ${a.audience || 'all'})`);
      });
      
      // Check for announcements without schoolId
      const announcementsWithoutSchool = await Announcement.countDocuments({ 
        $or: [{ schoolId: null }, { schoolId: { $exists: false } }] 
      });
      
      if (announcementsWithoutSchool > 0) {
        console.log(`   ⚠️  ${announcementsWithoutSchool} announcements have no schoolId (will cause errors)`);
      }
    }
    console.log('');

    // Check 5: Verify parent-student linking data
    console.log('📊 Check 5: Verifying parent-student linking...');
    const parentsWithStudents = await User.find({ 
      role: 'Parent',
      'linkedStudents.0': { $exists: true }
    }).select('name email linkedStudents');
    
    if (parentsWithStudents.length === 0) {
      console.log('⚠️  No parents have linked students!');
      console.log('   ℹ️  Link students to parents via School Admin dashboard');
    } else {
      console.log(`✅ Found ${parentsWithStudents.length} parents with linked students`);
      
      // Collect all student IDs first to minimize database queries
      const allStudentIds = new Set();
      const parentStudentMap = new Map();
      
      for (const parent of parentsWithStudents) {
        const validStudentIds = getValidStudentIds(parent.linkedStudents);
        
        if (validStudentIds.length === 0) {
          console.log(`   ⚠️  ${parent.name} (${parent.email}): Has linkedStudents array but all studentIds are null!`);
        } else {
          parentStudentMap.set(parent._id.toString(), {
            parent,
            studentIds: validStudentIds
          });
          validStudentIds.forEach(id => allStudentIds.add(id.toString()));
        }
      }
      
      // Fetch all students at once
      if (allStudentIds.size > 0) {
        const allStudents = await User.find({
          _id: { $in: Array.from(allStudentIds) },
          role: 'Student'
        }).select('_id name email');
        
        const studentMap = new Map();
        allStudents.forEach(s => studentMap.set(s._id.toString(), s));
        
        // Show details for each parent
        for (const [parentId, { parent, studentIds }] of parentStudentMap) {
          const linkedStudents = studentIds
            .map(id => studentMap.get(id.toString()))
            .filter(s => s); // Remove undefined (students not found)
          
          if (linkedStudents.length === 0) {
            console.log(`   ⚠️  ${parent.name} (${parent.email}): Linked students not found in database!`);
          } else {
            console.log(`   - ${parent.name} (${parent.email}): ${linkedStudents.length} linked student(s)`);
            linkedStudents.forEach(s => {
              console.log(`     → ${s.name} (${s.email})`);
            });
          }
        }
      }
    }
    console.log('');

    // Summary
    console.log('================================');
    console.log('📋 SUMMARY');
    console.log('================================');
    
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalTeachers = await User.countDocuments({ role: { $in: ['Teacher', 'Trial Teacher'] } });
    const totalParents = await User.countDocuments({ role: 'Parent' });
    
    console.log(`Total users:`);
    console.log(`  - Students: ${totalStudents} (${studentsWithoutSchoolId.length} without schoolId)`);
    console.log(`  - Teachers: ${totalTeachers} (${teachersWithoutSchoolId.length} without schoolId)`);
    console.log(`  - Parents: ${totalParents} (${parentsWithStudents.length} with linked students)`);
    
    if (hasAnnouncementCollection) {
      console.log(`  - Announcements: ${announcementsCount}`);
    }
    
    console.log('');
    
    if (studentsWithoutSchoolId.length > 0 || teachersWithoutSchoolId.length > 0) {
      console.log('⚠️  ACTION REQUIRED: Some users are missing schoolId');
      console.log('   Run update scripts or manually assign schoolId to these users');
    }
    
    if (!hasAnnouncementCollection || announcementsCount === 0) {
      console.log('⚠️  ACTION REQUIRED: Create test announcements via School Admin dashboard');
    }
    
    if (parentsWithStudents.length === 0) {
      console.log('⚠️  ACTION REQUIRED: Link students to parents via School Admin dashboard');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Verification complete. MongoDB connection closed.');
  }
}

// Run verification
verifySetup();
