# Question Bank Usage Guide

## 🎯 Quick Start

**The adaptive quiz system already uses your Question Bank!** If you're seeing errors when creating quizzes, you simply need to add questions to the database.

### Fastest Solution

Run this diagnostic to see what you need:
```bash
node backend/check-questions.js
```

Then add questions using one of these methods:
1. **Seed sample questions** (fastest for testing): `node backend/seed-questions.js`
2. **Use the UI**: P2L Admin → Question Bank → + Add Question
3. **Upload CSV**: P2L Admin → Question Bank → Upload CSV

---

## Overview

The adaptive quiz creation system **automatically uses questions from your Question Bank**. This guide explains how to ensure your questions are properly available for quiz creation.

## How It Works

When you create an adaptive quiz:

1. **The system queries your Question Bank** - It looks for questions in the database
2. **Filters by difficulty level** - Only uses questions at the difficulty levels you specify
3. **Filters by active status** - Only uses questions marked as `is_active: true`
4. **Randomly selects questions** - Picks questions randomly from the available pool
5. **Creates the quiz** - Saves the selected questions to the quiz

**Important:** The quiz creation code is already configured to use your Question Bank. If quiz creation fails, it means questions need to be added or activated in the database.

## Quick Diagnosis

Run this command to check your question bank status:

```bash
node backend/check-questions.js
```

This will show you:
- How many questions you have
- How many are active vs inactive
- Distribution by difficulty level
- Whether you can create quizzes with your current questions
- Specific guidance on what to add

## Adding Questions to Your Question Bank

### Option 1: Use the P2L Admin UI (Recommended)

1. **Login** to P2L Admin dashboard
2. **Navigate** to "Question Bank" section
3. **Click** "+ Add Question" button
4. **Fill in** the question details:
   - **Text**: The question content (required)
   - **Choices**: Multiple choice options (array of strings)
   - **Answer**: The correct answer (required)
   - **Difficulty**: 1-5 (1=easiest, 5=hardest) (required)
   - **Subject**: e.g., "Math", "Science" (default: "General")
   - **Topic**: e.g., "Addition", "Multiplication" (optional)
   - **Is Active**: true/false (default: true)
5. **Click** "Save Question"
6. **Repeat** for each question

### Option 2: Upload CSV File

1. **Prepare a CSV file** with these columns:
   ```csv
   text,choice1,choice2,choice3,choice4,answer,difficulty,subject,topic,is_active
   "What is 2+2?","2","3","4","5","4",1,"Math","Addition",true
   "What is 5-3?","1","2","3","4","2",1,"Math","Subtraction",true
   ```

2. **Upload via P2L Admin**:
   - Go to Question Bank page
   - Click "Upload CSV"
   - Select your CSV file
   - System will validate and import questions

3. **API Endpoint** (if using API directly):
   ```bash
   POST /api/p2ladmin/questions/upload-csv
   Content-Type: multipart/form-data
   
   # Requires authentication token
   ```

### Option 3: Run Seed Script (For Testing)

If you just want to test the system with sample questions:

```bash
cd backend
node seed-questions.js
```

This adds **50 sample math questions**:
- 10 questions at difficulty level 1
- 10 questions at difficulty level 2
- 10 questions at difficulty level 3
- 10 questions at difficulty level 4
- 10 questions at difficulty level 5

### Option 4: Use API Directly

Create a single question via API:

```bash
POST /api/p2ladmin/questions
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "text": "What is 2 + 2?",
  "choices": ["2", "3", "4", "5"],
  "answer": "4",
  "difficulty": 1,
  "subject": "Math",
  "topic": "Addition",
  "is_active": true
}
```

## Common Issues and Solutions

### Issue 1: "No active questions found in the question bank"

**Cause**: The database has no questions, or all questions are inactive.

**Solution**:
1. Run `node backend/check-questions.js` to see current status
2. Add questions using one of the methods above
3. Make sure questions have `is_active: true`

### Issue 2: "Not enough questions for difficulty X"

**Cause**: You're requesting more questions at a difficulty level than exist in the database.

**Example Error**:
```
Difficulty 2: need 10, have 5 (missing 5)
Difficulty 3: need 10, have 0 (missing 10)
```

**Solutions**:
1. **Add more questions** at the required difficulty levels
2. **Reduce the number** of questions requested for that difficulty
3. **Remove the difficulty level** from your quiz (set to 0)
4. **Run seed script** to quickly add sample questions: `node backend/seed-questions.js`

### Issue 3: Questions exist but not being used

**Cause**: Questions might be marked as inactive (`is_active: false`).

**Solution**:
1. Check question status: `node backend/check-questions.js`
2. Update questions via UI or API to set `is_active: true`
3. Use this API to activate a question:
   ```bash
   PUT /api/p2ladmin/questions/<question_id>
   {
     "is_active": true
   }
   ```

### Issue 4: Questions have invalid difficulty levels

**Cause**: Questions must have difficulty between 1-5.

**Solution**:
1. Run diagnostic: `node backend/check-questions.js`
2. Update questions to have valid difficulty (1, 2, 3, 4, or 5)

## Question Requirements

For a question to be used in adaptive quizzes, it must:

✅ **Have a text field** (the question content)  
✅ **Have an answer field** (the correct answer)  
✅ **Have difficulty level 1-5** (required)  
✅ **Be marked as active** (`is_active: true`)  
✅ **Be saved in the database** (not just in memory or UI)

Optional but recommended:
- **Choices array** - for multiple choice questions
- **Subject** - helps organize questions
- **Topic** - helps filter questions

## Checking Question Availability

### View all questions
```bash
GET /api/p2ladmin/questions
```

### View questions by difficulty
```bash
GET /api/p2ladmin/questions?difficulty=1
```

### View only active questions
```bash
GET /api/p2ladmin/questions?is_active=true
```

### Get question statistics
```bash
GET /api/p2ladmin/questions-stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "byDifficulty": {
      "1": 10,
      "2": 10,
      "3": 10,
      "4": 10,
      "5": 10
    },
    "totalActive": 50,
    "totalInactive": 0,
    "total": 50
  }
}
```

## Creating Adaptive Quizzes

Once you have questions in your question bank:

1. **Navigate** to "Create Adaptive Quiz" in P2L Admin
2. **Check availability** - The UI shows how many questions are available at each difficulty
3. **Set distribution** - Specify how many questions you want at each difficulty:
   ```
   Difficulty 1: [10]  (15 available) ✓
   Difficulty 2: [10]  (12 available) ✓
   Difficulty 3: [5]   (8 available)  ✓
   ```
4. **Configure quiz settings**:
   - Title (required)
   - Description (optional)
   - Target correct answers (default: 10)
   - Difficulty progression: gradual, immediate, or ml-based
5. **Create quiz** - System automatically pulls questions from your question bank

## Best Practices

1. **Create diverse questions** - Have questions at multiple difficulty levels
2. **Keep questions active** - Only activate questions you want to use
3. **Organize by subject/topic** - Makes management easier
4. **Test questions first** - Try answering them to ensure they make sense
5. **Start with seed data** - Use `node backend/seed-questions.js` for initial testing
6. **Monitor availability** - Use `node backend/check-questions.js` regularly
7. **Balance difficulty** - Have similar counts at each difficulty level you use

## Summary

✅ **The code already uses your Question Bank** - No code changes needed  
✅ **Questions are pulled from the database automatically**  
✅ **Run `node backend/check-questions.js` to diagnose issues**  
✅ **Add questions via UI, CSV, seed script, or API**  
✅ **Ensure questions are active and have valid difficulty levels**  
✅ **The system provides detailed error messages to guide you**

If you continue to have issues, run the diagnostic script and check the error messages carefully - they will tell you exactly what's missing!
