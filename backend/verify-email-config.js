// backend/verify-email-config.js
// This script verifies your email configuration without sending emails
// Run with: node backend/verify-email-config.js

require('dotenv').config();

console.log('🔍 Email Configuration Verification\n');
console.log('='.repeat(50));

// Check if all required environment variables are set
const requiredVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_SECURE',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM'
];

let allPresent = true;
let hasIssues = false;

console.log('\n📋 Checking Environment Variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value && value.trim() !== '';
  
  if (isSet) {
    console.log(`✅ ${varName}: ${varName === 'EMAIL_PASSWORD' ? '***hidden***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
    hasIssues = true;
  }
});

console.log('\n' + '='.repeat(50));

// Additional validation
if (allPresent) {
  console.log('\n🔍 Additional Validation:\n');
  
  // Check EMAIL_PORT is a number
  const port = parseInt(process.env.EMAIL_PORT);
  if (isNaN(port)) {
    console.log('❌ EMAIL_PORT must be a number (587 or 465)');
    hasIssues = true;
  } else if (port !== 587 && port !== 465) {
    console.log(`⚠️  EMAIL_PORT is ${port} (common ports are 587 or 465)`);
  } else {
    console.log(`✅ EMAIL_PORT: ${port} is valid`);
  }
  
  // Check EMAIL_SECURE matches port
  const secure = process.env.EMAIL_SECURE === 'true';
  if (port === 587 && secure) {
    console.log('⚠️  EMAIL_SECURE is true, but port 587 typically uses false (TLS)');
  } else if (port === 465 && !secure) {
    console.log('⚠️  EMAIL_SECURE is false, but port 465 typically uses true (SSL)');
  } else {
    console.log(`✅ EMAIL_SECURE: ${secure} matches port ${port}`);
  }
  
  // Check EMAIL_USER format
  const emailUser = process.env.EMAIL_USER;
  if (emailUser === 'apikey') {
    console.log('✅ EMAIL_USER: apikey (SendGrid detected)');
    if (process.env.EMAIL_HOST !== 'smtp.sendgrid.net') {
      console.log('⚠️  EMAIL_HOST should be smtp.sendgrid.net for SendGrid');
      hasIssues = true;
    }
  } else if (emailUser && emailUser.includes('@')) {
    console.log(`✅ EMAIL_USER: ${emailUser} (looks like an email)`);
  } else if (emailUser) {
    console.log(`⚠️  EMAIL_USER: ${emailUser} (should be an email address or "apikey" for SendGrid)`);
  }
  
  // Check EMAIL_FROM format
  const emailFrom = process.env.EMAIL_FROM;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailRegex.test(emailFrom);
  
  if (!hasEmail) {
    console.log(`❌ EMAIL_FROM is invalid - missing email address`);
    console.log(`   Current value: "${emailFrom}"`);
    console.log(`   EMAIL_FROM must contain a valid email address`);
    console.log(`   Correct formats:`);
    console.log(`   - "Play2Learn <your-email@gmail.com>"`);
    console.log(`   - "your-email@gmail.com"`);
    hasIssues = true;
  } else if (emailFrom && emailFrom.includes('<') && emailFrom.includes('>')) {
    const emailMatch = emailFrom.match(/<([^>]+)>/);
    if (emailMatch && emailMatch[1]) {
      console.log(`✅ EMAIL_FROM: ${emailFrom} (correct format)`);
    } else {
      console.log(`❌ EMAIL_FROM has angle brackets but email is malformed`);
      console.log(`   Current value: "${emailFrom}"`);
      console.log(`   Expected format: "Display Name <email@domain.com>"`);
      hasIssues = true;
    }
  } else if (emailFrom) {
    console.log(`✅ EMAIL_FROM: ${emailFrom} (email address format)`);
  }
  
  // Check common SMTP hosts
  const host = process.env.EMAIL_HOST;
  const knownHosts = {
    'smtp.gmail.com': 'Gmail',
    'smtp.sendgrid.net': 'SendGrid',
    'smtp-mail.outlook.com': 'Outlook/Hotmail',
    'smtp.mailgun.org': 'Mailgun',
    'smtp.office365.com': 'Office 365'
  };
  
  if (knownHosts[host]) {
    console.log(`✅ EMAIL_HOST: ${host} (${knownHosts[host]} detected)`);
  } else if (host) {
    console.log(`ℹ️  EMAIL_HOST: ${host} (custom SMTP server)`);
  }
}

console.log('\n' + '='.repeat(50));

// Final summary
if (!allPresent) {
  console.log('\n❌ RESULT: Missing required environment variables\n');
  console.log('📝 Action Required:');
  console.log('   1. Check your .env file (for local) or Render environment variables');
  console.log('   2. See EMAIL_SETUP_GUIDE.md for setup instructions');
  console.log('   3. Run this script again after adding missing variables\n');
  process.exit(1);
} else if (hasIssues) {
  console.log('\n⚠️  RESULT: Configuration has issues (see warnings above)\n');
  console.log('📝 Action Recommended:');
  console.log('   1. Review warnings above and fix if needed');
  console.log('   2. See EMAIL_SETUP_GUIDE.md for correct configuration');
  console.log('   3. Test with: node backend/test-email.js\n');
  process.exit(0);
} else {
  console.log('\n✅ RESULT: Configuration looks good!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Test email sending: node backend/test-email.js');
  console.log('   2. Deploy to Render with these same settings');
  console.log('   3. Check Render logs for "✅ Email service ready"\n');
  process.exit(0);
}
