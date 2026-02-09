// backend/services/emailService.js
const nodemailer = require('nodemailer');

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
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Go to Login Page</a>
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ Student credentials sent to parent: ${parentEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parentEmail}:`, error);
    return { success: false, error: error.message };
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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login Now</a>
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${teacher.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${teacher.email}:`, error);
    return { success: false, error: error.message };
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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">View Progress Now</a>
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${parent.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parent.email}:`, error);
    return { success: false, error: error.message };
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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Dashboard</a>
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ School admin welcome email sent to ${admin.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${admin.email}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTeacherWelcomeEmail,
  sendParentWelcomeEmail,
  sendStudentCredentialsToParent,
  sendSchoolAdminWelcomeEmail,
};