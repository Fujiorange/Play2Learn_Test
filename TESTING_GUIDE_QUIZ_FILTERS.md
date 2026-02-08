# Testing Guide - Quiz Generation and Dynamic Filters

## Overview
This guide covers testing the fixes for quiz generation routing and dynamic filter implementation.

## Prerequisites
- Backend server running on port 5000
- Frontend server running on port 3000
- P2LAdmin user account created
- Question bank populated with questions

## Test Scenarios

### 1. Quiz Generation Route Fix

#### Test 1.1: Trigger Quiz Generation
**Steps:**
1. Log in as P2LAdmin
2. Navigate to `/p2ladmin/quizzes`
3. Click "Trigger Quiz Generation" button
4. Select a quiz level from dropdown
5. Click "Generate Quiz"

**Expected Result:**
- ✅ No "Route not found" error
- ✅ Success message: "Quiz generated successfully! Created quiz: [quiz title]"
- ✅ New quiz appears in quiz list

**Before Fix:** Returned 404 "Route not found: /api/p2ladmin/quizzes/generate"
**After Fix:** Successfully generates quiz

#### Test 1.2: Verify Route Order
**API Test:**
```bash
# Test that /generate endpoint is accessible
curl -X POST http://localhost:5000/api/p2ladmin/quizzes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quiz_level": 1}'

# Should return success, not 404
```

### 2. Dynamic Quiz Level Dropdown

#### Test 2.1: View Available Quiz Levels
**Steps:**
1. Navigate to `/p2ladmin/quizzes`
2. Click "Trigger Quiz Generation"
3. Check quiz level dropdown

**Expected Result:**
- ✅ Dropdown shows only quiz levels that have questions in the database
- ✅ If questions exist for levels 1, 2, 5, 8 only those appear
- ✅ If no questions exist, shows fallback levels 1-10

**API Test:**
```bash
# Check available quiz levels
curl http://localhost:5000/api/p2ladmin/questions-quiz-levels \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"success": true, "data": [1, 2, 3, ...]}
```

#### Test 2.2: Add Questions and Verify Dynamic Update
**Steps:**
1. Note current quiz levels in dropdown
2. Add questions with a new quiz_level (e.g., 7)
3. Refresh page
4. Open quiz generation form

**Expected Result:**
- ✅ New quiz level appears in dropdown
- ✅ Levels are sorted numerically

### 3. Quiz Level Filter in Questions Page

#### Test 3.1: Filter Questions by Quiz Level
**Steps:**
1. Navigate to `/p2ladmin/questions`
2. Find "Quiz Level" filter dropdown
3. Select "Level 3"
4. Verify filtered results

**Expected Result:**
- ✅ Quiz Level filter is visible in filters section
- ✅ Only questions with quiz_level = 3 are displayed
- ✅ Question count updates correctly

#### Test 3.2: Clear Quiz Level Filter
**Steps:**
1. Apply quiz level filter
2. Click "Clear Filters" button

**Expected Result:**
- ✅ Quiz level filter resets to "All"
- ✅ All questions are displayed again

**API Test:**
```bash
# Test quiz_level filter
curl "http://localhost:5000/api/p2ladmin/questions?quiz_level=3" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return only questions with quiz_level = 3
```

### 4. Dynamic Difficulty Dropdown

#### Test 4.1: View Available Difficulties
**Steps:**
1. Navigate to `/p2ladmin/questions`
2. Check difficulty filter dropdown

**Expected Result:**
- ✅ Dropdown shows only difficulty levels present in question bank
- ✅ If questions exist with difficulties 1, 3, 5, only those appear
- ✅ If no questions exist, shows fallback levels 1-5

**API Test:**
```bash
# Check available difficulties
curl http://localhost:5000/api/p2ladmin/questions-difficulties \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"success": true, "data": [1, 2, 3, 4, 5]}
```

#### Test 4.2: Filter by Dynamic Difficulty
**Steps:**
1. Select a difficulty level
2. Verify filtered results

**Expected Result:**
- ✅ Only questions matching selected difficulty are shown
- ✅ Filter works correctly with other filters (subject, topic, etc.)

### 5. Combined Filter Testing

#### Test 5.1: Multiple Filters
**Steps:**
1. Navigate to `/p2ladmin/questions`
2. Apply filters:
   - Quiz Level: 2
   - Difficulty: 3
   - Subject: Math
   - Grade: Primary 1

**Expected Result:**
- ✅ Only questions matching ALL filters are displayed
- ✅ Filters work correctly in combination

#### Test 5.2: Clear All Filters
**Steps:**
1. Apply multiple filters
2. Click "Clear Filters"

**Expected Result:**
- ✅ All filter dropdowns reset to "All"
- ✅ All questions are displayed

### 6. Edge Cases

#### Test 6.1: Empty Question Bank
**Steps:**
1. Clear all questions from database
2. Navigate to quizzes page
3. Open quiz generation form

**Expected Result:**
- ✅ Quiz level dropdown shows fallback levels 1-10
- ✅ Generation fails with appropriate error message

#### Test 6.2: Invalid Quiz Level
**API Test:**
```bash
# Try to generate quiz with invalid level
curl -X POST http://localhost:5000/api/p2ladmin/quizzes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quiz_level": 99}'

# Should return 400 error: "Invalid quiz_level. Must be between 1 and 10"
```

#### Test 6.3: Boundary Values
**Steps:**
1. Test quiz_level = 1 (minimum)
2. Test quiz_level = 10 (maximum)
3. Test quiz_level = 0 (below minimum)
4. Test quiz_level = 11 (above maximum)

**Expected Result:**
- ✅ Levels 1 and 10 work correctly
- ✅ Levels 0 and 11 return validation error

## Performance Testing

### Test 7.1: Large Question Bank
**Scenario:** 10,000+ questions in database
**Steps:**
1. Load filters page
2. Check dropdown population time

**Expected Result:**
- ✅ Dropdowns load within 2 seconds
- ✅ No browser freezing or lag

## Regression Testing

### Test 8.1: Existing Quiz Features
**Verify these still work:**
- ✅ View all quizzes
- ✅ View single quiz details
- ✅ Update quiz metadata
- ✅ Delete quiz (non-auto-generated)
- ✅ Generate adaptive quiz

### Test 8.2: Existing Question Features
**Verify these still work:**
- ✅ Create new question
- ✅ Edit existing question
- ✅ Delete question
- ✅ Upload CSV
- ✅ Bulk delete questions
- ✅ Existing filters (subject, topic, grade)

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## API Response Validation

### Expected Response Formats

**GET /api/p2ladmin/questions-quiz-levels:**
```json
{
  "success": true,
  "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

**GET /api/p2ladmin/questions-difficulties:**
```json
{
  "success": true,
  "data": [1, 2, 3, 4, 5]
}
```

**POST /api/p2ladmin/quizzes/generate:**
```json
{
  "success": true,
  "message": "Quiz generated successfully for level 1",
  "data": {
    "_id": "...",
    "title": "Auto-Generated Quiz - Level 1",
    "quiz_level": 1,
    "questions": [...],
    ...
  }
}
```

## Test Checklist Summary

- [ ] Quiz generation no longer returns 404
- [ ] Quiz level dropdown is dynamic
- [ ] Quiz level filter appears in questions page
- [ ] Quiz level filter works correctly
- [ ] Difficulty dropdown is dynamic
- [ ] All filters work in combination
- [ ] Clear filters resets all filters including quiz_level
- [ ] Edge cases handled properly
- [ ] No regression in existing features
- [ ] API responses are correct
- [ ] Performance is acceptable

## Notes for QA Team

1. **Authentication Required:** All tests require a valid P2LAdmin token
2. **Data Setup:** Ensure question bank has diverse data (multiple levels, difficulties, subjects)
3. **Error Handling:** Test with various invalid inputs to verify validation
4. **UI Responsiveness:** Check that dropdowns populate without blocking UI
5. **Console Errors:** Check browser console for any JavaScript errors

## Rollback Plan

If issues are found:
1. Revert PR commits
2. Route order reverts to original (specific routes after parameterized)
3. Dropdowns revert to hardcoded values
4. Quiz level filter removed from questions page
