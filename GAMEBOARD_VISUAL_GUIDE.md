# Adaptive Quiz Gameboard - Visual Guide

## Implementation Overview

This document provides a visual guide to the implemented adaptive quiz gameboard system.

## User Interface Components

### 1. Gameboard Component

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│           🎮 Quiz Adventure Board                    │
│              Level X of 10                          │
├─────────────────────────────────────────────────────┤
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                     │
│  │1 │  │2 │  │3 │  │4 │  │5 │                     │
│  │✅│  │✅│  │⭐│  │🔒│  │🔒│                     │
│  │👦│  │  │  │  │  │  │  │  │                     │
│  └──┘  └──┘  └──┘  └──┘  └──┘                     │
│                                                      │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                     │
│  │6 │  │7 │  │8 │  │9 │  │10│                     │
│  │🔒│  │🔒│  │🔒│  │🔒│  │🔒│                     │
│  │  │  │  │  │  │  │  │  │  │                     │
│  └──┘  └──┘  └──┘  └──┘  └──┘                     │
└─────────────────────────────────────────────────────┘

Legend:
⭐ Current Level  |  ✅ Completed  |  🔒 Locked
```

**Character Avatars:**
- 👦 Male students
- 👧 Female students
- 😊 Neutral/Other

### 2. Student Progress Stats

```
┌─────────────────────────────────────────────────────┐
│              📊 Your Progress                        │
├─────────────┬─────────────┬─────────────┬──────────┤
│ Current     │ Total       │ Quizzes     │ Character│
│ Level       │ Points      │ Completed   │          │
│             │             │             │          │
│    3        │   150       │     5       │   👦    │
└─────────────┴─────────────┴─────────────┴──────────┘
│                                                      │
│     🚀 Start Level 3 Quiz                           │
└─────────────────────────────────────────────────────┘
```

### 3. Quiz History Table

```
┌─────────────────────────────────────────────────────┐
│              📈 Recent Quiz History                  │
├──────────┬──────────┬──────────┬───────────────────┤
│ Level    │ P-Score  │ Next     │ Date              │
│ Attempted│          │ Level    │                   │
├──────────┼──────────┼──────────┼───────────────────┤
│ Level 3  │ 2.45 🟢  │ Level 5  │ 📈 Feb 10, 2026  │
│ Level 2  │ 1.85 🔵  │ Level 3  │ 📈 Feb 09, 2026  │
│ Level 2  │ 1.50 🔵  │ Level 2  │    Feb 08, 2026  │
│ Level 1  │ 0.95 🔴  │ Level 1  │    Feb 07, 2026  │
└──────────┴──────────┴──────────┴───────────────────┘

Color Legend:
🟢 Green (P > 2.4): Excellent - Skip levels
🔵 Blue (1.7 < P ≤ 2.4): Very Good - Up 1 level
🔴 Red (P ≤ 1.0): Needs Improvement - Down 1 level
```

## User Flow

### Initial State (New Student)
```
1. Student logs in
2. System checks StudentProfile
3. If no profile exists:
   - Creates profile with currentLevel = 1
   - Sets gameboard_position = 1
   - Assigns character_type from User.gender
4. Student sees gameboard at Level 1
```

### Quiz Taking Flow
```
1. Student clicks "Start Level X Quiz"
   ↓
2. System fetches quiz for current level
   GET /api/adaptive-quiz/quizzes/level/{level}
   ↓
3. Student takes quiz (via existing TakeQuiz component)
   ↓
4. System calculates P-score
   accuracy = correct / total
   time_factor = max(0, 1 - time/max_time)
   speed_bonus = 0.5 × time_factor
   base_score = accuracy × (1 + speed_bonus)
   P = base_score × (1 + 0.2 × (difficulty - 1))
   ↓
5. System determines next level
   P ≤ 1.0:     Down 1 level
   1.0 < P ≤ 1.7: Stay same
   1.7 < P ≤ 2.4: Up 1 level
   P > 2.4:     Up 1-2 levels (capped)
   ↓
6. System updates StudentProfile
   - Updates currentLevel
   - Updates gameboard_position
   - Adds to quiz_history
   ↓
7. Student returns to gameboard
   - Sees updated position
   - Can start next quiz
```

## Level Progression Examples

### Example 1: Excellent Performance
```
Current Level: 3
Quiz Results: 10/10 correct in 5 minutes
Max Time: 15 minutes

Calculation:
- accuracy = 10/10 = 1.0
- time_factor = 1 - (5×60)/(15×60) = 0.667
- speed_bonus = 0.5 × 0.667 = 0.333
- base_score = 1.0 × (1 + 0.333) = 1.333
- difficulty = ceil(3/2) = 2
- P = 1.333 × (1 + 0.2 × 1) = 1.6

Result: 1.0 < P ≤ 1.7 → Stay at Level 3
```

### Example 2: Outstanding Performance
```
Current Level: 3
Quiz Results: 10/10 correct in 3 minutes
Max Time: 15 minutes

Calculation:
- accuracy = 10/10 = 1.0
- time_factor = 1 - (3×60)/(15×60) = 0.8
- speed_bonus = 0.5 × 0.8 = 0.4
- base_score = 1.0 × (1 + 0.4) = 1.4
- difficulty = ceil(3/2) = 2
- P = 1.4 × (1 + 0.2 × 1) = 1.68

Result: 1.0 < P ≤ 1.7 → Stay at Level 3

(Need even faster or higher difficulty for jump)
```

### Example 3: Perfect with Speed
```
Current Level: 5
Quiz Results: 10/10 correct in 2 minutes
Max Time: 15 minutes

Calculation:
- accuracy = 10/10 = 1.0
- time_factor = 1 - (2×60)/(15×60) = 0.867
- speed_bonus = 0.5 × 0.867 = 0.433
- base_score = 1.0 × (1 + 0.433) = 1.433
- difficulty = ceil(5/2) = 3
- P = 1.433 × (1 + 0.2 × 2) = 2.0

Result: 1.7 < P ≤ 2.4 → Up 1 level to Level 6
```

### Example 4: Level Skip
```
Current Level: 5
Quiz Results: 10/10 correct in 1 minute (very fast!)
Max Time: 10 minutes (harder quiz, less time)

Calculation:
- accuracy = 10/10 = 1.0
- time_factor = 1 - (60)/(600) = 0.9
- speed_bonus = 0.5 × 0.9 = 0.45
- base_score = 1.0 × (1 + 0.45) = 1.45
- difficulty = ceil(5/2) = 3
- P = 1.45 × (1 + 0.2 × 2) = 2.03

Still not enough! Need P > 2.4

Let's try difficulty 5 (level 10):
- P = 1.45 × (1 + 0.2 × 4) = 2.61

Result: P > 2.4 → Skip levels!
- extra_levels = floor((2.61 - 2.4) / 0.2) = 1
- skip_amount = min(2, 1 + 1) = 2
- Next Level = min(10, 5 + 2) = 7 ✓
```

## Responsive Design

### Desktop (>768px)
- Gameboard: 5 columns × 2 rows
- Stats: 4 columns
- Full quiz history table

### Tablet (480-768px)
- Gameboard: 3 columns × 4 rows
- Stats: 2 columns
- Scrollable history table

### Mobile (<480px)
- Gameboard: 2 columns × 5 rows
- Stats: 1 column (stacked)
- Horizontal scroll for history

## Animation States

### 1. Idle State
- Character avatar pulses gently
- Current level has green glow
- Completed levels have blue tint

### 2. Level Up Animation
```
1. Character bounces on current space
2. Character moves to next space(s)
   - 0.5s per space
3. Confetti effect (future enhancement)
4. New level highlighted
```

### 3. Level Down Animation
```
1. Character dims slightly
2. Character moves back one space
3. Previous level becomes current
```

## API Integration

### Endpoint Usage

```
GET /api/adaptive-quiz/student/level
Response:
{
  "success": true,
  "data": {
    "currentLevel": 3,
    "gameboard_position": 3,
    "character_type": "male",
    "totalPoints": 150,
    "quiz_history": [
      {
        "level_attempted": 2,
        "P_score": 1.85,
        "next_level": 3,
        "timestamp": "2026-02-09T..."
      }
    ]
  }
}
```

```
GET /api/adaptive-quiz/quizzes/level/3
Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Level 3 Adaptive Quiz",
    "quiz_level": 3,
    "questions": [...]
  }
}
```

## Color Scheme

### Primary Colors
- Green (#10b981): Success, excellent performance
- Blue (#3b82f6): Progress, very good performance
- Red (#ef4444): Warning, needs improvement
- Gray (#6b7280): Neutral, locked levels

### Gradients
- Header: #e8eef5 → #dce4f0
- Buttons: #10b981 → #059669
- Current Level: #ecfdf5 → #d1fae5
- Completed Level: #eff6ff → #dbeafe

## Accessibility

### ARIA Labels
- Gameboard spaces have level numbers
- Character type indicated in stats
- Color coding supplemented with icons (📈📉)

### Keyboard Navigation
- Tab through gameboard spaces
- Enter to start quiz
- Arrow keys for navigation (future)

### Screen Readers
- Current level announced
- P-score values read with context
- Progress updates verbalized

## Performance Considerations

### Optimizations
- Use React.memo for Gameboard component
- Lazy load quiz history (only show last 5)
- Cache student level data
- Debounce API calls

### Loading States
- Skeleton screens for stats
- Placeholder for gameboard
- Progressive loading of history

## Error Handling

### No Quiz Available
```
Error: "No quiz available for your level"
Action: Show message, allow retry
```

### Network Error
```
Error: "Failed to load student data"
Action: Show error banner, retry button
```

### Invalid Level
```
Error: Level must be 1-10
Action: Reset to last valid level
```

## Testing Scenarios

### Unit Tests
- [ ] P-score calculation
- [ ] Level progression logic
- [ ] Character type assignment
- [ ] 2-level skip cap enforcement

### Integration Tests
- [ ] API endpoint responses
- [ ] Database updates
- [ ] Quiz history tracking
- [ ] Backward compatibility

### E2E Tests
- [ ] Complete quiz flow
- [ ] Level progression
- [ ] Gameboard updates
- [ ] Navigation flow

## Deployment Checklist

- [x] Frontend builds successfully
- [x] Backend code reviewed
- [x] Security scan completed
- [ ] Database indexes created
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] User documentation updated
- [ ] Admin training completed
- [ ] Rollback plan prepared

---

**Implementation Status**: ✅ Complete
**Ready for**: Testing & Deployment
**Next Steps**: UI testing, E2E testing, production deployment
