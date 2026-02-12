# 🚨 EMAIL_FROM Configuration Error - Common Issue

## Problem

If you're getting email sending errors and you've set:
```
EMAIL_FROM=Play2Learn
```

This is **INCORRECT** and will cause email sending to fail!

## Why It Fails

The `EMAIL_FROM` environment variable must contain a **valid email address**, not just a display name.

Nodemailer (the email library) requires either:
1. A complete email address: `your-email@gmail.com`
2. A display name WITH email: `"Play2Learn <your-email@gmail.com>"`

Setting it to just `Play2Learn` without an email address will cause errors like:
- "Invalid address"
- "Missing sender address"
- Email sending fails silently

## ✅ Correct Formats

### Format 1: Display Name + Email (Recommended)
```env
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

### Format 2: Email Only
```env
EMAIL_FROM=your-email@gmail.com
```

### Format 3: Display Name + Email (Alternative)
```env
EMAIL_FROM=Play2Learn <your-email@gmail.com>
```

## 🔧 How to Fix in Render

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Select your service

2. **Open Environment Variables**
   - Click "Environment" in the left sidebar
   - Find the `EMAIL_FROM` variable

3. **Update the Value**
   - **INCORRECT:** `Play2Learn`
   - **CORRECT:** `"Play2Learn <your-email@gmail.com>"`
   
   Replace `your-email@gmail.com` with your actual email address that matches `EMAIL_USER`

4. **Save Changes**
   - Click "Save Changes"
   - Wait 2-3 minutes for Render to redeploy your service

5. **Verify It Works**
   - Check Render logs for: `✅ EMAIL_FROM format validated`
   - Test sending an email from the pending credentials page

## 📋 Complete Example Configuration

Here's what your email environment variables should look like:

### For Gmail:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="Play2Learn <yourname@gmail.com>"
```

### For SendGrid:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
EMAIL_FROM="Play2Learn <verified@yourdomain.com>"
```

### For Outlook:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM="Play2Learn <yourname@outlook.com>"
```

## 🔍 How to Verify

After updating EMAIL_FROM, check your Render logs:

### ✅ Success - You'll see:
```
📧 Email Configuration:
   FROM: "Play2Learn <your-email@gmail.com>"
✅ EMAIL_FROM format validated: "Play2Learn <your-email@gmail.com>"
✅ Email service ready - SMTP connection verified
```

### ❌ Error - You'll see:
```
📧 Email Configuration:
   FROM: Play2Learn
❌ CRITICAL: EMAIL_FROM is invalid - missing email address
   Current value: "Play2Learn"
   EMAIL_FROM must contain a valid email address.
   Correct formats:
   - "Play2Learn <your-email@gmail.com>"
   - "your-email@gmail.com"
```

## 🎯 Testing Email After Fix

1. **Check Configuration:**
   ```
   https://your-app.onrender.com/api/email-diagnostic/test-email-config
   ```
   Should return: `"success": true`

2. **Send Test Email:**
   ```
   https://your-app.onrender.com/api/email-diagnostic/send-test-email?to=your-email@gmail.com
   ```
   Should send email successfully

3. **Test from Dashboard:**
   - Navigate to `/school-admin/users/pending-credentials`
   - Send credentials to a test user
   - Check recipient's inbox (and spam folder!)

## 💡 Why This Format is Required

The email "from" field needs two pieces of information:
1. **Display Name** (optional): What recipients see (e.g., "Play2Learn")
2. **Email Address** (required): The actual sender email address

The format `"Display Name <email@address.com>"` provides both.

Without a valid email address, email servers will reject the message.

## 🆘 Still Having Issues?

If you've fixed EMAIL_FROM but still can't send emails:

1. **Check all 6 required variables are set:**
   - EMAIL_HOST
   - EMAIL_PORT
   - EMAIL_SECURE
   - EMAIL_USER
   - EMAIL_PASSWORD
   - EMAIL_FROM (with proper format!)

2. **For Gmail users:** Make sure you're using an App Password, not your regular Gmail password
   - Generate at: https://myaccount.google.com/apppasswords

3. **Check Render logs** for other error messages

4. **See the full troubleshooting guide:** EMAIL_TROUBLESHOOTING.md

---

**Last Updated:** 2026-02-12  
**Related Guides:** EMAIL_SETUP_GUIDE.md, EMAIL_TROUBLESHOOTING.md, EMAIL_SETUP_QUICKREF.md
