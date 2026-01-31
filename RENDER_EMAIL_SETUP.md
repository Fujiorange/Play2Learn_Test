# Render Deployment Guide

## Email Service Configuration for Render

### Problem
When deploying to Render, you may encounter this error:
```
❌ Email service error: Error: connect ECONNREFUSED 127.0.0.1:587
```

This happens because the email service is configured to use `localhost` which doesn't work in cloud environments.

### Solution

You need to configure environment variables in Render to use a real SMTP service.

## Step-by-Step Setup

### 1. Choose an SMTP Provider

Select one of these popular SMTP providers:

#### Option A: Gmail (Recommended for testing)
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Secure**: `false`
- **Requirements**: 
  - Enable 2-Factor Authentication on your Google account
  - Generate an App Password at https://myaccount.google.com/apppasswords
  - Use the App Password as EMAIL_PASSWORD (not your regular password)

#### Option B: Outlook/Hotmail
- **Host**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Secure**: `false`
- **Requirements**: Use your Outlook email and password

#### Option C: SendGrid (Recommended for production)
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Secure**: `false`
- **Requirements**: 
  - Sign up at https://sendgrid.com
  - Create an API key
  - Use `apikey` as EMAIL_USER
  - Use your API key as EMAIL_PASSWORD

#### Option D: Mailgun
- **Host**: `smtp.mailgun.org`
- **Port**: `587`
- **Secure**: `false`
- **Requirements**: 
  - Sign up at https://www.mailgun.com
  - Get SMTP credentials from dashboard

### 2. Configure Environment Variables in Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add the following environment variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=Play2Learn <your-email@gmail.com>
FRONTEND_URL=https://your-frontend-app.onrender.com
```

**Important**: Replace the values with your actual SMTP credentials.

### 3. Other Required Environment Variables

Make sure you also set:

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=play2learn
MONGODB_URI=your-mongodb-connection-string
PORT=5000
```

### 4. Deploy

After setting all environment variables:
1. Click "Save Changes" in Render
2. Render will automatically redeploy your service
3. Check the logs to verify email service is working:
   - Look for: `✅ Email service ready`
   - Should NOT see: `❌ Email service error`

## Testing Email Service

After deployment, you can test the email service by:

1. Creating a new account (student/teacher/admin)
2. Check if the welcome email is sent successfully
3. Monitor Render logs for any email-related errors

## Troubleshooting

### Error: ECONNREFUSED 127.0.0.1:587
- **Cause**: EMAIL_HOST is set to localhost or 127.0.0.1
- **Solution**: Set EMAIL_HOST to your SMTP provider's host (e.g., smtp.gmail.com)

### Error: Invalid login
- **Cause**: Wrong credentials or 2FA not configured
- **Solution**: 
  - For Gmail: Use App Password, not regular password
  - Verify EMAIL_USER and EMAIL_PASSWORD are correct

### Error: ETIMEDOUT
- **Cause**: Wrong port or firewall blocking
- **Solution**: 
  - Verify EMAIL_PORT is correct (usually 587)
  - Try EMAIL_SECURE=false for port 587, or EMAIL_SECURE=true for port 465

### Emails not arriving
- **Cause**: Emails might be in spam folder
- **Solution**: 
  - Check spam/junk folder
  - Configure SPF/DKIM records for production
  - Use a dedicated email service like SendGrid

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use App Passwords** - Don't use your main email password
3. **For production** - Use dedicated email services (SendGrid, Mailgun, AWS SES)
4. **Rotate credentials** - Change passwords periodically
5. **Monitor usage** - Check for unusual email sending patterns

## Example Configuration for Different Providers

### Gmail
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=Play2Learn <yourname@gmail.com>
```

### SendGrid
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Play2Learn <noreply@yourdomain.com>
```

### Outlook
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@outlook.com
EMAIL_PASSWORD=yourpassword
EMAIL_FROM=Play2Learn <yourname@outlook.com>
```

## Need Help?

If you continue to experience issues:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Test SMTP credentials using the `test-email.js` script locally first
4. Check SMTP provider's documentation for specific requirements
