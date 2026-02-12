// backend/routes/emailDiagnosticRoutes.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Simple diagnostic endpoint to test email configuration
// Only accessible when NODE_ENV is not production for security
router.get('/test-email-config', async (req, res) => {
  try {
    // Check if all environment variables are set
    const config = {
      EMAIL_HOST: process.env.EMAIL_HOST || null,
      EMAIL_PORT: process.env.EMAIL_PORT || null,
      EMAIL_SECURE: process.env.EMAIL_SECURE || null,
      EMAIL_USER: process.env.EMAIL_USER || null,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET (hidden)' : null,
      EMAIL_FROM: process.env.EMAIL_FROM || null,
    };

    const missingVars = Object.entries(config)
      .filter(([key, value]) => !value || value === null)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return res.json({
        success: false,
        message: 'Email configuration incomplete',
        config: config,
        missingVariables: missingVars,
        help: 'Add missing variables in Render Dashboard → Environment. See EMAIL_SETUP_GUIDE.md'
      });
    }

    // Try to create transporter
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Failed to create email transporter',
        error: error.message,
        config: config
      });
    }

    // Verify SMTP connection
    try {
      await transporter.verify();
      return res.json({
        success: true,
        message: 'Email configuration is valid and SMTP connection successful!',
        config: config,
        nextSteps: [
          'Try sending a test email to a user',
          'Check recipient\'s spam folder if email not received',
          'Monitor Render logs for detailed email sending information'
        ]
      });
    } catch (error) {
      let helpMessage = 'SMTP connection failed. ';
      
      if (error.code === 'EAUTH') {
        helpMessage += 'Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD. ';
        helpMessage += 'For Gmail: Use App Password, not regular password. ';
        helpMessage += 'For SendGrid: EMAIL_USER must be "apikey".';
      } else if (error.code === 'ECONNECTION' || error.code === 'ENOTFOUND') {
        helpMessage += 'Cannot connect to SMTP server. Check EMAIL_HOST and EMAIL_PORT. ';
        helpMessage += 'Common values: smtp.gmail.com:587, smtp.sendgrid.net:587';
      } else if (error.code === 'ETIMEDOUT') {
        helpMessage += 'Connection timeout. SMTP server not responding. Check EMAIL_HOST.';
      } else {
        helpMessage += 'See error details below.';
      }

      return res.json({
        success: false,
        message: 'SMTP connection failed',
        error: error.message,
        errorCode: error.code,
        config: config,
        help: helpMessage,
        troubleshooting: [
          'Check EMAIL_SETUP_GUIDE.md for your email provider',
          'Verify all environment variables in Render Dashboard',
          'For Gmail: Make sure you generated an App Password',
          'For SendGrid: Verify your API key and sender email'
        ]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Diagnostic test failed',
      error: error.message
    });
  }
});

// Send a test email to verify email sending works
// Query param: ?to=recipient@example.com
router.get('/send-test-email', async (req, res) => {
  try {
    const recipient = req.query.to;
    
    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Missing "to" query parameter. Example: /send-test-email?to=your-email@example.com'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Check configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.json({
        success: false,
        message: 'Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in Render environment.'
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject: 'Test Email from Play2Learn ✅',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { background: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 8px; }
            .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Test Successful!</h1>
            </div>
            <div class="content">
              <div class="success">
                <p><strong>Congratulations!</strong> Your Play2Learn email service is working correctly.</p>
              </div>
              <p>This test email confirms that:</p>
              <ul>
                <li>✅ SMTP configuration is correct</li>
                <li>✅ Authentication is successful</li>
                <li>✅ Emails can be delivered</li>
              </ul>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
              <p><strong>SMTP Server:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                If you're seeing this email, you can now send credentials to users!<br>
                <strong>Note:</strong> Check your spam folder if emails don't appear in inbox.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      messageId: info.messageId,
      response: info.response,
      note: 'Check the recipient\'s inbox (and spam folder). If not received within 5 minutes, there may be a deliverability issue.',
      troubleshooting: 'If email goes to spam, consider using SendGrid or Mailgun for better deliverability.'
    });
  } catch (error) {
    console.error('Test email failed:', error);
    
    let helpMessage = '';
    if (error.code === 'EAUTH') {
      helpMessage = 'Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD. For Gmail: use App Password.';
    } else if (error.code === 'ECONNECTION') {
      helpMessage = 'Cannot connect to SMTP server. Check EMAIL_HOST and EMAIL_PORT.';
    }
    
    res.json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      errorCode: error.code,
      help: helpMessage || 'See EMAIL_SETUP_GUIDE.md for troubleshooting.'
    });
  }
});

module.exports = router;
