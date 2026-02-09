// backend/init-trial-license.js - Initialize Free Trial license if it doesn't exist
const mongoose = require('mongoose');
require('dotenv').config();

const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

const freeTrialLicense = {
  name: 'Free Trial',
  type: 'free',
  priceMonthly: 0,
  priceYearly: 0,
  maxTeachers: 1,
  maxStudents: 5,
  maxClasses: 1,
  description: 'Free trial institude',
  isActive: true,
  isDeletable: false
};

async function initTrialLicense() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if Free Trial license already exists
    const existingTrial = await License.findOne({ name: 'Free Trial' });
    
    if (existingTrial) {
      console.log('ℹ️  Free Trial license already exists');
      
      // Update it to ensure it has the correct properties and is not deletable
      existingTrial.type = freeTrialLicense.type;
      existingTrial.priceMonthly = freeTrialLicense.priceMonthly;
      existingTrial.priceYearly = freeTrialLicense.priceYearly;
      existingTrial.maxTeachers = freeTrialLicense.maxTeachers;
      existingTrial.maxStudents = freeTrialLicense.maxStudents;
      existingTrial.maxClasses = freeTrialLicense.maxClasses;
      existingTrial.description = freeTrialLicense.description;
      existingTrial.isActive = freeTrialLicense.isActive;
      existingTrial.isDeletable = freeTrialLicense.isDeletable;
      
      await existingTrial.save();
      console.log('✅ Updated existing Free Trial license with correct properties');
    } else {
      // Create new Free Trial license
      const newLicense = await License.create(freeTrialLicense);
      console.log('✅ Created Free Trial license successfully');
      console.log(`   - Name: ${newLicense.name}`);
      console.log(`   - Type: ${newLicense.type}`);
      console.log(`   - Max Teachers: ${newLicense.maxTeachers}`);
      console.log(`   - Max Students: ${newLicense.maxStudents}`);
      console.log(`   - Max Classes: ${newLicense.maxClasses}`);
      console.log(`   - Deletable: ${newLicense.isDeletable}`);
    }

    console.log('\n✅ Free Trial license is ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing Free Trial license:', error);
    process.exit(1);
  }
}

initTrialLicense();
