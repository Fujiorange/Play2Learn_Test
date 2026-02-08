# Testing Guide for Registration and License Management Fixes

## Prerequisites

Before testing, ensure:
1. MongoDB is running
2. Backend server is running (`npm start` in backend directory)
3. Frontend server is running (`npm start` in frontend directory)
4. Licenses are seeded in the database

### Seed Licenses
```bash
cd backend
node seed-licenses.js
```

This will create:
- Free Trial (1 teacher, 5 students, 1 class)
- Basic Plan ($250/month, 50 teachers, 500 students, 100 classes)
- Standard Plan ($500/month, 100 teachers, 1000 students, 200 classes)
- Premium Plan ($1000/month, 250 teachers, 2500 students, 500 classes)

---

## Test 1: Registration Flow

### Steps:
1. Navigate to `/register` (or click "Register" from login page)
2. Fill out the registration form:
   - Institution Name: "Test School 123"
   - Email: "testadmin@example.com"
   - How did you hear about us: (optional)
   - Password: "testpass123"
   - Confirm Password: "testpass123"
3. Click "Start Free Trial"

### Expected Results:
- ✅ Success message: "✅ Institute registered successfully with free trial! Redirecting to login..."
- ✅ Page redirects to login page after 2 seconds
- ✅ Can log in with the credentials
- ✅ Console shows: `✅ New institute registered: testadmin@example.com for Test School 123`
- ✅ Console shows license details: `License: Free Trial (Teachers: 0/1, Students: 0/5, Classes: 0/1)`

### Error Cases to Test:
1. **Duplicate email**: Try registering with the same email again
   - Expected: "Email already registered"
2. **Duplicate institution name**: Try registering with the same institution name
   - Expected: "An organization with this name already exists. Please use a different name."
3. **Password mismatch**: Enter different passwords
   - Expected: "Passwords do not match"
4. **Short password**: Enter password less than 8 characters
   - Expected: "Password must be at least 8 characters long"
5. **Missing fields**: Leave required fields empty
   - Expected: Appropriate validation errors

---

## Test 2: School Appears in P2L Admin Panel

### Prerequisites:
- Log in as P2L Admin (platform admin account)

### Steps:
1. Navigate to `/p2ladmin/schools`
2. Look for the newly registered school

### Expected Results:
- ✅ "Test School 123" appears in the school list
- ✅ Organization type shows "school"
- ✅ License shows "Free Trial (free)"
- ✅ Teachers: 0/1
- ✅ Students: 0/5
- ✅ Classes: 0/1
- ✅ Price: $0/month, $0/year
- ✅ Contact shows the registered email

---

## Test 3: License Management Page UI

### Steps:
1. Navigate to `/p2ladmin/licenses`

### Expected Results:
- ✅ Page header shows "License Management"
- ✅ "← Back to Dashboard" button is visible below the title
- ✅ "← Back to Dashboard" button has green color
- ✅ Hovering over back button shows underline and darker green
- ✅ Clicking back button navigates to `/p2ladmin/dashboard`
- ✅ "+ Create New License" button is on the right side
- ✅ All existing licenses are displayed in cards
- ✅ Each license card shows:
  - Name and active/inactive badge
  - Type (free/paid)
  - Monthly and yearly prices
  - Max teachers, students, and classes
  - Description
  - Edit and Delete buttons

### UI Quality Checks:
- ✅ Layout is responsive on mobile
- ✅ Colors are consistent with design system
- ✅ No visual glitches or alignment issues
- ✅ Buttons have proper hover states
- ✅ Form is well-organized when creating/editing licenses

---

## Test 4: School Organization Type

### Steps:
1. Navigate to `/p2ladmin/schools`
2. Click "Create School" or edit an existing school

### Expected Results:
- ✅ Organization Type dropdown shows only 2 options:
  - School
  - Training Center
- ✅ "University" option is NOT present
- ✅ Can create a new school with "School" type
- ✅ Can create a new school with "Training Center" type
- ✅ Existing schools with "university" type still display correctly (backward compatibility)

---

## Test 5: School Admin Dashboard (After Registration)

### Prerequisites:
- Log in with the newly registered school admin account

### Steps:
1. Navigate to school admin dashboard

### Expected Results:
- ✅ Dashboard loads successfully
- ✅ License information displays correctly:
  - Plan: "Free Trial"
  - Teachers: 0/1
  - Students: 0/5
  - Available slots shown correctly
- ✅ Can navigate to all school admin features
- ✅ Can add teachers (within limit)
- ✅ Can add students (within limit)

---

## Test 6: License Limit Enforcement

### Steps:
1. Log in as the school admin
2. Try to add 2 teachers (limit is 1)

### Expected Results:
- ✅ First teacher is added successfully
- ✅ Second teacher addition fails with limit error
- ✅ Error message indicates limit has been reached

### Steps (Students):
1. Try to add 6 students (limit is 5)

### Expected Results:
- ✅ First 5 students are added successfully
- ✅ Sixth student addition fails with limit error

---

## Test 7: Unlimited License Support

### Prerequisites:
- Create a license with -1 values for unlimited
- Assign it to a school

### Steps:
1. View school info in admin panel

### Expected Results:
- ✅ Shows "Unlimited" or "-1" for teachers/students/classes
- ✅ `available` field returns -1 (not Infinity or null)
- ✅ `limitReached` is always false
- ✅ Can add unlimited teachers/students

---

## Test 8: Backend API Responses

### Manual API Testing:

**Test Registration Endpoint:**
```bash
curl -X POST http://localhost:5000/api/mongo/auth/register-school-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "testpass123",
    "institutionName": "API Test School"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Institute registered successfully with free trial",
  "schoolId": "..."
}
```

**Test School Info Endpoint:**
```bash
# First, get the auth token by logging in
curl -X POST http://localhost:5000/api/mongo/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "testpass123"
  }'

# Then use the token to get school info
curl -X GET http://localhost:5000/api/school-admin/school-info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected Response:
```json
{
  "success": true,
  "school": {
    "id": "...",
    "organization_name": "API Test School",
    "organization_type": "school",
    "plan": "Free Trial",
    "plan_info": {
      "teacher_limit": 1,
      "student_limit": 5,
      "price": 0
    },
    "current_teachers": 0,
    "current_students": 0,
    "is_active": true
  },
  "license": {
    "plan": "Free Trial",
    "teachers": {
      "current": 0,
      "limit": 1,
      "available": 1,
      "limitReached": false
    },
    "students": {
      "current": 0,
      "limit": 5,
      "available": 5,
      "limitReached": false
    }
  }
}
```

---

## Test 9: Database Verification

### Steps:
1. Connect to MongoDB
2. Check the schools collection

```javascript
// In MongoDB shell or Compass
use play2learn

// Find the newly created school
db.schools.findOne({ organization_name: "Test School 123" })
```

### Expected Results:
- ✅ School document exists
- ✅ `licenseId` field is populated with ObjectId (not null)
- ✅ No `plan` or `plan_info` fields (deprecated)
- ✅ `organization_type` is "school"
- ✅ `current_teachers` is 0
- ✅ `current_students` is 0
- ✅ `is_active` is true

```javascript
// Check the license
const school = db.schools.findOne({ organization_name: "Test School 123" })
db.licenses.findOne({ _id: school.licenseId })
```

### Expected Results:
- ✅ License exists
- ✅ `name` is "Free Trial"
- ✅ `type` is "free"
- ✅ `maxTeachers` is 1
- ✅ `maxStudents` is 5
- ✅ `maxClasses` is 1
- ✅ `priceMonthly` is 0
- ✅ `priceYearly` is 0

---

## Test 10: Error Handling

### Test: Trial License Not Found

Temporarily rename the Free Trial license or delete it, then try to register:

```bash
# In MongoDB
db.licenses.updateOne(
  { name: "Free Trial" },
  { $set: { name: "Free Trial DISABLED" } }
)

# Try to register
# Should get error: "Trial license not configured. Please contact support."

# Restore the license
db.licenses.updateOne(
  { name: "Free Trial DISABLED" },
  { $set: { name: "Free Trial" } }
)
```

---

## Regression Testing

### Areas to Verify Haven't Broken:

1. **Existing Schools**
   - ✅ Schools created before this update still work
   - ✅ School admin can still log in
   - ✅ School admin dashboard loads

2. **Other User Roles**
   - ✅ Students can log in and access their dashboard
   - ✅ Teachers can log in and access their dashboard
   - ✅ Parents can log in and access their dashboard
   - ✅ P2L Admin can log in and access admin panel

3. **Other Features**
   - ✅ Quiz system still works
   - ✅ Class management still works
   - ✅ Support tickets still work
   - ✅ Landing page customization still works

---

## Performance Testing

1. **Registration Speed**: Should complete in < 2 seconds
2. **School Info Fetch**: Should load in < 500ms
3. **License Management Page**: Should render in < 1 second
4. **Bulk Import**: Should handle 100+ students efficiently

---

## Browser Testing

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Security Testing

1. **SQL/NoSQL Injection**: Try malicious input in registration form
2. **XSS**: Try script tags in institution name
3. **Authentication**: Ensure routes are properly protected
4. **Authorization**: Ensure school admins can only access their own school

---

## Known Limitations

1. **MongoDB Dependency**: The trial license must exist in the database before registration works
2. **No Migration Script**: Existing schools with `plan` and `plan_info` fields will need manual migration
3. **Backward Compatibility**: Some old code may still reference `plan` fields (handled via response mapping)

---

## Troubleshooting

### Registration Fails with "Trial license not configured"
**Solution**: Run `node backend/seed-licenses.js`

### School Info Shows Null for License
**Solution**: The school's `licenseId` is not set or doesn't exist. Manually assign a valid license ID.

### Frontend Shows "University" Option
**Solution**: Clear browser cache and reload the page

### Infinity in JSON Response
**Solution**: This should be fixed - unlimited licenses now return -1 instead of Infinity

---

## Success Criteria

All tests above should pass with ✅ checkmarks. If any test fails, investigate and fix before deploying to production.
