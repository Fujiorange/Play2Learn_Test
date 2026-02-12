# Adaptive Quiz System - Level 1 as Placement Quiz

## Overview
Level 1 quiz now properly uses the **P2L Admin created adaptive quiz system** with performance-based level progression. This is the correct implementation where Level 1 serves as the placement quiz.

## System Architecture

### Quiz System Components

#### 1. Two Quiz Systems (DO NOT CONFUSE)

**A. Adaptive Quiz System** (CURRENT - CORRECT)
- Uses P2L Admin created quizzes
- Stored in `quizzes` collection with `quiz_level` field
- Performance-based progression (can skip levels)
- 20 questions per quiz from database
- Routes: `/api/adaptive-quiz/...`
- Components: `AttemptQuiz.js` → `AttemptAdaptiveQuiz.js`

**B. Regular Quiz System** (OLD - DEPRECATED for placement)
- Generates questions on the fly
- Uses profile-based questions
- Routes: `/api/student/quiz/generate`
- Component: `TakeQuiz.js`
- Should NOT be used for Level 1 placement

#### 2. Correct User Flow

```
Student Dashboard
    ↓ (Click "Quiz" button)
/student/quiz/attempt (AttemptQuiz.js)
    ↓ (Fetch quiz for current level)
API: GET /api/adaptive-quiz/quizzes/level/{level}
    ↓ (Returns quiz with _id)
Navigation to: /student/adaptive-quiz/{quizId}
    ↓ (Route to AttemptAdaptiveQuiz component)
AttemptAdaptiveQuiz.js
    ↓ (Start quiz attempt)
API: POST /api/adaptive-quiz/quizzes/{quizId}/start
    ↓ (Answer questions adaptively)
API: POST /api/adaptive-quiz/attempts/{attemptId}/answer
    ↓ (Complete quiz)
Performance Calculation → Determine Next Level
    ↓
Update StudentProfile.currentLevel = nextLevel
```

## Performance-Based Level Progression

### Formula (from `performanceCalculator.js`)

```javascript
// 1. Calculate Accuracy
accuracy = correct_answers / total_questions

// 2. Calculate Time Factor
time_factor = max(0, 1 - (time / max_time))
speed_bonus = 0.5 × time_factor

// 3. Calculate Base Score
base_score = accuracy × (1 + speed_bonus)

// 4. Apply Difficulty Multiplier
difficulty_multiplier = 1 + 0.2 × (difficulty - 1)

// 5. Final Performance Score (P)
P = base_score × difficulty_multiplier
```

### Level Progression Rules

| Performance Score (P) | Action | Example |
|----------------------|--------|---------|
| P ≤ 1.0 | Go down 1 level | Level 3 → Level 2 |
| 1.0 < P ≤ 1.7 | Stay at current level | Level 1 → Level 1 |
| 1.7 < P ≤ 2.4 | Go up 1 level | Level 1 → Level 2 |
| P > 2.4 | Skip levels (max +2) | Level 1 → Level 3 |

**Skip Level Details:**
- P = 2.5: Skip 1 level (+1)
- P = 2.7: Skip 2 levels (+2)
- P ≥ 2.8: Skip 2 levels (+2) - CAPPED

**Important:** Students CANNOT jump more than 2 levels from their current position.

## Level 1 as Placement Quiz

### Why Level 1 = Placement

1. **First Quiz**: New students start at Level 1
2. **Performance Assessment**: Level 1 quiz assesses student ability
3. **Adaptive Progression**: Based on performance, student can:
   - Stay at Level 1 (needs more practice)
   - Move to Level 2 (good performance)
   - Skip to Level 3 (excellent performance)
4. **No Separate Placement**: No need for a separate "placement quiz" - Level 1 IS the placement

### Performance Examples

**Example 1: Excellent Student**
- Takes Level 1 quiz
- Scores 90% with fast answers
- P-score = 2.8 (excellent)
- Result: Promoted to Level 3 (skip +2 levels)

**Example 2: Good Student**
- Takes Level 1 quiz
- Scores 75% with moderate speed
- P-score = 2.0 (very good)
- Result: Promoted to Level 2 (+1 level)

**Example 3: Struggling Student**
- Takes Level 1 quiz
- Scores 50% with slow answers
- P-score = 1.2 (good but not ready to advance)
- Result: Stays at Level 1

**Example 4: Needs Review**
- Takes Level 1 quiz
- Scores 30% with slow answers
- P-score = 0.8 (needs improvement)
- Result: Would go down but Level 1 is minimum, so stays at Level 1

## Backend Routes

### Adaptive Quiz API Endpoints

```javascript
// Get student's current level
GET /api/adaptive-quiz/student/level
Response: { currentLevel: 1, ... }

// Get quiz for a specific level
GET /api/adaptive-quiz/quizzes/level/{level}
Response: { success: true, data: { _id: "quiz123", ... } }

// Get all available quizzes (filtered by student's level)
GET /api/adaptive-quiz/quizzes
Response: { success: true, data: [...quizzes], studentLevel: 1 }

// Start a quiz attempt
POST /api/adaptive-quiz/quizzes/{quizId}/start
Response: { success: true, data: { attemptId: "attempt123", ... } }

// Get next question
GET /api/adaptive-quiz/attempts/{attemptId}/next-question
Response: { success: true, data: { question: {...}, ... } }

// Submit answer
POST /api/adaptive-quiz/attempts/{attemptId}/answer
Body: { answer: "42", timeSpent: 15 }
Response: { success: true, isCorrect: true, ... }

// Complete quiz (automatic after target correct answers)
Response includes: { performanceScore, nextLevel, ... }
```

## Frontend Components

### Component Hierarchy

```
StudentDashboard.js
    ↓
AttemptQuiz.js (Quiz Selection/Gameboard)
    ↓
AttemptAdaptiveQuiz.js (Quiz Taking Interface)
    ↓
[Quiz Completion & Results]
```

### Key Files

1. **AttemptQuiz.js** (`/student/quiz/attempt`)
   - Shows gameboard with student's progress
   - Displays current level and quiz options
   - Fetches quiz for current level
   - Navigates to adaptive quiz component

2. **AttemptAdaptiveQuiz.js** (`/student/adaptive-quiz/:quizId`)
   - Takes the actual quiz
   - Handles question-by-question adaptive flow
   - Tracks time per question
   - Submits answers to backend
   - Shows results and next level

3. **AdaptiveQuizzes.js** (Alternative entry point)
   - Can be used to browse all available quizzes
   - Allows selecting specific levels
   - Also navigates to AttemptAdaptiveQuiz

## Quiz Creation (P2L Admin)

### How to Create Level 1 Quiz

1. Login as P2L Admin
2. Navigate to `/p2ladmin/quizzes`
3. Click "Create Adaptive Quiz" or bulk upload
4. Set `quiz_level: 1`
5. Add 20+ questions from question bank
6. Ensure quiz is active (`is_active: true`)
7. Launch the quiz for all students

### Quiz Properties

```javascript
{
  title: "Level 1 Math Quiz",
  quiz_level: 1,
  quiz_type: "adaptive",
  questions: [...], // 20+ questions
  is_active: true,
  is_launched: true,
  adaptive_config: {
    target_correct_answers: 20,
    difficulty_progression: "gradual",
    starting_difficulty: 1
  }
}
```

## Student Profile Updates

### After Quiz Completion

```javascript
// StudentProfile model updated
{
  userId: "student123",
  currentLevel: 3, // Updated based on nextLevel
  gameboard_position: 3,
  lastQuizTaken: new Date(),
  performanceHistory: [
    {
      quizLevel: 1,
      performanceScore: 2.8,
      completedAt: new Date()
    }
  ],
  quiz_history: [
    {
      level_attempted: 1,
      P_score: 2.8,
      next_level: 3,
      timestamp: new Date()
    }
  ]
}
```

### MathProfile Updates

```javascript
// Also tracks points earned
{
  total_points: 250, // Based on point formula
  streak: 1,
  current_profile: 1 // Separate from quiz level
}
```

## Common Issues & Solutions

### Issue 1: "No quiz available for your level"
**Cause:** No quiz created for that level in P2L Admin
**Solution:** Create and launch a quiz for that level

### Issue 2: Students stuck at Level 1
**Cause:** Performance not meeting threshold (P ≤ 1.7)
**Solution:** Review quiz difficulty or provide additional support

### Issue 3: Students skipping too many levels
**Cause:** Quiz Level 1 may be too easy
**Solution:** Increase question difficulty for Level 1

### Issue 4: Wrong quiz component being used
**Cause:** Navigation routing to old TakeQuiz component
**Solution:** Ensure routing to `/student/adaptive-quiz/:quizId`

## Migration Notes

### Old System → New System

**Before (INCORRECT):**
- `/student/quiz/take` → TakeQuiz.js → `/api/student/quiz/generate`
- Generated questions on the fly
- No performance-based progression
- No quiz database

**After (CORRECT):**
- `/student/quiz/attempt` → AttemptQuiz.js → `/student/adaptive-quiz/:quizId` → AttemptAdaptiveQuiz.js
- Uses P2L Admin created quizzes
- Performance-based progression with skip capability
- Questions from database

### What to Deprecate

The old regular quiz system (`/api/student/quiz/generate`, `TakeQuiz.js`) should be:
- Removed or marked as deprecated
- Not used for Level 1 placement
- Potentially kept only for practice/drill exercises if needed

## Testing Checklist

### Manual Testing

- [ ] P2L Admin can create Level 1 quiz
- [ ] Level 1 quiz appears in quiz list
- [ ] New student starts at Level 1
- [ ] Quiz uses questions from P2L Admin created quiz
- [ ] Performance score calculates correctly
- [ ] Student promoted to Level 2 with good performance
- [ ] Student can skip to Level 3 with excellent performance
- [ ] Student stays at Level 1 with poor performance
- [ ] Points awarded based on performance
- [ ] Leaderboard updates after quiz completion

### API Testing

```bash
# Get student level
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/adaptive-quiz/student/level

# Get Level 1 quiz
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/adaptive-quiz/quizzes/level/1

# Start quiz
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/adaptive-quiz/quizzes/$QUIZ_ID/start
```

## Summary

✅ Level 1 quiz now uses P2L Admin adaptive quiz system
✅ Performance-based progression (stay, +1, or +2 levels)
✅ Proper routing through AttemptAdaptiveQuiz component
✅ Comprehensive performance calculation with time bonus
✅ Students can skip levels based on excellent performance
✅ No separate placement quiz needed - Level 1 IS placement
