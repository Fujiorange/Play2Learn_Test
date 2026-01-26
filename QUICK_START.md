# Quick Start: Fixing Email Service on Render

## What Was Changed

### 1. Updated Email Service Configuration
- **File**: `backend/services/emailService.js`
- **Changes**:
  - Added `secure` option to support both TLS (port 587) and SSL (port 465)
  - Replaced all hardcoded `http://localhost:3000` URLs with `${process.env.FRONTEND_URL || 'http://localhost:3000'}`
  - This ensures emails work in production and still work locally

### 2. Updated Test Email Script  
- **File**: `backend/test-email.js`
- **Changes**:
  - Added `secure` option using environment variable

### 3. Created Environment Variable Examples
- **File**: `backend/.env.example`
- **Purpose**: Shows all required environment variables with examples for different SMTP providers

### 4. Created Deployment Guide
- **File**: `RENDER_EMAIL_SETUP.md`
- **Purpose**: Step-by-step guide for configuring email on Render

## What You Need To Do on Render

### Quick Setup (5 minutes)

1. **Go to your Render Dashboard**
   - Select your backend service
   - Go to "Environment" tab

2. **Add These Environment Variables**:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=Play2Learn <your-email@gmail.com>
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ```

3. **For Gmail Users** (Recommended):
   - Enable 2-Factor Authentication on Google account
   - Generate App Password at: https://myaccount.google.com/apppasswords
   - Use the 16-character App Password as `EMAIL_PASSWORD`
   - **DO NOT** use your regular Gmail password

4. **Save and Deploy**
   - Click "Save Changes"
   - Render will automatically redeploy
   - Check logs for: `✅ Email service ready`

### Alternative SMTP Providers

If you don't want to use Gmail, see `RENDER_EMAIL_SETUP.md` for:
- Outlook/Hotmail setup
- SendGrid setup (recommended for production)
- Mailgun setup
- AWS SES setup

## Testing

After deployment:
1. Try creating a new student/teacher account
2. Check if welcome email is sent
3. Verify the login link in the email points to your production URL

## Troubleshooting

**Still seeing `ECONNREFUSED 127.0.0.1:587`?**
- Make sure you set `EMAIL_HOST` to a real SMTP server (not localhost or 127.0.0.1)
- Double-check all environment variables are saved in Render

**Emails not sending?**
- Check Render logs for error messages
- Verify SMTP credentials are correct
- For Gmail, make sure you're using App Password, not regular password

**Need more help?**
- Read the detailed guide: `RENDER_EMAIL_SETUP.md`
- Check the `.env.example` file for configuration examples

## Summary

The code now:
✅ Supports any SMTP provider (Gmail, Outlook, SendGrid, etc.)
✅ Works on Render and other cloud platforms
✅ Uses environment variables for all configuration
✅ Has fallback to localhost for local development
✅ Includes comprehensive documentation

**You just need to configure the environment variables in Render!**
