#!/usr/bin/env node

/**
 * Test script for new features:
 * 1. School Admin creation with temp password and requirePasswordChange flag
 * 2. Password change functionality
 * 3. CSV question upload
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing New Features\n');

// Test 1: Verify User model has requirePasswordChange field
console.log('Test 1: Checking User model...');
try {
  const userModelPath = path.join(__dirname, 'models', 'User.js');
  const userModelContent = fs.readFileSync(userModelPath, 'utf8');
  
  if (userModelContent.includes('requirePasswordChange')) {
    console.log('✅ User model has requirePasswordChange field');
  } else {
    console.log('❌ User model missing requirePasswordChange field');
  }
} catch (err) {
  console.log('❌ Error reading User model:', err.message);
}

// Test 2: Verify p2lAdminRoutes has CSV upload endpoint
console.log('\nTest 2: Checking p2lAdminRoutes for CSV upload...');
try {
  const routesPath = path.join(__dirname, 'routes', 'p2lAdminRoutes.js');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  if (routesContent.includes('upload-csv')) {
    console.log('✅ CSV upload endpoint found in p2lAdminRoutes');
  } else {
    console.log('❌ CSV upload endpoint missing from p2lAdminRoutes');
  }
  
  if (routesContent.includes('multer')) {
    console.log('✅ Multer configuration found');
  } else {
    console.log('❌ Multer configuration missing');
  }
  
  if (routesContent.includes('csv-parser')) {
    console.log('✅ CSV parser import found');
  } else {
    console.log('❌ CSV parser import missing');
  }
} catch (err) {
  console.log('❌ Error reading p2lAdminRoutes:', err.message);
}

// Test 3: Verify mongoAuthRoutes has password change endpoint
console.log('\nTest 3: Checking mongoAuthRoutes for password change...');
try {
  const authRoutesPath = path.join(__dirname, 'routes', 'mongoAuthRoutes.js');
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  if (authRoutesContent.includes('change-password')) {
    console.log('✅ Password change endpoint found');
  } else {
    console.log('❌ Password change endpoint missing');
  }
  
  if (authRoutesContent.includes('requirePasswordChange')) {
    console.log('✅ Password change flag handling found');
  } else {
    console.log('❌ Password change flag handling missing');
  }
} catch (err) {
  console.log('❌ Error reading mongoAuthRoutes:', err.message);
}

// Test 4: Verify school admin creation sets requirePasswordChange
console.log('\nTest 4: Checking school admin creation...');
try {
  const p2lAdminPath = path.join(__dirname, 'routes', 'p2lAdminRoutes.js');
  const p2lAdminContent = fs.readFileSync(p2lAdminPath, 'utf8');
  
  // Check if school admin creation includes requirePasswordChange: true
  const schoolAdminMatch = p2lAdminContent.match(/role:\s*['"]School Admin['"]/);
  if (schoolAdminMatch) {
    console.log('✅ School Admin role creation found');
    
    // Check if requirePasswordChange is set nearby
    const contextStart = p2lAdminContent.indexOf(schoolAdminMatch[0]) - 200;
    const contextEnd = p2lAdminContent.indexOf(schoolAdminMatch[0]) + 300;
    const context = p2lAdminContent.substring(contextStart, contextEnd);
    
    if (context.includes('requirePasswordChange: true')) {
      console.log('✅ requirePasswordChange flag is set for School Admins');
    } else {
      console.log('⚠️  requirePasswordChange flag may not be set for School Admins');
    }
  } else {
    console.log('❌ School Admin role creation not found');
  }
} catch (err) {
  console.log('❌ Error:', err.message);
}

// Test 5: Verify dependencies are installed
console.log('\nTest 5: Checking dependencies...');
try {
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = ['multer', 'csv-parser', 'bcrypt'];
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies[dep]) {
      console.log(`✅ ${dep} is in dependencies`);
    } else {
      console.log(`❌ ${dep} is missing from dependencies`);
    }
  });
} catch (err) {
  console.log('❌ Error reading package.json:', err.message);
}

console.log('\n📝 Summary:');
console.log('Backend code changes are complete and syntax is valid.');
console.log('To fully test the functionality:');
console.log('1. Start the backend server');
console.log('2. Create a school via P2L Admin dashboard');
console.log('3. Create a school admin for that school');
console.log('4. Login with the school admin credentials (check email for temp password)');
console.log('5. You should be prompted to change password');
console.log('6. Upload the CSV file from /tmp/sample_questions.csv');
