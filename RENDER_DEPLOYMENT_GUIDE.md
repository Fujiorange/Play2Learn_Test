# Render Deployment Guide - Play2Learn

## Issue Fixed ✅

The Render deployment was failing due to ESLint errors during the frontend build process. These have been resolved.

### Errors Fixed
1. **CreateTicket.js**: Missing `useEffect` import and undefined `setLoading` state
2. **TrackTicket.js**: Missing `getPriorityColor` helper function

## Deployment Configuration

### Build Script
The root `package.json` contains the render-build script:
```json
{
  "scripts": {
    "render-build": "npm run install-all && npm run build",
    "install-all": "npm install --prefix backend && npm install --prefix frontend",
    "build": "CI=false npm run build --prefix frontend",
    "start": "npm start --prefix backend"
  }
}
```

### Render Settings

#### Web Service Settings
- **Build Command**: `npm run render-build`
- **Start Command**: `npm start`
- **Environment**: `Node`
- **Node Version**: `>=16.0.0` (as specified in package.json)

#### Environment Variables Required

**Backend/Database:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn
JWT_SECRET=your-secure-random-secret-key-here
NODE_ENV=production
PORT=5000
```

**Email Configuration:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

**Frontend URL:**
```
FRONTEND_URL=https://your-app-name.onrender.com
```

## Deployment Steps

### 1. Initial Setup on Render

1. **Create New Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Name: `play2learn` (or your preferred name)
   - Region: Choose closest to your users
   - Branch: `main` (or your deployment branch)
   - Build Command: `npm run render-build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   - Add all required environment variables listed above
   - Ensure `JWT_SECRET` is a secure random string
   - Set `NODE_ENV=production`

### 2. Database Setup

**MongoDB Atlas (Recommended):**
1. Create a MongoDB Atlas account
2. Create a cluster (free tier available)
3. Create database user
4. Whitelist Render IPs (or use 0.0.0.0/0 for all IPs)
5. Get connection string
6. Set as `MONGODB_URI` environment variable

### 3. Email Configuration

**Using Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: Mail
   - Select device: Other (Custom name)
   - Copy the generated password
3. Use the App Password as `EMAIL_PASSWORD`

**Alternative Email Providers:**
- SendGrid: `smtp.sendgrid.net` (port 587)
- Mailgun: `smtp.mailgun.org` (port 587)
- AWS SES: `email-smtp.region.amazonaws.com` (port 587)

### 4. Deploy

1. **Automatic Deployment:**
   - Push to your configured branch
   - Render automatically detects and deploys

2. **Manual Deployment:**
   - Go to Render Dashboard
   - Select your service
   - Click "Manual Deploy" → "Deploy latest commit"

### 5. Verify Deployment

After deployment completes:

1. **Check Health Endpoint:**
   ```
   https://your-app-name.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "success": true,
     "message": "Server is healthy",
     "database": {
       "status": "Connected",
       "connected": true
     }
   }
   ```

2. **Check Frontend:**
   - Visit: `https://your-app-name.onrender.com`
   - Should display the landing page

3. **Test API:**
   ```
   https://your-app-name.onrender.com/api/test
   ```

## Post-Deployment Tasks

### Initialize Trial License
After first deployment, run the initialization script:

1. **Via Render Shell:**
   - Go to Render Dashboard → Your Service → Shell
   - Run:
     ```bash
     cd backend
     node init-trial-license.js
     ```

2. **Expected Output:**
   ```
   🔗 Connecting to MongoDB...
   ✅ Connected to MongoDB
   ✅ Created Free Trial license successfully
   ```

### Seed Initial Data (Optional)
If you need to seed questions or licenses:
```bash
cd backend
node seed-licenses.js
node seed-questions.js
```

## Troubleshooting

### Build Fails

**Error: ESLint errors**
- Solution: Fixed in this commit
- Ensure you're on the latest branch

**Error: Module not found**
- Check `package.json` dependencies
- Run `npm install` locally to verify
- Clear Render build cache and redeploy

### Deployment Succeeds but App Doesn't Work

**Issue: "Cannot connect to database"**
- Check `MONGODB_URI` is set correctly
- Verify MongoDB Atlas network access allows Render IPs
- Check database user permissions

**Issue: "CORS errors"**
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in `backend/server.js`
- Add your Render URL to allowed origins

**Issue: "Email not sending"**
- Verify email credentials
- Check email provider allows SMTP
- Test with Gmail App Password

### App Crashes or Restarts

1. **Check Logs:**
   - Render Dashboard → Your Service → Logs
   - Look for error messages

2. **Common Issues:**
   - Missing environment variables
   - Database connection timeout
   - Memory limits exceeded
   - Port binding issues

### Performance Issues

**Free Tier Limitations:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down will be slow (cold start)
- Consider upgrading to paid tier for production

**Solutions:**
- Use Render's paid plans ($7/month)
- Implement health check pings
- Add loading states in frontend

## Monitoring

### Health Checks
Render automatically pings your service. Configure in:
- Render Dashboard → Service → Settings → Health Check Path
- Set to: `/api/health`

### Logs
View real-time logs:
- Render Dashboard → Your Service → Logs
- Filter by: Error, Warning, Info

### Metrics
Monitor:
- Request volume
- Response times
- Error rates
- Memory usage

## Updating the Deployment

### For Code Changes:
1. Commit and push to your branch
2. Render automatically detects and rebuilds

### For Environment Variables:
1. Render Dashboard → Service → Environment
2. Add/Update variables
3. Click "Save Changes"
4. Service will redeploy automatically

### For Manual Redeploy:
- Render Dashboard → Service → Manual Deploy

## Cost Optimization

### Free Tier:
- ✅ Good for development/testing
- ❌ Service spins down after inactivity
- ❌ 750 hours/month limit

### Paid Plans ($7/month):
- ✅ Always-on service
- ✅ No spin-down
- ✅ Better performance
- ✅ Custom domains

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong, random JWT_SECRET
   - Rotate secrets regularly

2. **Database:**
   - Use MongoDB Atlas with authentication
   - Restrict IP access when possible
   - Regular backups

3. **Email:**
   - Use App Passwords, not account passwords
   - Monitor for abuse
   - Set rate limits

4. **CORS:**
   - Only allow your actual domain
   - Don't use wildcards in production

## Support

### Render Documentation:
- https://render.com/docs

### Common Commands:
```bash
# View logs
render logs

# SSH into service (paid plans only)
render ssh

# Restart service
# (Use Render Dashboard → Manual Deploy)
```

## Checklist for Successful Deployment

- [x] Fixed ESLint errors in CreateTicket.js
- [x] Fixed ESLint errors in TrackTicket.js  
- [x] Build script completes successfully
- [x] All environment variables configured
- [x] MongoDB connection string is valid
- [x] Email credentials are set
- [x] Service deployed on Render
- [ ] Health endpoint returns success
- [ ] Frontend loads correctly
- [ ] Trial license initialized
- [ ] Test user registration works
- [ ] Test user login works

---

**Last Updated:** February 15, 2026
**Status:** ✅ Deployment Issues Resolved
