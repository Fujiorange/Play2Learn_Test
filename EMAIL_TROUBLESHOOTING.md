# Email Troubleshooting Guide - Not Receiving Emails

If you've configured email on Render but emails are not being received, follow this systematic troubleshooting guide.

## 🔍 Quick Diagnostic Tools

### 1. Check Email Configuration (In Render)
**URL:** `https://your-app.onrender.com/api/email-diagnostic/test-email-config`

This endpoint checks if all email environment variables are set correctly.

**What to look for:**
- ✅ All 6 variables should be "SET"
- ✅ SMTP connection should be "successful"
- ❌ If any variables are missing, add them in Render Dashboard → Environment

### 2. Send Test Email
**URL:** `https://your-app.onrender.com/api/email-diagnostic/send-test-email?to=your-email@example.com`

Replace `your-email@example.com` with your actual email address.

**What happens:**
- Sends a test email immediately
- Returns success/failure status
- Check your inbox (and spam folder!)

---

## 🔧 Step-by-Step Troubleshooting

### Step 1: Check Render Logs

1. Go to **Render Dashboard** → Your Service → **Logs**
2. Look for these messages on startup:

**✅ GOOD Signs:**
```
✅ Email service ready - SMTP connection verified
   Emails will be sent from: Play2Learn <your-email@gmail.com>
```

**❌ BAD Signs:**
```
❌ CRITICAL: Missing email environment variables: EMAIL_PASSWORD
❌ Email service SMTP connection failed: Invalid login
```

### Step 2: Verify Environment Variables

Go to **Render Dashboard** → Your Service → **Environment**

**Required variables (all 6 must be set):**

| Variable | Example | Check |
|----------|---------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` | ✓ Set correctly for your provider |
| `EMAIL_PORT` | `587` | ✓ Usually 587 (or 465 for SSL) |
| `EMAIL_SECURE` | `false` | ✓ `false` for port 587, `true` for 465 |
| `EMAIL_USER` | `your-email@gmail.com` | ✓ Your email or "apikey" for SendGrid |
| `EMAIL_PASSWORD` | `*hidden*` | ✓ App Password (Gmail) or API key (SendGrid) |
| `EMAIL_FROM` | `"Play2Learn <email@gmail.com>"` | ✓ Include quotes and angle brackets |

**Common Mistakes:**
- ❌ Missing any of the 6 variables
- ❌ Using regular password instead of App Password (Gmail)
- ❌ Wrong EMAIL_USER for SendGrid (must be exactly `apikey`)
- ❌ Spaces in PASSWORD when copying from Gmail App Password

### Step 3: Provider-Specific Checks

#### For Gmail:

1. **App Password Required:**
   - You MUST use App Password, not your regular Gmail password
   - Regular password will NOT work even if correct

2. **Generate App Password:**
   - Enable 2FA: https://myaccount.google.com/security
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)" → "Play2Learn"
   - Copy the 16-character password **without spaces**

3. **Correct Configuration:**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  (16 chars, no spaces)
   EMAIL_FROM="Play2Learn <your-email@gmail.com>"
   ```

#### For SendGrid:

1. **API Key Required:**
   - Create API key in SendGrid Dashboard
   - Settings → API Keys → Create API Key

2. **Sender Verification:**
   - You MUST verify your sender email
   - Settings → Sender Authentication → Verify a Single Sender

3. **Correct Configuration:**
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey  (literally "apikey", not your username!)
   EMAIL_PASSWORD=SG.xxxxxxxxxxx  (your actual API key)
   EMAIL_FROM="Play2Learn <verified-email@yourdomain.com>"
   ```

#### For Outlook/Hotmail:

```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
EMAIL_FROM="Play2Learn <your-email@outlook.com>"
```

### Step 4: Check for Common Errors in Logs

After attempting to send an email, check Render logs for these error codes:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `EAUTH` | Authentication failed | Wrong EMAIL_USER or EMAIL_PASSWORD. For Gmail: use App Password. For SendGrid: USER must be "apikey" |
| `ECONNECTION` | Cannot connect to SMTP | Wrong EMAIL_HOST or EMAIL_PORT. Check your email provider's SMTP settings |
| `ETIMEDOUT` | Connection timeout | SMTP server not responding. Verify EMAIL_HOST is correct |
| `ENOTFOUND` | Host not found | EMAIL_HOST is incorrect or has a typo |
| `Invalid login` | Wrong credentials | Check EMAIL_USER and EMAIL_PASSWORD are correct |

### Step 5: Test Email Sending

1. **Navigate to:** `https://your-app.onrender.com/school-admin/users/pending-credentials`
2. **Find a test user** (or create one)
3. **Click "Send Credentials"**
4. **Check Render logs** for:
   ```
   ✅ Student credentials sent to parent: parent@example.com
      Message ID: <unique-id>
      Response: 250 Message accepted
   ```

5. **If you see success in logs but NO EMAIL:**
   - **Check SPAM folder** (most common issue!)
   - Wait 5-10 minutes (some email providers delay)
   - Verify recipient email address is correct
   - Try sending to a different email address

### Step 6: Email Deliverability Issues

**If emails are sent successfully (logs show ✅) but not received:**

1. **Check Spam Folder** - This is the #1 reason!
   - Check spam/junk folder on recipient's email
   - Mark email as "Not Spam" if found there

2. **Use Better Email Service:**
   - Gmail/Outlook free tiers often go to spam
   - Use **SendGrid** or **Mailgun** for production
   - These have better deliverability and reputation

3. **Verify Sender Email:**
   - For SendGrid: Verify your sender in dashboard
   - For custom domains: Set up SPF/DKIM records

4. **Test Different Recipients:**
   - Try sending to Gmail, Outlook, Yahoo
   - Some email providers block more aggressively

---

## 📋 Complete Troubleshooting Checklist

Go through each item:

- [ ] **All 6 environment variables are set in Render Dashboard**
- [ ] **Render logs show "✅ Email service ready" on startup**
- [ ] **No "❌" errors in Render logs**
- [ ] **Using App Password for Gmail (not regular password)**
- [ ] **Using "apikey" as EMAIL_USER for SendGrid**
- [ ] **EMAIL_PORT is 587 and EMAIL_SECURE is false**
- [ ] **Waited 2-3 minutes after setting env vars for Render to redeploy**
- [ ] **Checked spam/junk folder on recipient's email**
- [ ] **Tested with diagnostic endpoint:** `/api/email-diagnostic/test-email-config`
- [ ] **Sent test email with:** `/api/email-diagnostic/send-test-email?to=your-email`
- [ ] **Tried different recipient email address**
- [ ] **Checked Render logs after attempting to send**

---

## 🆘 Still Not Working?

### Method 1: Use Diagnostic Endpoints

1. **Check Configuration:**
   ```
   https://your-app.onrender.com/api/email-diagnostic/test-email-config
   ```
   - Should show all variables SET
   - Should show SMTP connection successful

2. **Send Test Email:**
   ```
   https://your-app.onrender.com/api/email-diagnostic/send-test-email?to=your-actual-email@gmail.com
   ```
   - Replace with your real email
   - Check your inbox and spam folder within 5 minutes

### Method 2: Check Specific Error Messages

**If you see in logs:**

```
❌ CRITICAL: Missing email environment variables: EMAIL_PASSWORD, EMAIL_FROM
```
**Solution:** Add the missing variables in Render Dashboard → Environment

```
❌ Email service SMTP connection failed: Invalid login
   Error code: EAUTH
```
**Solution:** Wrong EMAIL_PASSWORD. For Gmail: use App Password, not regular password.

```
❌ Email service SMTP connection failed: getaddrinfo ENOTFOUND smtp.gmail.comm
```
**Solution:** Typo in EMAIL_HOST. Should be `smtp.gmail.com` not `smtp.gmail.comm`

```
✅ Email service ready
...later...
❌ Failed to send email to user@example.com
   Error: Invalid login: 535 Authentication failed
```
**Solution:** Credentials changed or expired. Regenerate Gmail App Password.

### Method 3: Start Fresh

If nothing works, try starting from scratch:

1. **Delete all EMAIL_* variables** from Render Dashboard → Environment
2. **Generate NEW credentials:**
   - Gmail: Generate new App Password
   - SendGrid: Create new API key
3. **Add variables one by one** carefully (no typos!)
4. **Save and wait for redeploy** (2-3 minutes)
5. **Check logs** for "✅ Email service ready"
6. **Test with diagnostic endpoint first**

---

## 🎯 Most Common Issues & Quick Fixes

### Issue 1: "Email service error: Invalid login"
**Cause:** Wrong password  
**Fix:** For Gmail, use App Password (not regular password). Regenerate at https://myaccount.google.com/apppasswords

### Issue 2: "Missing email environment variables"
**Cause:** Variables not set in Render  
**Fix:** Go to Render Dashboard → Environment → Add all 6 EMAIL_* variables

### Issue 3: Logs show success but email not received
**Cause:** Email in spam folder  
**Fix:** Check spam/junk folder. Mark as "Not Spam". Consider using SendGrid.

### Issue 4: "getaddrinfo ENOTFOUND"
**Cause:** Typo in EMAIL_HOST  
**Fix:** Check EMAIL_HOST spelling. For Gmail: `smtp.gmail.com`

### Issue 5: "Connection timeout"
**Cause:** Wrong EMAIL_HOST or EMAIL_PORT  
**Fix:** Verify EMAIL_HOST and EMAIL_PORT match your provider. Gmail: `smtp.gmail.com:587`

### Issue 6: Works locally but not on Render
**Cause:** Environment variables not set on Render  
**Fix:** Add all 6 variables in Render Dashboard → Environment (not just in .env file)

---

## 📞 Getting Help

**Before asking for help, collect this information:**

1. **What error appears in Render logs?**
   - Copy the exact error message from Render → Logs

2. **Email provider you're using:**
   - Gmail, SendGrid, Outlook, etc.

3. **Configuration check result:**
   - Visit `/api/email-diagnostic/test-email-config`
   - Copy the JSON response

4. **Test email result:**
   - Visit `/api/email-diagnostic/send-test-email?to=your-email`
   - Copy the JSON response
   - Did you check spam folder?

5. **Screenshot of Render environment variables:**
   - Show EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE (hide PASSWORD)

With this information, it's much easier to diagnose the specific issue!

---

## ✅ Success Indicators

**You know email is working when:**

1. ✅ Render logs show: `✅ Email service ready - SMTP connection verified`
2. ✅ `/api/email-diagnostic/test-email-config` returns `success: true`
3. ✅ `/api/email-diagnostic/send-test-email` sends email successfully
4. ✅ Test email appears in inbox (or spam folder)
5. ✅ Sending credentials from dashboard works and email is received

**Once you see all these signs, your email system is fully operational!**

---

**Last Updated:** 2026-02-12  
**Related Guides:** EMAIL_SETUP_GUIDE.md, EMAIL_SETUP_QUICKREF.md
