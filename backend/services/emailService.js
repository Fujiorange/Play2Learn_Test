// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Log email configuration (without sensitive data) for debugging
console.log('📧 Email Configuration:');
console.log(`   HOST: ${process.env.EMAIL_HOST || '❌ NOT SET'}`);
console.log(`   PORT: ${process.env.EMAIL_PORT || '❌ NOT SET'}`);
console.log(`   SECURE: ${process.env.EMAIL_SECURE || '❌ NOT SET'}`);
console.log(`   USER: ${process.env.EMAIL_USER || '❌ NOT SET'}`);
console.log(`   PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`   FROM: ${process.env.EMAIL_FROM || '❌ NOT SET'}`);

// Check if all required environment variables are set
const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ CRITICAL: Missing email environment variables:', missingVars.join(', '));
  console.error('   Email functionality will NOT work until these are set in Render environment.');
  console.error('   See EMAIL_SETUP_GUIDE.md for configuration instructions.');
}

// Validate EMAIL_FROM format
if (process.env.EMAIL_FROM) {
  const emailFrom = process.env.EMAIL_FROM;
  // EMAIL_FROM should contain an email address in angle brackets or just be an email
  // Valid formats: "Name <email@domain.com>" or "email@domain.com"
  const hasAngleBrackets = emailFrom.includes('<') && emailFrom.includes('>');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const hasEmail = emailRegex.test(emailFrom);
  
  if (!hasEmail) {
    console.error('❌ CRITICAL: EMAIL_FROM is invalid - missing email address');
    console.error(`   Current value: "${emailFrom}"`);
    console.error('   EMAIL_FROM must contain a valid email address.');
    console.error('   Correct formats:');
    console.error('   - "Play2Learn <your-email@gmail.com>"');
    console.error('   - "your-email@gmail.com"');
    console.error('   Please update EMAIL_FROM in Render environment variables.');
  } else if (hasAngleBrackets) {
    // Extract email from angle brackets to validate
    const emailMatch = emailFrom.match(/<([^>]+)>/);
    if (emailMatch && emailMatch[1]) {
      console.log(`✅ EMAIL_FROM format validated: ${emailFrom}`);
    } else {
      console.error('❌ WARNING: EMAIL_FROM has angle brackets but email is malformed');
      console.error(`   Current value: "${emailFrom}"`);
      console.error('   Expected format: "Display Name <email@domain.com>"');
    }
  } else {
    console.log(`✅ EMAIL_FROM format validated: ${emailFrom}`);
  }
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service SMTP connection failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   This means emails CANNOT be sent.');
    console.error('   Common causes:');
    console.error('   - Wrong EMAIL_HOST or EMAIL_PORT');
    console.error('   - Invalid EMAIL_USER or EMAIL_PASSWORD');
    console.error('   - For Gmail: Must use App Password, not regular password');
    console.error('   - For SendGrid: EMAIL_USER must be "apikey"');
    console.error('   See EMAIL_SETUP_GUIDE.md for troubleshooting.');
  } else {
    console.log('✅ Email service ready - SMTP connection verified');
    console.log(`   Emails will be sent from: ${process.env.EMAIL_FROM}`);
  }
});

// Send student credentials to parent's email
async function sendStudentCredentialsToParent(student, tempPassword, parentEmail, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: parentEmail,
    subject: `${student.name}'s Play2Learn Account Created 🎮`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .login-card { background: white; border: 2px dashed #F59E0B; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Student Account Ready! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear Parent,</p>
            
            <p>Your child <strong>${student.name}</strong> can now access Play2Learn at <strong>${schoolName}</strong>!</p>
            
            <div class="login-card">
              <h3>🎮 Student Login Card</h3>
              <p><strong>Name:</strong> ${student.name}</p>
              <p><strong>Class:</strong> ${student.class || 'N/A'}</p>
              <hr style="margin: 15px 0;">
              <p><strong>Email:</strong> ${student.email}</p>
              <p><strong>Password:</strong> ${tempPassword}</p>
            </div>
            
            <p><strong>⚠️ Please help your child:</strong></p>
            <ol>
              <li>Login using the credentials above</li>
              <li>Keep these credentials safe</li>
              <li>Contact the teacher if they face any issues</li>
            </ol>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'https://play2learn-test.onrender.com'}/login" class="button">Go to Login Page</a>
            </center>
          </div>
          <div class="footer">
            <p>Questions? Contact ${schoolName} School Admin<br>
            This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Student credentials sent to parent: ${parentEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parentEmail}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}`);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  CONNECTION FAILED - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⚠️  TIMEOUT - SMTP server not responding');
    } else if (error.message && error.message.includes('invalid address')) {
      console.error('   ⚠️  INVALID EMAIL ADDRESS - Check EMAIL_FROM format');
      console.error('   EMAIL_FROM must be: "Display Name <email@domain.com>" or "email@domain.com"');
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
}

// Send welcome email to teacher
async function sendTeacherWelcomeEmail(teacher, tempPassword, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: teacher.email,
    subject: 'Welcome to Play2Learn! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Play2Learn!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${teacher.name}</strong>,</p>
            
            <p>Your Play2Learn teacher account for <strong>${schoolName}</strong> has been created successfully!</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${teacher.email}</p>
              <p><strong>🔑 Password:</strong> ${tempPassword}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'https://play2learn-test.onrender.com'}/login" class="button">Login Now</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${teacher.email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${teacher.email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  CONNECTION FAILED - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.message && error.message.includes('invalid address')) {
      console.error('   ⚠️  INVALID EMAIL ADDRESS - Check EMAIL_FROM format');
      console.error('   EMAIL_FROM must be: "Display Name <email@domain.com>" or "email@domain.com"');
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
}

// Send welcome email to parent
async function sendParentWelcomeEmail(parent, tempPassword, studentName, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: parent.email,
    subject: `Track ${studentName}'s Learning Progress 📊`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Play2Learn!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${parent.name}</strong>,</p>
            
            <p>Your Play2Learn parent account has been created! You can now monitor <strong>${studentName}'s</strong> learning journey at <strong>${schoolName}</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${parent.email}</p>
              <p><strong>🔑 Password:</strong> ${tempPassword}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'https://play2learn-test.onrender.com'}/login" class="button">View Progress Now</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${parent.email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parent.email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  CONNECTION FAILED - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.message && error.message.includes('invalid address')) {
      console.error('   ⚠️  INVALID EMAIL ADDRESS - Check EMAIL_FROM format');
      console.error('   EMAIL_FROM must be: "Display Name <email@domain.com>" or "email@domain.com"');
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
}

// Send welcome email to school admin
async function sendSchoolAdminWelcomeEmail(admin, tempPassword, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: admin.email,
    subject: 'School Admin Account Created - Play2Learn 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #7C3AED; margin: 20px 0; }
          .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School Admin Account Created!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${admin.name}</strong>,</p>
            
            <p>Your School Admin account for <strong>${schoolName}</strong> has been created successfully!</p>
            
            <p>As a school administrator, you can:</p>
            <ul>
              <li>Create and manage teacher accounts</li>
              <li>Create and manage student accounts</li>
              <li>Monitor school performance and statistics</li>
              <li>Manage classes and assignments</li>
            </ul>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${admin.email}</p>
              <p><strong>🔑 Temporary Password:</strong> ${tempPassword}</p>
              <p style="color: #EF4444; margin-top: 10px;"><strong>⚠️ Important:</strong> Please change your password after first login.</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'https://play2learn-test.onrender.com'}/login" class="button">Login to Dashboard</a>
            </center>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              Note: You are limited to the number of teachers and students based on your school's license plan.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ School admin welcome email sent to ${admin.email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${admin.email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  CONNECTION FAILED - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.message && error.message.includes('invalid address')) {
      console.error('   ⚠️  INVALID EMAIL ADDRESS - Check EMAIL_FROM format');
      console.error('   EMAIL_FROM must be: "Display Name <email@domain.com>" or "email@domain.com"');
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
}

// Send email verification PIN
async function sendVerificationPIN(email, pin, institutionName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Play2Learn Registration 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .pin-box { background: white; border: 3px solid #7C3AED; padding: 30px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .pin { font-size: 48px; font-weight: bold; color: #7C3AED; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to Play2Learn!</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            
            <p>Thank you for registering <strong>${institutionName}</strong> with Play2Learn!</p>
            
            <p>To complete your registration, please verify your email address using the PIN below:</p>
            
            <div class="pin-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification PIN</p>
              <div class="pin">${pin}</div>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⏰ Important:</strong> This PIN will expire in <strong>15 minutes</strong>.</p>
            </div>
            
            <p>If you didn't request this registration, you can safely ignore this email.</p>
            
            <p style="margin-top: 30px;">
              Need help? Contact our support team.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.<br>
            Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification PIN sent to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send verification PIN to ${email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  CONNECTION FAILED - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.message && error.message.includes('invalid address')) {
      console.error('   ⚠️  INVALID EMAIL ADDRESS - Check EMAIL_FROM format');
      console.error('   EMAIL_FROM must be: "Display Name <email@domain.com>" or "email@domain.com"');
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
}

module.exports = {
  sendTeacherWelcomeEmail,
  sendParentWelcomeEmail,
  sendStudentCredentialsToParent,
  sendSchoolAdminWelcomeEmail,
  sendVerificationPIN,
};