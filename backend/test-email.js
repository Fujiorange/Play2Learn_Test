// backend/test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log('🔍 Testing Outlook SMTP connection...');
    console.log(`Email: ${process.env.EMAIL_USER}`);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'your-personal-email@gmail.com', // Replace with YOUR email to test
      subject: 'Play2Learn Email Test 🎓',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #10b981;">Email Service Working! ✅</h2>
          <p>If you're seeing this email, your Outlook SMTP is configured correctly!</p>
          <p><strong>Sent from:</strong> ${process.env.EMAIL_USER}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log('\n📧 Check your inbox (and spam folder) for the test email.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Check:');
      console.error('   1. Email address is correct');
      console.error('   2. Password is correct');
      console.error('   3. Less secure app access is enabled (if required)');
    }
  }
}

testEmail();