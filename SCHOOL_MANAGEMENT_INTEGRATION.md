# School Management & Landing Page Pricing Integration

## Overview
This document explains the changes made to integrate landing page pricing with school management and fix the school admin authentication issue.

## Problem Statement
1. School admin login was failing - users couldn't access school admin routes after successful authentication
2. School management used hardcoded pricing plans instead of the dynamic pricing from the landing page
3. Need to verify that teacher/student license limits are properly enforced

## Solutions Implemented

### 1. 🐛 Fixed School Admin Authentication Bug

**Issue**: 
- School admins could login successfully but received 403 Forbidden errors when accessing routes
- Root cause: Authentication middleware was checking for role `'school-admin'` but the database stores `'School Admin'`

**Fix Location**: `backend/routes/schoolAdminRoutes.js` (line 57)

```javascript
// BEFORE (incorrect):
if (!user || user.role !== 'school-admin') {
  return res.status(403).json({ success: false, error: 'Access restricted to school admins' });
}

// AFTER (correct):
if (!user || user.role !== 'School Admin') {
  return res.status(403).json({ success: false, error: 'Access restricted to school admins' });
}
```

**Impact**: School admins can now successfully access all routes under `/school-admin/*`

---

### 2. 🔗 Landing Page Pricing Integration

#### Backend Changes

**New API Endpoint**: `GET /api/p2ladmin/landing/pricing-plans`

**Location**: `backend/routes/p2lAdminRoutes.js` (after line 1408)

**Functionality**:
1. Fetches the active landing page from MongoDB
2. Finds the pricing block (type: 'pricing')
3. Extracts pricing plans from `custom_data.plans`
4. Transforms to standardized format:
   ```json
   {
     "success": true,
     "plans": [
       {
         "id": "starter",
         "name": "Starter",
         "description": "Perfect for small schools",
         "price": 2500,
         "teacher_limit": 50,
         "student_limit": 500,
         "features": ["..."],
         "popular": false
       }
     ]
   }
   ```

**Smart ID Matching**:
The endpoint uses intelligent matching to ensure consistency with fallback plans:
- Plan names containing "Starter" or "Basic" → `starter`
- Plan names containing "Professional" or "Pro" → `professional`
- Plan names containing "Enterprise" or "Business" → `enterprise`
- Other names → sanitized lowercase (e.g., "Premium Plan" → `premium-plan`)

This ensures that landing page pricing plans use the same IDs as the hardcoded fallback constants.

#### Frontend Changes

**Service Method**: `frontend/src/services/p2lAdminService.js`

Added new method:
```javascript
export const getLandingPagePricingPlans = async () => {
  return apiCall('/api/p2ladmin/landing/pricing-plans');
};
```

**UI Component**: `frontend/src/components/P2LAdmin/SchoolManagement.js`

**Key Updates**:
1. Fetches pricing plans from landing page on component mount
2. Falls back to hardcoded `LICENSE_PLANS` if:
   - No landing page exists
   - No pricing block found
   - API call fails
3. Dynamically populates plan dropdown
4. Shows warning when no pricing plans are configured

**Code Improvements**:
- Extracted duplicate fallback logic into `useFallbackPlans()` helper
- Added null safety: `(plan.price || 0).toLocaleString()`
- Improved error handling and user feedback

---

### 3. ✅ License Limits Verification

All teacher and student creation endpoints already properly enforce license limits. No changes were needed.

#### Enforcement Points

**1. Manual User Creation** (`POST /school-admin/users/manual`)
- Lines 980-988 in `schoolAdminRoutes.js`
- Calls `checkLicenseAvailability(schoolId, role)` before creating teacher/student
- Returns 403 error with clear message when limit reached

**2. Bulk Teacher Import** (`POST /school-admin/bulk-import-teachers`)
- Lines 555-570 in `schoolAdminRoutes.js`
- Checks limit before each teacher creation
- Stops import gracefully when limit reached
- Returns clear error message with count information

**3. Bulk Student Import** (`POST /school-admin/bulk-import-students`)
- Lines 333-347 in `schoolAdminRoutes.js`
- Checks limit before each student creation
- Stops import gracefully when limit reached
- Returns clear error message with count information

**4. Bulk Parent Import** (`POST /school-admin/bulk-import-parents`)
- No license limits (parents don't count against the plan)

#### Helper Function

**`checkLicenseAvailability(schoolId, role)`** (lines 73-112)

```javascript
async function checkLicenseAvailability(schoolId, role) {
  const school = await School.findById(schoolId);
  
  if (!school || !school.is_active) {
    return { available: false, error: 'School not found or inactive' };
  }
  
  if (role === 'Teacher') {
    const currentTeachers = school.current_teachers || 0;
    const teacherLimit = school.plan_info.teacher_limit;
    
    if (currentTeachers >= teacherLimit) {
      return { 
        available: false, 
        error: `Teacher limit reached (${currentTeachers}/${teacherLimit}). Please upgrade your plan.` 
      };
    }
  }
  
  if (role === 'Student') {
    const currentStudents = school.current_students || 0;
    const studentLimit = school.plan_info.student_limit;
    
    if (currentStudents >= studentLimit) {
      return { 
        available: false, 
        error: `Student limit reached (${currentStudents}/${studentLimit}). Please upgrade your plan.` 
      };
    }
  }
  
  return { available: true, school };
}
```

**Counter Updates**:
When a teacher or student is created, the school's counter is updated atomically using MongoDB's `$inc` operator:

```javascript
await School.findByIdAndUpdate(
  schoolId,
  { $inc: { current_teachers: 1 } }  // or current_students
);
```

This prevents race conditions in bulk operations.

---

## Testing Guide

### Prerequisites
1. MongoDB running and accessible
2. Backend server running: `npm start --prefix backend`
3. Frontend server running: `npm start --prefix frontend`
4. At least one P2L Admin account created

### Test 1: School Admin Login Fix

**Steps**:
1. Login as P2L Admin
2. Navigate to `/p2ladmin/school-admins`
3. Select a school
4. Create a new school admin:
   - Name: Test Admin
   - Email: testadmin@school.com
   - Contact: (optional)
5. Click "Create School Admins"
6. **View the temporary password** (one-time only!)
7. Logout
8. Login with the new school admin credentials
9. Use temporary password and set a new password when prompted
10. **Verify**: Should be redirected to `/school-admin` dashboard (not 403 error)

**Expected Result**: ✅ School admin can access all school admin routes

---

### Test 2: Landing Page Pricing Integration

#### Setup: Create Pricing Block

1. Login as P2L Admin
2. Navigate to `/p2ladmin/landing-page`
3. Click "Add Block"
4. Select type: "Pricing"
5. Fill in details:
   - Title: "Subscription Plans"
   - Subtitle: "Choose the plan that fits your school"
6. Add pricing plans (click "+ Add Plan"):

   **Plan 1: Starter**
   - Name: Starter
   - Description: Perfect for small schools
   - Monthly Price: 250
   - Yearly Price: 2500
   - Max Teachers: 50
   - Max Students: 500
   - Features: (one per line)
     ```
     Basic adaptive learning paths
     Standard analytics dashboard
     Email support
     ```

   **Plan 2: Professional**
   - Name: Professional
   - Description: For growing institutions
   - Monthly Price: 500
   - Yearly Price: 5000
   - Max Teachers: 100
   - Max Students: 1000
   - Mark as Popular: ✓
   - Features:
     ```
     Advanced learning paths
     Comprehensive analytics
     Priority email support
     Custom branding
     ```

   **Plan 3: Enterprise**
   - Name: Enterprise
   - Description: For large organizations
   - Monthly Price: 1000
   - Yearly Price: 10000
   - Max Teachers: 250
   - Max Students: 2500
   - Features:
     ```
     Full feature access
     Advanced analytics & reporting
     24/7 phone & email support
     Dedicated account manager
     Custom integrations
     ```

7. Click "Save Block"
8. Click "Save Landing Page" at the bottom

#### Test: School Creation with Landing Page Pricing

1. Navigate to `/p2ladmin/schools`
2. Click "+ Create School"
3. **Verify**: Dropdown should show the pricing plans from landing page:
   - "Starter - 50 Teachers, 500 Students ($2,500)"
   - "Professional - 100 Teachers, 1000 Students ($5,000)"
   - "Enterprise - 250 Teachers, 2500 Students ($10,000)"
4. Fill in form:
   - Organization Name: Test School
   - Organization Type: School
   - License Plan: Professional
   - Contact: test@school.com
5. Click "Create"
6. **Verify**: School created with limits from landing page plan

#### Test: Fallback to Hardcoded Plans

1. Navigate to `/p2ladmin/landing-page`
2. Delete the pricing block (or delete entire landing page)
3. Go back to `/p2ladmin/schools`
4. Click "+ Create School"
5. **Verify**: Dropdown shows hardcoded fallback plans (from `LICENSE_PLANS` constant)
6. **Verify**: Warning message appears about creating pricing block

**Expected Results**:
- ✅ Landing page pricing is used when available
- ✅ Fallback plans work when no landing page pricing exists
- ✅ Schools are created with correct limits from selected plan

---

### Test 3: License Limit Enforcement

#### Setup: Create a School with Low Limits

1. Create a test pricing plan in landing page with very low limits:
   - Name: Test Plan
   - Teachers: 2
   - Students: 5
2. Create a school using this plan

#### Test 3a: Manual Teacher Creation

1. Login as school admin for the test school
2. Navigate to `/school-admin/users/manual-add`
3. Add Teacher #1:
   - Name: Teacher One
   - Email: teacher1@test.com
   - Role: Teacher
   - Subject: Mathematics
4. Click "Add User"
5. **Verify**: Success message, teacher created
6. Repeat for Teacher #2
7. **Verify**: Success message, teacher created
8. Try to add Teacher #3
9. **Verify**: Error message: "Teacher limit reached (2/2). Please upgrade your plan."

**Expected Result**: ✅ Cannot create teachers beyond limit

#### Test 3b: Manual Student Creation

1. Try to add 5 students manually
2. **Verify**: All 5 succeed
3. Try to add 6th student
4. **Verify**: Error message: "Student limit reached (5/5). Please upgrade your plan."

**Expected Result**: ✅ Cannot create students beyond limit

#### Test 3c: Bulk Teacher Import

1. Create CSV file `teachers.csv`:
   ```csv
   Name,Email,Subject
   Bulk Teacher 1,bulkteacher1@test.com,Mathematics
   Bulk Teacher 2,bulkteacher2@test.com,English
   Bulk Teacher 3,bulkteacher3@test.com,Science
   ```

2. Navigate to `/school-admin/users/bulk-upload`
3. Select "Teachers" tab
4. Upload `teachers.csv`
5. **Verify**: Import result shows:
   - Created: 0 (limit already reached)
   - Failed: 3
   - Error: "Teacher limit reached (2/2). Import stopped at record 1 of 3."

**Expected Result**: ✅ Bulk import respects limits

#### Test 3d: Bulk Student Import

1. Delete 3 students to make room (leaving 2/5 used)
2. Create CSV file `students.csv`:
   ```csv
   Name,Email,Class,GradeLevel,ParentEmail
   Student A,studenta@test.com,1A,Primary 1,parenta@test.com
   Student B,studentb@test.com,1A,Primary 1,parentb@test.com
   Student C,studentc@test.com,1A,Primary 1,parentc@test.com
   Student D,studentd@test.com,1A,Primary 1,parentd@test.com
   ```

3. Upload file
4. **Verify**: Import result shows:
   - Created: 3 (fills remaining slots: 2→5)
   - Failed: 1
   - Error: "Student limit reached (5/5). Import stopped at record 4 of 4."

**Expected Result**: ✅ Bulk import stops at limit with clear message

---

## Error Messages

### Clear User Feedback

When limits are reached, users see helpful error messages:

**Manual Creation**:
```
Teacher limit reached (50/50). Please upgrade your plan.
Student limit reached (500/500). Please upgrade your plan.
```

**Bulk Import**:
```
Teacher limit reached (50/50). Import stopped at record 12 of 25.
Student limit reached (500/500). Import stopped at record 87 of 100.
```

These messages:
1. State the exact limit (current/maximum)
2. Suggest action (upgrade plan)
3. For bulk: Show exactly where import stopped

---

## Files Modified

### Backend
1. **`backend/routes/schoolAdminRoutes.js`**
   - Line 57: Fixed authentication role check
   - Lines 73-112: License checking helper (verified)
   - Lines 333-347, 555-570, 980-988: License enforcement (verified)

2. **`backend/routes/p2lAdminRoutes.js`**
   - Lines 1411-1482: New pricing plans endpoint

### Frontend
3. **`frontend/src/services/p2lAdminService.js`**
   - Lines 106-110: New service method

4. **`frontend/src/components/P2LAdmin/SchoolManagement.js`**
   - Lines 1-30: Added state for pricing plans
   - Lines 37-81: Added pricing fetch logic
   - Lines 83-93: Helper function for fallback
   - Lines 206-228: Dynamic pricing dropdown

---

## Backward Compatibility

✅ **Fully Backward Compatible**

- If no landing page exists → Uses hardcoded `LICENSE_PLANS`
- If landing page has no pricing block → Uses fallback plans
- If API fails → Uses fallback plans
- All existing functionality preserved
- No database migrations required

---

## Security Considerations

### CodeQL Analysis

**Results**: 2 warnings (not introduced by this PR)
- Rate limiting alerts on existing P2L Admin endpoints
- These affect the entire API, not specific to these changes
- Recommendation: Consider adding rate limiting to all P2L Admin routes (separate task)

**This PR**: No new security vulnerabilities introduced ✅

### Authentication

- All new endpoints protected by `authenticateP2LAdmin` middleware
- School admin routes protected by `authenticateSchoolAdmin` middleware
- License checks happen server-side (cannot be bypassed)

---

## Performance Considerations

### Caching Opportunities

**Current Implementation**:
- Pricing plans fetched on each School Management page load
- Landing page queried from MongoDB for each request

**Future Optimization** (if needed):
```javascript
// Add caching to reduce MongoDB queries
const cache = {
  pricingPlans: null,
  lastFetch: null,
  TTL: 5 * 60 * 1000 // 5 minutes
};

router.get('/landing/pricing-plans', authenticateP2LAdmin, async (req, res) => {
  const now = Date.now();
  if (cache.pricingPlans && (now - cache.lastFetch) < cache.TTL) {
    return res.json(cache.pricingPlans);
  }
  // ... fetch from DB ...
  cache.pricingPlans = result;
  cache.lastFetch = now;
  // ...
});
```

**Note**: Not implemented as pricing plans don't change frequently and query is fast.

---

## Deployment Checklist

- [x] Code changes completed
- [x] Backend syntax validated
- [x] Frontend components updated
- [x] Code review feedback addressed
- [x] Security scan completed (CodeQL)
- [ ] Manual testing completed (see Testing Guide above)
- [ ] Deployed to staging environment
- [ ] Tested on staging
- [ ] Deployed to production
- [ ] User documentation updated

---

## Troubleshooting

### Issue: School Admin Still Gets 403

**Check**:
1. Verify role in database: `db.users.findOne({ email: "admin@school.com" })`
2. Should see: `role: "School Admin"` (with space and capitals)
3. If different, update: `db.users.updateOne({ email: "..." }, { $set: { role: "School Admin" } })`

### Issue: Pricing Plans Not Showing

**Check**:
1. Is landing page created? Navigate to `/p2ladmin/landing-page`
2. Is pricing block added? Check blocks array for `type: "pricing"`
3. Does pricing block have plans? Check `custom_data.plans` array
4. Check browser console for API errors
5. Check backend logs for MongoDB connection issues

**Fallback**: If issues persist, system will use hardcoded `LICENSE_PLANS`

### Issue: License Limits Not Working

**Check**:
1. Verify school has `plan_info` with `teacher_limit` and `student_limit`
2. Check `current_teachers` and `current_students` counters
3. Verify `checkLicenseAvailability()` is being called (check logs)
4. Ensure school `is_active: true`

---

## Future Enhancements

### Potential Improvements

1. **Dynamic Limit Adjustments**
   - Allow P2L Admin to adjust limits for specific schools
   - Override landing page defaults for special cases

2. **Usage Analytics**
   - Dashboard showing % of license used per school
   - Alerts when approaching limits
   - Historical usage trends

3. **Automatic Plan Upgrades**
   - Self-service plan upgrade flow
   - Payment integration
   - Instant limit increase

4. **Grace Period**
   - Allow temporary overage (e.g., +5% for 7 days)
   - Send warnings before hard limit

5. **Multi-tenant Improvements**
   - School-specific landing pages
   - Custom pricing per school
   - White-label branding

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages (they contain specific guidance)
3. Check server logs for detailed error information
4. Verify database state matches expectations

---

## Conclusion

This integration successfully:
1. ✅ Fixed critical authentication bug for school admins
2. ✅ Connected landing page pricing with school management
3. ✅ Verified license limits are properly enforced
4. ✅ Maintained backward compatibility
5. ✅ Provided clear error messages and user guidance

The system now allows P2L Admins to manage pricing centrally in the landing page, and those plans automatically flow through to school creation and license enforcement.
