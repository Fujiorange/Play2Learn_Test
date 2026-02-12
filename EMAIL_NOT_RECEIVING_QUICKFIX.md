# 🚨 NOT RECEIVING EMAILS? - Quick Fix Guide

**Problem:** You set up email on Render but emails are not being received.

**Solution:** Use these NEW diagnostic tools to find and fix the problem in 5 minutes!

---

## 🔍 Step 1: Check Your Configuration (30 seconds)

**Open this URL in your browser:**
```
https://play2learn-test.onrender.com/api/email-diagnostic/test-email-config
```
*(Replace `play2learn-test` with your actual Render app name)*

### What You'll See:

**✅ If Everything is OK:**
```json
{
  "success": true,
  "message": "Email configuration is valid and SMTP connection successful!"
}
```
**→ Skip to Step 2**

**❌ If There's a Problem:**
```json
{
  "success": false,
  "message": "Missing email environment variables",
  "missingVariables": ["EMAIL_PASSWORD", "EMAIL_FROM"]
}
```
**→ Fix the missing variables in Render Dashboard → Environment**

**❌ If Authentication Failed:**
```json
{
  "success": false,
  "errorCode": "EAUTH",
  "help": "Authentication failed. For Gmail: Use App Password, not regular password."
}
```
**→ Generate Gmail App Password (see Step 3)**

---

## 📧 Step 2: Send a Test Email (1 minute)

**Open this URL in your browser:**
```
https://play2learn-test.onrender.com/api/email-diagnostic/send-test-email?to=YOUR-EMAIL@gmail.com
```
*(Replace YOUR-EMAIL@gmail.com with your actual email address)*

### What You'll See:

**✅ Success:**
```json
{
  "success": true,
  "message": "Test email sent successfully to your-email@gmail.com",
  "note": "Check the recipient's inbox (and spam folder)"
}
```
**→ Check your email inbox and SPAM folder!**

**❌ Failed:**
```json
{
  "success": false,
  "error": "Invalid login",
  "errorCode": "EAUTH",
  "help": "Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD."
}
```
**→ Follow the help message or see Step 3**

---

## 🔧 Step 3: Fix Common Issues

### Issue #1: "EAUTH - Authentication Failed"

**For Gmail Users:**

1. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - If it asks you to enable 2FA first, do that
   - Select "Mail" → "Other (Custom name)" → "Play2Learn"
   - Click Generate
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

2. **Update Render:**
   - Go to Render Dashboard → Your Service → Environment
   - Find `EMAIL_PASSWORD`
   - Replace with your App Password (NO SPACES: `abcdefghijklmnop`)
   - Click "Save Changes"
   - Wait 2-3 minutes for redeploy

3. **Test Again:**
   - Go back to Step 1 and check configuration
   - Then Step 2 to send test email

**For SendGrid Users:**

1. Check that `EMAIL_USER` is exactly `apikey` (all lowercase)
2. Check that `EMAIL_PASSWORD` is your SendGrid API key (starts with `SG.`)
3. Verify your sender email in SendGrid dashboard

### Issue #2: "Missing Environment Variables"

1. Go to Render Dashboard → Your Service → Environment
2. Make sure ALL 6 variables are set:
   - `EMAIL_HOST` (e.g., `smtp.gmail.com`)
   - `EMAIL_PORT` (e.g., `587`)
   - `EMAIL_SECURE` (e.g., `false`)
   - `EMAIL_USER` (your email)
   - `EMAIL_PASSWORD` (your App Password)
   - `EMAIL_FROM` (e.g., `"Play2Learn <your-email@gmail.com>"`)
3. Click "Save Changes"
4. Wait 2-3 minutes for redeploy

### Issue #3: "Email Sent Successfully But Not Received"

**CHECK YOUR SPAM FOLDER!** This is the #1 reason emails aren't "received".

1. Check your spam/junk folder
2. If email is there, mark it as "Not Spam"
3. Future emails should arrive in inbox

**Still not in spam?**
- Wait 5-10 minutes (some email providers delay)
- Try sending to a different email address
- For production, use SendGrid instead of Gmail (better deliverability)

---

## 📋 Quick Checklist

Go through each item:

- [ ] Visited `/api/email-diagnostic/test-email-config` - shows success
- [ ] All 6 EMAIL_* variables are set in Render
- [ ] Using Gmail App Password (not regular password)
- [ ] Visited `/api/email-diagnostic/send-test-email?to=my-email`
- [ ] Waited 2-3 minutes after changing Render environment variables
- [ ] **CHECKED SPAM FOLDER** (most important!)
- [ ] Tried sending to different email address

---

## 🆘 Still Not Working?

### Check Render Logs for Details

1. Go to Render Dashboard
2. Click on your service
3. Click "Logs" in sidebar
4. Look for messages like:

```
✅ Email service ready - SMTP connection verified
```
Good! Email is configured.

```
❌ Email service SMTP connection failed: Invalid login
   Error code: EAUTH
   ⚠️  AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD
```
Fix: Use Gmail App Password, not regular password.

```
❌ CRITICAL: Missing email environment variables: EMAIL_PASSWORD
```
Fix: Add EMAIL_PASSWORD in Render Dashboard → Environment

### Read the Full Troubleshooting Guide

For more detailed help, see: **EMAIL_TROUBLESHOOTING.md**

It has:
- Detailed step-by-step troubleshooting
- Solutions for 15+ common error codes
- Provider-specific setup instructions
- Complete troubleshooting checklist

---

## ✅ Success!

Once you see:
1. ✅ `/test-email-config` shows success
2. ✅ `/send-test-email` sends email
3. ✅ Test email received (check spam!)

**Your email is working!** You can now:
- Send credentials to users from `/school-admin/users/pending-credentials`
- Users will receive welcome emails with login credentials
- Check Render logs to monitor email sending

---

## 🎯 Quick Links

**Test Email Config:**
```
https://your-app.onrender.com/api/email-diagnostic/test-email-config
```

**Send Test Email:**
```
https://your-app.onrender.com/api/email-diagnostic/send-test-email?to=your-email@example.com
```

**Gmail App Password:**
```
https://myaccount.google.com/apppasswords
```

**Render Dashboard:**
```
https://dashboard.render.com
```

---

**Remember:** 
- Check SPAM folder (90% of "not received" issues!)
- Use Gmail App Password (not regular password)
- Wait 2-3 minutes after changing environment variables
- All 6 EMAIL_* variables must be set

**Average fix time: 5-10 minutes!** 🚀
