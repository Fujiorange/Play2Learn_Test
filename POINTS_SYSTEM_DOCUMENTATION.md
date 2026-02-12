# Play2Learn Points System Documentation

## Overview
The Play2Learn platform now features a comprehensive points system that rewards students based on quiz performance, question difficulty, and quiz level.

## Point Calculation Formula

### For Adaptive Quizzes
Points are calculated per question using the following formula:

```
points_per_correct_answer = 10 × (1 + level_factor × difficulty_factor)

where:
  level_factor = quiz_level / 10        (ranges from 0.1 to 1.0 for levels 1-10)
  difficulty_factor = difficulty / 5     (ranges from 0.2 to 1.0 for difficulty 1-5)
```

### Examples

| Quiz Level | Difficulty | Points per Correct Answer |
|------------|-----------|---------------------------|
| 1          | 1         | 10.2                      |
| 1          | 5         | 12.0                      |
| 5          | 3         | 13.0                      |
| 10         | 1         | 12.0                      |
| 10         | 5         | 20.0                      |

### Key Benefits
1. **Progressive Rewards**: Higher-level quizzes award more points
2. **Difficulty Recognition**: Harder questions within a level are worth more
3. **Fair Scaling**: The formula ensures balanced progression across all levels
4. **Motivation**: Students are incentivized to attempt harder quizzes and questions

## Points Usage

### 1. Leaderboard Ranking
The leaderboard sorts students by:
1. **Quiz Level** (highest first)
2. **Total Points** (most points first)
3. **First Completion Time** (earliest completion wins ties)

This ensures that students who reach higher levels are ranked higher, but points matter for students at the same level.

### 2. Reward Shop
Points earned can be spent in the reward shop to purchase:
- Digital badges
- Achievement unlocks
- Special privileges
- Other rewards configured by school administrators

### 3. Achievement Tracking
Total points contribute to:
- Student profile statistics
- Badge unlocking criteria
- Progress milestones

## Technical Implementation

### Backend
- Points calculation: `backend/routes/adaptiveQuizRoutes.js` (calculateQuestionPoints function)
- Points tracking: Stored in `MathProfile.total_points` field
- Leaderboard sorting: `backend/routes/mongoStudentRoutes.js` (leaderboard endpoint)

### Frontend
- Points display: Student dashboard, leaderboard, quiz results
- Real-time updates: Points are updated immediately after quiz completion

## Configuration

### Default Values
- Base points per correct answer: 10
- Quiz levels: 1-10
- Question difficulty: 1-5
- Target questions per quiz: 20

### Customization
School administrators can adjust point values through the P2L Admin panel under "Skill Points Configuration".

## Quiz Changes

### Adaptive Quizzes
- Now contain 20 questions (increased from 10)
- Questions are randomly selected from the database question pool
- Target correct answers to complete quiz: 20

### Quiz Accessibility
- Students can attempt any quiz at or below their current level
- Previous quizzes can be re-attempted multiple times
- Placement quiz can be retaken at any time

## Leaderboard Features

### View Modes
1. **My Class**: Shows rankings within the student's class
2. **My School**: Shows rankings across the entire school

### Sorting Logic
Students are ranked by:
1. Quiz level achieved (highest level first)
2. Total P-points earned (more points = higher rank)
3. Time of first quiz completion (earlier = higher rank for ties)

This ensures fair competition while rewarding both progress and performance.
