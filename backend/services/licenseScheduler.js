// License Scheduler Service
// Handles automatic conversion of expired cancelled licenses to free trial
const cron = require('node-cron');
const School = require('../models/School');
const License = require('../models/License');
const User = require('../models/User');
const Class = require('../models/Class');

/**
 * Check and convert expired cancelled licenses to free trial
 * This runs daily at midnight to check for expired licenses
 */
async function checkExpiredLicenses() {
  try {
    console.log('🔍 Checking for expired cancelled licenses...');
    
    const now = new Date();
    
    // Find all schools with:
    // 1. subscriptionStatus = 'cancelled'
    // 2. licenseExpiresAt is in the past
    // 3. License type is still 'paid' (not yet converted)
    const expiredSchools = await School.find({
      subscriptionStatus: 'cancelled',
      licenseExpiresAt: { $lte: now }
    }).populate('licenseId');
    
    if (expiredSchools.length === 0) {
      console.log('✅ No expired cancelled licenses found');
      return;
    }
    
    console.log(`📋 Found ${expiredSchools.length} expired cancelled licenses to process`);
    
    // Find the free trial license
    const freeTrialLicense = await License.findOne({ type: 'free', isActive: true });
    
    if (!freeTrialLicense) {
      console.error('❌ ERROR: No active free trial license found in the database!');
      console.error('   Please create a free trial license before running this scheduler.');
      return;
    }
    
    console.log(`✅ Free trial license found: ${freeTrialLicense.name}`);
    console.log(`   Limits: ${freeTrialLicense.maxTeachers} teachers, ${freeTrialLicense.maxStudents} students, ${freeTrialLicense.maxClasses} classes`);
    
    // Process each expired school
    for (const school of expiredSchools) {
      try {
        console.log(`\n📦 Processing school: ${school.organization_name} (ID: ${school._id})`);
        console.log(`   Current license: ${school.licenseId.name} (${school.licenseId.type})`);
        console.log(`   Expired at: ${school.licenseExpiresAt}`);
        
        // Convert to free trial license
        school.licenseId = freeTrialLicense._id;
        school.subscriptionStatus = 'expired';
        school.licenseExpiresAt = null; // Free trial has no expiration
        school.billingCycle = null;
        school.nextBillingDate = null;
        school.autoRenew = false;
        
        await school.save();
        console.log(`   ✅ Converted to free trial license`);
        
        // Handle capacity limits
        // Free trial: 1 class, 1 teacher, 5 students
        await handleCapacityDowngrade(school._id, {
          maxClasses: freeTrialLicense.maxClasses,
          maxTeachers: freeTrialLicense.maxTeachers,
          maxStudents: freeTrialLicense.maxStudents
        });
        
        console.log(`   ✅ School ${school.organization_name} successfully downgraded to free trial`);
      } catch (schoolError) {
        console.error(`   ❌ Error processing school ${school.organization_name}:`, schoolError.message);
      }
    }
    
    console.log(`\n✅ Expired license check completed. Processed ${expiredSchools.length} schools.`);
  } catch (error) {
    console.error('❌ Error in checkExpiredLicenses:', error);
  }
}

/**
 * Handle capacity downgrade when converting to free trial
 * @param {String} schoolId - School ID
 * @param {Object} limits - New limits { maxClasses, maxTeachers, maxStudents }
 */
async function handleCapacityDowngrade(schoolId, limits) {
  try {
    console.log(`   🔧 Handling capacity downgrade for school ${schoolId}`);
    
    // Get all classes for this school
    const classes = await Class.find({ school_id: schoolId });
    console.log(`   Found ${classes.length} classes`);
    
    // If more than maxClasses, keep only the first one and deactivate others
    if (classes.length > limits.maxClasses) {
      console.log(`   ⚠️  School has ${classes.length} classes, but free trial allows only ${limits.maxClasses}`);
      
      // Sort by creation date (keep oldest/first created)
      classes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first N classes, deactivate the rest
      const classesToKeep = classes.slice(0, limits.maxClasses);
      const classesToDeactivate = classes.slice(limits.maxClasses);
      
      console.log(`   Keeping ${classesToKeep.length} class(es): ${classesToKeep.map(c => c.className).join(', ')}`);
      
      // Deactivate extra classes by removing students from them
      // (We don't delete classes to preserve data)
      for (const cls of classesToDeactivate) {
        cls.students = [];
        await cls.save();
        console.log(`   ⚠️  Deactivated class: ${cls.className} (removed all students)`);
      }
    }
    
    // Get all teachers for this school
    const teachers = await User.find({ schoolId: schoolId, role: 'Teacher' });
    console.log(`   Found ${teachers.length} teachers`);
    
    // If more than maxTeachers, keep only the first one and deactivate others
    if (teachers.length > limits.maxTeachers) {
      console.log(`   ⚠️  School has ${teachers.length} teachers, but free trial allows only ${limits.maxTeachers}`);
      
      // Sort by creation date (keep oldest/first created)
      teachers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const teachersToKeep = teachers.slice(0, limits.maxTeachers);
      const teachersToDeactivate = teachers.slice(limits.maxTeachers);
      
      console.log(`   Keeping ${teachersToKeep.length} teacher(s): ${teachersToKeep.map(t => t.name).join(', ')}`);
      
      // Deactivate extra teachers by marking them as inactive
      // (We don't delete users to preserve data and allow reactivation if they upgrade)
      for (const teacher of teachersToDeactivate) {
        teacher.accountActive = false;
        await teacher.save();
        console.log(`   ⚠️  Deactivated teacher: ${teacher.name} (${teacher.email})`);
      }
    }
    
    // Get all students for this school
    const students = await User.find({ schoolId: schoolId, role: 'Student' });
    console.log(`   Found ${students.length} students`);
    
    // If more than maxStudents, keep only the first N and deactivate others
    if (students.length > limits.maxStudents) {
      console.log(`   ⚠️  School has ${students.length} students, but free trial allows only ${limits.maxStudents}`);
      
      // Sort by creation date (keep oldest/first created)
      students.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const studentsToKeep = students.slice(0, limits.maxStudents);
      const studentsToDeactivate = students.slice(limits.maxStudents);
      
      console.log(`   Keeping ${studentsToKeep.length} student(s)`);
      
      // Deactivate extra students by marking them as inactive
      for (const student of studentsToDeactivate) {
        student.accountActive = false;
        await student.save();
        console.log(`   ⚠️  Deactivated student: ${student.name} (${student.email})`);
      }
    }
    
    console.log(`   ✅ Capacity downgrade completed`);
  } catch (error) {
    console.error(`   ❌ Error in handleCapacityDowngrade:`, error);
    throw error;
  }
}

/**
 * Initialize the license scheduler
 * Runs daily at midnight (00:00)
 */
function initLicenseScheduler() {
  console.log('📅 Initializing license expiry scheduler...');
  
  // Schedule to run daily at midnight
  // Cron format: second minute hour day month weekday
  // '0 0 * * *' = every day at 00:00 (midnight)
  cron.schedule('0 0 * * *', () => {
    console.log('\n⏰ Running scheduled license expiry check at', new Date().toISOString());
    checkExpiredLicenses();
  });
  
  console.log('✅ License expiry scheduler initialized (runs daily at midnight)');
  
  // Run once on startup (after a short delay to ensure DB is connected)
  setTimeout(() => {
    console.log('\n🚀 Running initial license expiry check...');
    checkExpiredLicenses();
  }, 5000); // 5 second delay
}

module.exports = {
  initLicenseScheduler,
  checkExpiredLicenses // Export for manual testing
};
