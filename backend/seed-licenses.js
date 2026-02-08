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
    description: '30-day free trial with basic features - perfect for testing the platform'
  },
  {
    name: 'Basic Plan',
    type: 'paid',
    priceMonthly: 29.99,
    priceYearly: 299.99,
    maxTeachers: 5,
    maxStudents: 50,
    maxClasses: 10,
    description: 'Perfect for small schools and learning centers'
  },
  {
    name: 'Professional Plan',
    type: 'paid',
    priceMonthly: 99.99,
    priceYearly: 999.99,
    maxTeachers: 20,
    maxStudents: 200,
    maxClasses: 50,
    description: 'Ideal for medium-sized educational institutions'
  },
  {
    name: 'Enterprise Plan',
    type: 'paid',
    priceMonthly: 299.99,
    priceYearly: 2999.99,
    maxTeachers: -1, // -1 means unlimited
    maxStudents: -1,
    maxClasses: -1,
    description: 'Unlimited access for large educational organizations'
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
