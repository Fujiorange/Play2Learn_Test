# Backend Database Summary - Play2Learn

## Table of Contents
1. [Overview](#overview)
2. [Database Technology](#database-technology)
3. [Database Models](#database-models)
4. [Data Flow Architecture](#data-flow-architecture)
5. [API Routes & Operations](#api-routes--operations)
6. [Authentication & Security](#authentication--security)
7. [Data Relationships](#data-relationships)

---

## Overview

Play2Learn uses a **MongoDB** database with **Mongoose ODM** for schema modeling and validation. The backend is built with **Express.js** and follows a RESTful API architecture with JWT-based authentication.

**Key Technologies:**
- Database: MongoDB (v7.0.0)
- ODM: Mongoose (v9.1.3)
- Server: Express.js
- Authentication: JWT (JSON Web Tokens)
- Password Hashing: bcrypt
- CORS enabled for cross-origin requests

---

## Database Technology

### Connection Configuration
**Location:** `backend/server.js` (lines 62-67)

```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';
```

**Features:**
- Supports both local MongoDB and MongoDB Atlas (cloud)
- Connection timeout: 5 seconds (serverSelectionTimeoutMS)
- Environment-based configuration via `.env` file
- Automatic reconnection on connection loss

---

## Database Models

The application uses 17 MongoDB models located in `backend/models/`. Each model represents a collection in the database.

### 1. User Model (`User.js`)

**Purpose:** Core user entity supporting multiple roles

**Schema Fields:**
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  role: Enum ['Platform Admin', 'p2ladmin', 'School Admin', 'Teacher', 
              'Student', 'Parent', 'Trial Student', 'Trial Teacher'],
  schoolId: String (nullable),
  contact: String,
  salutation: String,
  gender: Enum ['male', 'female', 'other', 'prefer-not-to-say'],
  date_of_birth: Date,
  profile_picture: String (URL or dataURL),
  
  // Student-specific
  class: String,
  gradeLevel: String,
  username: String,
  
  // Teacher-specific
  assignedClasses: [String],
  assignedSubjects: [String],
  
  // Parent-specific
  linkedStudents: [{
    studentId: ObjectId,
    relationship: String
  }],
  
  // Account management
  emailVerified: Boolean (default: false),
  verificationToken: String,
  accountActive: Boolean (default: true),
  requirePasswordChange: Boolean (default: false),
  tempPassword: String,
  credentialsSent: Boolean (default: false),
  credentialsSentAt: Date,
  
  createdBy: String,
  isTrialUser: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ schoolId: 1, role: 1 }` - For school-based user queries
- `{ role: 1 }` - For role-based filtering
- `{ 'linkedStudents.studentId': 1 }` - For parent-student lookup

**Data Storage:**
- Passwords are hashed using bcrypt (10 salt rounds) before storage
- Email addresses are converted to lowercase for consistency
- Profile pictures can be stored as URLs or base64 dataURLs

**Data Fetching:**
- Retrieved via email during login (`User.findOne({ email })`)
- Retrieved via userId for profile operations
- Bulk fetched by schoolId and role for school admin operations

**Data Sending:**
- Password field is never sent to frontend
- User object is sanitized before sending in responses
- JWT tokens include userId, email, and role

---

### 2. StudentProfile Model (`StudentProfile.js`)

**Purpose:** Student-specific gamification and progress tracking

**Schema Fields:**
```javascript
{
  userId: ObjectId (ref: 'User', required, unique),
  currentLevel: Number (1-10, default: 1),
  gameboard_position: Number (1-10, default: 1),
  character_type: Enum ['male', 'female', 'neutral'] (default: 'neutral'),
  totalPoints: Number (default: 0),
  badges: [String],
  loginStreak: Number (default: 0),
  lastLoginDate: Date,
  lastQuizTaken: Date,
  performanceHistory: [{
    quizLevel: Number,
    performanceScore: Number,
    completedAt: Date
  }],
  quiz_history: [{
    level_attempted: Number,
    P_score: Number,
    next_level: Number,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Created automatically when a student user is created
- Points accumulate from quiz performance
- Login streak is calculated based on consecutive daily logins (Singapore timezone)

**Data Fetching:**
- Retrieved via userId (`StudentProfile.findOne({ userId })`)
- Used in student dashboard to display progress

**Data Sending:**
- Full profile sent to student dashboard
- Performance history used for charts and analytics

---

### 3. MathProfile Model (`MathProfile.js`)

**Purpose:** Math-specific student progression and adaptive quiz tracking

**Schema Fields:**
```javascript
{
  student_id: ObjectId (ref: 'User'),
  current_profile: Number (1-10, default: 1),
  placement_completed: Boolean (default: false),
  adaptive_quiz_level: Number (1-10, default: 1),
  total_points: Number (default: 0),
  streak: Number (default: 0),
  last_quiz_date: Date,
  skill_matrix: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Points-based leveling system with thresholds:
  - Level 0: 0-24 points
  - Level 1: 25-49 points
  - Level 2: 50-99 points
  - Level 3: 100-199 points
  - Level 4: 200-399 points
  - Level 5: 400+ points
- Streak is updated on quiz completion (consecutive daily completion)

**Data Fetching:**
- Retrieved via student_id for math progress tracking
- Used to determine which quiz level to present

**Data Sending:**
- Math profile data sent to student dashboard
- Skill matrix sent for skill-based analytics

---

### 4. Quiz Model (`Quiz.js`)

**Purpose:** Quiz definitions with adaptive configuration and launch system

**Schema Fields:**
```javascript
{
  title: String (required),
  description: String,
  quiz_type: Enum ['placement', 'adaptive'] (default: 'adaptive'),
  quiz_level: Number (1-10),
  questions: [{
    question_id: ObjectId (ref: 'Question'),
    text: String,
    choices: [String],
    answer: String,
    difficulty: Number (1-5)
  }],
  is_adaptive: Boolean (default: true),
  is_active: Boolean (default: true),
  is_auto_generated: Boolean (default: false),
  generation_criteria: String,
  unique_hash: String,
  adaptive_config: {
    target_correct_answers: Number (default: 20),
    difficulty_progression: Enum ['gradual', 'immediate', 'ml-based'] (default: 'gradual'),
    starting_difficulty: Number (1-5, default: 1)
  },
  
  // Quiz launch system
  is_launched: Boolean (default: false),
  launched_by: ObjectId (ref: 'User'),
  launched_at: Date,
  launched_for_classes: [String],
  launched_for_school: String,
  launch_start_date: Date,
  launch_end_date: Date,
  
  created_by: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ quiz_type: 1, is_active: 1 }` - For filtering active quizzes by type
- `{ is_launched: 1, is_active: 1 }` - For finding launched quizzes
- `{ quiz_level: 1, is_active: 1 }` - For level-based quiz selection
- `{ is_auto_generated: 1 }` - For managing auto-generated quizzes

**Data Storage:**
- Questions can be embedded or referenced
- Auto-generated quizzes have a unique_hash to prevent duplicates
- Launch system allows teachers to assign quizzes to specific classes

**Data Fetching:**
- Placement quizzes fetched by school admin
- Adaptive quizzes fetched by quiz level for students
- Launched quizzes fetched for specific classes

**Data Sending:**
- Full quiz with questions sent when quiz starts
- Questions sent one at a time for adaptive quizzes
- Launch status visible to teachers

---

### 5. QuizAttempt Model (`QuizAttempt.js`)

**Purpose:** Individual quiz attempt tracking with performance scoring

**Schema Fields:**
```javascript
{
  userId: ObjectId (ref: 'User', required),
  quizId: ObjectId (ref: 'Quiz', required),
  quizLevel: Number (1-10, default: 1),
  score: Number (default: 0),
  answers: [{
    questionId: ObjectId,
    question_text: String,
    difficulty: Number,
    answer: String,
    correct_answer: String,
    isCorrect: Boolean,
    timeSpent: Number (seconds),
    answeredAt: Date
  }],
  current_difficulty: Number (default: 1),
  correct_count: Number (default: 0),
  total_answered: Number (default: 0),
  is_completed: Boolean (default: false),
  performanceScore: Number (default: 0),
  nextLevel: Number (1-10),
  startedAt: Date,
  completedAt: Date,
  timeSpent: Number (total seconds)
}
```

**Indexes:**
- `{ userId: 1, is_completed: 1 }` - For user's attempt history
- `{ userId: 1, startedAt: -1 }` - For chronological attempt listing

**Data Storage:**
- Created when student starts a quiz
- Updated after each question is answered
- Performance score calculated on quiz completion using progressive scoring:
  - Accuracy score (correctAnswers / totalQuestions)
  - Speed bonus (0.5 if very fast, -0.2 if slow)
  - Difficulty bonus (based on quiz level)

**Data Fetching:**
- Retrieved for quiz results page
- Used to calculate next recommended level
- Aggregated for student performance analytics

**Data Sending:**
- Complete attempt data sent after quiz completion
- Progress data sent during quiz for tracking

---

### 6. Question Model (`Question.js`)

**Purpose:** Question bank for quizzes

**Schema Fields:**
```javascript
{
  subject: String,
  topic: String,
  difficulty: Number (1-5),
  text: String,
  choices: [String],
  answer: String,
  explanation: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Questions stored with difficulty levels for adaptive quiz generation
- Multiple choice format with text and choices

**Data Fetching:**
- Filtered by subject, topic, and difficulty for quiz generation
- Random selection for variety

**Data Sending:**
- Question text and choices sent to frontend
- Answer only sent after student submits response

---

### 7. School Model (`School.js`)

**Purpose:** School account management with license binding

**Schema Fields:**
```javascript
{
  organization_name: String (required),
  organization_type: String (default: 'school'),
  licenseId: ObjectId (ref: 'License', required),
  licenseExpiresAt: Date,
  
  // Subscription management
  billingCycle: Enum ['monthly', 'yearly'],
  subscriptionStatus: Enum ['active', 'cancelled', 'expired'] (default: 'active'),
  autoRenew: Boolean (default: false),
  nextBillingDate: Date,
  cancelledAt: Date,
  
  contact: String,
  is_active: Boolean (default: true),
  current_teachers: Number (default: 0),
  current_students: Number (default: 0),
  current_classes: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Each school is tied to a license plan
- User counts are tracked for license limit enforcement
- Free trial license has no expiration

**Data Fetching:**
- Retrieved by school admin for dashboard
- Used to enforce license limits

**Data Sending:**
- School details with license info sent to school admin
- Current usage vs. limits displayed

---

### 8. License Model (`License.js`)

**Purpose:** Subscription plans with tier-based limits

**Schema Fields:**
```javascript
{
  name: String (required, unique),
  type: Enum ['free', 'paid'],
  priceMonthly: Number,
  priceYearly: Number,
  maxTeachers: Number,
  maxStudents: Number,
  maxClasses: Number,
  features: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Default licenses include "Free Trial", "Basic", "Premium"
- Limits enforced when creating users or classes

**Data Fetching:**
- All active licenses fetched for selection during registration
- License details retrieved with school info

**Data Sending:**
- License plans displayed on registration page
- Current license and limits shown in school admin dashboard

---

### 9. Class Model (`Class.js`)

**Purpose:** Class grouping with teacher/student references

**Schema Fields:**
```javascript
{
  class_name: String (required),
  grade: Enum ['Primary 1', 'Primary 2', 'Primary 3', 
               'Primary 4', 'Primary 5', 'Primary 6'],
  teachers: [ObjectId] (ref: 'User'),
  students: [ObjectId] (ref: 'User'),
  subjects: [String],
  school_id: ObjectId (ref: 'School'),
  is_active: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Data Storage:**
- Many-to-many relationship between teachers and students
- Class creation restricted by school's license limits

**Data Fetching:**
- Retrieved by school_id for school admin
- Retrieved for teachers to see their assigned classes

**Data Sending:**
- Class lists with student/teacher counts
- Full class details with members for class management

---

### 10. Additional Models

#### MathSkill (`MathSkill.js`)
- Math skill definitions and tracking
- Used for skill-based analytics

#### Testimonial (`Testimonial.js`)
```javascript
{
  student_name: String,
  user_role: String,
  message: String,
  rating: Number,
  display_on_landing: Boolean,
  created_at: Date
}
```
- User testimonials for landing page
- Fetched for public landing page display

#### LandingPage (`LandingPage.js`)
```javascript
{
  blocks: Array,
  is_active: Boolean,
  custom_data: Object
}
```
- Dynamic landing page configuration
- Cached for 5 minutes on public endpoint

#### Maintenance (`Maintenance.js`)
```javascript
{
  is_active: Boolean,
  start_date: Date,
  end_date: Date,
  message: String
}
```
- Maintenance broadcast management
- Public endpoint for downtime notifications

#### SupportTicket (`SupportTicket.js`)
- Support/help request tracking
- Used by students, parents, and teachers

#### SkillPointsConfig (`SkillPointsConfig.js`)
- Gamification point configuration
- Defines point values for different difficulty levels

#### MarketSurvey (`MarketSurvey.js`)
- Survey/feedback collection
- Captured during registration process

#### StudentQuiz (`StudentQuiz.js`)
- Quiz-student associations
- Legacy model (mostly replaced by QuizAttempt)

---

## Data Flow Architecture

### 1. User Registration Flow

```
Frontend → POST /api/mongo/auth/register
         ↓
Server validates input
         ↓
bcrypt.hash(password) → Hashed password
         ↓
new User({ email, password: hashedPassword, ... })
         ↓
User.save() → MongoDB
         ↓
Response: { success: true, message: 'Registration successful' }
```

**Data Stored:**
- User document in `users` collection
- Password is hashed before storage (never plain text)
- Email is lowercased for consistency

---

### 2. User Login Flow

```
Frontend → POST /api/mongo/auth/login
         ↓
User.findOne({ email: email.toLowerCase() })
         ↓
MongoDB returns user document (or null)
         ↓
bcrypt.compare(password, user.password)
         ↓
If match: jwt.sign({ userId, email, role }, JWT_SECRET)
         ↓
Response: { 
  success: true, 
  token: 'jwt-token',
  user: { userId, name, email, role, ... }
}
```

**Data Fetched:**
- User document retrieved by email
- Password hash compared with provided password

**Data Sent:**
- JWT token for subsequent authenticated requests
- User object (without password) for frontend state

---

### 3. Quiz Start Flow

```
Frontend → POST /api/adaptive-quiz/start
         ↓
authenticateToken(req) → Verify JWT
         ↓
MathProfile.findOne({ student_id: userId })
         ↓
Quiz.findOne({ quiz_level, is_active: true })
         ↓
new QuizAttempt({
  userId,
  quizId,
  quizLevel,
  startedAt: Date.now()
})
         ↓
QuizAttempt.save() → MongoDB
         ↓
Response: {
  attemptId,
  quiz: { title, questions },
  currentDifficulty: 1
}
```

**Data Stored:**
- QuizAttempt document created with initial state
- startedAt timestamp recorded

**Data Fetched:**
- MathProfile to determine appropriate quiz level
- Quiz document with questions

**Data Sent:**
- Quiz questions (one at a time for adaptive quizzes)
- Attempt ID for tracking progress

---

### 4. Quiz Answer Submission Flow

```
Frontend → POST /api/adaptive-quiz/answer/:attemptId
         ↓
QuizAttempt.findById(attemptId)
         ↓
Validate answer correctness
         ↓
Calculate points based on difficulty:
  - Difficulty 1: +1 (correct), -2.5 (wrong)
  - Difficulty 2: +2 (correct), -2.0 (wrong)
  - Difficulty 3: +3 (correct), -1.5 (wrong)
  - Difficulty 4: +4 (correct), -1.0 (wrong)
  - Difficulty 5: +5 (correct), -0.5 (wrong)
         ↓
Update QuizAttempt:
  - answers.push({ questionId, answer, isCorrect, timeSpent })
  - correct_count += (isCorrect ? 1 : 0)
  - total_answered += 1
  - Adjust current_difficulty
         ↓
QuizAttempt.save() → MongoDB
         ↓
Response: {
  isCorrect,
  correct_answer,
  nextDifficulty,
  progress: total_answered / 20
}
```

**Data Stored:**
- Answer added to QuizAttempt.answers array
- Counters updated (correct_count, total_answered)
- Difficulty adjusted for next question

**Data Sent:**
- Immediate feedback on answer correctness
- Next question difficulty level
- Progress indicator

---

### 5. Quiz Completion Flow

```
Frontend → POST /api/adaptive-quiz/complete/:attemptId
         ↓
QuizAttempt.findById(attemptId)
         ↓
Calculate performance score:
  accuracyScore = correct_count / 20
  speedBonus = f(timeElapsed)
  difficultyBonus = (quizLevel - 1) * 0.2
  performanceScore = accuracyScore * (1 + speedBonus) * (1 + difficultyBonus)
         ↓
Determine next level:
  - If accuracy < 40%: level down
  - If accuracy < 70%: stay (blocked)
  - If score >= 0.85: level up
  - If score >= 1.20: skip 2 levels
         ↓
Update QuizAttempt:
  - is_completed = true
  - completedAt = Date.now()
  - performanceScore = calculated score
  - nextLevel = determined level
         ↓
Update MathProfile:
  - total_points += points earned
  - adaptive_quiz_level = nextLevel
  - current_profile = calculateLevelFromPoints(total_points)
  - streak = updateStreakOnCompletion()
         ↓
Update StudentProfile:
  - quiz_history.push({ level_attempted, P_score, next_level })
  - performanceHistory.push({ quizLevel, performanceScore })
         ↓
Save all updates → MongoDB
         ↓
Response: {
  score,
  performanceScore,
  nextLevel,
  levelChange,
  progression,
  totalPoints,
  newLevel
}
```

**Data Stored:**
- QuizAttempt marked as completed with final scores
- MathProfile updated with new level and points
- StudentProfile updated with quiz history

**Data Fetched:**
- QuizAttempt retrieved for calculations
- MathProfile and StudentProfile for updates

**Data Sent:**
- Complete quiz results
- Performance metrics
- Next recommended level
- Updated profile data

---

### 6. Student Dashboard Data Flow

```
Frontend → GET /api/mongo/student/dashboard
         ↓
authenticateToken(req) → Verify JWT
         ↓
Parallel data fetching:
  - User.findById(userId)
  - MathProfile.findOne({ student_id: userId })
  - StudentProfile.findOne({ userId })
  - QuizAttempt.find({ userId, is_completed: true })
    .sort({ completedAt: -1 })
    .limit(10)
  - Quiz.find({ is_launched: true, launched_for_classes: user.class })
         ↓
Calculate dashboard metrics:
  - Current level (from MathProfile.current_profile)
  - Total points (from MathProfile.total_points)
  - Login streak (computed from MathProfile.last_quiz_date)
  - Recent quiz history
  - Available quizzes
         ↓
Response: {
  user: { name, email, class, gradeLevel },
  mathProfile: { current_profile, total_points, streak },
  studentProfile: { gameboard_position, badges },
  recentQuizzes: [...],
  availableQuizzes: [...]
}
```

**Data Fetched:**
- User profile data
- Math progress and points
- Student gamification data
- Recent quiz attempts
- Available quizzes for the student's class

**Data Sent:**
- Comprehensive dashboard data
- All metrics needed for frontend display

---

### 7. Teacher Dashboard Data Flow

```
Frontend → GET /api/mongo/teacher/dashboard
         ↓
authenticateToken(req) → Verify JWT
         ↓
User.findById(userId) → Get teacher info
         ↓
Get assigned classes and subjects from teacher.assignedClasses
         ↓
Parallel data fetching:
  - User.countDocuments({ role: 'Student', class: { $in: assignedClasses } })
  - Quiz.countDocuments({ launched_by: userId, is_launched: true })
  - QuizAttempt.find({ userId: { $in: studentIds } })
    .populate('userId')
    .populate('quizId')
    .sort({ completedAt: -1 })
    .limit(20)
         ↓
Calculate class performance metrics:
  - Average quiz scores per class
  - Student participation rates
  - Recent quiz completions
         ↓
Response: {
  teacher: { name, assignedClasses, assignedSubjects },
  totalStudents,
  activeQuizzes,
  recentAttempts: [...],
  classPerformance: { ... }
}
```

**Data Fetched:**
- Teacher's assigned classes and subjects
- Student count in assigned classes
- Active launched quizzes
- Recent quiz attempts by students
- Aggregated performance data

**Data Sent:**
- Teacher dashboard metrics
- Class performance summaries
- Recent student activity

---

### 8. School Admin Data Flow

```
Frontend → GET /api/mongo/school-admin/dashboard
         ↓
authenticateToken(req) → Verify JWT
         ↓
User.findById(userId) → Get school admin info
         ↓
School.findById(user.schoolId).populate('licenseId')
         ↓
Parallel data fetching:
  - User.countDocuments({ schoolId, role: 'Teacher' })
  - User.countDocuments({ schoolId, role: 'Student' })
  - Class.countDocuments({ school_id: schoolId })
  - License data (limits and current usage)
         ↓
Calculate capacity metrics:
  - Teachers: current vs. max
  - Students: current vs. max
  - Classes: current vs. max
  - License expiration status
         ↓
Response: {
  school: { organization_name, subscriptionStatus },
  license: { name, type, limits },
  usage: {
    teachers: { current, max, percentage },
    students: { current, max, percentage },
    classes: { current, max, percentage }
  }
}
```

**Data Fetched:**
- School information with license details
- User counts by role
- Class counts
- License limits

**Data Sent:**
- School dashboard with usage metrics
- License status and limits
- Capacity indicators

---

### 9. Bulk User Import Flow

```
Frontend → POST /api/mongo/school-admin/import-users
         ↓
authenticateToken(req) → Verify JWT
         ↓
School.findById(user.schoolId).populate('licenseId')
         ↓
Validate against license limits:
  - Check if adding users exceeds maxTeachers/maxStudents
         ↓
For each user in CSV:
  - Generate random password (passwordGenerator.js)
  - Hash password with bcrypt
  - Create User document
         ↓
User.insertMany([...users]) → MongoDB
         ↓
Update School counters:
  - current_teachers += teachers added
  - current_students += students added
         ↓
School.save() → MongoDB
         ↓
For each user:
  - Store tempPassword for credential sending
  - Queue email with credentials (emailService.js)
         ↓
Response: {
  success: true,
  created: count,
  users: [{ email, tempPassword }]
}
```

**Data Stored:**
- Multiple User documents created in bulk
- Passwords hashed before storage
- tempPassword stored temporarily for credential sending
- School counters updated

**Data Sent:**
- List of created users with temporary passwords
- Email notifications queued

---

### 10. Quiz Launch Flow (Teacher)

```
Frontend → POST /api/mongo/teacher/launch-quiz
         ↓
authenticateToken(req) → Verify JWT
         ↓
Quiz.findById(quizId)
         ↓
Update quiz document:
  - is_launched = true
  - launched_by = userId
  - launched_at = Date.now()
  - launched_for_classes = [classNames]
  - launch_start_date = startDate
  - launch_end_date = endDate
         ↓
Quiz.save() → MongoDB
         ↓
Response: {
  success: true,
  message: 'Quiz launched successfully',
  quiz: { title, launched_for_classes }
}
```

**Data Stored:**
- Quiz document updated with launch information
- Launch metadata recorded

**Data Sent:**
- Confirmation of successful launch
- Updated quiz details

---

## API Routes & Operations

### Authentication Routes (`/api/mongo/auth`)
**File:** `backend/routes/mongoAuthRoutes.js`

| Endpoint | Method | Authentication | Description | Data Flow |
|----------|--------|----------------|-------------|-----------|
| `/register` | POST | None | Register new user | Email → Validate → Hash password → Create User → Save to DB |
| `/register-school-admin` | POST | None | Register school with free trial | Validate → Create School → Create License → Create Admin User → Save to DB |
| `/login` | POST | None | User login | Email → Fetch User → Compare password → Generate JWT → Send token |
| `/profile` | GET | JWT Required | Get user profile | JWT → Fetch User by userId → Send user data |
| `/update-profile` | PUT | JWT Required | Update user profile | JWT → Fetch User → Update fields → Save to DB |
| `/change-password` | POST | JWT Required | Change password | JWT → Fetch User → Verify old password → Hash new password → Save to DB |

---

### Student Routes (`/api/mongo/student`)
**File:** `backend/routes/mongoStudentRoutes.js`

| Endpoint | Method | Description | Data Operations |
|----------|--------|-------------|-----------------|
| `/dashboard` | GET | Student dashboard data | Fetch User, MathProfile, StudentProfile, QuizAttempts, Available Quizzes |
| `/math-profile` | GET | Math profile details | Fetch MathProfile by student_id |
| `/quiz-history` | GET | Quiz attempt history | Fetch QuizAttempts with pagination, exclude placement quizzes |
| `/leaderboard` | GET | Class leaderboard | Fetch MathProfiles for class, sort by total_points |
| `/support-tickets` | GET/POST | Support tickets | Fetch/Create SupportTicket documents |
| `/shop` | GET | Gamification shop items | Fetch SkillPointsConfig, available items |
| `/purchase` | POST | Purchase shop item | Update MathProfile (deduct points), Update StudentProfile (add badge) |

**Key Data Operations:**
- **Dashboard:** Aggregates data from 5+ collections
- **Leaderboard:** Sorts students by points within same class
- **Quiz History:** Paginates attempts, calculates statistics
- **Shop:** Points-based transaction system

---

### Teacher Routes (`/api/mongo/teacher`)
**File:** `backend/routes/mongoTeacherRoutes.js`

| Endpoint | Method | Description | Data Operations |
|----------|--------|-------------|-----------------|
| `/dashboard` | GET | Teacher dashboard | Fetch teacher's classes, student counts, active quizzes, recent attempts |
| `/classes` | GET | Assigned classes | Fetch Classes where teachers array includes userId |
| `/class/:className/students` | GET | Students in class | Fetch Users where role='Student' and class=className |
| `/student/:studentId/details` | GET | Student details | Fetch User, MathProfile, StudentProfile, QuizAttempts for student |
| `/launch-quiz` | POST | Launch quiz for classes | Update Quiz (is_launched=true, launched_for_classes=[...]) |
| `/revoke-quiz` | POST | Revoke quiz | Update Quiz (is_launched=false) |
| `/messages` | GET/POST | Teacher-student/parent messaging | Fetch/Create Message documents |
| `/support-tickets` | GET | View support tickets | Fetch SupportTickets from students |

**Key Data Operations:**
- **Class Monitoring:** Aggregates student performance by class
- **Quiz Management:** CRUD operations on Quiz launch status
- **Communication:** Message system between teacher, students, parents
- **Performance Analysis:** Quiz attempt aggregations and statistics

---

### School Admin Routes (`/api/mongo/school-admin`)
**File:** `backend/routes/schoolAdminRoutes.js`

| Endpoint | Method | Description | Data Operations |
|----------|--------|-------------|-----------------|
| `/dashboard` | GET | School dashboard | Fetch School, License, User counts, Class counts |
| `/import-users` | POST | Bulk import users (CSV) | Validate limits → Create Users → Update School counters → Send credentials |
| `/users` | GET | List school users | Fetch Users by schoolId with filtering |
| `/users/:userId` | PUT/DELETE | Update/delete user | Update/Delete User, Update School counters |
| `/classes` | GET/POST | List/create classes | Fetch/Create Class documents, validate limits |
| `/classes/:classId` | PUT/DELETE | Update/delete class | Update/Delete Class, update teacher assignedClasses |
| `/placement-quizzes` | GET/POST | Manage placement quizzes | Fetch/Create Quiz with quiz_type='placement' |
| `/announcements` | POST | Broadcast announcements | Create announcement for school users |

**Key Data Operations:**
- **License Management:** Enforce limits before user/class creation
- **Bulk Operations:** CSV parsing and batch user creation
- **Counter Sync:** Keep School.current_* fields in sync with actual counts
- **Class Management:** Handle many-to-many teacher-student relationships

---

### P2L Admin Routes (`/api/p2ladmin`)
**File:** `backend/routes/p2lAdminRoutes.js`

| Endpoint | Method | Description | Data Operations |
|----------|--------|-------------|-----------------|
| `/questions` | GET/POST | Question bank CRUD | Fetch/Create Question documents |
| `/questions/:id` | PUT/DELETE | Update/delete question | Update/Delete Question |
| `/generate-quiz` | POST | Auto-generate quiz | Fetch Questions by filters → Create Quiz with unique_hash |
| `/schools` | GET | List all schools | Fetch School documents with License population |
| `/schools/:id` | PUT | Update school license | Update School.licenseId |
| `/analytics` | GET | Platform analytics | Aggregate QuizAttempts, Users, Schools for statistics |
| `/licenses` | GET/POST | License management | Fetch/Create License documents |

**Key Data Operations:**
- **Question Bank:** Full CRUD on Question collection
- **Quiz Generation:** Algorithm to select questions by difficulty/topic
- **Platform Analytics:** Cross-school aggregation queries
- **License Administration:** Create and manage subscription plans

---

### Adaptive Quiz Routes (`/api/adaptive-quiz`)
**File:** `backend/routes/adaptiveQuizRoutes.js`

| Endpoint | Method | Description | Data Operations |
|----------|--------|-------------|-----------------|
| `/start` | POST | Start adaptive quiz | Fetch MathProfile → Determine level → Fetch Quiz → Create QuizAttempt |
| `/next-question/:attemptId` | GET | Get next question | Fetch QuizAttempt → Select question by current_difficulty |
| `/answer/:attemptId` | POST | Submit answer | Validate answer → Calculate points → Update QuizAttempt → Adjust difficulty |
| `/complete/:attemptId` | POST | Complete quiz | Calculate performance score → Determine next level → Update QuizAttempt, MathProfile, StudentProfile |
| `/results/:attemptId` | GET | Get quiz results | Fetch completed QuizAttempt with full details |
| `/attempts` | GET | List user attempts | Fetch QuizAttempts for user with pagination |

**Key Adaptive Logic:**
- **Difficulty Progression:** Adjust based on consecutive correct/wrong answers
- **Performance Scoring:** Weighted by accuracy, speed, and difficulty
- **Level Determination:**
  - Accuracy < 40%: Level down
  - Accuracy 40-69%: Stay (blocked from advancing)
  - Accuracy ≥ 70% + Score ≥ 0.85: Level up
  - Accuracy ≥ 70% + Score ≥ 1.20: Skip 2 levels

---

### License Routes (`/api/licenses`)
**File:** `backend/routes/licenseRoutes.js`

| Endpoint | Method | Authentication | Description | Data Operations |
|----------|--------|----------------|-------------|-----------------|
| `/` | GET | JWT Required | List all licenses | Fetch License documents (active only) |
| `/` | POST | P2L Admin only | Create license | Create License document |
| `/:id` | PUT | P2L Admin only | Update license | Update License document |
| `/:id` | DELETE | P2L Admin only | Delete license | Delete License, check for dependencies |

---

### Public Routes

| Endpoint | Method | Authentication | Description | Data Operations |
|----------|--------|----------------|-------------|-----------------|
| `/api/public/landing-page` | GET | None | Get landing page blocks | Fetch LandingPage (cached 5 min) |
| `/api/public/maintenance` | GET | None | Get maintenance status | Fetch active Maintenance document |
| `/api/public/testimonials` | GET | None | Get testimonials | Fetch Testimonials where display_on_landing=true |

---

## Authentication & Security

### JWT Token System

**Token Generation:**
```javascript
const token = jwt.sign(
  { userId, email, role },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Token Verification:**
```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { userId, email, role }
    next();
  });
}
```

**Security Features:**
- Tokens expire after 24 hours
- JWT_SECRET must be set in production (validated on startup)
- Tokens include userId, email, and role for authorization
- All authenticated routes verify token before processing

---

### Password Security

**Hashing on Registration:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
user.password = hashedPassword;
```

**Verification on Login:**
```javascript
const isMatch = await bcrypt.compare(providedPassword, user.password);
if (!isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

**Password Rules:**
- Minimum length enforced on frontend
- Hashed before storage (never stored as plain text)
- bcrypt uses 10 salt rounds for adequate security
- Password field never sent to frontend

---

### Role-Based Access Control (RBAC)

**Roles:**
1. **Platform Admin** / **p2ladmin** - Full system access
2. **School Admin** - Manage school users, classes, licenses
3. **Teacher** / **Trial Teacher** - Manage classes, launch quizzes, view student progress
4. **Student** / **Trial Student** - Take quizzes, view own progress
5. **Parent** - View linked students' progress

**Authorization Middleware:**
```javascript
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}
```

**Example Usage:**
```javascript
router.post('/generate-quiz', 
  authenticateToken, 
  requireRole(['Platform Admin', 'p2ladmin']), 
  generateQuizHandler
);
```

---

### CORS Configuration

**Allowed Origins:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://play2learn-test.onrender.com'
];
```

**CORS Options:**
```javascript
{
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}
```

---

## Data Relationships

### Entity Relationship Diagram (Text)

```
User (1) ──────< (1) StudentProfile
     (1) ──────< (1) MathProfile
     (1) ──────< (*) QuizAttempt
     (1) ──────< (*) SupportTicket
     (*) ──────> (*) Class (via students/teachers arrays)
     (*) ──────> (1) School (via schoolId)

School (1) ──────< (*) User
       (1) ──────< (*) Class
       (*) ──────> (1) License (via licenseId)

Quiz (1) ──────< (*) QuizAttempt
     (1) ──────< (*) Question (via questions array)
     (*) ──────> (1) User (via created_by)
     (*) ──────> (1) User (via launched_by)

QuizAttempt (*) ──────> (1) User (via userId)
            (*) ──────> (1) Quiz (via quizId)

Class (*) ──────> (1) School (via school_id)
      (*) ──────> (*) User (via teachers/students arrays)

Testimonial (*) ──────> (1) LandingPage (via display_on_landing)
```

### Key Relationships Explained

**1. User → StudentProfile (1:1)**
- Each student user has exactly one StudentProfile
- StudentProfile.userId references User._id
- Created automatically on student registration

**2. User → MathProfile (1:1)**
- Each student has exactly one MathProfile
- MathProfile.student_id references User._id
- Tracks math-specific progress

**3. User → QuizAttempt (1:many)**
- Each user can have multiple quiz attempts
- QuizAttempt.userId references User._id
- Indexed for efficient querying

**4. School → User (1:many)**
- Each school can have multiple users
- User.schoolId references School._id
- School tracks current counts (current_teachers, current_students)

**5. School → License (many:1)**
- Multiple schools can have the same license plan
- School.licenseId references License._id
- License defines limits (maxTeachers, maxStudents, maxClasses)

**6. Quiz → QuizAttempt (1:many)**
- Each quiz can have multiple attempts
- QuizAttempt.quizId references Quiz._id
- Used for analytics and performance tracking

**7. Class → School (many:1)**
- Each class belongs to one school
- Class.school_id references School._id
- School.current_classes counts active classes

**8. Class ↔ User (many:many)**
- Teachers and students can be in multiple classes
- Class.teachers and Class.students are arrays of User._id
- User.assignedClasses (for teachers) is array of class names
- Bi-directional relationship

**9. User → Quiz (1:many via created_by and launched_by)**
- P2L Admin creates quizzes (Quiz.created_by)
- Teachers launch quizzes (Quiz.launched_by)
- Both reference User._id

---

## Summary

### Data Storage
- **Database:** MongoDB with Mongoose ODM
- **Collections:** 17 models representing different entities
- **Indexes:** Strategic indexes on frequently queried fields
- **Validation:** Schema-level validation with Mongoose
- **Security:** Passwords hashed with bcrypt, sensitive data never exposed

### Data Fetching
- **Authentication:** JWT-based token system
- **Query Patterns:** 
  - Direct lookups by _id or unique fields
  - Filtered queries by role, schoolId, class
  - Aggregations for analytics and dashboards
  - Population for referenced documents
- **Pagination:** Supported on list endpoints
- **Caching:** 5-minute cache on public landing page

### Data Sending
- **Response Format:** JSON with success/error indicators
- **Data Sanitization:** Passwords and sensitive fields excluded
- **Error Handling:** Consistent error response format
- **Frontend Integration:** RESTful API consumed by React frontend
- **Real-time Updates:** Polling-based (no WebSockets currently)

### Best Practices Implemented
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ Database indexes for performance
- ✅ CORS configuration
- ✅ Environment-based configuration
- ✅ Error handling and logging
- ✅ Data relationships with referential integrity
- ✅ Pagination for large datasets

---

**Last Updated:** 2026-02-11  
**Database Version:** MongoDB 7.0.0  
**Mongoose Version:** 9.1.3  
**Backend Framework:** Express.js
