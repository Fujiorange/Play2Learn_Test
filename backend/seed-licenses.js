// backend/seed-licenses.js - Seed default license types
const mongoose = require('mongoose');
require('dotenv').config();

const License = require('./models/License');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

const licenses = [
  {
    name: 'Trial',
    type: 'trial',
    priceMonthly: 0,
    priceYearly: 0,
    maxTeachers: 1,
    maxStudents: 5,
    maxClasses: 1,
    description: '30-day free trial with basic features - perfect for testing the platform',
    isActive: true
  },
  {
    name: 'Starter',
    type: 'starter',
    priceMonthly: 250,
    priceYearly: 2500,
    maxTeachers: 50,
    maxStudents: 500,
    maxClasses: 10,
    description: 'Perfect for small schools and institutions',
    isActive: true
  },
  {
    name: 'Professional',
    type: 'professional',
    priceMonthly: 500,
    priceYearly: 5000,
    maxTeachers: 100,
    maxStudents: 1000,
    maxClasses: 25,
    description: 'Ideal for medium-sized schools and districts',
    isActive: true
  },
  {
    name: 'Enterprise',
    type: 'enterprise',
    priceMonthly: 1000,
    priceYearly: 10000,
    maxTeachers: 250,
    maxStudents: 2500,
    maxClasses: 50,
    description: 'For large institutions and school networks',
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
