# Automated Quiz Generation - Quick Start Guide

## What This Feature Does

Automatically generates quizzes with smart question selection, ensuring fresh, unique questions for each quiz attempt.

## For Administrators

### Generating a Quiz

1. Navigate to **P2L Admin → Quiz Manager**
2. Click **"+ Trigger Quiz Generation"**
3. Select **Quiz Level** (1-10)
4. Click **"Generate Quiz"**

That's it! The system will:
- Select 20 questions from the quiz level
- Prioritize less-used questions (freshness)
- Apply adaptive difficulty progression
- Create a unique quiz with no duplicates

### Requirements

- Minimum **40 questions** must exist for each quiz level before generation
- Questions must have `quiz_level` field set (1-10)

### Adding Questions

#### Via Form:
1. Go to **P2L Admin → Question Bank**
2. Click **"+ Create Question"**
3. Fill in all fields including **Quiz Level** (1-10)
4. Click **"Create"**

#### Via CSV Upload:
1. Go to **P2L Admin → Question Bank**
2. Click **"📤 Upload CSV"**
3. Download the template to see required format
4. Ensure your CSV includes the `quiz_level` column
5. Upload your file

**CSV Format:**
```csv
text,choice1,choice2,choice3,choice4,answer,difficulty,quiz_level,subject,topic,grade
"What is 2+2?","2","3","4","5","4",1,1,"Math","Addition","Primary 1"
```

### Managing Quizzes

#### Can Do:
- ✅ View all quizzes
- ✅ Edit quiz metadata (title, description)
- ✅ Delete manually-created quizzes
- ✅ Trigger new quiz generation

#### Cannot Do:
- ❌ Manually create quizzes (auto-generation only)
- ❌ Delete auto-generated quizzes
- ❌ Edit questions in auto-generated quizzes

### Quiz Cards

Auto-generated quizzes display:
- **✨ Auto-generated** badge (green)
- **Level #** badge (blue)
- Generation criteria (how it was triggered)
- Question count (always 20)

## For Developers

### Key Files

**Backend:**
- `models/Question.js` - Question schema with usage tracking
- `models/Quiz.js` - Quiz schema with generation metadata
- `services/quizGenerationService.js` - Core generation logic
- `routes/p2lAdminRoutes.js` - API endpoints

**Frontend:**
- `components/P2LAdmin/QuestionBank.js` - Question management UI
- `components/P2LAdmin/QuizManager.js` - Quiz generation UI
- `services/p2lAdminService.js` - API calls

### API Endpoints

#### Generate Quiz
```http
POST /api/p2ladmin/quizzes/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "quiz_level": 1,
  "student_id": null,
  "trigger_reason": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz generated successfully for level 1",
  "data": {
    "_id": "...",
    "title": "Quiz Level 1 - 12/15/2024",
    "quiz_level": 1,
    "questions": [...],
    "is_auto_generated": true,
    "generation_criteria": "manual",
    "unique_hash": "..."
  }
}
```

#### Check Availability
```http
GET /api/p2ladmin/quizzes/check-availability/1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "questionCount": 45,
    "required": 40,
    "message": "45 questions available for level 1"
  }
}
```

### Testing

Run the test script:
```bash
cd backend
node test-quiz-generation.js
```

This tests:
- Availability checking for all levels
- Quiz generation for level 1
- Question usage tracking
- Uniqueness validation

### Database Schema

**Question Fields:**
```javascript
{
  text: String,
  choices: [String],
  answer: String,
  difficulty: Number (1-5),
  quiz_level: Number (1-10),    // NEW
  usage_count: Number,           // NEW
  last_used_timestamp: Date,     // NEW
  subject: String,
  topic: String,
  grade: String
}
```

**Quiz Fields:**
```javascript
{
  title: String,
  description: String,
  quiz_level: Number (1-10),         // NEW
  questions: [QuestionObject],
  is_auto_generated: Boolean,        // NEW
  generation_criteria: String,       // NEW
  unique_hash: String,               // NEW
  quiz_type: String,
  is_adaptive: Boolean
}
```

## Algorithm Overview

### Generation Process

1. **Validate** - Check ≥40 questions exist for quiz level
2. **Weight** - Calculate freshness score for each question
   - Base: 100 points
   - Bonus: +50 for unused/old questions
   - Penalty: -5 per use
3. **Select** - Pick 20 questions with weighted randomization
   - Start at difficulty 1
   - Adaptive progression (50% increase, 30% same, 20% decrease)
   - No duplicates
4. **Track** - Update usage_count and last_used_timestamp
5. **Shuffle** - Randomize final sequence
6. **Create** - Save quiz with unique hash

### Freshness Algorithm

```javascript
weight = 100 + freshness_bonus - usage_penalty

freshness_bonus = (time_since_last_use / max_time) * 50
usage_penalty = usage_count * 5

// Higher weight = Higher chance of selection
```

## Common Issues

### "Insufficient questions for quiz level"

**Problem:** Less than 40 questions exist for the selected quiz level

**Solution:** 
1. Add more questions to that level via form or CSV
2. Check that existing questions have correct quiz_level
3. Verify questions are active (is_active = true)

### Cannot Delete Quiz

**Problem:** Delete button is grayed out

**Reason:** Quiz is auto-generated and protected

**Solution:** Auto-generated quizzes cannot be deleted by design. They are managed by the system.

### Manual Quiz Creation Blocked

**Problem:** POST /quizzes returns 403

**Reason:** Manual creation is disabled

**Solution:** Use the generation endpoint instead (POST /quizzes/generate)

## Documentation

For more details, see:
- **QUIZ_GENERATION_IMPLEMENTATION.md** - Complete implementation guide
- **SECURITY_SUMMARY_QUIZ_GENERATION.md** - Security analysis
- **VISUAL_CHANGES_QUIZ_GENERATION.md** - UI changes
- **IMPLEMENTATION_SUMMARY_QUIZ_GENERATION.md** - Executive summary

## Support

For issues or questions:
1. Check the documentation files
2. Review the test script for examples
3. Check browser console for errors
4. Check backend logs for server errors

## Future Enhancements

Planned features:
- Automatic triggers (enrollment, completion, scheduled)
- Student-specific personalization
- Advanced analytics dashboard
- ML-based question selection

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** December 2024
