# Visual Guide: P2L Admin Changes

## What You Will See

### 1. Dashboard Statistics (Before vs After)

#### Before:
```
Quick Statistics
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Schools   │  │ Total Admins    │  │ Total Questions │  │ Total Quizzes   │
│       -         │  │       -         │  │       -         │  │       -         │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

#### After:
```
Quick Statistics
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Schools   │  │ Total Admins    │  │ Total Questions │  │ Total Quizzes   │
│       5         │  │       10        │  │      100        │  │       20        │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2. Quiz Manager Header (Before vs After)

#### Before:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Quiz Manager                                                         │
│ Create and manage placement quizzes and adaptive quizzes for students│
│ ← Back to Dashboard                                                  │
│                                                                      │
│                       [+ Create Adaptive Quiz (Advanced)] [+ Create Placement Quiz] │
└──────────────────────────────────────────────────────────────────────┘
```

#### After:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Quiz Manager                                                         │
│ Create and manage placement quizzes and adaptive quizzes for students│
│ ← Back to Dashboard                                                  │
│                                                                      │
│                                             [+ Create Quiz]          │
└──────────────────────────────────────────────────────────────────────┘
```

### 3. Quiz Creation Form - New Adaptive Field

When you click "+ Create Quiz" and check "Enable Adaptive Mode", you will now see:

```
┌─────────────────────────────────────────────────────────────┐
│ Create New Quiz                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Quiz Title *                                                │
│ [____________________________]                              │
│                                                             │
│ Description                                                 │
│ [____________________________]                              │
│ [____________________________]                              │
│                                                             │
│ Quiz Type *                                                 │
│ [Placement Quiz ▼]                                          │
│ Placement quizzes are used for initial student assessment.  │
│ Adaptive quizzes are used for ongoing practice with         │
│ difficulty adjustment.                                      │
│                                                             │
│ ☑ Enable Adaptive Mode                                     │
│ Adaptive quizzes adjust difficulty based on student         │
│ performance                                                 │
│                                                             │
│ ← NEW FIELD APPEARS HERE WHEN CHECKED ↓                    │
│ How many questions correct to end the quiz? *               │
│ [10                ]                                        │
│ Students need to get this many correct answers to complete  │
│ the adaptive quiz                                           │
│                                                             │
│ Select Questions (0 selected)                               │
│ ...                                                         │
│                                                             │
│           [Create Quiz]  [Cancel]                           │
└─────────────────────────────────────────────────────────────┘
```

## How to Access These Changes

1. **Dashboard Statistics:**
   - Login as P2L Admin
   - Navigate to: `/p2ladmin/dashboard`
   - Look at the "Quick Statistics" section at the bottom

2. **Quiz Manager:**
   - Login as P2L Admin
   - Navigate to: `/p2ladmin/quizzes`
   - Click the "+ Create Quiz" button
   - Check the "Enable Adaptive Mode" checkbox
   - You'll see the new "How many questions correct to end the quiz?" field

## Key Features

### Dashboard Statistics:
- Shows real-time counts from the database
- Updates automatically when you refresh the page
- Counts include:
  - Total Schools: All schools in the system
  - Total Admins: All users with 'schooladmin' role
  - Total Questions: All active questions
  - Total Quizzes: All quizzes (placement and adaptive)

### Unified Quiz Form:
- Single entry point for creating any quiz type
- Quiz Type dropdown lets you choose Placement or Adaptive
- "Enable Adaptive Mode" checkbox activates adaptive features
- Conditional field for target correct answers appears only when needed
- All settings in one place - no need to navigate between different pages

### Adaptive Quiz Configuration:
- Default value: 10 correct answers required
- Range: 1-100 questions
- Required field when adaptive mode is enabled
- Persists when you edit existing quizzes
- Clear help text explains what the field does

## Testing Checklist

When deployed, verify:
- [ ] Dashboard shows actual numbers, not dashes
- [ ] Quiz Manager has only one "+ Create Quiz" button
- [ ] Clicking the button opens a modal form
- [ ] "Enable Adaptive Mode" checkbox works
- [ ] "How many questions correct to end the quiz?" appears when adaptive mode is checked
- [ ] Field disappears when adaptive mode is unchecked
- [ ] Can create placement quizzes (without adaptive settings)
- [ ] Can create adaptive quizzes (with target correct answers)
- [ ] Can edit existing quizzes and see current target_correct_answers value
- [ ] Form validates the target_correct_answers field (required, min 1, max 100)
