# Email Setup Guide for Play2Learn on Render

This guide will help you set up email functionality for your Play2Learn platform deployed on Render. You'll be able to send welcome emails and credentials to newly created teacher, student, and parent accounts.

> **🚨 Not receiving emails after setup?** See [EMAIL_TROUBLESHOOTING.md](EMAIL_TROUBLESHOOTING.md) for detailed troubleshooting steps and diagnostic tools.

## 📋 Overview

Your Play2Learn platform is already configured with email functionality using **Nodemailer**. You just need to configure the SMTP settings in your Render environment.

### Current Email Features
- ✅ Send welcome emails to Teachers
- ✅ Send welcome emails to Parents  
- ✅ Send student credentials to Parent's email
- ✅ Manual sending via: `/school-admin/users/pending-credentials`
- ✅ Bulk sending capabilities

---

## 🚀 Quick Start: Setting Up Email on Render

### Step 1: Choose an Email Service Provider

You need an SMTP email service. Here are the recommended options:

#### Option A: Gmail (Easiest for Testing)
- **Best for**: Testing and small deployments
- **Cost**: Free
- **Limit**: 500 emails/day
- **Setup time**: 5 minutes

#### Option B: SendGrid (Recommended for Production)
- **Best for**: Production use
- **Cost**: Free tier (100 emails/day), paid plans available
- **Limit**: 100+ emails/day (depending on plan)
- **Setup time**: 10 minutes
- **Website**: https://sendgrid.com

#### Option C: Mailgun
- **Best for**: High-volume production use
- **Cost**: Free tier (5,000 emails/month), paid plans available
- **Setup time**: 10 minutes
- **Website**: https://www.mailgun.com

#### Option D: Outlook/Hotmail
- **Best for**: If you have a Microsoft account
- **Cost**: Free
- **Limit**: 300 emails/day
- **Setup time**: 5 minutes

---

## 📧 Detailed Setup Instructions

### Using Gmail (Recommended for Getting Started)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification**
4. Follow the setup wizard

#### Step 2: Generate App Password
1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Type "Play2Learn Render" as the name
5. Click **Generate**
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
7. **Save this password** - you'll need it for Render

#### Step 3: Configure Render Environment Variables
1. Go to your Render Dashboard: https://dashboard.render.com
2. Select your **play2learn** web service
3. Click on **Environment** in the left sidebar
4. Add these environment variables by clicking **Add Environment Variable**:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcd efgh ijkl mnop` with your App Password (remove spaces when entering)
- Keep `EMAIL_SECURE=false` when using port 587
- The `EMAIL_FROM` format should be: `"Display Name <email@domain.com>"`

#### Step 4: Save and Deploy
1. Click **Save Changes** at the bottom
2. Render will automatically redeploy your app with the new settings
3. Wait for deployment to complete (usually 2-3 minutes)

---

### Using SendGrid (Recommended for Production)

#### Step 1: Create SendGrid Account
1. Sign up at: https://sendgrid.com/pricing/ (Free tier available)
2. Verify your email address
3. Complete the account setup

#### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click **Create API Key**
3. Name it "Play2Learn Render"
4. Select **Full Access** (or **Mail Send** if restricted access preferred)
5. Click **Create & View**
6. **Copy the API key** - you won't be able to see it again!

#### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Click **Verify a Single Sender**
3. Fill in your details (use your actual email)
4. Check your email and click the verification link

#### Step 4: Configure Render Environment Variables
Add these to your Render Environment Variables:

```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Play2Learn <verified-sender@yourdomain.com>"
```

**Important Notes:**
- `EMAIL_USER` is literally the word `apikey` (not your username)
- `EMAIL_PASSWORD` is your actual SendGrid API key
- `EMAIL_FROM` must match your verified sender email

---

### Using Outlook/Hotmail

#### Step 1: Configure Render Environment Variables
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
EMAIL_FROM="Play2Learn <your-email@outlook.com>"
```

**Notes:**
- Use your actual Outlook/Hotmail password
- If you have 2FA enabled, you may need to create an app password

---

## 🧪 Testing Your Email Configuration

### Method 1: Use Diagnostic Endpoints (Recommended - On Render)

**NEW! Use these endpoints to test your email configuration directly on Render:**

**Step 1: Check Configuration**
```
https://your-app.onrender.com/api/email-diagnostic/test-email-config
```
- Shows if all 6 email variables are set correctly
- Tests SMTP connection
- Provides helpful error messages if something is wrong

**Step 2: Send Test Email**
```
https://your-app.onrender.com/api/email-diagnostic/send-test-email?to=your-email@example.com
```
- Replace `your-email@example.com` with your actual email
- Sends a real test email immediately
- Check your inbox (and spam folder!) within 5 minutes

**Example Response (Success):**
```json
{
  "success": true,
  "message": "Email configuration is valid and SMTP connection successful!",
  "config": {
    "EMAIL_HOST": "smtp.gmail.com",
    "EMAIL_PORT": "587",
    "EMAIL_USER": "your-email@gmail.com"
  }
}
```

**If there are issues, you'll get detailed help:**
```json
{
  "success": false,
  "message": "SMTP connection failed",
  "errorCode": "EAUTH",
  "help": "Authentication failed. For Gmail: Use App Password, not regular password."
}
```

> **💡 Tip:** Use these diagnostic endpoints first before trying to send actual user credentials!

### Method 2: Use the Test Script (Local Testing)

If you have the code locally:

1. Create a `.env` file in the `backend` folder with your settings:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

2. Update `backend/test-email.js` line 27 with your personal email

3. Run the test:
```bash
cd backend
node test-email.js
```

4. Check your inbox (and spam folder) for the test email

### Method 3: Test on Render (Production Testing)

1. Log in to your deployed app at: `https://play2learn-test.onrender.com`
2. Create a test account (Teacher, Student, or Parent)
3. Navigate to: `/school-admin/users/pending-credentials`
4. Click "Send Credentials" for a test user
5. Check the recipient's email inbox

### Method 4: Check Render Logs

1. Go to Render Dashboard
2. Select your play2learn service
3. Click on **Logs**
4. Look for these messages after redeployment:
   - `✅ Email service ready - SMTP connection verified` - Email is configured correctly
   - `❌ Email service SMTP connection failed` - There's a configuration issue
   - Detailed error messages will help you identify the problem

---

## 🔍 How to Use the Email Feature

### Accessing the Pending Credentials Page

1. Log in as a **School Admin**
2. Navigate to: `https://play2learn-test.onrender.com/school-admin/users/pending-credentials`
3. You'll see a list of users who have pending credentials (newly created accounts)

### Sending Credentials Manually

**For Individual Users:**
1. Find the user in the pending credentials list
2. Click the **"Send Credentials"** button next to their name
3. The system will:
   - Send an email to the user (or parent for students)
   - Mark the credentials as sent
   - Remove the user from the pending list

**For Multiple Users (Bulk Send):**
1. Select multiple users using checkboxes
2. Click **"Send All Selected"** button
3. All selected users will receive their credentials

### What Gets Sent?

**Teachers receive:**
- Welcome email to their registered email
- Login credentials (email + temporary password)
- Link to login page

**Students receive:**
- Email sent to parent's email address
- Student's name and class information
- Login credentials
- Link to login page

**Parents receive:**
- Welcome email to their registered email
- Their own login credentials
- Information about linked student
- Link to view student progress

---

## ⚠️ Troubleshooting

> **📖 For comprehensive troubleshooting, see [EMAIL_TROUBLESHOOTING.md](EMAIL_TROUBLESHOOTING.md)**
>
> **Quick Diagnosis:**
> 1. Visit `/api/email-diagnostic/test-email-config` to check configuration
> 2. Visit `/api/email-diagnostic/send-test-email?to=your-email` to test sending
> 3. Check Render logs for detailed error messages

### Problem: "Email service error" in Render logs

**Solution:**
1. Check that all environment variables are set correctly in Render
2. Verify no extra spaces in EMAIL_USER or EMAIL_PASSWORD
3. Ensure EMAIL_PORT is a number (587 or 465)
4. For Gmail, make sure you're using the App Password, not your regular password

### Problem: Emails go to spam folder

**Solution:**
1. Add a proper EMAIL_FROM address that matches your sending domain
2. Consider using SendGrid or Mailgun for better deliverability
3. Ask recipients to mark your email as "Not Spam"

### Problem: "Authentication failed" error

**Solution for Gmail:**
- Verify 2FA is enabled on your Google account
- Use App Password, not regular password
- Remove any spaces from the App Password when entering in Render

**Solution for Outlook:**
- Use your actual account password
- If 2FA is enabled, create an app password

**Solution for SendGrid:**
- EMAIL_USER must be exactly `apikey` (lowercase)
- EMAIL_PASSWORD must be your SendGrid API key
- Verify your sender email in SendGrid dashboard

### Problem: Emails not being sent (no error)

**Solution:**
1. Check Render logs for specific error messages
2. Verify EMAIL_HOST and EMAIL_PORT are correct
3. Test with the test-email.js script locally first
4. Make sure the user has a valid email address
5. Check if EMAIL_FROM email is verified (for SendGrid/Mailgun)

### Problem: "Failed to send email. Please check email configuration."

**Solution:**
This means the email service is not properly configured. Check:
1. All 6 email environment variables are set in Render
2. No typos in variable names
3. EMAIL_SECURE is set to `false` for port 587, `true` for port 465
4. Redeploy after adding variables

---

## 📊 Recommended Email Limits

| Service | Free Tier Limit | Recommended Use |
|---------|----------------|-----------------|
| Gmail | 500/day | Testing, small schools (< 50 users) |
| Outlook | 300/day | Testing, small schools |
| SendGrid | 100/day (free) | Production (any size) |
| Mailgun | 5,000/month | Production (any size) |

---

## 🎯 Quick Checklist for Render Email Setup

- [ ] Choose email service (Gmail for testing, SendGrid for production)
- [ ] For Gmail: Enable 2FA and generate App Password
- [ ] For SendGrid: Create account, generate API key, verify sender
- [ ] Add all 6 environment variables in Render Dashboard:
  - [ ] EMAIL_HOST
  - [ ] EMAIL_PORT
  - [ ] EMAIL_SECURE
  - [ ] EMAIL_USER
  - [ ] EMAIL_PASSWORD
  - [ ] EMAIL_FROM
- [ ] Save changes and wait for Render to redeploy
- [ ] Check Render logs for "✅ Email service ready"
- [ ] Test by sending credentials to a test user
- [ ] Verify email received (check spam folder too)

---

## 💡 Best Practices

1. **Use SendGrid for Production**: Gmail is great for testing but has daily limits
2. **Monitor Email Sending**: Check Render logs regularly for email errors
3. **Verify Emails**: Make sure all user emails are valid before sending
4. **Test Before Bulk Send**: Send to one user first to verify everything works
5. **Keep Credentials Secure**: Never commit .env files or share API keys publicly
6. **Update EMAIL_FROM**: Use a professional from address like `noreply@yourschool.com`

---

## 🔐 Security Notes

- **Never commit** EMAIL_PASSWORD or API keys to git
- Use environment variables in Render (never hardcode)
- Rotate API keys periodically (every 3-6 months)
- Use App Passwords for Gmail (not your main account password)
- For SendGrid, use restricted API keys (Mail Send only) when possible

---

## 📞 Need Help?

If you're still having issues:
1. Check Render logs for specific error messages
2. Review this guide step-by-step
3. Test locally with test-email.js first
4. Verify all environment variables are correct (no typos)
5. Check that your email service account is active and verified

---

## 🎉 Success!

Once configured, your email system will:
- ✅ Send professional welcome emails automatically
- ✅ Deliver login credentials securely
- ✅ Support bulk sending for multiple users
- ✅ Work reliably in production

Your users will receive beautiful, branded emails with their login credentials, making onboarding smooth and professional!

---

**Last Updated**: 2026-02-12  
**Platform**: Render.com  
**Email Service**: Nodemailer with SMTP
