# Production Deployment Guide

## Quick Fix for Current Issue

Your live site is trying to connect to `localhost:5000` because the frontend doesn't know where your backend API is deployed. Here's how to fix it:

### Step 1: Identify Your Backend URL
First, find out where your backend is deployed. It could be:
- Render: `https://your-backend-name.onrender.com`
- Heroku: `https://your-app-name.herokuapp.com`
- Vercel: `https://your-backend.vercel.app`
- Custom server: `https://api.yourdomain.com`

### Step 2: Configure Frontend Environment Variable

#### For Render.com:
1. Go to your frontend service dashboard on Render
2. Click on "Environment" in the left sidebar
3. Click "Add Environment Variable"
4. Add: 
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-backend.onrender.com`)
5. Click "Save Changes"
6. Render will automatically rebuild and redeploy your frontend

#### For Vercel:
1. Go to your project dashboard on Vercel
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: Your backend URL
5. Select all environments (Production, Preview, Development)
6. Click "Save"
7. Redeploy your frontend

#### For Netlify:
1. Go to your site dashboard on Netlify
2. Click on "Site settings"
3. Click on "Environment variables"
4. Click "Add a variable"
5. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend URL
6. Click "Save"
7. Trigger a new deploy

### Step 3: Verify the Fix

After redeployment:
1. Open your live site
2. Open browser console (F12 or right-click → Inspect → Console)
3. Look for the log message: `🌐 Parent Service API_BASE_URL: <url>`
4. Verify it shows your production URL, not `localhost:5000`
5. Test parent login and dashboard

## Alternative: Same-Origin Deployment

If your frontend and backend are deployed on the same domain (e.g., both on `yourapp.com`), you don't need to set `REACT_APP_API_URL`. The system will automatically detect this and use relative URLs.

Example same-origin setup:
- Frontend: `https://yourapp.com`
- Backend: `https://yourapp.com/api`

In this case, just ensure your backend is accessible at `/api` path on the same domain.

## Troubleshooting

### Issue: Still seeing "localhost:5000" error
**Solution**: 
1. Make sure the environment variable is set correctly
2. Trigger a fresh build/deploy (not just restart)
3. Clear browser cache and reload

### Issue: CORS errors after fixing URL
**Solution**: 
1. Add your frontend URL to backend CORS configuration
2. Edit `backend/server.js`, line 24-29
3. Add your frontend domain to `allowedOrigins` array
4. Redeploy backend

### Issue: 404 errors on API calls
**Solution**: 
1. Verify backend is running and accessible
2. Check that API routes are registered in `backend/server.js`
3. Ensure backend environment variables are set (especially `MONGODB_URI`)

## Backend Configuration

Make sure your backend has these environment variables set:

```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<random-secure-string>
FRONTEND_URL=<your-frontend-url>
PORT=5000 (or whatever port your host assigns)
NODE_ENV=production
```

## Testing Locally

To test the fix locally before deploying:

1. Create `frontend/.env.local`:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

2. Start backend:
   ```bash
   cd backend
   npm start
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm start
   ```

4. Test parent login and dashboard

## Summary

The fix is already in your code. You just need to:
1. **Set the environment variable** `REACT_APP_API_URL` in your hosting platform
2. **Redeploy** your frontend
3. **Test** that parents can now see their children

That's it! The parent dashboard error should be resolved.
