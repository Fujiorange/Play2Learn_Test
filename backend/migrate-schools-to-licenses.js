// Migration script to help update existing schools to use the new license system
// This script should be run after creating licenses using seed-licenses.js

const mongoose = require('mongoose');
require('dotenv').config();

const School = require('./models/School');
const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function migrateLicenses() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all licenses
    const licenses = await License.find({});
    if (licenses.length === 0) {
      console.log('❌ No licenses found! Please run seed-licenses.js first.');
      process.exit(1);
    }

    console.log(`Found ${licenses.length} licenses:`);
    licenses.forEach(l => {
      console.log(`  - ${l.name} (${l.type})`);
    });
    console.log('');

    // Get all schools
    const schools = await School.find({});
    console.log(`Found ${schools.length} schools to migrate\n`);

    if (schools.length === 0) {
      console.log('✅ No schools to migrate.');
      process.exit(0);
    }

    let migrated = 0;
    let skipped = 0;

    for (const school of schools) {
      // If school already has a valid licenseId, skip it
      if (school.licenseId) {
        console.log(`⏩ Skipping ${school.organization_name} - already has licenseId`);
        skipped++;
        continue;
      }

      // Assign a default license (Free Trial)
      const freeLicense = licenses.find(l => l.type === 'free');
      if (!freeLicense) {
        console.log(`⚠️  Warning: No free license found, skipping ${school.organization_name}`);
        skipped++;
        continue;
      }

      school.licenseId = freeLicense._id;
      await school.save();
      console.log(`✅ Migrated ${school.organization_name} -> ${freeLicense.name}`);
      migrated++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏩ Skipped: ${skipped}`);
    console.log(`   📝 Total: ${schools.length}\n`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  migrateLicenses();
}

module.exports = migrateLicenses;
