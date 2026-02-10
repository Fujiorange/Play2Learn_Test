# Quick Deployment Reference - Render

## 🚀 Quick Start (5 Minutes)

### Step 1: Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render detects `render.yaml` automatically

### Step 2: Set Environment Variables
**Required:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/play2learn
JWT_SECRET=<generate-random-32-char-string>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<gmail-app-password>
EMAIL_FROM="Play2Learn <noreply@play2learn.com>"
```

**Recommended:**
```
FRONTEND_URL=https://your-app.onrender.com
REACT_APP_API_URL=https://your-app.onrender.com
```

### Step 3: Deploy
Click **Apply** - Render will build and deploy automatically!

### Step 4: Post-Deployment (One-Time Setup)
Open Render Shell and run:
```bash
cd backend
node init-trial-license.js
```

## ✅ Verify Deployment

Check these URLs:
- `https://your-app.onrender.com/` - Should show API info
- `https://your-app.onrender.com/api/health` - Should return `{"success": true}`
- `https://your-app.onrender.com` - Should load React app

## 🔧 Quick Troubleshooting

**Build fails?**
→ Check build logs in Render dashboard

**Server crashes on start?**
→ Verify `MONGODB_URI` and `JWT_SECRET` are set

**CORS errors?**
→ Set `FRONTEND_URL` to your Render URL

**Email not working?**
→ Use Gmail App Password, not regular password

## 📚 Full Documentation
See `RENDER_DEPLOYMENT_GUIDE.md` for complete instructions

## 🆘 Need Help?
Check `/api/health` endpoint first - it shows database status and server info
