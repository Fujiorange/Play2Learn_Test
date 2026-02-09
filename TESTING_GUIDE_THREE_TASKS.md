# Testing Guide - Three Tasks Implementation

This guide provides comprehensive testing instructions for all three implemented fixes.

---

## Prerequisites

### Access Requirements
- P2L Admin account for testing admin features
- Test email account for registration flow
- MongoDB access for verifying database changes

### Test Environment
- Development: `http://localhost:5000`
- Production: `https://play2learn-test.onrender.com`

---

## Task 1: License Duplicate Key Error Fix

### 1.1 Pre-Migration Testing (Reproduce Original Bug)

**Skip if already deployed - this documents the original issue**

1. Navigate to `/p2ladmin/licenses`
2. Create first "paid" license:
   - Name: "Basic Plan"
   - Type: "paid"
   - Monthly Price: 250
   - Click Create
   - ✅ Should succeed

3. Create second "paid" license:
   - Name: "Standard Plan"
   - Type: "paid"
   - Monthly Price: 500
   - Click Create
   - ❌ **Expected**: Error message showing duplicate key error
   ```
   E11000 duplicate key error collection: play2learn.licenses index: type_1 dup key: { type: "paid" }
   ```

### 1.2 Run Migration

```bash
# Backup database first
mongodump --uri="<your-mongodb-uri>" --out=./backup-$(date +%Y%m%d)

# Run migration
cd backend
node drop-license-type-index.js
```

**Expected Output**:
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB
📋 Checking existing indexes on licenses collection...
🗑️  Dropping type_1 unique index...
✅ Successfully dropped type_1 index

📋 Final indexes on licenses collection:
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "name": 1 }, "name": "name_1", "unique": true }
]

✅ Migration completed successfully!
```

### 1.3 Post-Migration Testing

1. Navigate to `/p2ladmin/licenses`

2. Create first "paid" license:
   - Name: "Basic Plan"
   - Type: "paid"
   - Monthly Price: 250
   - Monthly Teachers: 50
   - Monthly Students: 500
   - Click Create
   - ✅ **Expected**: Success message
   - ✅ **Verify**: License appears in list

3. Create second "paid" license:
   - Name: "Standard Plan"
   - Type: "paid"
   - Monthly Price: 500
   - Monthly Teachers: 100
   - Monthly Students: 1000
   - Click Create
   - ✅ **Expected**: Success message (NO ERROR)
   - ✅ **Verify**: Both licenses appear in list

4. Create third "paid" license:
   - Name: "Premium Plan"
   - Type: "paid"
   - Monthly Price: 1000
   - Monthly Teachers: 250
   - Monthly Students: 2500
   - Click Create
   - ✅ **Expected**: Success message
   - ✅ **Verify**: All three licenses visible

5. Test duplicate name validation (should still fail):
   - Try to create license with name "Basic Plan"
   - ✅ **Expected**: Error message about duplicate name
   - ✅ **Verify**: Name uniqueness still enforced

6. Create "free" license:
   - Name: "Free Trial"
   - Type: "free"
   - All prices: 0
   - Click Create
   - ✅ **Expected**: Success message
   - ✅ **Verify**: Can have both "paid" and "free" types

### 1.4 Database Verification

```bash
# Connect to MongoDB
mongo <your-mongodb-uri>

# Check indexes
db.licenses.getIndexes()

# Expected: Should NOT have type_1 index
# Expected: Should HAVE name_1 unique index
```

---

## Task 2: Quiz Level Filter

### 2.1 Question Bank - Filter Testing

1. Navigate to `/p2ladmin/questions`

2. **Verify UI Elements**:
   - ✅ Five filter dropdowns visible:
     - Difficulty
     - Subject
     - Topic
     - Grade
     - Quiz Level (NEW)
   - ✅ Quiz Level dropdown populated from database
   - ✅ Only shows levels that exist in questions

3. **Test Quiz Level Filter**:
   
   a. Filter by Quiz Level 1:
   - Select "Quiz Level 1" from dropdown
   - ✅ **Expected**: Only level 1 questions shown
   - ✅ **Verify**: Question count updates correctly
   
   b. Filter by Quiz Level 2:
   - Select "Quiz Level 2" from dropdown
   - ✅ **Expected**: Only level 2 questions shown
   - ✅ **Verify**: Different questions than level 1
   
   c. Combine filters:
   - Select "Quiz Level 1" AND "Difficulty: Level 3"
   - ✅ **Expected**: Only questions matching both criteria
   
   d. Clear filters:
   - Click "Clear Filters"
   - ✅ **Expected**: All questions shown again
   - ✅ **Verify**: All filter dropdowns reset to "All"

### 2.2 Question Display Testing

For each question card, verify the following badges are displayed:

1. **Header Badges** (top of card):
   - ✅ Difficulty badge (colored: blue/green/yellow/red/purple)
   - ✅ Subject badge (light blue background)
   - ✅ Grade badge (green background)
   - ✅ **Quiz Level badge** (light blue, format: "Quiz Level X")
   - ✅ **Topic badge** (yellow background, only if topic exists)

2. **Badge Styling**:
   - ✅ All badges are rounded pills
   - ✅ Badges have appropriate spacing
   - ✅ Colors match the CSS specifications

3. **Topic Display**:
   - ✅ Topic shown in header badge (if exists)
   - ✅ Topic NOT shown in card body (removed duplicate)

### 2.3 Question Creation/Edit Testing

1. Click "Create Question"
2. Fill form including Quiz Level
3. ✅ **Verify**: Quiz Level dropdown has options 1-10
4. Create question with Quiz Level 5
5. ✅ **Verify**: New question displays "Quiz Level 5" badge
6. Edit the question, change to Quiz Level 3
7. ✅ **Verify**: Badge updates to "Quiz Level 3"

### 2.4 API Endpoint Testing

Use browser console or API testing tool:

```javascript
// Test quiz levels endpoint
fetch('/api/p2ladmin/questions-quiz-levels', {
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
})
.then(r => r.json())
.then(console.log);

// Expected response:
// {
//   success: true,
//   data: [1, 2, 3, 4, 5, ...] // Numbers only, sorted
// }

// Test questions filter with quiz_level
fetch('/api/p2ladmin/questions?quiz_level=3', {
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
})
.then(r => r.json())
.then(console.log);

// Expected: Only questions with quiz_level: 3
```

### 2.5 Edge Cases

1. **No questions at a level**:
   - Delete all level 5 questions
   - ✅ **Verify**: Level 5 doesn't appear in dropdown
   - Create a level 5 question
   - ✅ **Verify**: Level 5 now appears in dropdown

2. **Missing quiz_level field** (old questions):
   - Questions without quiz_level should still display
   - ✅ **Verify**: No quiz level badge shown for these
   - Edit and add quiz_level
   - ✅ **Verify**: Badge appears after saving

---

## Task 3: School Admin Registration & Management

### 3.1 New Institute Registration

1. **Logout** from any existing account

2. Navigate to `/register`

3. Fill registration form:
   - Email: `testschool@example.com`
   - Password: `SecurePass123!`
   - Institution Name: `Test Academy`
   - Click Register

4. ✅ **Expected**: Success message
5. ✅ **Verify**: Can login immediately with credentials

### 3.2 P2L Admin - School Visibility

1. Login as P2L Admin

2. Navigate to `/p2ladmin/school-admins`

3. **Verify School Dropdown**:
   - ✅ Dropdown loads without errors
   - ✅ "Test Academy" appears in list
   - ✅ Format: "Test Academy (Free Trial)"
   - ✅ NOT: "Test Academy (undefined)" or error

4. Select "Test Academy" from dropdown

5. **Verify Admin Display**:
   - ✅ "testschool@example.com" appears in admin list
   - ✅ Admin card shows name and email
   - ✅ Created date is today

### 3.3 School Admin Reset Password

1. From school admin list, click "Reset Password" for an admin

2. ✅ **Expected**: Confirmation dialog appears

3. Confirm reset

4. ✅ **Expected**: Success message
5. ✅ **Expected**: Alert showing temporary password
6. ✅ **Verify**: "View Temp Password" button appears on admin card

7. Click "View Temp Password"

8. ✅ **Expected**: Temp password shown in alert
9. ✅ **Expected**: Warning about one-time viewing
10. ✅ **Verify**: Button disappears after viewing

### 3.4 School Admin First Login

1. **Logout** from P2L Admin account

2. Navigate to `/login`

3. Login with reset credentials:
   - Email: (admin email)
   - Password: (temporary password from reset)

4. ✅ **Expected**: Login successful
5. ✅ **Expected**: Redirected to change password page
6. ✅ **Verify**: Message about required password change

7. Enter new password:
   - Old Password: (temporary password)
   - New Password: `NewSecurePass123!`
   - Confirm Password: `NewSecurePass123!`

8. ✅ **Expected**: Success message
9. ✅ **Verify**: Redirected to dashboard
10. ✅ **Verify**: Can use new password for future logins

### 3.5 Verify Temp Password Cleanup

1. Login as P2L Admin again

2. Navigate to school admin management

3. Select school with recently reset admin

4. ✅ **Verify**: "View Temp Password" button NO LONGER appears
5. ✅ **Expected**: Temp password was cleared after password change

### 3.6 Database Verification

```bash
# Connect to MongoDB
mongo <your-mongodb-uri>

# Check user was created correctly
db.users.findOne({ email: "testschool@example.com" })

# Verify fields:
# - role: "School Admin"
# - schoolId: (should match school._id)
# - emailVerified: true
# - accountActive: true
# - isTrialUser: true

# Check school was created
db.schools.findOne({ organization_name: "Test Academy" })

# Verify fields:
# - licenseId: (should reference "Free Trial" license)
# - contact: "testschool@example.com"
# - is_active: true
```

### 3.7 Email Testing

If email service is configured:

1. Reset a school admin password

2. ✅ **Verify**: Email sent to admin's email address

3. Check email content:
   - ✅ Contains school name
   - ✅ Contains login credentials
   - ✅ Contains temporary password
   - ✅ Instructions to change password on first login

---

## Integration Testing

### Scenario 1: Complete Institute Onboarding

1. Register new institute
2. Login as new school admin
3. P2L Admin creates additional admin for same school
4. Verify both admins appear in school admin management
5. Both admins can login and access school dashboard

### Scenario 2: Multi-License School

1. P2L Admin creates multiple paid licenses (after migration)
2. Create school with "Basic Plan"
3. Verify school shows "(Basic Plan)" in dropdown
4. Upgrade school to "Premium Plan"
5. Verify dropdown updates to "(Premium Plan)"

### Scenario 3: Question Management Workflow

1. Create questions with different quiz levels
2. Filter by quiz level to verify questions
3. Bulk select all level 1 questions
4. Delete them
5. Verify level 1 removed from filter dropdown
6. Create new level 1 question
7. Verify level 1 reappears in dropdown

---

## Regression Testing

Verify existing functionality still works:

### License Management
- ✅ Can create "free" licenses
- ✅ Can edit licenses
- ✅ Can delete deletable licenses
- ✅ Cannot delete protected licenses
- ✅ Cannot create duplicate names

### Question Management
- ✅ Can create questions
- ✅ Can edit questions
- ✅ Can delete questions
- ✅ Can upload CSV questions
- ✅ All existing filters (difficulty, subject, topic, grade) work
- ✅ Bulk select/delete works

### School Management
- ✅ Can create schools manually
- ✅ Can edit schools
- ✅ Can delete schools
- ✅ School license assignment works

### Authentication
- ✅ P2L Admin login works
- ✅ School Admin login works
- ✅ Student/Teacher login works
- ✅ Role-based access control enforced

---

## Performance Testing

### Questions Page
1. Create 100+ questions
2. Apply filters
3. ✅ **Verify**: Page loads in < 2 seconds
4. ✅ **Verify**: Filtering is instant

### School Admin Management
1. Create 20+ schools
2. Create 5+ admins per school
3. ✅ **Verify**: Dropdown loads in < 1 second
4. ✅ **Verify**: Admin list loads instantly when school selected

---

## Security Testing

### Authentication
1. Try accessing `/p2ladmin` routes without login
2. ✅ **Expected**: Redirected to login or 401 error

### Authorization
1. Login as School Admin
2. Try accessing `/p2ladmin/licenses`
3. ✅ **Expected**: 403 Forbidden error

### Password Security
1. Check database after password reset
2. ✅ **Verify**: `password` field is hashed
3. ✅ **Verify**: `tempPassword` is plaintext (documented tradeoff)
4. Change password
5. ✅ **Verify**: `tempPassword` cleared from database

### Input Validation
1. Try creating license with negative price
2. ✅ **Expected**: Error message
3. Try creating question with quiz_level = 99
4. ✅ **Expected**: Accepted (no max validation currently)

---

## Browser Compatibility

Test in multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

Verify:
- ✅ All filters work
- ✅ Badges display correctly
- ✅ Dropdowns populate
- ✅ No console errors

---

## Mobile Responsiveness

Test on mobile viewport (375x667):
1. Navigate to questions page
2. ✅ **Verify**: Filters stack vertically
3. ✅ **Verify**: All badges readable
4. ✅ **Verify**: Cards display correctly

---

## Test Checklist Summary

### Task 1: License Duplicate Fix
- [ ] Pre-migration: Verify bug exists
- [ ] Run migration successfully
- [ ] Post-migration: Create multiple paid licenses
- [ ] Verify name uniqueness still enforced
- [ ] Database verification

### Task 2: Quiz Level Filter
- [ ] Quiz level dropdown appears and populates
- [ ] Filtering by quiz level works
- [ ] Quiz level and topic badges display
- [ ] Combine filters works
- [ ] Clear filters resets quiz level
- [ ] API endpoints return correct data
- [ ] Edge cases (no questions at level)

### Task 3: School Admin Management
- [ ] New institute registration works
- [ ] School appears in P2L Admin dropdown
- [ ] School displays with license name (not undefined)
- [ ] Admin appears in admin list
- [ ] Password reset generates temp password
- [ ] Temp password can be viewed once
- [ ] First login requires password change
- [ ] Temp password cleared after change
- [ ] Email sent (if configured)

### Integration & Regression
- [ ] Complete onboarding workflow
- [ ] Existing features still work
- [ ] No console errors
- [ ] Performance acceptable

### Security
- [ ] Authentication enforced
- [ ] Authorization enforced
- [ ] Passwords hashed
- [ ] Temp password cleanup works

---

## Reporting Issues

If any test fails, report with:
1. Test section and step number
2. Expected behavior
3. Actual behavior
4. Browser/environment
5. Console errors (if any)
6. Screenshots

---

**Last Updated**: 2026-02-09  
**Testing Environment**: Development & Production  
**Status**: Ready for Testing
