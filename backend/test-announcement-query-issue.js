// Test script to verify MongoDB announcement query behavior
require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const User = require('./models/User');

async function testAnnouncementQuery() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // First, let's see what announcements exist
    console.log('📋 Checking existing announcements...');
    const allAnnouncements = await Announcement.find({}).lean();
    console.log(`Total announcements in database: ${allAnnouncements.length}`);
    
    if (allAnnouncements.length > 0) {
      console.log('\nSample announcement:');
      console.log(JSON.stringify(allAnnouncements[0], null, 2));
    }

    // Get a student user
    console.log('\n👤 Finding a student user...');
    const student = await User.findOne({ role: 'student' }).select('_id schoolId email');
    if (!student) {
      console.log('❌ No student found in database');
      await mongoose.connection.close();
      process.exit(1);
    }
    console.log(`Found student: ${student.email}`);
    console.log(`Student schoolId: ${student.schoolId}`);

    if (!student.schoolId) {
      console.log('⚠️ Student has no schoolId - this is the problem!');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Test the query that the endpoint uses
    console.log('\n🔍 Testing the current query logic...');
    const now = new Date();
    const currentFilter = {
      schoolId: student.schoolId,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null }
      ],
      audience: { $in: ['all', 'student', 'students'] }
    };

    console.log('Current filter:', JSON.stringify(currentFilter, null, 2));
    const currentResults = await Announcement.find(currentFilter).lean();
    console.log(`✅ Current query returned ${currentResults.length} announcements`);

    // Test alternative query
    console.log('\n🔍 Testing alternative query with $exists...');
    const alternativeFilter = {
      schoolId: student.schoolId,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ],
      audience: { $in: ['all', 'student', 'students'] }
    };

    const alternativeResults = await Announcement.find(alternativeFilter).lean();
    console.log(`✅ Alternative query returned ${alternativeResults.length} announcements`);

    // Show announcements for this school
    console.log('\n📢 All announcements for this school:');
    const schoolAnnouncements = await Announcement.find({ schoolId: student.schoolId }).lean();
    console.log(`Total for school: ${schoolAnnouncements.length}`);
    
    if (schoolAnnouncements.length > 0) {
      schoolAnnouncements.forEach((ann, i) => {
        console.log(`\n${i + 1}. "${ann.title}"`);
        console.log(`   - audience: ${ann.audience}`);
        console.log(`   - expiresAt: ${ann.expiresAt}`);
        console.log(`   - pinned: ${ann.pinned}`);
        console.log(`   - createdAt: ${ann.createdAt}`);
      });
    }

    console.log('\n✅ Test completed successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testAnnouncementQuery();
