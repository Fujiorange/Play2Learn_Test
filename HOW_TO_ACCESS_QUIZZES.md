# How to Access and Use Adaptive Quizzes

This guide explains how to create, access, and attempt adaptive quizzes in the Play2Learn platform.

## Table of Contents
- [For P2L Admins: Creating Quizzes](#for-p2l-admins-creating-quizzes)
- [For Students: Accessing and Attempting Quizzes](#for-students-accessing-and-attempting-quizzes)
- [Prerequisites](#prerequisites)
- [Troubleshooting](#troubleshooting)

---

## For P2L Admins: Creating Quizzes

### Step 1: Login as P2L Admin
1. Navigate to: `http://localhost:3000/login` (or your deployed URL)
2. Enter your P2L Admin credentials
3. Click "Log In"

### Step 2: Navigate to Quiz Manager
**Option A - From Dashboard:**
1. After login, you'll be on the P2L Admin Dashboard
2. Click on "📝 Adaptive Quiz Manager" card

**Option B - Direct URL:**
- Navigate directly to: `http://localhost:3000/p2ladmin/quizzes`

### Step 3: Create an Adaptive Quiz
1. Click the "+ Create Adaptive Quiz" button
2. Fill in the quiz details:
   - **Quiz Title**: Give your quiz a descriptive name (e.g., "Math Adaptive Quiz - Beginner Level")
   - **Description**: Describe what the quiz covers
   - **Target Correct Answers**: Set how many correct answers students need (default: 10)
   - **Difficulty Progression Strategy**: Choose one:
     - **Gradual**: Adjusts based on last 3 answers (recommended for most students)
     - **Immediate**: Adjusts after each answer (for quick assessments)
     - **ML-Based**: Uses overall accuracy (for advanced adaptive learning)
   - **Question Distribution**: Specify how many questions from each difficulty level (1-5)

3. The system will show you how many questions are available at each difficulty level
4. Click "Create Adaptive Quiz"
5. You'll see a success message and be redirected to the quiz list

### URLs for P2L Admins:
- **Dashboard**: `/p2ladmin/dashboard`
- **Quiz Manager**: `/p2ladmin/quizzes`
- **Create Adaptive Quiz**: `/p2ladmin/quizzes/create-adaptive`
- **Question Bank**: `/p2ladmin/questions`

---

## For Students: Accessing and Attempting Quizzes

### Step 1: Login as Student
1. Navigate to: `http://localhost:3000/login`
2. Enter your student credentials
3. Click "Log In"

### Step 2: Navigate to Adaptive Quizzes
**Option A - From Dashboard:**
1. After login, you'll be on the Student Dashboard
2. Look for "Adaptive Quizzes" or similar navigation option

**Option B - Direct URL:**
- Navigate directly to: `http://localhost:3000/student/adaptive-quizzes`

### Step 3: View Available Quizzes
On the Adaptive Quizzes page, you'll see:
- **Available Quizzes** tab: Shows all quizzes you can attempt
- **My Attempts** tab: Shows your quiz history

Each quiz card displays:
- Quiz title and description
- Target number of correct answers needed
- Total questions in the pool
- Difficulty levels included
- Progression strategy

### Step 4: Start a Quiz
1. Find the quiz you want to attempt
2. Click the "Start Quiz →" button
3. The quiz will begin and adapt to your performance

### Step 5: Complete the Quiz
- Answer questions one at a time
- Get immediate feedback after each answer
- Watch the difficulty adjust based on your performance
- Complete when you reach the target number of correct answers
- View detailed results showing your progression

### URLs for Students:
- **Dashboard**: `/student/dashboard`
- **Adaptive Quizzes**: `/student/adaptive-quizzes`
- **Quiz Attempt**: `/student/adaptive-quiz/:attemptId` (automatically navigated when starting)
- **Quiz Results**: `/student/quiz-results/:attemptId` (after completing)

---

## Prerequisites

### Database Setup
Before creating quizzes, ensure you have questions in the database:

```bash
# Navigate to backend directory
cd backend

# Run the seed script to populate questions
node seed-questions.js
```

This will create 50 sample questions across 5 difficulty levels (10 questions per level).

### User Accounts
You need appropriate user accounts:

**Create P2L Admin:**
```bash
cd backend
node create-admin.js admin@example.com YourPassword123!
```

**Create Student Account:**
- Use the registration page at `/register`
- Or have a school admin create the account

---

## Troubleshooting

### "Failed to create quiz" Error
**Cause**: Not enough questions available at the requested difficulty levels.

**Solution**:
1. Run the seed script: `node backend/seed-questions.js`
2. Or create questions manually through the Question Bank at `/p2ladmin/questions`
3. Ensure you have enough questions at each difficulty level you want to include

### Quiz Not Appearing for Students
**Possible Causes**:
1. Quiz is not marked as active
2. Quiz is not marked as adaptive
3. Student is not properly authenticated

**Solution**:
- Verify quiz settings in the Quiz Manager
- Ensure student is logged in with valid credentials
- Check that the quiz `is_active` field is `true`

### Cannot Start Quiz
**Possible Causes**:
1. Already have an incomplete attempt
2. Authentication token expired
3. Network/API connectivity issues

**Solution**:
- Complete or cancel any pending attempts
- Log out and log back in
- Check browser console for error messages
- Verify backend server is running on port 5000

### Backend Server Not Running
```bash
cd backend
npm install
node server.js
```

### Frontend Not Running
```bash
cd frontend
npm install
npm start
```

---

## API Endpoints Reference

### P2L Admin Endpoints
- `POST /api/p2ladmin/quizzes/generate-adaptive` - Create adaptive quiz
- `GET /api/p2ladmin/quizzes` - List all quizzes
- `GET /api/p2ladmin/quizzes/:id` - Get quiz details
- `PUT /api/p2ladmin/quizzes/:id` - Update quiz
- `DELETE /api/p2ladmin/quizzes/:id` - Delete quiz

### Student Endpoints
- `GET /api/adaptive-quiz/quizzes` - Get available quizzes
- `POST /api/adaptive-quiz/quizzes/:quizId/start` - Start quiz attempt
- `GET /api/adaptive-quiz/attempts/:attemptId/next-question` - Get next question
- `POST /api/adaptive-quiz/attempts/:attemptId/submit-answer` - Submit answer
- `GET /api/adaptive-quiz/attempts/:attemptId/results` - Get results
- `GET /api/adaptive-quiz/my-attempts` - Get attempt history

---

## Quick Start Example

### Complete Flow from Scratch:

1. **Setup Database**:
   ```bash
   # Start MongoDB (if using Docker)
   docker run -d --name play2learn-mongodb -p 27017:27017 mongo:latest
   
   # Seed questions
   cd backend
   node seed-questions.js
   ```

2. **Create Admin Account**:
   ```bash
   node create-admin.js admin@test.com Admin123!
   ```

3. **Start Servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm install
   node server.js
   
   # Terminal 2 - Frontend
   cd frontend
   npm install
   npm start
   ```

4. **Create Quiz** (as Admin):
   - Go to: http://localhost:3000/login
   - Login with: admin@test.com / Admin123!
   - Navigate to: Adaptive Quiz Manager → Create Adaptive Quiz
   - Fill in details and create

5. **Register Student**:
   - Go to: http://localhost:3000/register
   - Create account

6. **Attempt Quiz** (as Student):
   - Login with student credentials
   - Navigate to: Adaptive Quizzes
   - Click "Start Quiz"

---

## Additional Resources

- **Main README**: See `/ADAPTIVE_QUIZ_README.md` for detailed system documentation
- **Implementation Guide**: See `/ADAPTIVE_QUIZ_GUIDE.md` for technical details
- **API Documentation**: Check the backend route files in `/backend/routes/`

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0
