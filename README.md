# Play2Learn - Adaptive Learning Platform

Play2Learn is an adaptive learning platform that combines gamification with personalized education to enhance student engagement and learning outcomes.

## Features

- **Adaptive Quizzes**: AI-powered quiz generation that adapts to student performance
- **Gamification**: Points, badges, leaderboards, and rewards
- **Multi-Role Support**: Students, Teachers, Parents, School Admins, and Platform Admins
- **License Management**: Flexible subscription plans for institutions
- **Real-time Analytics**: Track student progress and performance
- **Parent Portal**: Parents can monitor their children's progress
- **Teacher Tools**: Class management, quiz creation, student tracking

## Tech Stack

### Frontend
- React 19.2
- React Router 7.9
- Create React App 5.0

### Backend
- Node.js
- Express.js 4.18
- MongoDB with Mongoose 9.1
- JWT Authentication
- Nodemailer for emails

## Quick Start

### Prerequisites
- Node.js >= 16.0.0
- MongoDB (local or MongoDB Atlas)
- SMTP email service (Gmail recommended for development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fujiorange/FYP-25-S4-14P_Play2Learn.git
   cd FYP-25-S4-14P_Play2Learn
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```
   
   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3000

5. **Initialize database (first time only)**
   ```bash
   cd backend
   node init-trial-license.js
   ```

## Deployment

### Deploy to Render

**Quick Deployment:**

1. Push this repository to GitHub
2. Sign up at [Render.com](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Render will auto-detect the `render.yaml` configuration
6. Set environment variables (see below)
7. Deploy!

**📘 Full Instructions:** See [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)

**📧 Email Setup:** See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) for detailed email configuration

**🚨 Troubleshooting:** See [RENDER_QUICK_FIX.md](RENDER_QUICK_FIX.md)

### Required Environment Variables for Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn
JWT_SECRET=<generate-a-secure-32-char-string>
FRONTEND_URL=https://your-app.onrender.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<gmail-app-password>
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Project Structure

```
FYP-25-S4-14P_Play2Learn/
├── backend/              # Express.js backend
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication, etc.
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
│   └── public/          # Static assets
├── database/            # Database scripts
├── package.json         # Root package config
└── render.yaml          # Render deployment config
```

## Available Scripts

### Root Level

- `npm run install-all` - Install all dependencies (backend + frontend)
- `npm run build` - Build frontend for production
- `npm start` - Start backend server
- `npm run dev` - Start both backend and frontend in development mode
- `npm run render-build` - Build command for Render deployment

### Backend

```bash
cd backend
npm start           # Start server
npm run dev         # Start with nodemon (auto-reload)

# Email testing utilities
node verify-email-config.js  # Verify email configuration
node test-email.js           # Send test email
```

### Frontend

```bash
cd frontend
npm start           # Start dev server (port 3000)
npm run build       # Build for production
npm test            # Run tests
```

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint
- `GET /api/public/landing-page` - Landing page data
- `GET /api/public/maintenance` - Maintenance broadcasts

### Authentication
- `POST /api/mongo/auth/register` - Register new user
- `POST /api/mongo/auth/login` - User login
- `POST /api/mongo/auth/logout` - User logout

### Student
- `GET /api/mongo/student/*` - Student routes (protected)

### Teacher
- `GET /api/mongo/teacher/*` - Teacher routes (protected)

### Parent
- `GET /api/mongo/parent/*` - Parent routes (protected)

### Admin
- `GET /api/p2ladmin/*` - Platform admin routes
- `GET /school-admin/*` - School admin routes

## Documentation

- [Render Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Render Quick Fix Guide](RENDER_QUICK_FIX.md) - Common deployment issues and fixes
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Feature deployment checklist
- [Setup Instructions](Readme_v1.txt) - Original setup guide

## Common Issues

### Build fails on Render
**Solution:** Already fixed! The `render.yaml` includes `CI=false` to prevent warnings from failing the build.

### MongoDB connection fails
**Solution:** 
1. Verify MONGODB_URI is set correctly
2. Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas
3. URL-encode special characters in password

### CORS errors
**Solution:** Set `FRONTEND_URL` environment variable to your Render app URL

### Email not sending
**Solution:** 
1. Use Gmail App Password (not regular password)
2. Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords

See [RENDER_QUICK_FIX.md](RENDER_QUICK_FIX.md) for more troubleshooting.

## Development Notes

### MongoDB Local Setup
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (recommended for production)
```

### Email Testing
For development, you can use:
- Gmail with App Password
- Ethereal Email (fake SMTP for testing): https://ethereal.email/
- Mailtrap: https://mailtrap.io/

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of a Final Year Project (FYP) for academic purposes.

## Support

For deployment issues, see:
- [Render Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md)
- [Quick Fix Guide](RENDER_QUICK_FIX.md)

For application issues, create an issue in the GitHub repository.

## Authors

FYP-25-S4-14P Team

---

**Last Updated:** February 2026
