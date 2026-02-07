# Automated Adaptive Quiz System - Quick Start Guide

## Overview
This system automatically generates 21 quiz levels (0-20) with adaptive difficulty and intelligent student progression.

## Quick Setup

### 1. Upload Questions
Use the sample CSV file (`sample-questions.csv`) as a template:

```bash
# CSV Format:
text, choices, answer, difficulty, quiz_level, subject, topic, grade

# Example:
"What is 2+2?", "2,3,4,5", 4, 1, 0, Mathematics, Addition, Primary 1
```

**Important Fields:**
- `difficulty`: 1-10 (1=easiest, 10=hardest)
- `quiz_level`: 0-20 (student progression level)
- `subject`: Currently only "Mathematics" is enabled

### 2. Upload via Admin Panel
1. Login as P2L Admin
2. Navigate to Question Bank
3. Upload CSV file
4. System automatically generates quizzes for all levels

### 3. Monitor Generation
Check quiz generation status:
- API: `GET /api/p2ladmin/quizzes/generation-stats`
- View auto-generated quizzes: `GET /api/p2ladmin/quizzes/auto-generated`

### 4. Launch Quizzes
1. Review generated quizzes
2. Launch for specific classes
3. Students can now take quizzes at their level

## Student Experience

### Taking a Quiz
1. Student logs in (starts at level 0)
2. Selects available quiz for their current level
3. Answers 20 questions (from 40-question pool)
4. Difficulty adjusts in real-time:
   - ✓ Correct → difficulty +1
   - ✗ Incorrect → difficulty -1
5. Receives promotion/demotion based on performance

### Promotion System
- **100% + High Difficulty**: +3 levels
- **100% + Medium Difficulty**: +2 levels  
- **80-99%**: +1-2 levels
- **60-79%**: Stay or +1 level
- **Below 60%**: -1 level

## API Endpoints

### Admin
```javascript
// Regenerate all quizzes
POST /api/p2ladmin/quizzes/regenerate-all

// Regenerate specific level
POST /api/p2ladmin/quizzes/regenerate-level/:level

// Get statistics
GET /api/p2ladmin/quizzes/generation-stats

// List auto-generated quizzes
GET /api/p2ladmin/quizzes/auto-generated

// Upload questions
POST /api/p2ladmin/questions/upload-csv
```

### Student
```javascript
// Get available quizzes (for current level)
GET /api/adaptive-quiz/quizzes

// Start quiz
POST /api/adaptive-quiz/quizzes/:quizId/start

// Get next question
GET /api/adaptive-quiz/attempts/:attemptId/next-question

// Submit answer
POST /api/adaptive-quiz/attempts/:attemptId/submit-answer
```

## Requirements

### Minimum Questions Per Level
- **Ideal**: 40 questions (4 per difficulty level)
- **Acceptable**: 20-39 questions (generates with warning)
- **Insufficient**: < 20 questions (skips generation)

### Question Distribution
Aim for balanced distribution across difficulties 1-10:
- Level 1-2: Easier questions
- Level 3-7: Medium difficulty
- Level 8-10: Harder questions

## Testing

### Validate Logic
```bash
cd backend
node test-quiz-logic.js
```

### Full Integration Test
```bash
cd backend
node test-quiz-generation.js
```

## Troubleshooting

### Quizzes Not Generating?
- Check question count: `GET /api/p2ladmin/quizzes/generation-stats`
- Ensure questions have correct `quiz_level` field
- Verify `subject` is set to "Mathematics"
- Check server logs for detailed errors

### Students Not Seeing Quizzes?
- Verify quizzes are launched
- Check student's current `quiz_level` in MathProfile
- Ensure launch dates are valid
- Confirm class matching

### Regenerate if Needed
```bash
# Via API
POST /api/p2ladmin/quizzes/regenerate-all

# Or specific level
POST /api/p2ladmin/quizzes/regenerate-level/0
```

## Files Modified

### Backend Models
- `models/Question.js` - Added quiz_level, expanded difficulty to 1-10
- `models/Quiz.js` - Added quiz_level, auto_generated fields
- `models/MathProfile.js` - Added quiz_level for student progression
- `models/QuizAttempt.js` - Added topic field

### Backend Routes
- `routes/p2lAdminRoutes.js` - Added quiz generation endpoints
- `routes/adaptiveQuizRoutes.js` - Updated for new difficulty range and promotion

### Backend Utilities
- `utils/quizGenerator.js` - NEW: Automated quiz generation engine

### Documentation
- `AUTOMATED_QUIZ_SYSTEM.md` - Complete documentation
- `sample-questions.csv` - Sample CSV template
- `test-quiz-logic.js` - Logic validation script
- `test-quiz-generation.js` - Integration test script

## Key Features

✓ **Fully Automated**: Upload questions → quizzes auto-generate
✓ **21 Quiz Levels**: Progressive difficulty from 0-20
✓ **40 Questions Per Quiz**: Ensures variety
✓ **20-Question Sessions**: Students answer 20 selected from 40
✓ **Real-Time Adaptation**: Difficulty adjusts with each answer
✓ **Weighted Scoring**: Higher difficulty = more points
✓ **Intelligent Promotion**: Based on score % and difficulty
✓ **Admin Monitoring**: Dashboard for statistics and regeneration
✓ **Subject Support**: Mathematics (expandable to others)

## Next Steps

1. Review complete documentation: `AUTOMATED_QUIZ_SYSTEM.md`
2. Upload sample questions: `sample-questions.csv`
3. Test the system with sample data
4. Monitor generation statistics
5. Launch quizzes for students
6. Track student progression through levels

## Support

For detailed documentation, see:
- **Full Documentation**: `AUTOMATED_QUIZ_SYSTEM.md`
- **API Details**: See "API Endpoints" section in documentation
- **Model Schemas**: See "Database Schema Changes" in documentation
- **Test Scripts**: `backend/test-quiz-logic.js`, `backend/test-quiz-generation.js`

---

**System Status**: ✓ Fully Implemented and Ready for Use
