# Play2Learn - Educational Gamification Platform

## 📚 Overview

**Play2Learn** is a comprehensive full-stack educational platform that gamifies the learning experience through interactive quizzes, adaptive assessments, assignments, and reward systems. The platform supports multiple user roles with role-based features to create an engaging learning ecosystem for students, teachers, parents, and administrators.

## 🏗️ Architecture

Play2Learn follows a modern three-tier architecture:

### Frontend (React.js)
- **Technology Stack**: React 19, React Router v7, React Scripts
- **Purpose**: Responsive user interface for all user roles
- **Key Pages**:
  - Authentication (Login, Registration, Password Management)
  - Dynamic Landing Page with Testimonials
  - Student Dashboard (Quizzes, Assignments, Progress Tracking)
  - Teacher Dashboard (Student Management, Feedback, Assignments)
  - Parent Portal (Child Monitoring, Performance Tracking)
  - School Admin Panel (User Management, Class Management)
  - P2L Admin Dashboard (Question Bank, Quiz Creation, School Management)

### Backend (Node.js/Express)
- **Technology Stack**: Express.js, Node.js, JWT, bcrypt, Nodemailer
- **Database**: MongoDB (Primary) with Mongoose ODM, MySQL (Legacy backup)
- **Purpose**: RESTful API server, authentication, business logic
- **Key API Routes**:
  - `/api/auth` - Authentication (Login, Registration, Password Reset)
  - `/api/student` - Student operations (Quizzes, Assignments, Progress)
  - `/api/teacher` - Teacher operations
  - `/api/parent` - Parent operations
  - `/api/schooladmin` - School administration
  - `/api/p2ladmin` - Platform administration
  - `/api/adaptive-quiz` - Adaptive quiz engine

### Database Layer
**MongoDB Collections**:
- `users` - All user accounts (students, teachers, parents, admins)
- `questions` - Question bank with metadata
- `quizzes` - Quiz configurations
- `studentprofiles` - Student academic profiles
- `studentquizzes` - Quiz history and results
- `quizattempts` - Individual quiz attempts
- `mathskills` & `mathprofiles` - Skill tracking
- `schools` - School information
- `testimonials` - User testimonials
- `supporttickets` - Support system
- `landingpages` - Landing page content
- `maintenances` - System announcements

**Legacy**: MySQL database backup available in `/database` directory

## 🔑 Key Features

### 👨‍🎓 For Students
- ✅ **Adaptive Quizzes** - Intelligent question selection based on performance
- ✅ **Quiz History** - Detailed results and analytics
- ✅ **Skill Matrix** - Visual representation of learning progress
- ✅ **Rewards System** - Points, badges, and achievements
- ✅ **Assignments** - Deadline tracking and submissions
- ✅ **Leaderboards** - Performance comparison with peers
- ✅ **Progress Tracking** - Comprehensive learning analytics
- ✅ **Support Tickets** - Issue reporting and resolution

### 👨‍🏫 For Teachers
- ✅ **Student Analytics** - Performance monitoring and insights
- ✅ **Assignment Management** - Create, modify, and track assignments
- ✅ **Feedback System** - Provide personalized student feedback
- ✅ **Progress Monitoring** - Track student learning journeys
- ✅ **Testimonial Management** - Review and manage testimonials
- ✅ **Class Management** - Organize students and sections

### 👪 For Parents
- ✅ **Child Performance** - View comprehensive learning analytics
- ✅ **Progress Tracking** - Monitor skill development
- ✅ **Skill Matrix View** - Visual learning progress
- ✅ **Teacher Feedback** - Access feedback from teachers
- ✅ **Support System** - Submit tickets for concerns

### 🏫 For School Admins
- ✅ **Bulk User Management** - CSV upload for mass user creation
- ✅ **Manual Registration** - Individual user creation
- ✅ **Class/Section Management** - Organize school structure
- ✅ **Points & Badge Configuration** - Customize reward system
- ✅ **Password Management** - Reset and temporary password generation
- ✅ **User Account Control** - Enable/disable user accounts

### 🎯 For P2L Admins (Platform Administrators)
- ✅ **Question Bank Management** - Full CRUD operations on questions
- ✅ **Quiz Creation** - Standard and adaptive quiz configuration
- ✅ **Adaptive Quiz Engine** - Intelligent difficulty scaling
- ✅ **School Management** - Multi-school support
- ✅ **School Admin Management** - Platform-wide user administration
- ✅ **Landing Page Customization** - Dynamic content management
- ✅ **Bulk Operations** - Mass question import/export
- ✅ **Health Checks** - System monitoring and maintenance
- ✅ **Subject-based Filtering** - Advanced question organization
- ✅ **Email Configuration** - Multi-provider SMTP support

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, React Router DOM v7, React Scripts 5 |
| **Backend** | Express.js 4, Node.js (>=16.0.0) |
| **Database** | MongoDB 7 with Mongoose 9, MySQL 2 (legacy) |
| **Authentication** | JWT (JSON Web Tokens), bcrypt 6 |
| **Email** | Nodemailer 7 (Gmail, Outlook, SendGrid, Mailgun) |
| **File Processing** | Multer 2 (uploads), CSV Parser 3 |
| **Analytics** | Sentiment Analysis 5 |
| **Development** | Nodemon 3, Concurrently 8 |
| **Deployment** | Render Cloud Platform |

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Play2Learn_Test
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This installs dependencies for both frontend and backend.

3. **Configure environment variables**
   
   Create `.env` file in `/backend` directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Email Configuration (choose one provider)
   EMAIL_SERVICE=gmail|outlook|sendgrid|mailgun
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_email_password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development|production
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the backend server**
   ```bash
   npm start
   ```

### Database Setup

#### Seed Initial Data (Optional)

1. **Create admin account**
   ```bash
   cd backend
   node create-admin.js
   ```

2. **Seed sample questions**
   ```bash
   node seed-questions.js
   ```

3. **Check question database**
   ```bash
   node check-questions.js
   ```

## 📁 Project Structure

```
Play2Learn_Test/
├── backend/                    # Backend server code
│   ├── models/                 # MongoDB Mongoose models
│   │   ├── User.js            # User accounts model
│   │   ├── Question.js        # Question bank model
│   │   ├── Quiz.js            # Quiz configuration model
│   │   ├── StudentProfile.js  # Student academic profile
│   │   ├── School.js          # School information model
│   │   └── ...                # Other models
│   ├── routes/                # API route handlers
│   │   ├── mongoAuthRoutes.js         # Authentication APIs
│   │   ├── mongoStudentRoutes.js      # Student APIs
│   │   ├── p2lAdminRoutes.js          # P2L Admin APIs
│   │   ├── schoolAdminRoutes.js       # School Admin APIs
│   │   ├── mongoParentRoutes.js       # Parent APIs
│   │   └── adaptiveQuizRoutes.js      # Adaptive quiz engine
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic services
│   ├── utils/                 # Utility functions
│   ├── server.js              # Express server entry point
│   └── package.json           # Backend dependencies
│
├── frontend/                  # React frontend code
│   ├── public/                # Static assets
│   ├── src/                   # React source code
│   │   ├── components/        # React components
│   │   ├── App.js            # Main app component
│   │   └── index.js          # React entry point
│   └── package.json          # Frontend dependencies
│
├── database/                  # Database scripts and backups
│   └── mysql/                # Legacy MySQL database
│
├── package.json              # Root package.json for scripts
└── README.md                 # This file
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **JWT Authentication**: Token-based authentication with expiry
- **Role-Based Access Control (RBAC)**: Fine-grained permissions per user role
- **Input Validation**: Server-side validation on all user inputs
- **CORS Configuration**: Controlled cross-origin resource sharing
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: Input sanitization

## 🧪 Testing

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Test Specific Features
```bash
cd backend
node test-adaptive-quiz.js      # Test adaptive quiz engine
node test-email.js              # Test email service
node test-mongo.js              # Test MongoDB connection
node test-registration-fix.js   # Test registration flow
node test-question-stats.js     # Test question statistics
```

## 📧 Email Integration

Play2Learn supports multiple email providers:

- **Gmail** - Standard SMTP
- **Outlook** - Microsoft SMTP
- **SendGrid** - Cloud email service
- **Mailgun** - Transactional email API

Configure in backend `.env` file with appropriate credentials.

## 🌐 Deployment

### Render Cloud Platform

The application is configured for deployment on Render:

1. **Build Command**: `npm run render-build`
2. **Start Command**: `npm start`
3. **Environment**: Set environment variables in Render dashboard
4. **Node Version**: >= 16.0.0

### Environment Variables Required
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`
- `FRONTEND_URL`
- `NODE_ENV=production`

## 📊 Recent Enhancements

- ✨ **Question Bank Improvements**: Subject-based filtering, bulk delete operations
- ✨ **Email Service Enhancement**: Multi-provider SMTP support
- ✨ **Temporary Password Feature**: Streamlined new user onboarding
- ✨ **Testimonial System**: User testimonials for landing page
- ✨ **Maintenance Broadcasting**: System-wide announcements
- ✨ **Adaptive Quiz Engine**: Intelligent difficulty progression
- ✨ **Support Ticket System**: Integrated issue tracking
- ✨ **Landing Page Customization**: Dynamic content management

## 🤝 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Student** | Primary learners | Quizzes, assignments, progress tracking |
| **Teacher** | Educators | Student management, feedback, assignments |
| **Parent** | Guardians | Child monitoring, performance tracking |
| **School Admin** | School administrators | User management, school configuration |
| **P2L Admin** | Platform administrators | Full platform control, question bank, multi-school |

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Student Endpoints
- `GET /api/student/quizzes` - Get available quizzes
- `POST /api/student/quiz/submit` - Submit quiz attempt
- `GET /api/student/progress` - Get learning progress
- `GET /api/student/assignments` - Get assignments
- `GET /api/student/leaderboard` - Get leaderboard

### Admin Endpoints
- `GET /api/p2ladmin/questions` - Get question bank
- `POST /api/p2ladmin/question` - Create question
- `PUT /api/p2ladmin/question/:id` - Update question
- `DELETE /api/p2ladmin/question/:id` - Delete question
- `POST /api/p2ladmin/quiz` - Create quiz
- `GET /api/p2ladmin/schools` - Manage schools

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify `MONGODB_URI` in `.env`
   - Check MongoDB service is running
   - Ensure network connectivity

2. **Email Not Sending**
   - Verify email credentials in `.env`
   - Check email service provider settings
   - Review app-specific password requirements

3. **Frontend Not Loading**
   - Clear browser cache
   - Check console for errors
   - Verify backend API is running

4. **Build Errors**
   - Delete `node_modules` and reinstall: `npm run install-all`
   - Check Node.js version: `node --version` (should be >= 16.0.0)

## 📄 License

ISC

## 👥 Contributing

This is an educational platform project. For contributions or issues, please contact the project maintainers.

---

**Built with ❤️ for transforming education through gamification**
