# Adaptive Quiz Creation - Using Your Question Bank

## Overview

The adaptive quiz creation system **automatically pulls questions from your Question Bank**. This document explains how it works and how to resolve common issues.

## How It Works

When you create an adaptive quiz, the system:

1. **Pulls questions from the Question Bank** (the questions you created)
2. **Filters by difficulty level** - only uses active questions at the levels you specify
3. **Randomly selects questions** - shuffles questions to create unique quiz instances
4. **Creates the quiz** - saves it for students to attempt

## Prerequisites

Before creating an adaptive quiz, you need questions in your Question Bank:

### Option 1: Add Questions Manually

1. Go to **P2L Admin Dashboard** → **Question Bank**
2. Click **"+ Add Question"**
3. Fill in the question details:
   - Text (the question)
   - Choices (multiple choice options)
   - Answer (correct answer)
   - Difficulty (1-5, where 1 is easiest)
   - Subject and Topic (optional)
4. Click **"Save Question"**
5. Repeat until you have enough questions for your quiz

### Option 2: Use the Seed Script (For Testing)

If you want to quickly populate sample questions for testing:

```bash
cd backend
node seed-questions.js
```

This adds 50 sample math questions (10 at each difficulty level 1-5).

## Creating an Adaptive Quiz

### Step 1: Navigate to Quiz Creator

1. Login as P2L Admin
2. Go to **Adaptive Quiz Manager** → **Create Adaptive Quiz**

### Step 2: Configure Your Quiz

The quiz creator shows:
- **Available question counts** for each difficulty level
- **Current database status** (warnings if questions are missing)

Fill in:
- **Quiz Title** (required)
- **Description** (optional)
- **Target Correct Answers** - how many correct answers needed to complete
- **Difficulty Progression** - how difficulty adjusts:
  - **Gradual**: Based on last 3 answers
  - **Immediate**: After each answer
  - **ML-Based**: Based on overall accuracy

### Step 3: Set Question Distribution

For each difficulty level (1-5), specify how many questions to include:

```
Difficulty 1: [10] (15 available) ✓
Difficulty 2: [10] (12 available) ✓
Difficulty 3: [10] (8 available)  ✗ Warning: Only 8 available
Difficulty 4: [0]  (20 available)
Difficulty 5: [0]  (5 available)
```

The system will:
- ✅ Show green checkmark if enough questions available
- ⚠️ Show warning if you request more than available
- ❌ Prevent quiz creation if insufficient questions

### Step 4: Create Quiz

Click **"Create Adaptive Quiz"**

## Common Issues and Solutions

### Issue 1: "No questions found in the question bank"

**Cause**: The Question Bank is empty.

**Solution**:
1. Add questions via Question Bank page, OR
2. Run `node backend/seed-questions.js` to add sample questions

### Issue 2: "Not enough questions for difficulty X"

**Cause**: You requested more questions at a difficulty level than exist in the database.

**Example Error**:
```
Not enough active questions in question bank. 
Difficulty 2: need 10, have 5 (missing 5); 
Difficulty 3: need 10, have 0 (missing 10). 
Please add more questions or adjust your quiz configuration.
```

**Solutions**:
1. **Add more questions** at the missing difficulty levels, OR
2. **Reduce the number requested** in quiz configuration, OR
3. **Remove that difficulty level** from the quiz (set to 0)

### Issue 3: Questions exist but not showing up

**Cause**: Questions might be marked as inactive.

**Solution**:
1. Go to Question Bank
2. Check the "Active" status of your questions
3. Make sure questions are marked as active (is_active = true)

### Issue 4: Frontend shows different counts than backend

**Cause**: The counts might be cached or filters applied.

**Solution**:
1. Refresh the page
2. Check Question Bank to verify actual counts
3. The quiz creator now uses the `/questions-stats` endpoint which is more accurate

## API Endpoints

### Get Question Statistics

```http
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

### Create Adaptive Quiz

```http
POST /api/p2ladmin/quizzes/generate-adaptive
```

Request body:
```json
{
  "title": "Math Quiz Level 1",
  "description": "Adaptive math quiz",
  "difficulty_distribution": {
    "1": 10,
    "2": 10,
    "3": 10
  },
  "target_correct": 10,
  "difficulty_progression": "gradual"
}
```

Success response (201):
```json
{
  "success": true,
  "message": "Adaptive quiz created successfully",
  "data": { ... quiz object ... }
}
```

Error response (400):
```json
{
  "success": false,
  "error": "Not enough active questions in question bank. Difficulty 2: need 10, have 5 (missing 5). Please add more questions or adjust your quiz configuration.",
  "missingQuestions": [
    {
      "difficulty": 2,
      "needed": 10,
      "available": 5,
      "missing": 5
    }
  ]
}
```

## Best Practices

1. **Create diverse questions**: Have questions at multiple difficulty levels
2. **Test your questions**: Try them out before creating quizzes
3. **Start small**: Create quizzes with fewer questions first
4. **Monitor usage**: Check which questions are being used most
5. **Keep questions active**: Regularly review and update your question bank

## Troubleshooting Checklist

- [ ] Are there questions in the Question Bank?
- [ ] Are the questions marked as active?
- [ ] Do you have questions at all required difficulty levels?
- [ ] Are you requesting more questions than available?
- [ ] Have you tried refreshing the page?
- [ ] Have you checked the browser console for errors?

## Summary

**Key Points**:
- ✅ Quiz creation **ALREADY USES** your Question Bank
- ✅ You must have questions at each difficulty level you want to use
- ✅ The system provides detailed error messages when questions are missing
- ✅ You can add questions manually or use the seed script
- ✅ The quiz creator shows real-time availability of questions

**The system is working as designed** - it pulls from your Question Bank. If quiz creation fails, it's because you need more questions at certain difficulty levels.
