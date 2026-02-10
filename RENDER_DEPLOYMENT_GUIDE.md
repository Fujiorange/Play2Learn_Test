# Render Deployment Guide for Play2Learn

## Overview
This guide will help you deploy the Play2Learn application to Render.com.

## Prerequisites
- A Render.com account
- A MongoDB Atlas account (or other MongoDB hosting service)
- SMTP credentials for email functionality
- GitHub repository connected to Render

## Deployment Steps

### 1. Create MongoDB Atlas Database (if you haven't already)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string (it should look like `mongodb+srv://username:password@cluster.mongodb.net/play2learn`)

### 2. Set Up Render Service

#### Option A: Using render.yaml (Recommended)

The repository includes a `render.yaml` file that automatically configures your deployment.

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Configure the environment variables (see section below)
6. Click "Apply" to deploy

#### Option B: Manual Setup

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the following:
   - **Name**: play2learn (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

### 3. Configure Environment Variables

In your Render dashboard, add the following environment variables:

#### Required Variables:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Sets the environment to production |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/play2learn` | Your MongoDB connection string |
| `JWT_SECRET` | `your-super-secret-key-here` | Secret key for JWT tokens (use a strong random string) |
| `PORT` | `5000` | Server port (Render sets this automatically, but defaults to 5000) |

#### Email Configuration (Required for password reset and notifications):

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `EMAIL_PORT` | `587` | SMTP server port |
| `EMAIL_SECURE` | `false` | Use TLS (false for port 587, true for port 465) |
| `EMAIL_USER` | `your-email@gmail.com` | SMTP username/email |
| `EMAIL_PASSWORD` | `your-app-password` | SMTP password or app password |
| `EMAIL_FROM` | `"Play2Learn <noreply@play2learn.com>"` | Email "from" address |

**Note for Gmail users**: Use an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password.

#### Optional Variables:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `FRONTEND_URL` | `https://play2learn-test.onrender.com` | URL where frontend is hosted (recommended to set explicitly) |
| `REACT_APP_API_URL` | `https://play2learn-test.onrender.com` | API URL for frontend to connect to (recommended for production) |
| `USER_DELETION_PIN` | `7h9p2k5m` | PIN required for user deletion (defaults to random) |

**Important Notes:**
- If you deploy backend and frontend on the **same** Render service (using the existing setup), set both `FRONTEND_URL` and `REACT_APP_API_URL` to the same Render URL (e.g., `https://your-app.onrender.com`)
- If you deploy backend and frontend **separately**, set `REACT_APP_API_URL` to your backend URL and `FRONTEND_URL` to your frontend URL
- For the standard single-service deployment, these values should be identical

### 4. Deploy

1. After setting environment variables, click "Create Web Service" or "Apply"
2. Render will start building and deploying your application
3. The build process includes:
   - Installing all dependencies (backend and frontend)
   - Building the React frontend
   - Starting the Node.js backend server

### 5. Post-Deployment Setup

#### Initialize Free Trial License

After successful deployment, you need to create the default Free Trial license:

1. Open the Render Shell for your service:
   - Go to your service in Render Dashboard
   - Click "Shell" tab
   
2. Run the initialization script:
   ```bash
   cd backend
   node init-trial-license.js
   ```

3. You should see output like:
   ```
   ✅ Connected to MongoDB
   ✅ Created Free Trial license successfully
   ```

#### Seed Questions (Optional)

If you want to add sample questions to the question bank:

```bash
cd backend
node seed-questions.js
```

### 6. Verify Deployment

1. Visit your Render URL (e.g., `https://play2learn-test.onrender.com`)
2. Check the health endpoint: `https://your-app.onrender.com/api/health`
3. Try to register a new institute account
4. Verify the account can log in

## Troubleshooting

### Build Fails

**Problem**: `npm run build` fails
- **Check**: Build logs in Render dashboard
- **Common causes**:
  - Missing dependencies
  - React build errors
  - Memory issues (upgrade Render plan if needed)

**Solution**: Review build logs and fix any errors in your code

### Server Won't Start

**Problem**: Server starts but crashes immediately
- **Check**: Server logs in Render dashboard
- **Common causes**:
  - `MONGODB_URI` not set
  - `JWT_SECRET` not set in production
  - MongoDB connection issues

**Solution**: 
1. Verify all required environment variables are set
2. Test MongoDB connection string locally
3. Check MongoDB Atlas IP whitelist includes 0.0.0.0/0

### CORS Errors

**Problem**: Frontend can't connect to backend
- **Symptoms**: Browser console shows CORS errors
- **Common causes**:
  - Frontend URL not in CORS allowed origins
  - Incorrect `FRONTEND_URL` environment variable

**Solution**:
1. Set `FRONTEND_URL` environment variable to your Render URL
2. Clear browser cache and try again
3. Check server logs for "CORS blocked" messages

### Email Not Working

**Problem**: Password reset emails not sent
- **Check**: Server logs for email errors
- **Common causes**:
  - Incorrect SMTP credentials
  - Gmail blocking "less secure apps"
  - Wrong EMAIL_HOST or EMAIL_PORT

**Solution**:
1. For Gmail: Use an App Password, not your regular password
2. Verify SMTP credentials by testing with a tool like `nodemailer`
3. Check EMAIL_PORT (587 for TLS, 465 for SSL)

### 404 on Routes

**Problem**: Direct URL navigation returns 404
- **Cause**: Static file serving not configured correctly
- **Solution**: Verify `NODE_ENV=production` is set

### Database Connection Timeout

**Problem**: "MongoDB connection failed" error
- **Solutions**:
  1. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
  2. Check connection string format
  3. Ensure database user has correct permissions
  4. Try connection from Render shell: `mongosh "your-connection-string"`

## Monitoring

### Health Checks

Render automatically monitors your service. You can also:
- Visit `/api/health` to check server and database status
- Monitor server logs in Render dashboard
- Set up custom alerts in Render

### Logs

View logs in Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Use filters to search specific errors

## Updating Your Deployment

### Automatic Deployment

If you enabled auto-deploy:
1. Push changes to your GitHub repository
2. Render automatically detects and deploys changes

### Manual Deployment

1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or select a specific commit/branch to deploy

## Performance Tips

1. **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Consider upgrading to paid tier for production use

2. **Build Optimization**:
   - The `CI=false` flag in build script ignores warnings
   - Consider enabling it in production: `CI=true npm run build --prefix frontend`

3. **Database Indexing**:
   - Ensure MongoDB indexes are created for better performance
   - Run index creation scripts after deployment

## Security Checklist

- [ ] Strong `JWT_SECRET` set (at least 32 random characters)
- [ ] `USER_DELETION_PIN` set to secure value
- [ ] Email credentials use app passwords, not account passwords
- [ ] MongoDB database user has minimum required permissions
- [ ] MongoDB IP whitelist configured correctly
- [ ] HTTPS enabled (automatic on Render)
- [ ] Environment variables stored securely in Render (not in code)

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

## Support

If you encounter issues not covered in this guide:
1. Check Render logs for detailed error messages
2. Review MongoDB Atlas logs
3. Test endpoints using `/api/health`
4. Check browser console for frontend errors

## Next Steps

After successful deployment:
1. Run `init-trial-license.js` to create default license
2. Create a P2L Admin account using `backend/create-admin.js`
3. Configure landing page content
4. Set up email templates
5. Test all major features (registration, login, quiz creation, etc.)
