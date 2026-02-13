# Pure Adaptive Quiz System - Implementation Guide

## Overview
This implementation provides a **pure adaptive quiz system** where difficulty adjusts after **every single answer**, not every 4 questions. This creates a true adaptive experience based on real-time student performance.

## What Was Changed

### 1. New Scripts Created
Three powerful scripts were added to the `backend/scripts/` directory:

#### `check-question-distribution.js`
- Analyzes question bank distribution across all 10 quiz levels
- Shows breakdown by difficulty (1-5) for each level
- Provides status indicators (✅ EXCELLENT, ✅ GOOD, ⚠️ WARNING, ❌ INSUFFICIENT)
- Helps verify if your question bank is ready for pure adaptive

**Usage:**
```bash
cd backend
npm run check-questions
```

#### `regenerate-adaptive-quizzes.js`
- Pulls ALL active questions from question bank
- Regenerates Quiz documents with full question sets (50+ per level vs old 20)
- Supports command line options:
  - `--yes` or `-y`: Skip confirmation prompt
  - `--levels=1,2,3`: Only regenerate specific levels

**Usage:**
```bash
cd backend
npm run regenerate-quizzes
# Or skip confirmation:
npm run regenerate-quizzes-yes
# Or regenerate specific levels:
npm run regenerate-level 1,2,3
```

#### `setup-adaptive-quizzes.js`
- Combined script that runs analysis then regeneration
- Interactive flow with confirmation prompts
- Provides comprehensive summary

**Usage:**
```bash
cd backend
npm run setup-adaptive
```

### 2. Model Updates

#### `models/QuizAttempt.js`
Added two new optional fields (backward compatible):
- `last_question_difficulty`: Tracks the difficulty of the question that was actually served
- `progressionData`: Stores level progression information as an object

These fields are optional and existing quiz attempts will continue to work without them.

### 3. Route Updates

#### `routes/adaptiveQuizRoutes.js`

**Start Quiz Endpoint** (Line ~434-459):
- Always starts at difficulty 1 (pure adaptive)
- Returns enhanced response with:
  - Pure adaptive mode indicator
  - Description of how the system works
  - Quiz level information

**Submit Answer Endpoint** (Line ~694-757):
- **Replaced complex logic** (gradual/ml-based) with simple +1/-1 logic:
  - ✅ Correct answer → Difficulty +1 (if not at max 5)
  - ❌ Wrong answer → Difficulty -1 (if not at min 1)
- Returns clear messages indicating difficulty changes:
  - "✅ Correct! Difficulty increased: 2 → 3"
  - "❌ Wrong. Difficulty decreased: 3 → 2"
  - "✅ Correct! You're at maximum difficulty (5). Excellent work!"
  - "❌ Wrong. You're at minimum difficulty (1). Keep trying!"
- Tracks topic in answers for skill matrix updates

**Next Question Endpoint** (Line ~527-585):
- Reduced "recently answered" tracking from 3 to 2 questions
- Improved question selection with priority system:
  1. **Priority 1**: Exact difficulty, not recently answered
  2. **Priority 2**: Exact difficulty, allow reuse if needed
  3. **Priority 3**: Adjacent difficulty (±1) if exact not available
- Better handling of question variety

### 4. Package.json Updates
Added 5 new npm scripts:
```json
{
  "check-questions": "node scripts/check-question-distribution.js",
  "regenerate-quizzes": "node scripts/regenerate-adaptive-quizzes.js",
  "setup-adaptive": "node scripts/setup-adaptive-quizzes.js",
  "regenerate-quizzes-yes": "node scripts/regenerate-adaptive-quizzes.js --yes",
  "regenerate-level": "node scripts/regenerate-adaptive-quizzes.js --levels="
}
```

## How Pure Adaptive Works

### Example Flow:
```
Student starts Quiz Level 1:

Q1: Diff 1 → ✅ Correct → Difficulty = 2
Q2: Diff 2 → ✅ Correct → Difficulty = 3
Q3: Diff 3 → ❌ Wrong → Difficulty = 2
Q4: Diff 2 → ✅ Correct → Difficulty = 3
Q5: Diff 3 → ✅ Correct → Difficulty = 4
Q6: Diff 4 → ❌ Wrong → Difficulty = 3
Q7: Diff 3 → ❌ Wrong → Difficulty = 2
Q8: Diff 2 → ✅ Correct → Difficulty = 3
Q9: Diff 3 → ✅ Correct → Difficulty = 4
Q10: Diff 4 → ✅ Correct → Difficulty = 5
Q11: Diff 5 → ✅ Correct → Difficulty = 5 (max)
Q12: Diff 5 → ✅ Correct → Difficulty = 5
Q13: Diff 5 → ❌ Wrong → Difficulty = 4
... continues for 20 questions total
```

Every answer **immediately** affects the next question difficulty!

## Benefits

✅ **True pure adaptive** - Difficulty adjusts after every answer  
✅ **Never get stuck** - One correct answer always moves you forward  
✅ **Huge question variety** - 50+ questions per level vs 20  
✅ **Better student experience** - Immediate feedback and adaptation  
✅ **Scalable** - As you add questions to bank, quizzes automatically benefit  
✅ **Random for each student** - Different questions every time  
✅ **Backward compatible** - Old quiz attempts continue to work  

## Setup Instructions

### For New Deployments:

1. **Check question distribution:**
   ```bash
   cd backend
   npm run check-questions
   ```
   This shows if you have enough questions at each difficulty level.

2. **Regenerate quizzes:**
   ```bash
   npm run regenerate-quizzes
   ```
   This pulls ALL questions from question bank into Quiz documents.

3. **Test the flow:**
   - Start an adaptive quiz
   - Answer questions correctly and incorrectly
   - Verify difficulty adjusts immediately

### For Existing Deployments:

1. **Backup Quiz documents** (optional, they will be replaced)
   
2. **Run full setup:**
   ```bash
   cd backend
   npm run setup-adaptive
   ```
   This will analyze your question bank, then ask for confirmation before regenerating.

3. **Existing QuizAttempt documents** will continue to work (backward compatible)

4. **New quiz attempts** will use pure adaptive logic

## Question Bank Requirements

For optimal pure adaptive experience:

- ✅ 500+ questions total across 10 levels
- ✅ Each level should have 40-60 questions
- ✅ Each level should have 8-12 questions at EACH difficulty (1-5)
- ⚠️ Minimum 4 questions per difficulty to avoid excessive reuse
- ❌ Levels with 0-3 questions at any difficulty may fall back to adjacent difficulties

Run `npm run check-questions` to verify your question bank meets these requirements.

## API Changes

### Start Quiz Response:
**Before:**
```json
{
  "success": true,
  "message": "Quiz attempt started",
  "data": {
    "attemptId": "...",
    "quizTitle": "...",
    "target_correct_answers": 10,
    "current_difficulty": 1,
    "correct_count": 0
  }
}
```

**After:**
```json
{
  "success": true,
  "message": "🎯 Pure Adaptive Quiz Started - Difficulty adjusts after every answer!",
  "data": {
    "attemptId": "...",
    "quizTitle": "...",
    "quizLevel": 1,
    "target_correct_answers": 20,
    "current_difficulty": 1,
    "correct_count": 0,
    "adaptiveMode": "pure",
    "description": "Answer correctly to increase difficulty, incorrectly to decrease"
  }
}
```

### Submit Answer Response:
**Before:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correct_answer": "42",
    "new_difficulty": 2,
    "correct_count": 1,
    "total_answered": 1
  }
}
```

**After:**
```json
{
  "success": true,
  "message": "✅ Correct! Difficulty increased: 1 → 2",
  "data": {
    "isCorrect": true,
    "correct_answer": "42",
    "old_difficulty": 1,
    "new_difficulty": 2,
    "difficulty_changed": true,
    "correct_count": 1,
    "total_answered": 1
  }
}
```

## Rollback Plan

If issues arise:

1. **Keep the scripts** - They're useful for maintenance
2. **Revert routes changes** in `adaptiveQuizRoutes.js` to use checkpoint-based logic
3. **Keep the regenerated Quiz documents** - More questions = better
4. **Or restore Quiz documents from backup** if you made one

## Troubleshooting

### "Not enough questions" errors?
- Run `npm run check-questions` to see distribution
- Add more questions to your question bank at needed difficulty levels
- Run `npm run regenerate-quizzes` to pull new questions into quizzes

### Students seeing same questions?
- This can happen if level has very few questions
- Add more questions to question bank
- Regenerate quizzes to include new questions

### Difficulty not changing?
- Check that Quiz documents were regenerated with `difficulty_progression: 'immediate'`
- Verify new attempts are using pure adaptive logic
- Check browser console for API response messages

## Testing Checklist

- [ ] Run `npm run check-questions` successfully
- [ ] Run `npm run regenerate-quizzes` successfully
- [ ] Start a new quiz attempt
- [ ] Answer correctly, verify difficulty increases
- [ ] Answer wrong, verify difficulty decreases
- [ ] Complete 20-question quiz without "running out" errors
- [ ] Start multiple attempts, verify different questions served
- [ ] Verify old quiz attempts still accessible

## Performance Considerations

- Questions stored in Quiz document (no join queries needed)
- Random selection is O(1)
- Recently answered tracking limited to last 2 questions
- No complex ML calculations - simple +1/-1 logic
- Scales well with large question banks

## Future Enhancements

Possible future improvements:
- Add analytics dashboard showing difficulty progression over time
- Add teacher controls to adjust adaptive sensitivity
- Add student performance heatmaps by difficulty
- Add question usage statistics
- Add automatic question bank balancing recommendations
