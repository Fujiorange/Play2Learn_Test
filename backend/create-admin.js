/**
 * Script to create a P2L Admin account directly in the database
 * Usage: node create-admin.js <email> <password>
 * Example: node create-admin.js admin@play2learn.com SecurePass123!
 */

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not available, environment variables should be set directly
}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node create-admin.js <email> <password>');
  console.log('Example: node create-admin.js admin@play2learn.com SecurePass123!\n');
  process.exit(1);
}

const [email, password] = args;

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  console.log('   Please provide a valid email address\n');
  process.exit(1);
}

// Validate password length
if (password.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long\n');
  process.exit(1);
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error('\n❌ Error: Email already registered');
      console.log('   User found with email:', existingUser.email);
      console.log('   Role:', existingUser.role);
      console.log('   Created:', existingUser.createdAt);
      console.log('\nTo delete this user, run:');
      console.log(`   db.users.deleteOne({ email: "${email.toLowerCase()}" })`);
      console.log('\nOr use a different email address.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin name from email
    const adminName = email.split('@')[0];

    // Create new admin user
    console.log('👤 Creating P2L Admin account...');
    const newAdmin = new User({
      name: adminName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'p2ladmin',
      emailVerified: true,
      accountActive: true,
      createdBy: 'create-admin-script',
    });

    await newAdmin.save();

    console.log('\n✅ SUCCESS! P2L Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   ID:', newAdmin._id);
    console.log('   Name:', newAdmin.name);
    console.log('   Email:', newAdmin.email);
    console.log('   Role:', newAdmin.role);
    console.log('   Email Verified:', newAdmin.emailVerified);
    console.log('   Account Active:', newAdmin.accountActive);
    console.log('   Created At:', newAdmin.createdAt);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email:', newAdmin.email);
    console.log('   Password:', '(the password you provided)');
    console.log('\n🌐 You can now log in at:');
    console.log('   https://play2learn-test.onrender.com/login');
    console.log('   or http://localhost:3000/login (if running locally)\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin account:', error.message);
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      console.log('\n💡 Tips:');
      console.log('   - Check that MONGODB_URI is set correctly in .env file');
      console.log('   - Verify MongoDB service is running');
      console.log('   - Check network connectivity to MongoDB');
      console.log('   - For MongoDB Atlas, verify IP whitelist settings\n');
    } else if (error.name === 'ValidationError') {
      console.log('\n💡 Validation error details:');
      Object.keys(error.errors).forEach(key => {
        console.log(`   - ${key}: ${error.errors[key].message}`);
      });
      console.log();
    } else {
      console.error('Full error:', error);
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();
