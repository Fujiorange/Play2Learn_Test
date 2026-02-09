# Automated Quiz Generation Guide

This guide explains the automated quiz generation feature and how to use it.

## Overview

The automated quiz generation system can automatically create quizzes when there are sufficient questions available in the question bank. This ensures a consistent supply of fresh quizzes for students without manual intervention.

## Generation Criteria

Quizzes are automatically generated when ALL of the following criteria are met:

1. **Minimum 40 questions** available in the question bank
2. Questions must share the same:
   - **Grade** (e.g., "Primary 1", "Primary 2", etc.)
   - **Subject** (e.g., "Mathematics", "Science", "English")
   - **Quiz Level** (1-10)
3. Questions must be **active** (is_active = true)

## Quiz Features

Each automatically generated quiz includes:

### Basic Properties
- ✅ **20 questions per quiz** - Optimal length for student engagement
- ✅ **Unique title format**: `{Grade}'s Level {QuizLevel}`
  - Example: "Primary 3's Level 5"
- ✅ **Auto-generated flag** - Clearly marked as system-generated

### Advanced Features
- ✅ **Freshness weighting** - Questions that haven't been used recently are prioritized
- ✅ **Adaptive difficulty progression** - Questions gradually increase in difficulty
- ✅ **Unique sequence** - Each quiz has a unique combination and order of questions
- ✅ **Usage tracking** - System tracks which questions have been used and when
- ✅ **Duplicate prevention** - Same question won't appear twice in the same quiz

## Quiz Naming Convention

The quiz title follows this format:

```
{Grade}'s Level {QuizLevel}
```

### Examples:
- "Primary 1's Level 1"
- "Primary 3's Level 5"
- "Primary 6's Level 10"

## Question Bank Requirements

For each grade/subject/quiz_level combination, you need:

### Minimum Requirements
- **At least 40 active questions**
- Questions must have:
  - `grade` field set
  - `subject` field set
  - `quiz_level` field set (1-10)
  - `difficulty` field set (1-5)
  - `is_active` set to true

### Recommended Distribution
For best results, include a variety of difficulty levels:
- Easy questions (difficulty 1-2): ~30%
- Medium questions (difficulty 3): ~40%
- Hard questions (difficulty 4-5): ~30%

## How to Use

### 1. Manual Trigger (P2L Admin)

Navigate to: `https://play2learn-test.onrender.com/p2ladmin/quizzes`

**Check Eligible Combinations:**
```
GET /api/p2ladmin/quizzes/eligible-combinations
```

This will show you all grade/subject/quiz_level combinations that have 40+ questions and are eligible for quiz generation.

**Trigger Auto-Generation:**
```
POST /api/p2ladmin/quizzes/auto-generate
```

This will:
1. Check all eligible combinations
2. Generate quizzes for combinations that don't have a recent quiz
3. Skip combinations where a quiz was generated in the last 24 hours
4. Return a summary of results

### 2. Automatic Generation (Future Enhancement)

While the current implementation supports manual triggering, you can set up automated generation using:

#### Option A: Scheduled Job (Recommended)
Set up a cron job or scheduled task to call the auto-generate endpoint:

```bash
# Run every day at 2 AM
0 2 * * * curl -X POST https://play2learn-test.onrender.com/api/p2ladmin/quizzes/auto-generate \
  -H "Authorization: Bearer YOUR_P2L_ADMIN_TOKEN"
```

#### Option B: Trigger on Question Addition
Call the auto-generate endpoint whenever new questions are added to the question bank (if question count reaches 40).

#### Option C: MongoDB Change Streams
Set up a MongoDB change stream to monitor the Question collection and trigger generation when criteria are met.

## API Endpoints

### Check Eligible Combinations

**Endpoint:** `GET /api/p2ladmin/quizzes/eligible-combinations`

**Authentication:** P2L Admin JWT token required

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "grade": "Primary 3",
      "subject": "Mathematics",
      "quiz_level": 5,
      "questionCount": 45,
      "eligible": true
    },
    ...
  ]
}
```

### Auto-Generate Quizzes

**Endpoint:** `POST /api/p2ladmin/quizzes/auto-generate`

**Authentication:** P2L Admin JWT token required

**Response:**
```json
{
  "success": true,
  "message": "Auto-generation complete. Generated 3 new quizzes, skipped 2 recent quizzes",
  "data": {
    "checked": 5,
    "generated": 3,
    "skipped": 2,
    "errors": [],
    "quizzes": [
      {
        "title": "Primary 3's Level 5",
        "quiz_level": 5,
        "grade": "Primary 3",
        "subject": "Mathematics",
        "questionCount": 45
      },
      ...
    ]
  }
}
```

### Manual Generation (Single Quiz Level)

**Endpoint:** `POST /api/p2ladmin/quizzes/generate`

**Authentication:** P2L Admin JWT token required

**Request Body:**
```json
{
  "quiz_level": 5,
  "trigger_reason": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz generated successfully for level 5",
  "data": {
    "_id": "...",
    "title": "Primary 3's Level 5",
    "quiz_level": 5,
    "questions": [...],
    "is_auto_generated": true,
    "generation_criteria": "manual"
  }
}
```

### Check Generation Availability

**Endpoint:** `GET /api/p2ladmin/quizzes/check-availability/:level`

**Authentication:** P2L Admin JWT token required

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "questionCount": 45,
    "required": 40,
    "message": "45 questions available for level 5"
  }
}
```

## Question Selection Algorithm

The quiz generation algorithm uses the following process:

1. **Filter Questions**
   - Find all active questions matching grade, subject, and quiz_level
   - Ensure at least 40 questions are available

2. **Calculate Weights**
   - Questions never used: Maximum weight (150 points)
   - Recently used questions: Lower weight (based on time since last use)
   - Frequently used questions: Penalty applied (5 points per use)

3. **Select with Adaptive Difficulty**
   - Start at difficulty level 1
   - For each of the 20 questions:
     - Filter by current difficulty level
     - If none available, expand to adjacent difficulties
     - Use weighted random selection
     - Update question usage statistics
     - Calculate next difficulty level (50% increase, 30% same, 20% decrease)

4. **Shuffle Questions**
   - Shuffle final sequence for additional randomness
   - Update position numbers to reflect final order

5. **Create Quiz**
   - Save quiz to database with all metadata
   - Mark as auto-generated
   - Store unique hash for tracking

## Viewing Generated Quizzes

Generated quizzes can be viewed at:

**P2L Admin Dashboard:**
- `https://play2learn-test.onrender.com/p2ladmin/quizzes`

**Quiz Details:**
- Shows all auto-generated quizzes
- Displays generation date and criteria
- Shows question count and difficulty distribution

## Best Practices

### For P2L Admins

1. **Regular Monitoring**
   - Check eligible combinations weekly
   - Run auto-generation regularly (daily or weekly)
   - Monitor question usage statistics

2. **Question Bank Maintenance**
   - Ensure even distribution of difficulty levels
   - Add new questions regularly
   - Review and update old questions
   - Deactivate outdated or incorrect questions

3. **Quiz Quality**
   - Review auto-generated quizzes periodically
   - Check for appropriate difficulty progression
   - Ensure questions are relevant and accurate

### For Content Creators

1. **Adding Questions**
   - Always set grade, subject, quiz_level, and difficulty
   - Aim for at least 40 questions per grade/subject/quiz_level combination
   - Distribute difficulty levels evenly
   - Mark questions as active when ready for use

2. **Question Metadata**
   - Grade: Use standardized format (Primary 1-6)
   - Subject: Mathematics, Science, or English
   - Quiz Level: 1-10 (1 = easiest, 10 = hardest)
   - Difficulty: 1-5 (1 = easy, 5 = very hard)

## Troubleshooting

### "Insufficient questions" Error

**Problem:** Not enough questions for quiz generation

**Solution:**
- Check question count: `GET /api/p2ladmin/quizzes/check-availability/:level`
- Add more questions to the question bank
- Ensure questions are marked as active
- Verify grade, subject, and quiz_level are set correctly

### "Ran out of questions during generation"

**Problem:** Algorithm couldn't find questions to complete the quiz

**Solution:**
- This usually means there's poor difficulty distribution
- Add more questions across different difficulty levels
- Ensure at least 8-10 questions per difficulty level (1-5)

### Quizzes Not Generating

**Problem:** Auto-generation runs but creates no quizzes

**Solution:**
- Check if quizzes were recently generated (24-hour cooldown)
- Verify eligible combinations exist
- Check API response for errors array
- Ensure questions have proper metadata

### Same Questions Appearing

**Problem:** Students see repeated questions across quizzes

**Solution:**
- This is normal if the question pool is small (near 40 minimum)
- Add more questions to increase variety
- System weights against recently used questions
- Each quiz should still have unique sequence and difficulty progression

## Monitoring and Analytics

### Key Metrics to Track

1. **Question Coverage**
   - How many questions are eligible for each grade/subject/quiz_level
   - Which combinations need more questions

2. **Generation Success Rate**
   - How many quizzes are successfully generated
   - Any recurring errors

3. **Question Usage**
   - Which questions are most frequently used
   - Which questions are never used (may need review)

4. **Student Performance**
   - How students perform on auto-generated quizzes
   - Whether difficulty progression is appropriate

## Future Enhancements

Potential improvements to consider:

1. **Smart Scheduling**
   - Automatic generation based on student enrollment
   - Generate when students complete previous quizzes

2. **Performance-Based Generation**
   - Adjust difficulty based on class average performance
   - Generate remedial or advanced quizzes as needed

3. **Topic-Based Generation**
   - Generate quizzes focused on specific topics
   - Allow filtering by topic tags

4. **ML-Based Selection**
   - Use machine learning to optimize question selection
   - Predict student performance and adjust accordingly

## Support

For questions or issues with automated quiz generation:
1. Check this guide for proper setup and usage
2. Verify question bank has sufficient questions
3. Review API error messages
4. Contact system administrator

## Related Documentation

- Question Bank Management Guide
- Quiz Management Guide  
- Student Assessment Guide
- API Documentation
