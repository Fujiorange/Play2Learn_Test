// backend/seed-licenses.js - Seed default license types
const mongoose = require('mongoose');
require('dotenv').config();

const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

const licenses = [
  {
    name: 'Free Trial',
    type: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    maxTeachers: 1,
    maxStudents: 5,
    maxClasses: 1,
    description: 'Free trial with basic features - perfect for testing the platform',
    isActive: true
  },
  {
    name: 'Basic Plan',
    type: 'paid',
    priceMonthly: 250,
    priceYearly: 2500,
    maxTeachers: 50,
    maxStudents: 500,
    maxClasses: 100,
    description: 'Perfect for small to medium schools',
    isActive: true
  },
  {
    name: 'Standard Plan',
    type: 'paid',
    priceMonthly: 500,
    priceYearly: 5000,
    maxTeachers: 100,
    maxStudents: 1000,
    maxClasses: 200,
    description: 'Ideal for growing educational institutions',
    isActive: true
  },
  {
    name: 'Premium Plan',
    type: 'paid',
    priceMonthly: 1000,
    priceYearly: 10000,
    maxTeachers: 250,
    maxStudents: 2500,
    maxClasses: 500,
    description: 'Unlimited features for large organizations',
    isActive: true
  }
];

async function seedLicenses() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing licenses...');
    await License.deleteMany({});
    console.log('✅ Cleared existing licenses');

    console.log('📝 Creating license types...');
    for (const license of licenses) {
      const newLicense = await License.create(license);
      console.log(`   ✓ Created ${license.name} license`);
    }

    console.log('\n✅ Successfully seeded all licenses!');
    console.log('\nLicense Summary:');
    const allLicenses = await License.find({});
    allLicenses.forEach(l => {
      const teachersText = l.maxTeachers === -1 ? 'Unlimited' : l.maxTeachers;
      const studentsText = l.maxStudents === -1 ? 'Unlimited' : l.maxStudents;
      const classesText = l.maxClasses === -1 ? 'Unlimited' : l.maxClasses;
      console.log(`   - ${l.name}: $${l.priceMonthly}/month, ${teachersText} teachers, ${studentsText} students, ${classesText} classes`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding licenses:', error);
    process.exit(1);
  }
}

seedLicenses();
