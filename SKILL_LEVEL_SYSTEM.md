# Skill Level System Documentation

## Overview
The skill level system tracks student progress in different math topics based on points earned from quiz questions.

## Points-Based Leveling

### How Points Are Earned
- Students earn points by correctly answering quiz questions
- Points awarded depend on question difficulty:
  - Difficulty 1: 1 point (correct), -2.5 points (wrong)
  - Difficulty 2: 2 points (correct), -2.0 points (wrong)
  - Difficulty 3: 3 points (correct), -1.5 points (wrong)
  - Difficulty 4: 4 points (correct), -1.0 points (wrong)
  - Difficulty 5: 5 points (correct), -0.5 points (wrong)

### Level Thresholds
Points accumulate over time and determine the skill level:

| Level | Points Required | Description |
|-------|----------------|-------------|
| 0 | 0-24 points | Novice |
| 1 | 25-49 points | Learning |
| 2 | 50-99 points | Beginner |
| 3 | 100-199 points | Intermediate |
| 4 | 200-399 points | Advanced |
| 5 | 400+ points | Master |

### Examples
- Answer 5 difficulty-5 questions correctly: 25 points → Level 1
- Answer 10 difficulty-5 questions correctly: 50 points → Level 2
- Answer 20 difficulty-5 questions correctly: 100 points → Level 3
- Answer 80 difficulty-5 questions correctly: 400 points → Level 5 (Master)

## Skill Topics

### Base Skills
Four core math skills are always available:
1. **Addition** - Adding numbers
2. **Subtraction** - Subtracting numbers
3. **Multiplication** - Multiplying numbers (unlocks at Profile 6)
4. **Division** - Dividing numbers (unlocks at Profile 6)

### Dynamic Skills
Additional skills are automatically created based on question topics:
- **Basic Arithmetic** - General arithmetic questions
- Any other topics defined in quiz questions

## Technical Implementation

### Backend
- **Helper Functions**:
  - `calculateLevelFromPoints(points)`: Converts points to level (0-5)
  - `calculateLevelProgress(points)`: Returns percentage progress within current level
  
- **Skill Updates**:
  - Occurs after quiz completion
  - Points are added/deducted based on answers
  - Level is recalculated based on new point total
  - Progress percentage shows advancement within current level

### Frontend
- **Display Components**:
  - Shows current points for each skill
  - Displays current level and max level (5)
  - Shows point range for current level
  - Indicates points needed for next level
  - Progress bar shows advancement within current level

## Database Schema

### MathSkill Model
```javascript
{
  student_id: ObjectId,      // Reference to student
  skill_name: String,         // Name of skill (e.g., "Addition")
  current_level: Number,      // 0-5 based on points
  xp: Number,                 // Legacy XP (kept for compatibility)
  points: Number,             // Points earned (drives leveling)
  unlocked: Boolean,          // Whether skill is accessible
  updatedAt: Date            // Last update timestamp
}
```

## Configuration

### Points Configuration
P2L Admins can modify point awards/deductions through the SkillPointsConfig model:
- Adjust points for each difficulty level
- Customize correct/wrong answer penalties
- Changes apply to all future quiz attempts

## Benefits of Points-Based System

1. **Intuitive**: Direct relationship between quiz performance and level
2. **Progressive**: Higher levels require more effort to achieve
3. **Flexible**: Topics dynamically create skills
4. **Fair**: Difficult questions worth more points
5. **Forgiving**: Wrong answers deduct fewer points than earned for correct ones
