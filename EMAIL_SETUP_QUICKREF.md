# Email Setup Quick Reference

A quick reference card for setting up email on Render. For detailed instructions, see [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md).

## Required Environment Variables (6 total)

Add these in Render Dashboard → Environment:

```env
EMAIL_HOST=smtp.gmail.com           # Or your SMTP server
EMAIL_PORT=587                      # 587 for TLS, 465 for SSL
EMAIL_SECURE=false                  # false for 587, true for 465
EMAIL_USER=your-email@gmail.com     # Your email or "apikey" for SendGrid
EMAIL_PASSWORD=your-password        # App Password or API key
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

## Common Configurations

### Gmail (Testing)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx    # 16-char App Password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

**Setup Steps:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password (remove spaces when pasting)

### SendGrid (Production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey                    # Literally "apikey"
EMAIL_PASSWORD=SG.xxxxxxxxxxxxx      # Your API key
EMAIL_FROM="Play2Learn <verified@yourdomain.com>"
```

**Setup Steps:**
1. Sign up: https://sendgrid.com
2. Create API key: Settings → API Keys
3. Verify sender: Settings → Sender Authentication

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM="Play2Learn <your-email@outlook.com>"
```

## Testing

### Local Testing
```bash
cd backend

# Verify configuration
node verify-email-config.js

# Send test email (edit recipient in file first)
node test-email.js
```

### Production Testing
1. Deploy to Render with email variables
2. Check Render logs for: `✅ Email service ready`
3. Navigate to: `/school-admin/users/pending-credentials`
4. Send credentials to a test user
5. Check recipient's inbox (and spam folder)

## Common Issues

| Issue | Solution |
|-------|----------|
| "Email service error" | Check all 6 variables are set in Render |
| "Authentication failed" | Gmail: Use App Password, not regular password<br>SendGrid: USER must be "apikey" |
| Emails go to spam | Use verified sender (SendGrid) or professional domain |
| "Connection timeout" | Check EMAIL_HOST and EMAIL_PORT are correct |

## Verification Checklist

- [ ] Choose email service (Gmail/SendGrid/Outlook)
- [ ] Set up service account (2FA for Gmail, API key for SendGrid)
- [ ] Add all 6 EMAIL_* variables in Render Environment
- [ ] Save and wait for Render to redeploy (2-3 minutes)
- [ ] Check Render logs for "✅ Email service ready"
- [ ] Test sending credentials to a test user
- [ ] Verify email received (check spam folder)

## Daily Limits

| Service | Free Tier Limit |
|---------|-----------------|
| Gmail | 500 emails/day |
| Outlook | 300 emails/day |
| SendGrid | 100 emails/day |
| Mailgun | 5,000 emails/month |

## Need Help?

1. **Detailed Guide**: See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)
2. **Deployment Guide**: See [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)
3. **Check Render Logs**: Render Dashboard → Your Service → Logs
4. **Verify Locally**: Run `node backend/verify-email-config.js`

---

**Quick Link**: Once deployed, access at:  
`https://your-app.onrender.com/school-admin/users/pending-credentials`
