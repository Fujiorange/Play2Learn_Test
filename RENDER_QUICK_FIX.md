# Quick Fix Guide for Common Render Deployment Issues

This document provides quick solutions to common Render deployment failures.

## Quick Diagnosis

### 1. Check Build Logs
- Go to Render Dashboard → Your Service → Logs
- Look for the error message in the build phase

### 2. Common Error Patterns

#### Error: "npm ERR! Missing script: render-build"
**Fix:** Ensure `render.yaml` has correct build command or check `package.json` has the script.

#### Error: "Treating warnings as errors because process.env.CI = true"
**Fix:** ✅ Already fixed in this PR - `CI=false` added to render-build script.

#### Error: "MongooseServerSelectionError: connection timed out"
**Causes:**
- MONGODB_URI not set
- MongoDB Atlas IP whitelist doesn't include 0.0.0.0/0
- Wrong MongoDB connection string format

**Fix:**
```bash
# In Render Dashboard → Environment:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn?retryWrites=true&w=majority
```

#### Error: "JWT_SECRET must be set in the production environment"
**Fix:**
```bash
# In Render Dashboard → Environment:
JWT_SECRET=your-random-32-character-secret-here
```

Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Error: "Not allowed by CORS"
**Fix:** ✅ Already fixed in this PR - CORS now uses FRONTEND_URL environment variable.

Set in Render Dashboard:
```bash
FRONTEND_URL=https://your-app-name.onrender.com
```

#### Error: "Application Error" or "Port X is already in use"
**Fix:** Don't set PORT manually. Render assigns it automatically. Remove PORT from environment variables if you set it.

#### Error: Build succeeds but app crashes on startup
**Check:**
1. Is `NODE_ENV=production` set?
2. Are all required environment variables set?
3. Check application logs for the actual error

## Environment Variables Checklist

Copy this to your Render Dashboard → Environment:

```bash
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
FRONTEND_URL=https://your-app-name.onrender.com

# Email (required for user registration/password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<your-gmail-app-password>
EMAIL_FROM="Play2Learn <your-email@gmail.com>"

# Optional
USER_DELETION_PIN=<your-secure-pin>
```

## Post-Deployment Steps

After successful deployment:

1. **Initialize Database:**
   ```bash
   # In Render Shell:
   cd backend
   node init-trial-license.js
   ```

2. **Test Endpoints:**
   - Health: `https://your-app.onrender.com/api/health`
   - Test: `https://your-app.onrender.com/api/test`

3. **Test Registration:**
   - Go to `https://your-app.onrender.com`
   - Try creating a new account

## Still Having Issues?

1. **Check Render Logs:**
   - Dashboard → Your Service → Logs
   - Look for the exact error message

2. **Verify Environment Variables:**
   - Dashboard → Your Service → Environment
   - Ensure all required variables are set

3. **Test Locally:**
   ```bash
   # Set environment variables
   export NODE_ENV=production
   export MONGODB_URI=<your-atlas-uri>
   export JWT_SECRET=<your-secret>
   
   # Build and run
   npm run render-build
   npm start
   ```

4. **MongoDB Atlas Setup:**
   - Verify user exists with correct password
   - Check IP whitelist includes 0.0.0.0/0
   - Verify connection string format

5. **Review Full Guide:**
   - See `RENDER_DEPLOYMENT_GUIDE.md` for complete instructions

## Deploy Checklist

- [ ] render.yaml exists in repository root
- [ ] All environment variables set in Render Dashboard
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Email service configured (Gmail App Password)
- [ ] Build command: `npm run render-build`
- [ ] Start command: `npm start`
- [ ] Auto-deploy enabled on main branch
- [ ] First deployment successful
- [ ] Database initialized with `init-trial-license.js`
- [ ] Health endpoint returns success
- [ ] Can register and login

## Emergency Rollback

If deployment fails and you need to rollback:

1. Go to Render Dashboard → Your Service → Events
2. Find the last successful deployment
3. Click "Redeploy" on that version

Or manually:
```bash
git revert HEAD
git push origin main
```

## Support Resources

- Render Status: https://status.render.com/
- Render Docs: https://render.com/docs
- MongoDB Atlas Support: https://www.mongodb.com/cloud/atlas/support
- Full Deployment Guide: See `RENDER_DEPLOYMENT_GUIDE.md`
